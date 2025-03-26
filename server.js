const express = require("express");
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

// ✅ Enable CORS for frontend access
app.use(cors());

// ✅ Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// ✅ Environment Variables
const { OPENWEATHER_API_KEY, CRICKET_API_KEY, NEWS_API_KEY } = process.env;

if (!OPENWEATHER_API_KEY || !CRICKET_API_KEY || !NEWS_API_KEY) {
    console.error("❌ API keys are missing. Check your .env file.");
    process.exit(1);
}

// ✅ Middleware to log requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ✅ Weather API Proxy
app.get("/api/weather", async (req, res) => {
    try {
        const { q, lat, lon } = req.query;
        if (!q && (!lat || !lon)) {
            return res.status(400).json({ error: "❌ Missing 'q' or 'lat/lon' parameters." });
        }

        const url = q
            ? `https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${OPENWEATHER_API_KEY}&units=metric`
            : `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;

        const { data } = await axios.get(url);
        res.json(data);
    } catch (error) {
        handleError(res, error, "Weather API error");
    }
});

// ✅ Forecast API Proxy
app.get("/api/forecast", async (req, res) => {
    try {
        const { lat, lon } = req.query;
        if (!lat || !lon) return res.status(400).json({ error: "❌ Missing lat/lon parameters." });

        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;

        const { data } = await axios.get(url);
        res.json(data);
    } catch (error) {
        handleError(res, error, "Forecast API error");
    }
});

// ✅ Air Quality API Proxy
app.get("/api/air-quality", async (req, res) => {
    try {
        const { lat, lon } = req.query;
        if (!lat || !lon) return res.status(400).json({ error: "❌ Missing lat/lon parameters." });

        const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`;

        const { data } = await axios.get(url);
        res.json(data);
    } catch (error) {
        handleError(res, error, "AQI API error");
    }
});

// ✅ Cricket API Proxy
app.get("/api/cricket", async (req, res) => {
    try {
        const url = `https://api.cricapi.com/v1/currentMatches?apikey=${CRICKET_API_KEY}&offset=0`;

        const { data } = await axios.get(url);
        res.json(data);
    } catch (error) {
        handleError(res, error, "Cricket API error");
    }
});

// ✅ NewsAPI Proxy
app.get("/api/news", async (req, res) => {
    try {
        const url = `https://newsapi.org/v2/top-headlines?category=sports&language=en&pageSize=5`;

        const { data } = await axios.get(url, {
            headers: {
                'X-Api-Key': NEWS_API_KEY // Use environment variable instead of hardcoded key
            }
        });
        res.json(data);
    } catch (error) {
        handleError(res, error, "NewsAPI error");
    }
});

// ✅ Catch-All Route (for frontend navigation)
app.get("*", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

// ✅ Start Server
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));

// ✅ Error Handling Function
function handleError(res, error, message) {
    console.error(`${message}:`, error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ error: error.message });
}