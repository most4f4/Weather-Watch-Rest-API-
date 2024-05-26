// Add an event listener to the form to handle the submission event
// This prevents the default form submission behavior, which would reload the page
// Instead, it calls the fetchWeather function to handle the form data and fetch weather information
document.getElementById('weather-form').addEventListener('submit', function(event) {
    event.preventDefault();
    fetchWeather();
});

// When the window loads, automatically fetch the weather information
// for the user's current location by calling the getCurrentLocationWeather function
window.onload = function() {
    getCurrentLocationWeather();
};

let currentPage = 1;
const recordsPerPage = 3;
let totalPages = 0;
let currentWeatherData = [];
const apiKey = "48bd836253a2ae351c8ee9839626dc14";

// This function is designed to fetch and display the weather information for 
// the user's current geographical location. It uses the browser's Geolocation API
// to determine the user's latitude and longitude coordinates, and then it calls 
// another function to fetch weather data for those coordinates.
function getCurrentLocationWeather() {
    // Check if the browser supports the Geolocation API
    if (navigator.geolocation) {
        // Request the current position from the Geolocation API
        // The navigator.geolocation.getCurrentPosition function is designed to work with callbacks rather than promises.
        navigator.geolocation.getCurrentPosition(position => {
            // Extract the latitude and longitude from the position object
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            // Fetch the weather data using the latitude and longitude
            fetchWeatherByCoords(lat, lon);
        }, error => {
            // Log the error to the console
            console.error('Error getting location:', error);
            // Display an error message to the user
            document.getElementById('current-location-weather').innerHTML = '<p>Unable to retrieve your location.</p>';
        });
    } else {
        // If the browser does not support Geolocation API, display a message
        document.getElementById('current-location-weather').innerHTML = '<p>Geolocation is not supported by your browser.</p>';
    }
}

function fetchWeatherByCoords(lat, lon) {
    // API URL using the provided latitude, longitude, API key, and default metric unit
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    // Fetch weather data from the API
    fetch(apiUrl)
        // Convert the response to JSON format
        .then(response => response.json())
        // Process the JSON data
        .then(data => {
            // Log the result to the console to get the structure of data
            console.log(data);
            // Extract relevant information from the data
            const cityName = data.name;
            const country = data.sys.country;
            const temperature = data.main.temp;
            const flagUrl = `http://openweathermap.org/images/flags/${country.toLowerCase()}.png`;
            // Construct HTML to display weather information
            const weatherInfo = `
                <h4>Current Location Weather</h4>
                <p><img src="${flagUrl}" alt="Flag of ${country}"> ${cityName} - ${country}</p>
                <p>Temperature: ${temperature.toFixed(2)} °C</p>
            `;
            // Update the content of the 'current-location-weather' element with the weather information
            document.getElementById('current-location-weather').innerHTML = weatherInfo;
        })
        // Handle any errors that occur during the fetch operation
        .catch(error => {
            // Log the error to the console
            console.error('Error fetching data:', error);
            // Update the content of the 'current-location-weather' element with an error message
            document.getElementById('current-location-weather').innerHTML = '<p>Error fetching weather data for current location.</p>';
        });
}

// Formats a Unix timestamp into HH:MM format.
function formatTime(unixTimestamp) {
    // Convert Unix timestamp to a Date object
    const date = new Date(unixTimestamp * 1000);
    // Extract hours from the Date object
    const hours = date.getHours();
    // Extract minutes from the Date object and ensure it has leading zeros if necessary
    const minutes = ("0" + date.getMinutes()).slice(-2);
    // Construct and return the formatted time string
    return `${hours}:${minutes}`;
} 

