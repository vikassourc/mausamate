

// ========================
// CONSTANTS & SELECTORS
// ========================

// Use backend proxy endpoints (no API keys needed in frontend)
const WEATHER_API = "/api/weather";
const FORECAST_API = "/api/forecast";
const AQI_API = "/api/air-quality";
const CRICKET_API = "/api/cricket";
const SIMPLE_CRICKET_API = "/api/news";

// DOM Elements
const userLocation = document.getElementById("userLocation");
const converter = document.getElementById("converter");
const weatherIcon = document.querySelector(".weatherIcon");
const temperature = document.querySelector(".temperature");
const feelsLike = document.querySelector(".feelsLike");
const description = document.querySelector(".description");
const date = document.querySelector(".date");
const city = document.getElementById("city");
const HValue = document.getElementById("HValue");
const CValue = document.getElementById("CValue");
const WValue = document.getElementById("WValue");
const SRValue = document.getElementById("SRValue");
const SSValue = document.getElementById("SSValue");
const AQIValue = document.getElementById("AQIValue");
const PValue = document.getElementById("PValue");
const Forecast = document.querySelector(".Forecast");
const scoreContainer = document.getElementById("cricketScores");
const graphContainer = document.getElementById("weatherGraphs");
let globalForecastData = null;
let globalTimezoneOffset = 0;
let currentChart = null;

// ========================
// UTILITY FUNCTIONS
// ========================

// Format time with timezone offset
function getCorrectTime(timestamp, timezoneOffset, options = {}) {
    const timestampMs = timestamp * 1000;
    const date = new Date(timestampMs);
    const utcTimeMs = date.getTime() + (date.getTimezoneOffset() * 60000);
    const locationTimeMs = utcTimeMs + (timezoneOffset * 1000);
    const locationTime = new Date(locationTimeMs);
    return locationTime;
}

// Check if it's nighttime based on sunrise and sunset times
function isNighttime(currentTime, sunriseTime, sunsetTime, timezoneOffset) {
    const current = getCorrectTime(currentTime, timezoneOffset);
    const sunrise = getCorrectTime(sunriseTime, timezoneOffset);
    const sunset = getCorrectTime(sunsetTime, timezoneOffset);

    const currentHour = current.getHours();
    const sunriseHour = sunrise.getHours();
    const sunsetHour = sunset.getHours();

    return currentHour < sunriseHour || currentHour >= sunsetHour;
}

// Temperature Converter Function
function TempConverter(temp) {
    let tempValue = Math.round(temp);
    return converter && converter.value === "°C" 
        ? `${tempValue}<span>°C</span>` 
        : `${Math.round((tempValue * 9) / 5 + 32)}<span>°F</span>`;
}

// Get numeric temperature without HTML tags for graph data
function getNumericTemp(temp) {
    let tempValue = Math.round(temp);
    return converter && converter.value === "°C" 
        ? tempValue 
        : Math.round((tempValue * 9) / 5 + 32);
}

// Loading screen functions
function showLoading() {
    const loadingScreen = document.getElementById("loadingScreen");
    if (loadingScreen) loadingScreen.classList.remove("hidden");
}

function hideLoading() {
    const loadingScreen = document.getElementById("loadingScreen");
    if (loadingScreen) loadingScreen.classList.add("hidden");
}

// Convert µg/m³ to ppm for gaseous pollutants
function convertToPpm(ugm3, molecularWeight) {
    return (ugm3 * 24.45) / (molecularWeight * 1000);
}

