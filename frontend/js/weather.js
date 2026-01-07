// weather.js - OpenWeatherMap API Integration for Visibility Monitoring
import CONFIG from '../config.js';

// Check Weather Conditions
window.checkWeatherConditions = async function(location) {
    if (!location) {
        console.warn('Location not available for weather check');
        return;
    }
    
    try {
        const weatherData = await fetchWeatherData(location);
        analyzeVisibility(weatherData);
        updateWeatherDisplay(weatherData);
    } catch (error) {
        console.error('Weather check failed:', error);
        // Use simulation mode if API fails
        simulateWeatherCheck();
    }
};

// Fetch Weather Data from OpenWeatherMap
async function fetchWeatherData(location) {
    const apiKey = CONFIG.OPENWEATHER_API_KEY;
    
    // Check if API key is configured
    if (!apiKey || apiKey === 'YOUR_OPENWEATHER_API_KEY_HERE') {
        console.warn('OpenWeatherMap API key not configured. Using simulation mode.');
        return simulateWeatherData();
    }
    
    const url = `${CONFIG.ENDPOINTS.OPENWEATHER}?lat=${location.lat}&lon=${location.lng}&appid=${apiKey}&units=metric`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            visibility: data.visibility / 1000, // Convert to km
            weather: data.weather[0].main,
            description: data.weather[0].description,
            temperature: data.main.temp,
            humidity: data.main.humidity,
            windSpeed: data.wind.speed,
            timestamp: new Date().toLocaleString()
        };
    } catch (error) {
        console.error('OpenWeatherMap API Error:', error);
        return simulateWeatherData();
    }
}

// Simulate Weather Data (for demo without API key)
function simulateWeatherData() {
    const scenarios = [
        { visibility: 0.5, weather: 'Fog', description: 'Dense fog', temp: 18 },
        { visibility: 0.8, weather: 'Mist', description: 'Light mist', temp: 20 },
        { visibility: 5, weather: 'Clear', description: 'Clear sky', temp: 25 },
        { visibility: 8, weather: 'Clouds', description: 'Few clouds', temp: 22 },
        { visibility: 10, weather: 'Clear', description: 'Clear sky', temp: 28 }
    ];
    
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    return {
        visibility: scenario.visibility,
        weather: scenario.weather,
        description: scenario.description,
        temperature: scenario.temp,
        humidity: 65 + Math.floor(Math.random() * 20),
        windSpeed: 5 + Math.random() * 10,
        timestamp: new Date().toLocaleString()
    };
}

// Simulate Weather Check
function simulateWeatherCheck() {
    const weatherData = simulateWeatherData();
    analyzeVisibility(weatherData);
    updateWeatherDisplay(weatherData);
}

// Analyze Visibility and Show Alert
function analyzeVisibility(weatherData) {
    const visibilityThreshold = CONFIG.VISIBILITY_THRESHOLD;
    
    if (weatherData.visibility < visibilityThreshold) {
        showWeatherAlert(weatherData);
    } else {
        hideWeatherAlert();
    }
}

// Show Weather Alert Banner
function showWeatherAlert(weatherData) {
    const alertBanner = document.getElementById('weatherAlert');
    const alertMessage = document.getElementById('alertMessage');
    const alertDetails = document.getElementById('alertDetails');
    const alertTimestamp = document.getElementById('alertTimestamp');
    
    if (alertBanner) {
        alertBanner.classList.remove('hidden');
        
        if (alertMessage) {
            alertMessage.textContent = `⚠️ CAUTION: Low Visibility Reported in Your Area`;
        }
        
        if (alertDetails) {
            alertDetails.textContent = `Visibility: ${weatherData.visibility.toFixed(2)} km | ${weatherData.weather} - ${weatherData.description}`;
        }
        
        if (alertTimestamp) {
            alertTimestamp.textContent = `Last updated: ${weatherData.timestamp}`;
        }
        
        // Add pulse animation
        alertBanner.classList.add('pulse-animation');
        
        // Log to console
        console.log('⚠️ Low visibility alert triggered:', weatherData);
        
        // Show notification
        if (window.showNotification) {
            window.showNotification(
                `Low visibility detected: ${weatherData.visibility.toFixed(2)} km. Drive carefully!`,
                'warning'
            );
        }
    }
}

// Hide Weather Alert Banner
function hideWeatherAlert() {
    const alertBanner = document.getElementById('weatherAlert');
    if (alertBanner) {
        alertBanner.classList.add('hidden');
        alertBanner.classList.remove('pulse-animation');
    }
}

// Update Weather Display (optional dashboard widget)
function updateWeatherDisplay(weatherData) {
    // Create or update weather widget if desired
    const weatherWidget = createWeatherWidget(weatherData);
    
    // You can add this widget to any section
    console.log('Weather data updated:', weatherData);
}

// Create Weather Widget
function createWeatherWidget(weatherData) {
    return `
        <div class="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold">Current Weather</h3>
                ${getWeatherIcon(weatherData.weather)}
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <div class="text-4xl font-bold">${Math.round(weatherData.temperature)}°C</div>
                    <div class="text-sm opacity-90">${weatherData.description}</div>
                </div>
                
                <div class="space-y-2 text-sm">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        <span>Visibility: ${weatherData.visibility.toFixed(1)} km</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                        </svg>
                        <span>Humidity: ${weatherData.humidity}%</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                        </svg>
                        <span>Wind: ${weatherData.windSpeed.toFixed(1)} m/s</span>
                    </div>
                </div>
            </div>
            
            <div class="mt-4 text-xs opacity-75">
                Updated: ${weatherData.timestamp}
            </div>
        </div>
    `;
}

// Get Weather Icon
function getWeatherIcon(weather) {
    const icons = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Fog': '🌫️',
        'Haze': '🌫️',
        'Smoke': '🌫️'
    };
    
    return `<span class="text-4xl">${icons[weather] || '🌤️'}</span>`;
}

// Get Visibility Level
function getVisibilityLevel(visibility) {
    if (visibility < 0.5) return { level: 'Critical', color: 'red', action: 'Avoid driving' };
    if (visibility < 1) return { level: 'Very Low', color: 'orange', action: 'Drive with extreme caution' };
    if (visibility < 2) return { level: 'Low', color: 'yellow', action: 'Reduce speed' };
    if (visibility < 5) return { level: 'Moderate', color: 'blue', action: 'Drive carefully' };
    return { level: 'Good', color: 'green', action: 'Normal driving conditions' };
}

// Periodic Weather Check (every 10 minutes)
function startWeatherMonitoring() {
    // Initial check
    if (window.AppState && window.AppState.userLocation) {
        window.checkWeatherConditions(window.AppState.userLocation);
    }
    
    // Set interval for periodic checks (10 minutes)
    setInterval(() => {
        if (window.AppState && window.AppState.userLocation) {
            window.checkWeatherConditions(window.AppState.userLocation);
        }
    }, 600000); // 10 minutes in milliseconds
}

// Start monitoring when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWeatherMonitoring);
} else {
    startWeatherMonitoring();
}

// Export for external use
window.getWeatherData = fetchWeatherData;
window.getVisibilityLevel = getVisibilityLevel;