// Fetches weather data from the OpenWeatherMap API based on user input.
function fetchWeather() {
    // Clear previous results
    currentWeatherData = []; 
    // Get the value entered by the user in the input field, trim any leading or trailing whitespace, and convert to lowercase
    const userInput = document.getElementById('cityCountry').value.trim().toLowerCase();
    // Split the userInput string by commas, then map over the resulting array to trim any whitespace from each element
    // The result is an array containing the city name as the first element and the country code as the second element
    const [city, countryCode] = userInput.split(',').map(s => s.trim());
    // Determine the preferred unit of temperature (imperial for Farenheit, metric for Celsius)
    const units = document.getElementById('flexRadioDefault1').checked ? 'imperial' : 'metric';
    const temperatureUnit = units === 'imperial' ? '°F' : '°C';

    // Check if city input is provided
    if (!city) {
        document.getElementById('weather-info').innerHTML = '';
        document.getElementById('error-message').innerHTML = '<p>Please enter a city name.</p>';
        return;
    }

    document.getElementById('error-message').innerHTML = '';

    // Construct the API URL for fetching weather data
    var apiUrl = `https://api.openweathermap.org/data/2.5/find?q=${city}`
    if (countryCode) {
        apiUrl += `${countryCode}`;
    } 
    apiUrl += `&appid=${apiKey}&units=${units}&cnt=50`
    
    // Fetch weather data from the API
    fetch(apiUrl)
        .then(response => response.json())
        .then(data=>{
            // Check if the response contains valid data
            if (data.cod !== "200" || data.count === 0) {
                document.getElementById('weather-info').innerHTML = '';
                document.getElementById('error-message').innerHTML = '<p>No matching city found. Please check the city name or country code.</p>';
                return;
            }

            let citiesProcessed = 0;

            // Iterate over each city in the response data
            for (let i = 0; i < data.list.length; i++) {
                const city = data.list[i];
                const cityName = city.name;
                const countryCode = city.sys.country;
    
                // Construct the URL to fetch weather data for the current city
                const cityWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName},${countryCode}&appid=${apiKey}&units=${units}`;
    
                // Fetch weather data for the current city
                fetch(cityWeatherUrl)
                    .then(response => response.json())
                    .then(cityData => {
                        // Store the retrieved weather data in the currentWeatherData array
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
                            unit: temperatureUnit
                        });
    
                        citiesProcessed++;
    
                        // Check if all cities have been processed
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
// Display the weather information for the specified page.
function displayPage(page) {
    // Calculate the start and end index for the current page
    const startIndex = (page - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    
    // Extract the data for the current page
    const pageData = currentWeatherData.slice(startIndex, endIndex);
    
    // Generate HTML for each city's weather information on the current page
    const weatherInfo = pageData.map(cityData => {
        // Format sunrise and sunset times
        const formattedSunrise = formatTime(cityData.sunrise);
        const formattedSunset = formatTime(cityData.sunset);
        
        // Generate the URL for the flag image
        const flagUrl = `http://openweathermap.org/images/flags/${cityData.country.toLowerCase()}.png`;
        
        // Generate HTML for each city's weather information
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
                <div class="col-sm">Wind Speend: ${cityData.windSpeed}</div>
                <div class="col-sm">Pressure: ${cityData.pressure}</div>
                <div class="col-sm">Humidity: ${cityData.humidity}</div>
                <div class="col-sm">Sunrise: ${formattedSunrise}</div>
                <div class="col-sm">Sunset: ${formattedSunset}</div>
            </div>
        </div>`;
    }).join(''); // Convert the array of HTML strings into a single string
    
    // Combine the weather information HTML with the result heading
    let result = 
        `<div class="text-center" style="margin-bottom: 20px;">
            <h5> Here is the result: </h5>
        </div>`
    result += weatherInfo;

    // Update the weather info section with the generated HTML
    document.getElementById('weather-info').innerHTML = result;

    // Update the pagination controls
    document.getElementById('pagination').innerHTML = `
    <button onclick="prevPage()" ${page === 1 ? 'disabled' : ''}>Previous</button>
    <span>Page ${page} of ${totalPages}</span>
    <button onclick="nextPage()" ${page === totalPages ? 'disabled' : ''}>Next</button>
    `;
}

// Display the previous page of weather information.
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayPage(currentPage);
    }
}

// Display the next page of weather information.
function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        displayPage(currentPage);
    }
}