// Judge air quality based on pollutant levels in ppm or µg/m³
function judgeAirQuality(aqiData) {
    const components = aqiData.list[0].components;
    console.log("Pollutant Components:", components);
    
    const coPpm = components.co !== undefined ? convertToPpm(components.co, 28) : 0;
    const no2Ppm = components.no2 !== undefined ? convertToPpm(components.no2, 46) : 0;
    const so2Ppm = components.so2 !== undefined ? convertToPpm(components.so2, 64) : 0;
    const o3Ppm = components.o3 !== undefined ? convertToPpm(components.o3, 48) : 0;
    const pm25 = components.pm2_5 !== undefined ? components.pm2_5 : 0;
    const pm10 = components.pm10 !== undefined ? components.pm10 : 0;

    console.log(`CO: ${coPpm.toFixed(2)} ppm, NO₂: ${no2Ppm.toFixed(2)} ppm, SO₂: ${so2Ppm.toFixed(2)} ppm, O₃: ${o3Ppm.toFixed(2)} ppm, PM2.5: ${pm25.toFixed(2)} µg/m³, PM10: ${pm10.toFixed(2)} µg/m³`);

    const thresholds = {
        co: { good: 9, moderate: 35, poor: Infinity },
        no2: { good: 0.053, moderate: 0.1, poor: Infinity },
        so2: { good: 0.075, moderate: 0.5, poor: Infinity },
        o3: { good: 0.07, moderate: 0.125, poor: Infinity },
        pm25: { good: 12, moderate: 35, poor: Infinity },
        pm10: { good: 50, moderate: 150, poor: Infinity }
    };

    let dominantPollutant = '';
    let value = 0;
    let judgment = '';

    if (coPpm > thresholds.co.poor) {
        dominantPollutant = 'CO';
        value = coPpm;
        judgment = 'Very Poor 🛑';
    } else if (no2Ppm > thresholds.no2.poor) {
        dominantPollutant = 'NO₂';
        value = no2Ppm;
        judgment = 'Very Poor 🛑';
    } else if (so2Ppm > thresholds.so2.poor) {
        dominantPollutant = 'SO₂';
        value = so2Ppm;
        judgment = 'Very Poor 🛑';
    } else if (o3Ppm > thresholds.o3.poor) {
        dominantPollutant = 'O₃';
        value = o3Ppm;
        judgment = 'Very Poor 🛑';
    } else if (pm25 > thresholds.pm25.poor) {
        dominantPollutant = 'PM2.5';
        value = pm25;
        judgment = 'Very Poor 🛑';
    } else if (pm10 > thresholds.pm10.poor) {
        dominantPollutant = 'PM10';
        value = pm10;
        judgment = 'Very Poor 🛑';
    } else if (coPpm > thresholds.co.moderate) {
        dominantPollutant = 'CO';
        value = coPpm;
        judgment = 'Poor 😷';
    } else if (no2Ppm > thresholds.no2.moderate) {
        dominantPollutant = 'NO₂';
        value = no2Ppm;
        judgment = 'Poor 😷';
    } else if (so2Ppm > thresholds.so2.moderate) {
        dominantPollutant = 'SO₂';
        value = so2Ppm;
        judgment = 'Poor 😷';
    } else if (o3Ppm > thresholds.o3.moderate) {
        dominantPollutant = 'O₃';
        value = o3Ppm;
        judgment = 'Poor 😷';
    } else if (pm25 > thresholds.pm25.moderate) {
        dominantPollutant = 'PM2.5';
        value = pm25;
        judgment = 'Poor 😷';
    } else if (pm10 > thresholds.pm10.moderate) {
        dominantPollutant = 'PM10';
        value = pm10;
        judgment = 'Poor 😷';
    } else if (pm25 > thresholds.pm25.good) {
        dominantPollutant = 'PM2.5';
        value = pm25;
        judgment = 'Moderate 😐';
    } else if (pm10 > thresholds.pm10.good) {
        dominantPollutant = 'PM10';
        value = pm10;
        judgment = 'Moderate 😐';
    } else if (o3Ppm > thresholds.o3.good) {
        dominantPollutant = 'O₃';
        value = o3Ppm;
        judgment = 'Moderate 😐';
    } else if (so2Ppm > thresholds.so2.good) {
        dominantPollutant = 'SO₂';
        value = so2Ppm;
        judgment = 'Moderate 😐';
    } else if (no2Ppm > thresholds.no2.good) {
        dominantPollutant = 'NO₂';
        value = no2Ppm;
        judgment = 'Moderate 😐';
    } else if (coPpm > thresholds.co.good) {
        dominantPollutant = 'CO';
        value = coPpm;
        judgment = 'Moderate 😐';
    } else {
        const pollutants = [
            { name: 'CO', value: coPpm },
            { name: 'NO₂', value: no2Ppm },
            { name: 'SO₂', value: so2Ppm },
            { name: 'O₃', value: o3Ppm },
            { name: 'PM2.5', value: pm25 },
            { name: 'PM10', value: pm10 }
        ];
        const maxPollutant = pollutants.reduce((max, curr) => curr.value > max.value ? curr : max, { name: 'N/A', value: 0 });
        dominantPollutant = maxPollutant.name;
        value = maxPollutant.value;
        judgment = 'Good 🌿';
    }

    const unit = (dominantPollutant === 'PM2.5' || dominantPollutant === 'PM10') ? 'µg/m³' : 'ppm';
    return `${dominantPollutant}: ${value.toFixed(2)} ${unit} - ${judgment}`;
}

