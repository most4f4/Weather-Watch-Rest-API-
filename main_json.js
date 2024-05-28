/*********************************************************************************
 *
 * WEB422 – Assignment 1
 * I declare that this assignment is my own work in accordance with Seneca Academic
 * Policy. No part of this assignment has been copied manually or electronically 
 * from any other source (including web sites) or distributed to other students.
 * 
 * Name: Mostafa Hasanalipourshahrabadi 
 * Student ID: 154581227 
 * Date: 2024-05-27
 * 
 ********************************************************************************/

document.getElementById('weather-form').addEventListener('submit', function(event) {
    event.preventDefault();
    fetchWeather();
});

window.onload = function() {
    getCurrentLocationWeather();
};

const apiKey = "48bd836253a2ae351c8ee9839626dc14";
const recordsPerPage = 3;

let currentPage = 1;
let totalPages = 0;
let currentWeatherData = [];

function getCurrentLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetchWeatherByCoords(lat, lon);
        }, error => {
            console.error('Error getting location:', error);
            document.getElementById('current-location-weather').innerHTML = '<p>Unable to retrieve your location.</p>';
        });
    } else {
        document.getElementById('current-location-weather').innerHTML = '<p>Geolocation is not supported by your browser.</p>';
    }
}

function fetchWeatherByCoords(lat, lon) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            
            const cityName = data.name;
            const country = data.sys.country;
            const temperature = data.main.temp;
            const flagUrl = `http://openweathermap.org/images/flags/${country.toLowerCase()}.png`;
            
            const weatherInfo = `
                <h4>Current Location Weather</h4>
                <p><img src="${flagUrl}" alt="Flag of ${country}"> ${cityName} - ${country}</p>
                <p>Temperature: ${temperature.toFixed(2)} °C</p>
            `;
            document.getElementById('current-location-weather').innerHTML = weatherInfo;
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            document.getElementById('current-location-weather').innerHTML = '<p>Error fetching weather data for current location.</p>';
        });
}

function formatTime(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);
    const hours = date.getHours();
    const minutes = ("0" + date.getMinutes()).slice(-2);
    return `${hours}:${minutes}`;
} 

function fetchWeather() {
    currentWeatherData = []; 
    totalPages = 0;
    let currentPage = 1;

    const userInput = document.getElementById('cityCountry').value.trim().toLowerCase();
    const [city, countryCode] = userInput.split(',').map(s => s.trim());
    const units = document.getElementById('flexRadioDefault1').checked ? 'imperial' : 'metric';
    const temperatureUnit = units === 'imperial' ? '°F' : '°C';

    if (!city) {
        document.getElementById('weather-info').innerHTML = '';
        document.getElementById('error-message').innerHTML = '<p>Please enter a city name.</p>';
        return;
    }
    console.log(`city if ${city} and country is ${countryCode}`)

    document.getElementById('error-message').innerHTML = '';

    var apiUrl = `https://api.openweathermap.org/data/2.5/find?q=${city}`
    if (countryCode) {
        apiUrl += `,${countryCode}`;
    } 
    apiUrl += `&appid=${apiKey}&units=${units}&cnt=50`
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data=>{
            console.log(data);
            if (data.cod !== "200" || data.count === 0) {
                document.getElementById('weather-info').innerHTML = '';
                document.getElementById('error-message').innerHTML = '<p>No matching city found. Please check the city name or country code.</p>';
                return;
            }

            let citiesProcessed = 0;

            for (let i = 0; i < data.list.length; i++) {
                const city = data.list[i];
                const cityName = city.name;
                const countryCode = city.sys.country;
    
                const cityWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName},${countryCode}&appid=${apiKey}&units=${units}`;
    
                fetch(cityWeatherUrl)
                    .then(response => response.json())
                    .then(cityData => {
                        console.log(cityData);
                        currentWeatherData.push({
                            id: cityData.id,
                            name: cityData.name,
                            country: cityData.sys.country,
                            temperature: cityData.main.temp,
                            maxTemp: cityData.main.temp_max,
                            minTemp: cityData.main.temp_min,
                            weatherCondition: cityData.weather[0].description,
                            windSpeed: cityData.wind.speed,
                            humidity: cityData.main.humidity,
                            pressure: cityData.main.pressure,
                            sunrise: cityData.sys.sunrise,
                            sunset: cityData.sys.sunset,
                            lon:cityData.coord.lon,
                            lat:cityData.coord.lat,
                            unit: temperatureUnit
                        });
    
                        citiesProcessed++;
    
                        if (citiesProcessed === data.list.length) {
                            totalPages = Math.floor((citiesProcessed / recordsPerPage)+(citiesProcessed % recordsPerPage > 0 ? 1 : 0));
                            displayPage(currentPage);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching data for city:', error);
                    });
            }
            
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            document.getElementById('weather-info').innerHTML = '';
            document.getElementById('error-message').innerHTML = '<p>Error fetching weather data.</p>';
        });
}

function displayPage(page) {
    const startIndex = (page - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    
    const pageData = currentWeatherData.slice(startIndex, endIndex);
    
    const weatherInfo = pageData.map(cityData => {
        const formattedSunrise = formatTime(cityData.sunrise);
        const formattedSunset = formatTime(cityData.sunset);
        
        const flagUrl = `http://openweathermap.org/images/flags/${cityData.country.toLowerCase()}.png`;
        
        
        const windSpeedUnit = cityData.unit === '°F' ? 'mph' : 'm/s';
        const pressureUnit = 'hPa';
        const humidityUnit = '%';

        return `
        <div class="container border p-3 mb-4">
            <div class="row">
                <div class="col-2-sm">
                    <h6><img src="${flagUrl}" alt="Flag of ${cityData.country}" class="flag"> ${cityData.name}, ${cityData.country}</h6>
                </div>
            </div>

            <div class="row">
                <div class="col-sm"><em><strong>${cityData.weatherCondition}</strong></em></div>
                <div class="col-sm"><strong>Temperature: </strong>${cityData.temperature.toFixed(2)} ${cityData.unit}</div>
                <div class="col-sm">Max/Min Temp: ${cityData.maxTemp.toFixed(2)} / ${cityData.minTemp.toFixed(2)} ${cityData.unit}</div>
            </div>

            <div class="row">
                <div class="col-sm">Wind Speend: ${cityData.windSpeed} ${windSpeedUnit}</div>
                <div class="col-sm">Pressure: ${cityData.pressure} ${pressureUnit}</div>
                <div class="col-sm">Humidity: ${cityData.humidity} ${humidityUnit}</div>
                <div class="col-sm">Sunrise: ${formattedSunrise}</div>
                <div class="col-sm">Sunset: ${formattedSunset}</div>
            </div>
            <div class="row">
            <div class="col-sm">Coordination: [${cityData.lon.toFixed(2)}, ${cityData.lat.toFixed(2)}]</div>
        </div>
        </div>`;
    }).join(''); 
    
    let result = 
        `<div class="text-center" style="margin-bottom: 20px;">
            <h5> Here is the result: </h5>
        </div>`
    result += weatherInfo;

    document.getElementById('weather-info').innerHTML = result;

    document.getElementById('pagination').innerHTML = `
    <button onclick="prevPage()" ${page === 1 ? 'disabled' : ''}>Previous</button>
    <span>Page ${page} of ${totalPages}</span>
    <button onclick="nextPage()" ${page === totalPages ? 'disabled' : ''}>Next</button>
    `;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayPage(currentPage);
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        displayPage(currentPage);
    }
}