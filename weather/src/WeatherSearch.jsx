import React, { useState, useEffect, useRef } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './App.css';
import moment from 'moment';

import location from './assets/pin-white.png';
import sun from './assets/sunny.png';
import cloudy from './assets/cloudy.png';
import cloud from './assets/cloud.png';
import fog from './assets/foggy.png';
import drizzle from './assets/drizzle.png';
import rain from './assets/rainy.png';
import snow from './assets/sleet.png';
import thunder from './assets/thunder.png';
import moon from './assets/moon.png';
import cloudy_night from './assets/half-moon.png';

// Función auxiliar para esperar (en milisegundos)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/* Componente FavoriteCitiesSelect:
   Dropdown personalizado para mostrar las ciudades favoritas */
const FavoriteCitiesSelect = ({ favorites, onSelect }) => {
  // Se generan las opciones a partir de los favoritos y se agrega la opción "clear"
  const options = favorites.map((city) => ({ value: city, label: city }));
  options.push({ value: 'clear', label: 'Clear selection' });

  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('Select favorite city');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const optionRefs = useRef([]);

  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex].focus();
    }
  }, [isOpen, focusedIndex]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleDropdown = (expand = null) => {
    const newOpen = expand !== null ? expand : !isOpen;
    setIsOpen(newOpen);
    if (newOpen) {
      setFocusedIndex(0);
    } else {
      setFocusedIndex(-1);
      if (buttonRef.current) buttonRef.current.focus();
    }
  };

  const handleOptionSelect = (option) => {
    if (option.value === 'clear') {
      setSelectedValue('Select favorite city');
      onSelect('clear');
    } else {
      setSelectedValue(option.label);
      onSelect(option.value);
    }
    setIsOpen(false);
    if (buttonRef.current) buttonRef.current.focus();
  };

  const handleButtonKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setFocusedIndex(0);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleDropdownKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusedIndex((prevIndex) => (prevIndex + 1) % options.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedIndex((prevIndex) => (prevIndex - 1 + options.length) % options.length);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOptionSelect(options[focusedIndex]);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      if (buttonRef.current) buttonRef.current.focus();
    }
  };

  return (
    <div className="custom-select" ref={containerRef}>
      <button
        id="dropdown-button"
        className="select-button"
        role="combobox"
        aria-label="select button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="select-dropdown"
        onClick={() => toggleDropdown()}
        onKeyDown={handleButtonKeyDown}
        ref={buttonRef}
      >
        <span className="selected-value">{selectedValue}</span>
        <span className="arrow"></span>
      </button>
      <ul
        id="select-dropdown"
        className={`select-dropdown ${isOpen ? "" : "hidden"}`}
        role="listbox"
        aria-labelledby="dropdown-button"
        onKeyDown={handleDropdownKeyDown}
      >
        {options.map((option, index) => (
          <li
            key={option.value + index}
            role="option"
            tabIndex={index === focusedIndex ? 0 : -1}
            onClick={() => handleOptionSelect(option)}
            ref={(el) => (optionRefs.current[index] = el)}
          >
            {option.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

/* Componente WeatherSearch */
function WeatherSearch({ user }) {
  console.log("Usuario logueado:", user);

  const navigate = useNavigate();

  const maxForecastHours = 20;

  const [city, setCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [hourlyForecastData, setHourlyForecastData] = useState(null);
  const [timeData, setTimeData] = useState(null);
  const [tempUnit, setTempUnit] = useState('C');
  const [locationInfo, setLocationInfo] = useState({ city: "", state: "", country: "" });
  const [sliderOffset, setSliderOffset] = useState(0);

  // Estados de animación
  const [animateOpacity, setAnimateOpacity] = useState(1);
  const [applyFade, setApplyFade] = useState(true);
  const [backFade, setBackFade] = useState(false);

  // Favoritos del usuario (solo si está registrado)
  const [favorites, setFavorites] = useState([]);

  // Mapeo de códigos de clima según Open Meteo
  const weatherCodeMapping = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };

  useEffect(() => {
    if (user) {  
      const token = localStorage.getItem('token');
      fetch(`http://localhost:5000/user/${user.id}/favorites`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error("Error when getting favorites");
          }
          return response.json();
        })
        .then(data => {
          const favs = data.favorite_places ? data.favorite_places.split(',') : [];
          setFavorites(favs);
        })
        .catch(err => {
          console.error("Error fetching favorites:", err);
        });
    }
  }, [user]);

  const handleInputChange = (e) => {
    setCity(e.target.value);
  };

  // Función que consulta las APIs (geocodificación, forecast y TimeAPI)
  const fetchWeatherData = async () => {
    try {
      if (!city) {
        alert("Enter a valid city.");
        window.location.reload();
        return;
      }
      const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();
      if (!geocodeData.results || geocodeData.results.length === 0) {
        alert('The city was not found. Check the spelling or try another one.');
        window.location.reload();
        return;
      }
      const { latitude, longitude, name, admin1, country } = geocodeData.results[0];
      setLocationInfo({ city: name, state: admin1, country: country });
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=weathercode,temperature_2m,apparent_temperature,precipitation_probability,relativehumidity_2m,is_day&timezone=auto`;
      const forecastResponse = await fetch(forecastUrl);
      const forecastData = await forecastResponse.json();
      if (!forecastData || !forecastData.current_weather) {
        alert('The city was not found. Check the spelling or try another one.');
        window.location.reload();
        return;
      }
      let hourlyData = [];
      if (forecastData.hourly && forecastData.hourly.time) {
        hourlyData = forecastData.hourly.time.map((time, index) => ({
          time,
          temperature: forecastData.hourly.temperature_2m[index],
          apparent_temperature: forecastData.hourly.apparent_temperature[index],
          precipitation_probability: forecastData.hourly.precipitation_probability[index],
          relative_humidity: forecastData.hourly.relativehumidity_2m[index],
          weathercode: forecastData.hourly.weathercode[index],
          is_day: forecastData.hourly.is_day[index],
        }));
      }
      const timezone = forecastData.timezone || "UTC";
      const timeApiUrl = `https://timeapi.io/api/Time/current/zone?timeZone=${encodeURIComponent(timezone)}`;
      const timeApiResponse = await fetch(timeApiUrl);
      if (!timeApiResponse.ok) {
        throw new Error('Error when getting time from TimeAPI');
      }
      const timeApiData = await timeApiResponse.json();
      setWeatherData(forecastData);
      setHourlyForecastData(hourlyData);
      setTimeData(timeApiData);
    } catch (error) {
      console.error('Error when looking for weather information:', error);
      alert('An error occurred. Please try again later.');
      window.location.reload();
    }
  };

  const fetchWeatherDataForCity = async (cityValue) => {
    try {
      if (!cityValue) {
        alert("Enter a valid city.");
        window.location.reload();
        return;
      }
      const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityValue)}`;
      const geocodeResponse = await fetch(geocodeUrl);
      const geocodeData = await geocodeResponse.json();
      if (!geocodeData.results || geocodeData.results.length === 0) {
        alert('The city was not found. Check the spelling or try another one.');
        window.location.reload();
        return;
      }
      const { latitude, longitude, name, admin1, country } = geocodeData.results[0];
      setLocationInfo({ city: name, state: admin1, country: country });
      const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=weathercode,temperature_2m,apparent_temperature,precipitation_probability,relativehumidity_2m,is_day&timezone=auto`;
      const forecastResponse = await fetch(forecastUrl);
      const forecastData = await forecastResponse.json();
      if (!forecastData || !forecastData.current_weather) {
        alert('Weather for this city could not be obtained.');
        window.location.reload();
        return;
      }
      let hourlyData = [];
      if (forecastData.hourly && forecastData.hourly.time) {
        hourlyData = forecastData.hourly.time.map((time, index) => ({
          time,
          temperature: forecastData.hourly.temperature_2m[index],
          apparent_temperature: forecastData.hourly.apparent_temperature[index],
          precipitation_probability: forecastData.hourly.precipitation_probability[index],
          relative_humidity: forecastData.hourly.relativehumidity_2m[index],
          weathercode: forecastData.hourly.weathercode[index],
          is_day: forecastData.hourly.is_day[index],
        }));
      }
      const timezone = forecastData.timezone || "UTC";
      const timeApiUrl = `https://timeapi.io/api/Time/current/zone?timeZone=${encodeURIComponent(timezone)}`;
      const timeApiResponse = await fetch(timeApiUrl);
      if (!timeApiResponse.ok) {
        throw new Error('Error when getting time from TimeAPI');
      }
      const timeApiData = await timeApiResponse.json();
      setWeatherData(forecastData);
      setHourlyForecastData(hourlyData);
      setTimeData(timeApiData);
    } catch (error) {
      console.error('Error when looking for weather information:', error);
      alert('An error occurred. Please try again later.');
      window.location.reload();
    }
  };

  // Búsqueda principal sin animación extra
  const handleMainSearch = async () => {
    setApplyFade(false);
    await fetchWeatherData();
  };

  // Búsqueda mediante el select de favoritos

  const handleBack = async () => {
    setBackFade(true);
    setAnimateOpacity(0);

    await sleep(1000);
    setWeatherData(null);
    setCity('');
    await sleep(1000);

    setAnimateOpacity(1);

    setApplyFade(true);
    setBackFade(false);
  };

  // Función para manejar la selección de una ciudad favorita mediante el select personalizado.

  const handleFavoriteSelect = async (selectedCity) => {
    if (selectedCity === 'clear') {
      setCity('');
      return;
    } else {
      setCity(selectedCity);
      setAnimateOpacity(0);
      await sleep(1000);
      await fetchWeatherDataForCity(selectedCity);
      setAnimateOpacity(1);
    }
  };

  /* Función para manejar el "like" y guardar la ciudad actual en favoritos */

  const handleHeartClick = async () => {
    if (!user) {
      alert("You must be logged in to save a city in favorites.");
      return;
    }
    if (!city) {
      alert("There is no city selected for saving.");
      return;
    }
    if (favorites.includes(city)) {
      alert("The city is already in your favorites.");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:5000/user/${user.id}/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ new_place: city })
      });
      if (!response.ok) {
        throw new Error("Error when saving favorite");
      }
      const data = await response.json();
      alert(`City "${city}" stored in favorites.`);
      setFavorites([...favorites, city]);
    } catch (error) {
      console.error("Error when saving favorite:", error);
      alert("Error saving the city in favorites.");
    }
  };

  // Función que redirige al apartado login del sitio web.

  const handleLogin = () => {

    navigate('/login')

  }

  // Función para cerrar sesión (logout)
  const handleLogout = () => {

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');

    window.location.reload();
  };

  // Formateo de fecha y hora
  let formattedDate = "";
  let formattedTime = "";
  if (timeData && timeData.dateTime) {
    formattedDate = moment.parseZone(timeData.dateTime).format('dddd, MMMM D, YYYY');
    formattedTime = moment.parseZone(timeData.dateTime).format('HH:mm');
  } else if (weatherData && weatherData.current_weather && weatherData.current_weather.time) {
    formattedDate = moment.parseZone(weatherData.current_weather.time).format('dddd, MMMM D, YYYY');
    formattedTime = moment.parseZone(weatherData.current_weather.time).format('HH:mm');
  }

  // Función para obtener el índice actual en el pronóstico
  const getCurrentIndex = () => {
    if (weatherData && weatherData.current_weather && hourlyForecastData && hourlyForecastData.length) {
      const currentTime = moment(timeData.dateTime);
      for (let i = hourlyForecastData.length - 1; i >= 0; i--) {
        if (moment(hourlyForecastData[i].time).isSameOrBefore(currentTime)) {
          return i;
        }
      }
    }
    return 0;
  };

  const currentIndex = getCurrentIndex();
  const currentPrecipitation = hourlyForecastData && hourlyForecastData[currentIndex]
    ? hourlyForecastData[currentIndex].precipitation_probability
    : null;
  const currentRelativeHumidity = hourlyForecastData && hourlyForecastData[currentIndex]
    ? hourlyForecastData[currentIndex].relative_humidity
    : null;
  const currentApparentTemperature = hourlyForecastData && hourlyForecastData[currentIndex]
    ? hourlyForecastData[currentIndex].apparent_temperature
    : null;
  const weatherText = weatherData && weatherData.current_weather
    ? (weatherCodeMapping[weatherData.current_weather.weathercode] || "")
    : "";
  const currentWeatherCode = weatherData?.current_weather?.weathercode;
  const getWeatherIcon = (code, is_day) => {
    if (code === 0) return is_day ? sun : moon;
    else if (code === 1 || code === 2) return is_day ? cloudy : cloudy_night;
    else if (code === 3) return cloud;
    else if (code === 45 || code === 48) return fog;
    else if ([51, 53, 55, 56, 57].includes(code)) return drizzle;
    else if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return rain;
    else if ([71, 73, 75, 77, 85, 86].includes(code)) return snow;
    else if ([95, 96, 99].includes(code)) return thunder;
    return sun;
  };
  
  const iconSrc = currentWeatherCode !== undefined 
    ? getWeatherIcon(currentWeatherCode, weatherData?.current_weather?.is_day) 
    : null;

  const sliderStart = currentIndex + 1 + sliderOffset;
  const maxSliderIndex = currentIndex + 1 + maxForecastHours;
  const sliderEnd = Math.min(sliderStart + 5, maxSliderIndex);

  const handleSliderNext = () => {
    const totalHoursAvailable = hourlyForecastData.length;
    if (sliderEnd < Math.min(totalHoursAvailable, maxSliderIndex)) {
      setSliderOffset(sliderOffset + 5);
    }
  };

  const handleSliderPrev = () => {
    if (sliderOffset > 0) {
      setSliderOffset(sliderOffset - 5);
    }
  };

  const sliderEndLogged = sliderStart + 5;

  const handleSliderNextLogged = () => {
    if (sliderEndLogged < hourlyForecastData.length) {
      setSliderOffset(sliderOffset + 5);
    }
  };

  return (
    <main>
      {weatherData && (
        <div>
          <motion.button
            className='go-back'
            onClick={handleBack}
            animate={{ opacity: animateOpacity }}
            transition={{ duration: 1 }}
          >
            <div className='go-back-sign'>
              <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd">
                <path d="M2.117 12l7.527 6.235-.644.765-9-7.521 9-7.479.645.764-7.529 6.236h21.884v1h-21.883z"/>
              </svg>
            </div>
          </motion.button>

          <motion.div animate={{ opacity: animateOpacity }} transition={{ duration: 1 }}>
            {user ? (
              <div className='log-out' onClick={handleLogout}>
                <div className="log-out-sign">
                  <svg viewBox="0 0 512 512">
                    <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z"></path>
                  </svg>
                </div>
                <div className="log-out-text">Logout</div>
              </div>
            ) : (
              <div className='log-out' onClick={handleLogin}>
                <div className="log-out-sign">
                  <svg viewBox="0 0 512 512"><path d="M217.9 105.9L340.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L217.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1L32 320c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM352 416l64 0c17.7 0 32-14.3 32-32l0-256c0-17.7-14.3-32-32-32l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l64 0c53 0 96 43 96 96l0 256c0 53-43 96-96 96l-64 0c-17.7 0-32-14.3-32-32s14.3-32 32-32z"></path></svg>
                </div>
                <div className="log-out-text">Login</div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {!weatherData && (
        <div className={`search ${applyFade ? '' : 'fade-out'} ${backFade ? 'fade-in' : ''}`}>
          <div className="logo-big">Weather App</div>
          <input
            type="text"
            placeholder="Enter a city..."
            value={city}
            className="search-city"
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleMainSearch();
            }}
          />
          <button onClick={handleMainSearch}>
            <span className="shadow"></span>
            <span className="edge"></span>
            <span className="front text">Search</span>
          </button>
        </div>
      )}

      {weatherData && (
        <div className={`result ${applyFade ? '' : 'fade-in'} ${backFade ? 'fade-out' : ''}`}>
          <div className="location">
            <motion.div animate={{ opacity: animateOpacity }} transition={{ duration: 1 }}>
              <div className="logo">Weather App</div>
              <div className="location-icon-text">
                <img src={location} alt="Ubicación" className="location-image" />
                <div className="location-text">
                  {locationInfo.city}
                  {locationInfo.state ? `, ${locationInfo.state}` : ""}
                  {locationInfo.country ? `, ${locationInfo.country}` : ""}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="units">
            {user && favorites.length > 0 ? (
              <motion.div animate={{ opacity: animateOpacity }} transition={{ duration: 1 }}>
                <FavoriteCitiesSelect favorites={favorites} onSelect={handleFavoriteSelect} />
              </motion.div>
            ) : (
              '' 
            )}
            <motion.div animate={{ opacity: animateOpacity }} transition={{ duration: 1 }}>
              <div className="change-units">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setTempUnit('C'); }}
                  className={`link ${tempUnit === 'C' ? 'active-unit' : 'unit-link'}`}
                >
                  °C
                </a>
                |
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setTempUnit('F'); }}
                  className={`link ${tempUnit === 'F' ? 'active-unit' : 'unit-link'}`}
                >
                  °F
                </a>
              </div>
            </motion.div>
          </div>

          <motion.div animate={{ opacity: animateOpacity }} transition={{ duration: 1 }}>
            <div className="current">
              <div className="parent">
                <div className="date-hour">
                  <div className="date">{formattedDate}</div>
                  <div className="hour">Weather at {formattedTime}</div>
                </div>
                <div className="icon">
                  {iconSrc && (
                    <img src={iconSrc} alt="Icono del clima actual" className="weather-icon" />
                  )}
                </div>
                <div className="temperature">
                  {tempUnit === 'C'
                    ? Math.round(weatherData.current_weather.temperature) + " °C"
                    : Math.round((weatherData.current_weather.temperature * 9 / 5) + 32) + " °F"}
                </div>
                <div className="summary">
                  <div className="description">{weatherText}</div>
                  <div className="real-feel">
                    Feels like {tempUnit === 'C'
                      ? (currentApparentTemperature != null
                          ? Math.round(currentApparentTemperature) + " °C"
                          : Math.round(weatherData.current_weather.temperature) + " °C")
                      : (currentApparentTemperature != null
                          ? Math.round((currentApparentTemperature * 9 / 5) + 32) + " °F"
                          : Math.round((weatherData.current_weather.temperature * 9 / 5) + 32) + " °F")}
                  </div>
                </div>
                <div className="forecast">
                  <div className="precipitation">
                    Rain: {currentPrecipitation != null ? currentPrecipitation + "%" : "No disponible"}
                  </div>
                  <div className="humidity">
                    Humidity: {currentRelativeHumidity != null ? Math.round(currentRelativeHumidity) + "%" : "No disponible"}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div animate={{ opacity: animateOpacity }} transition={{ duration: 1 }}>
            <div className="weather-by-hours">

              {user ? (
                
                <div>

                  <div className="link-register">
                                  
                    Extended forecast

                  </div>

                  <div className="slider-container">
                    <button onClick={handleSliderPrev} disabled={sliderOffset === 0}>
                      ←
                    </button>
                    <div className="slider-forecast">
                      {hourlyForecastData
                        ?.slice(sliderStart, sliderEndLogged)
                        .map((forecast, idx) => {
                          const hour = moment(forecast.time).format('HH:mm');
                          const temperature =
                            tempUnit === 'C'
                              ? Math.round(forecast.temperature) + ' °C'
                              : Math.round((forecast.temperature * 9) / 5 + 32) + ' °F';
                          const iconForecast = getWeatherIcon(
                            forecast.weathercode,
                            forecast.is_day
                          );
                          return (
                            <div key={idx} className="hour-forecast">
                              <div className="next-hour">{hour}</div>
                              <img src={iconForecast} alt="Icono" className="next-icon" />
                              <div className="next-temperature">{temperature}</div>
                            </div>
                          );
                        })}
                    </div>
                    <button
                      onClick={handleSliderNextLogged}
                      disabled={sliderEndLogged >= hourlyForecastData.length}
                    >
                      →
                    </button>
                  </div>

                </div>

              ) : (
                
                <div>

                  <div className="link-register">
                                  
                    <Link to="/signup">Register</Link> to see the next 7 days forecast.

                  </div>

                  <div className="slider-container">
                    <button onClick={handleSliderPrev} disabled={sliderOffset === 0}>
                      ←
                    </button>
                    <div className="slider-forecast">
                      {hourlyForecastData
                        ?.slice(sliderStart, sliderEnd)
                        .map((forecast, idx) => {
                          const hour = moment(forecast.time).format('HH:mm');
                          const temperature =
                            tempUnit === 'C'
                              ? Math.round(forecast.temperature) + ' °C'
                              : Math.round((forecast.temperature * 9) / 5 + 32) + ' °F';
                          const iconForecast = getWeatherIcon(
                            forecast.weathercode,
                            forecast.is_day
                          );
                          return (
                            <div key={idx} className="hour-forecast">
                              <div className="next-hour">{hour}</div>
                              <img src={iconForecast} alt="Icono" className="next-icon" />
                              <div className="next-temperature">{temperature}</div>
                            </div>
                          );
                        })}
                    </div>
                    <button
                      onClick={handleSliderNext}
                      disabled={sliderEnd >= Math.min(hourlyForecastData.length, maxSliderIndex)}
                    >
                      →
                    </button>
                  </div>

                </div>

              )}


              <div className="like-button">
                <input
                  className="on"
                  id="heart"
                  type="checkbox"
                  onChange={handleHeartClick}
                />
                <label className="like" htmlFor="heart">
                  <svg
                    className="like-icon"
                    fillRule="nonzero"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z"
                    ></path>
                  </svg>
                </label>
              </div>
              
            </div>
          </motion.div>

          <div className="register">
            <motion.div animate={{ opacity: animateOpacity }} transition={{ duration: 1 }}>
              
              <div className="acknowledgment">
                
                Information retrieved from Open Meteo.

                <div className='share'>

                  <button class="Btn">

                    <a
                      href={
                        `https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `The current weather in ${locationInfo.city} is ${weatherData.current_weather.temperature} °C - ${weatherText}.`
                        )}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                    
                      <span class="svgContainer">
                        <svg
                          viewBox="0 0 24 24"
                          height="18px"
                          class="svgIcon"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M19.001 4.908A9.817 9.817 0 0 0 11.992 2C6.534 2 2.085 6.448 2.08 11.908c0 1.748.458 3.45 1.321 4.956L2 22l5.255-1.377a9.916 9.916 0 0 0 4.737 1.206h.005c5.46 0 9.908-4.448 9.913-9.913A9.872 9.872 0 0 0 19 4.908h.001ZM11.992 20.15A8.216 8.216 0 0 1 7.797 19l-.3-.18-3.117.818.833-3.041-.196-.314a8.2 8.2 0 0 1-1.258-4.381c0-4.533 3.696-8.23 8.239-8.23a8.2 8.2 0 0 1 5.825 2.413 8.196 8.196 0 0 1 2.41 5.825c-.006 4.55-3.702 8.24-8.24 8.24Zm4.52-6.167c-.247-.124-1.463-.723-1.692-.808-.228-.08-.394-.123-.556.124-.166.246-.641.808-.784.969-.143.166-.29.185-.537.062-.247-.125-1.045-.385-1.99-1.23-.738-.657-1.232-1.47-1.38-1.716-.142-.247-.013-.38.11-.504.11-.11.247-.29.37-.432.126-.143.167-.248.248-.413.082-.167.043-.31-.018-.433-.063-.124-.557-1.345-.765-1.838-.2-.486-.404-.419-.557-.425-.142-.009-.309-.009-.475-.009a.911.911 0 0 0-.661.31c-.228.247-.864.845-.864 2.067 0 1.22.888 2.395 1.013 2.56.122.167 1.742 2.666 4.229 3.74.587.257 1.05.408 1.41.523.595.19 1.13.162 1.558.1.475-.072 1.464-.6 1.673-1.178.205-.58.205-1.075.142-1.18-.061-.104-.227-.165-.475-.29Z"
                          ></path>
                        </svg>
                      </span>

                      <span class="BG"></span>

                    </a>
                  </button>

                    <button class="Btn">

                      <a
                        href={
                          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                            `The current weather in ${locationInfo.city} is ${weatherData.current_weather.temperature} °C - ${weatherText}.`
                          )}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span class="svgContainer">
                          <svg
                            viewBox="0 0 512 512"
                            height="16px"
                            xmlns="http://www.w3.org/2000/svg"
                            class="svgIcon"
                          >
                            <path
                              d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"
                            ></path>
                          </svg>
                        </span>

                        <span class="BG"></span>

                      </a>
                    </button>
                </div>

              </div>
            </motion.div>
          </div>
        </div>
      )}
    </main>
  );
}

export default WeatherSearch;