// ========================
// WEATHER DATA FUNCTIONS
// ========================

function findUserLocation() {
    if (!userLocation || !userLocation.value) {
        alert("⚠️ Please enter a location!");
        return;
    }

    showLoading();

    fetch(`${WEATHER_API}?q=${userLocation.value}`)
        .then(response => response.json())
        .then(data => {
            hideLoading();
            
            if (!data || data.cod !== 200) {
                alert(`❌ Error: ${data.message || "Location not found!"}`);
                return;
            }

            console.log("Current Weather Data:", data);
            updateCurrentWeather(data);
            const timezoneOffset = data.timezone;
            fetchAirQuality(data.coord.lat, data.coord.lon);
            fetchForecast(data.coord.lat, data.coord.lon, timezoneOffset);
        })
        .catch(error => {
            hideLoading();
            console.error("Weather Fetch Error:", error);
            alert(`❌ Error fetching weather data: ${error.message}`);
        });
    
    fetchSimpleCricketScores();
}

// Update UI with current weather data, including moon icon for nighttime
function updateCurrentWeather(data) {
    const timezoneOffset = data.timezone;
    
    city.innerHTML = `${data.name}, ${data.sys.country}`;
    weatherIcon.style.background = `url(https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png) no-repeat center/contain`;
    temperature.innerHTML = TempConverter(data.main.temp);
    feelsLike.innerHTML = "Feels like " + TempConverter(data.main.feels_like);

    const currentTime = Math.floor(Date.now() / 1000);
    const isNight = isNighttime(currentTime, data.sys.sunrise, data.sys.sunset, timezoneOffset);
    const weatherDesc = data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1);
    description.innerHTML = `<i class="fa-solid fa-cloud"></i> ${weatherDesc}${isNight ? ' <i class="fa-solid fa-moon"></i>' : ''}`;

    HValue.innerHTML = `${Math.round(data.main.humidity)}<span>%</span>`;
    WValue.innerHTML = `${Math.round(data.wind.speed)}<span> km/h</span>`;
    CValue.innerHTML = `${data.clouds.all}<span>%</span>`;
    PValue.innerHTML = `${data.main.pressure}<span> hPa</span>`;
    
    date.innerHTML = "📅 " + getCorrectTime(currentTime, timezoneOffset, {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    }).toLocaleString("en-US");

    const timeOptions = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true };
    SRValue.innerHTML = "🌅 " + getCorrectTime(data.sys.sunrise, timezoneOffset, timeOptions).toLocaleString("en-US", timeOptions);
    SSValue.innerHTML = "🌇 " + getCorrectTime(data.sys.sunset, timezoneOffset, timeOptions).toLocaleString("en-US", timeOptions);
}

