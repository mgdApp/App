import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WeatherSearch from './WeatherSearch';
import Login from './Login';
import SignUp from './SignUp';

function App() {
  const [user, setUser] = useState(null); // null si no está logueado

  // Al cargar la aplicación, intenta leer la sesión almacenada en localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error al parsear el usuario almacenado:", err);
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    // Además, guarda la información en localStorage para que persista la sesión
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleSignUpSuccess = (data) => {
    alert("Registration successful!");
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WeatherSearch user={user} />} />
        <Route path="/signup" element={<SignUp onSignUpSuccess={handleSignUpSuccess} />} />
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
