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
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&mode=xml`;

    fetch(apiUrl)
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, 'text/xml');

            const cityElement = xmlDoc.getElementsByTagName('city')[0];
            if (!cityElement) {
                throw new Error('City not found in XML data.');
            }

            const cityName = cityElement.getAttribute('name');
            const country = xmlDoc.getElementsByTagName('country')[0].textContent;
            const temperature = xmlDoc.getElementsByTagName('temperature')[0].getAttribute('value');
            const flagUrl = `http://openweathermap.org/images/flags/${country.toLowerCase()}.png`;

            const weatherInfo = `
                <h4>Current Location Weather</h4>
                <p><img src="${flagUrl}" alt="Flag of ${country}"> ${cityName} - ${country}</p>
                <p>Temperature: ${parseFloat(temperature).toFixed(2)} °C</p>
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
    currentPage = 1;

    const userInput = document.getElementById('cityCountry').value.trim().toLowerCase();
    const [city, countryCode] = userInput.split(',').map(s => s.trim());
    const units = document.getElementById('flexRadioDefault1').checked ? 'imperial' : 'metric';
    const temperatureUnit = units === 'imperial' ? '°F' : '°C';

    if (!city) {
        document.getElementById('weather-info').innerHTML = '';
        document.getElementById('error-message').innerHTML = '<p>Please enter a city name.</p>';
        return;
    }

    document.getElementById('error-message').innerHTML = '';

    let apiUrl = `https://api.openweathermap.org/data/2.5/find?q=${city}`;
    if (countryCode) {
        apiUrl += `,${countryCode}`;
    }
    apiUrl += `&appid=${apiKey}&units=${units}&mode=xml&cnt=50`;

    fetch(apiUrl)
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, 'text/xml');
            const locationList = xmlDoc.querySelectorAll('item');

            if (locationList.length === 0) {
                document.getElementById('weather-info').innerHTML = '';
                document.getElementById('error-message').innerHTML = '<p>No matching city found. Please check the city name or country code.</p>';
                return;
            }

            let citiesProcessed = 0;

            locationList.forEach(location => {
                const cityElement = location.querySelector('city');
                const countryElement = location.querySelector('country');
                const cityName = cityElement.getAttribute('name');
                const country = countryElement.textContent;

                const cityWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName},${country}&appid=${apiKey}&units=${units}&mode=xml`;

                fetch(cityWeatherUrl)
                    .then(response => response.text())
                    .then(cityDataXml => {
                        const cityDataDoc = parser.parseFromString(cityDataXml, 'text/xml');
                        const weatherElement = cityDataDoc.querySelector('current');

                        const temperature = weatherElement.querySelector('temperature').getAttribute('value');
                        const maxTemp = weatherElement.querySelector('temperature').getAttribute('max');
                        const minTemp = weatherElement.querySelector('temperature').getAttribute('min');
                        const weatherCondition = weatherElement.querySelector('weather').getAttribute('value');
                        const windSpeed = weatherElement.querySelector('wind speed').getAttribute('value');
                        const humidity = weatherElement.querySelector('humidity').getAttribute('value');
                        const pressure = weatherElement.querySelector('pressure').getAttribute('value');
                        const sunrise = weatherElement.querySelector('city sun').getAttribute('rise');
                        const sunset = weatherElement.querySelector('city sun').getAttribute('set');

                        currentWeatherData.push({
                            id: cityElement.getAttribute('id'),
                            name: cityName,
                            country: country,
                            temperature: parseFloat(temperature),
                            maxTemp: parseFloat(maxTemp),
                            minTemp: parseFloat(minTemp),
                            weatherCondition: weatherCondition,
                            windSpeed: parseFloat(windSpeed),
                            humidity: parseFloat(humidity),
                            pressure: parseFloat(pressure),
                            sunrise: new Date(sunrise).getTime() / 1000,
                            sunset: new Date(sunset).getTime() / 1000,
                            unit: temperatureUnit
                        });

                        citiesProcessed++;

                        if (citiesProcessed === locationList.length) {
                            totalPages = Math.floor((citiesProcessed / recordsPerPage)+(citiesProcessed % recordsPerPage > 0 ? 1 : 0));
                            displayPage(currentPage);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching data for city:', error);
                    });
            });
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
                <div class="col-sm">Wind Speed: ${cityData.windSpeed} ${windSpeedUnit}</div>
                <div class="col-sm">Pressure: ${cityData.pressure} ${pressureUnit}</div>
                <div class="col-sm">Humidity: ${cityData.humidity} ${humidityUnit}</div>
                <div class="col-sm">Sunrise: ${formattedSunrise}</div>
                <div class="col-sm">Sunset: ${formattedSunset}</div>
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