function fetchAirQuality(lat, lon) {
    console.log(`Fetching AQI for lat: ${lat}, lon: ${lon}`);
    fetch(`${AQI_API}?lat=${lat}&lon=${lon}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(aqiData => {
            console.log("Raw AQI Data:", aqiData);
            if (!aqiData || !aqiData.list || aqiData.list.length === 0) {
                console.warn("No AQI data returned or invalid structure");
                AQIValue.innerHTML = "N/A - No air quality data available";
                return;
            }
            const airQualityText = judgeAirQuality(aqiData);
            console.log("Formatted AQI Text:", airQualityText);
            AQIValue.innerHTML = airQualityText;
        })
        .catch(error => {
            console.error("AQI Fetch Error:", error.message);
            AQIValue.innerHTML = `Error fetching AQI: ${error.message}`;
        });
}

function fetchForecast(lat, lon, timezoneOffset) {
    console.log(`Fetching forecast for lat: ${lat}, lon: ${lon}, timezoneOffset: ${timezoneOffset}`);
    fetch(`${FORECAST_API}?lat=${lat}&lon=${lon}`)
        .then(response => {
            console.log(`Forecast API response status: ${response.status}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(forecastData => {
            console.log("Forecast Data:", forecastData);
            if (!forecastData || !forecastData.list) {
                console.error("Invalid forecast data structure:", forecastData);
                graphContainer.innerHTML = "<p>No forecast data available.</p>";
                return;
            }
            Forecast.innerHTML = "";
            globalForecastData = forecastData;
            globalTimezoneOffset = timezoneOffset;
            console.log("Set globalForecastData and globalTimezoneOffset:", globalForecastData, globalTimezoneOffset);
            
            // Enable chart buttons after data is fetched
            document.querySelectorAll('.chart-btn').forEach(btn => {
                btn.disabled = false;
            });
            
            // Automatically render the temperature chart
            createWeatherGraphs(forecastData, timezoneOffset, 'temperature');
            displayDailyForecast(forecastData, timezoneOffset);
        })
        .catch(error => {
            console.error("Forecast Fetch Error:", error);
            graphContainer.innerHTML = "<p>Error loading forecast data. Please try again.</p>";
            // Keep buttons disabled if fetch fails
            document.querySelectorAll('.chart-btn').forEach(btn => {
                btn.disabled = true;
            });
        });
}

function displayDailyForecast(forecastData, timezoneOffset) {
    const dailyForecasts = {};
    
    forecastData.list.forEach(item => {
        const forecastDate = new Date(getCorrectTime(item.dt, timezoneOffset, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        }));
        const dateKey = forecastDate.toISOString().split('T')[0];
        if (!dailyForecasts[dateKey]) {
            dailyForecasts[dateKey] = item;
        }
    });
    
    const forecastArray = Object.values(dailyForecasts).slice(0, 5);
    
    forecastArray.forEach(forecast => {
        let div = document.createElement("div");
        div.classList.add("forecast-card");
        
        const forecastDay = getCorrectTime(forecast.dt, timezoneOffset, {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });

        const rainAmount = forecast.rain && 
            (typeof forecast.rain === 'number' || forecast.rain['3h']) 
                ? `<p>Rain: ${typeof forecast.rain === 'number' ? forecast.rain : forecast.rain['3h']} mm</p>` 
                : '<p>Rain: 0 mm</p>';

        const rainProb = forecast.pop !== undefined 
            ? `<p>Chance of Rain: ${Math.round(forecast.pop * 100)}%</p>` 
            : '<p>Chance of Rain: N/A</p>';

        div.innerHTML = `
            <h3>${forecastDay.toLocaleString("en-US")}</h3>
            <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="Weather Icon">
            <p>Temp: ${TempConverter(forecast.main.temp)}</p>
            <p>Wind: ${Math.round(forecast.wind.speed)} km/h</p>
            <p>Humidity: ${forecast.main.humidity}%</p>
            ${rainProb}
            ${rainAmount}
        `;
        Forecast.appendChild(div);
    });
}

// ========================
// CHART FUNCTIONS
// ========================

function createWeatherGraphs(forecastData, timezoneOffset, chartType = 'temperature') {
    if (!graphContainer) {
        console.error("Graph container element not found!");
        return;
    }
    
    graphContainer.innerHTML = "";
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
    
    const canvas = document.createElement("canvas");
    canvas.id = "weatherGraph";
    graphContainer.appendChild(canvas);
    
    const hourlyData = forecastData.list.slice(0, 8);
    const labels = hourlyData.map(item => {
        return getCorrectTime(item.dt, timezoneOffset, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).toLocaleString("en-US", { hour: 'numeric', hour12: true });
    });
    
    let chartConfig;
    
    try {
        if (chartType === 'temperature') {
            const temperatures = hourlyData.map(item => getNumericTemp(item.main.temp));
            chartConfig = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: converter && converter.value === "°C" ? 'Temperature (°C)' : 'Temperature (°F)',
                        data: temperatures,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: { display: true, text: 'Temperature Forecast' },
                        legend: { position: 'top' }
                    },
                    scales: {
                        y: { beginAtZero: false, title: { display: true, text: converter && converter.value === "°C" ? '°C' : '°F' } }
                    }
                }
            };
        } else if (chartType === 'rainfall') {
            const rainfallPercentage = hourlyData.map(item => (item.pop !== undefined ? item.pop * 100 : 0));
            console.log("Rainfall Percentage Data:", rainfallPercentage);
            chartConfig = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Chance of Rain (%)',
                        data: rainfallPercentage,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: { display: true, text: 'Precipitation Probability' },
                        legend: { position: 'top' }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            max: 100, 
                            title: { display: true, text: 'Probability (%)' },
                            ticks: { stepSize: 20 }
                        }
                    }
                }
            };
        } else if (chartType === 'humidity') {
            const humidity = hourlyData.map(item => (item.main.humidity !== undefined ? item.main.humidity : 0));
            console.log("Humidity Data:", humidity);
            chartConfig = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Humidity (%)',
                        data: humidity,
                        borderColor: 'rgb(153, 102, 255)',
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        title: { display: true, text: 'Humidity Forecast' },
                        legend: { position: 'top' }
                    },
                    scales: {
                        y: { 
                            beginAtZero: true, 
                            max: 100, 
                            title: { display: true, text: '%' },
                            ticks: { stepSize: 20 }
                        }
                    }
                }
            };
        } else {
            throw new Error(`Unsupported chart type: ${chartType}`);
        }
        
        const ctx = canvas.getContext('2d');
        currentChart = new Chart(ctx, chartConfig);
    } catch (error) {
        console.error(`Error creating ${chartType} chart:`, error);
        graphContainer.innerHTML = `<p>Error creating ${chartType} chart: ${error.message}</p>`;
    }
}

function switchChart(chartType) {
    if (globalForecastData && globalTimezoneOffset !== undefined) {
        console.log(`Switching to ${chartType} chart`);
        createWeatherGraphs(globalForecastData, globalTimezoneOffset, chartType);
    } else {
        console.warn("No forecast data available to switch chart.");
        graphContainer.innerHTML = "<p>Forecast data not available. Please try searching again.</p>";
    }
}

function initWeatherChart() {
    if (!graphContainer) return;
    graphContainer.innerHTML = '';
    const ctx = document.createElement('canvas');
    ctx.width = 400;
    ctx.height = 200;
    graphContainer.appendChild(ctx);
    
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Search for a location to see actual forecast data'],
            datasets: [{
                label: 'Temperature',
                data: [0],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Please search for a location' },
                legend: { position: 'top' }
            }
        }
    });
}

// ========================
// CRICKET SCORE FUNCTIONS
// ========================

function fetchCricketScores() {
    console.log("Fetching cricket scores...");
    
    if (!scoreContainer) {
        console.error("Score container element not found! Expected element with id='cricketScores'");
        return;
    }
    
    scoreContainer.innerHTML = "<p>Loading cricket scores...</p>";
    
    fetch(CRICKET_API)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Cricket Score Data:", data);
            
            if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
                scoreContainer.innerHTML = "<p>No cricket match data available.</p>";
                return;
            }
            
            const matchesHtml = data.data.slice(0, 5).map(match => {
                try {
                    return `
                        <div class="match-card">
                            <h3>${match.name || 'Cricket Match'}</h3>
                            <p>${match.status || 'Status not available'}</p>
                            <p>${match.teams[0] || 'Team 1'} vs ${match.teams[1] || 'Team 2'}</p>
                            ${match.score && match.score.length > 0 ? 
                                `<p class="score">${match.score[0]?.inning || ''}: ${match.score[0]?.r || 0}/${match.score[0]?.w || 0} 
                                 (${match.score[0]?.o || 0} overs)</p>` : ''}
                            ${match.score && match.score.length > 1 ? 
                                `<p class="score">${match.score[1]?.inning || ''}: ${match.score[1]?.r || 0}/${match.score[1]?.w || 0} 
                                 (${match.score[1]?.o || 0} overs)</p>` : ''}
                            <p>${match.venue || 'Venue not available'}</p>
                        </div>
                    `;
                } catch (err) {
                    console.error("Error processing match data:", err);
                    return `<div class="match-card"><p>Error processing match data</p></div>`;
                }
            }).join("");
            
            scoreContainer.innerHTML = matchesHtml || "<p>No cricket match data available.</p>";
        })
        .catch(error => {
            console.error("Cricket API Fetch Error:", error);
            useStaticCricketData();
        });
}

function useStaticCricketData() {
    const staticMatches = [
        {
            name: "India vs Australia - 3rd Test",
            status: "Australia won by 6 wickets",
            teams: ["India", "Australia"],
            venue: "Melbourne Cricket Ground, Melbourne"
        },
        {
            name: "England vs South Africa - 2nd ODI", 
            status: "Match in progress",
            teams: ["England", "South Africa"],
            venue: "Lord's Cricket Ground, London"
        },
        {
            name: "Pakistan vs New Zealand - 1st T20I",
            status: "Match starts in 2 hours",
            teams: ["Pakistan", "New Zealand"],
            venue: "National Stadium, Karachi"
        }
    ];
    
    const staticHtml = staticMatches.map(match => {
        return `
            <div class="match-card">
                <h3>${match.name}</h3>
                <p>${match.status}</p>
                <p>${match.teams[0]} vs ${match.teams[1]}</p>
                <p>${match.venue}</p>
                <p><small>*Static data - API unavailable</small></p>
            </div>
        `;
    }).join("");
    
    scoreContainer.innerHTML = staticHtml || "<p>Cricket score data unavailable.</p>";
}

function fetchSimpleCricketScores() {
    const scoreContainer = document.getElementById("cricketScores");
    if (scoreContainer) {
        scoreContainer.innerHTML = "<p>Loading sports news...</p>";
    }
    
    fetch(SIMPLE_CRICKET_API)
        .then(response => {
            if (!response.ok) {
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Sports News Data:", data);
            
            if (!data || !data.articles || data.articles.length === 0) {
                scoreContainer.innerHTML = "<p>No sports news available.</p>";
                return;
            }
            
            const newsHtml = data.articles.slice(0, 5).map(article => {
                return `
                    <div class="score-card">
                        <h3>${article.title || 'Sports News'}</h3>
                        ${article.urlToImage ? 
                            `<img src="${article.urlToImage}" alt="${article.title}" style="max-width:100%; margin:10px 0;">` : 
                            ''}
                        <p>${article.description || 'No description available'}</p>
                        <p>Source: ${article.source.name || 'Unknown'} | ${new Date(article.publishedAt).toLocaleDateString()}</p>
                        <a href="${article.url}" target="_blank" rel="noopener noreferrer">Read more</a>
                    </div>
                `;
            }).join("");
            
            scoreContainer.innerHTML = newsHtml || "<p>No sports news available.</p>";
        })
        .catch(error => {
            console.error("Sports News API Error:", error);
            scoreContainer.innerHTML = `<p>Error loading sports news: ${error.message}</p>`;
            setTimeout(() => {
                useStaticCricketData();
            }, 2000);
        });
}

function setupChartControls() {
    console.log("Setting up chart controls");
    const chartBtns = document.querySelectorAll('.chart-btn');
    if (chartBtns.length === 0) {
        console.warn("No chart buttons found!");
        return;
    }
    
    chartBtns.forEach(btn => {
        btn.disabled = true; // Disable buttons initially
        console.log(`Found chart button: ${btn.getAttribute('data-chart')}`);
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`Chart button clicked: ${this.getAttribute('data-chart')}`);
            chartBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const chartType = this.getAttribute('data-chart');
            switchChart(chartType);
        });
    });
    
    const tempBtn = document.querySelector('.chart-btn[data-chart="temperature"]');
    if (tempBtn) tempBtn.classList.add('active');
}
    
    
function handleChartResize() {
    const chartDisplay = document.querySelector('.chart-display');
    if (chartDisplay && window.innerWidth < 500) {
        chartDisplay.style.height = '200px';
    } else if (chartDisplay) {
        chartDisplay.style.height = '300px';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM content loaded - initializing app");
    
    try {
        if (!userLocation) console.error("User location input not found!");
        if (!graphContainer) console.error("Graph container not found!");
        
        setupChartControls();
        handleChartResize();
        window.addEventListener('resize', handleChartResize);
        
        const searchBtn = document.getElementById('searchButton');
        if (searchBtn) searchBtn.addEventListener('click', findUserLocation);
        
        const searchForm = document.getElementById('searchForm');
        if (searchForm) {
            searchForm.addEventListener('submit', function(e) {
                e.preventDefault();
                findUserLocation();
            });
        }
        
        if (userLocation) {
            userLocation.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    findUserLocation();
                }
            });
        }
        
        if (converter) {
            converter.addEventListener('change', function() {
                if (globalForecastData) {
                    if (temperature && globalForecastData.list[0]) {
                        temperature.innerHTML = TempConverter(globalForecastData.list[0].main.temp);
                    }
                    if (feelsLike && globalForecastData.list[0]) {
                        feelsLike.innerHTML = "Feels like " + TempConverter(globalForecastData.list[0].main.feels_like);
                    }
                    displayDailyForecast(globalForecastData, globalTimezoneOffset);
                    const activeBtn = document.querySelector('.chart-btn.active');
                    if (activeBtn) {
                        switchChart(activeBtn.getAttribute('data-chart'));
                    } else {
                        switchChart('temperature');
                    }
                }
            });
        }
        
        if (userLocation && userLocation.value) {
            findUserLocation();
        } else {
            fetchSimpleCricketScores();
            initWeatherChart();
        }
    } catch (error) {
        console.error("Error during app initialization:", error);
    }
});

window.addEventListener("load", () => {
    console.log("Window loaded");
    
    try {
        const loadingScreen = document.getElementById("loadingScreen");
        if (!loadingScreen) {
            console.warn("Loading screen element not found!");
            document.body.classList.add("loaded");
            try {
                initWeatherChart();
            } catch (error) {
                console.error("Error initializing weather chart:", error);
            }
            return;
        }

        loadingScreen.classList.remove("hidden");

        setTimeout(() => {
            loadingScreen.classList.add("hidden");
            console.log("Loading screen hidden after 2 seconds");
            document.body.classList.add("loaded");
            try {
                initWeatherChart();
            } catch (error) {
                console.error("Error initializing weather chart:", error);
            }
        }, 2000);
    } catch (error) {
        console.error("Error in load event handler:", error);
    }
});