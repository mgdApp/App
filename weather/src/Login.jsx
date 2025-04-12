// src/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
        navigate('/');  // O la ruta de tu aplicación una vez logueado
        alert("You have successfully logged in.");
      } else {
        // Hubo un error
        setError(data.message);
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor.');
    }
  };

  return (
    <div className='sign-up-container'>
      
      <main>
        <div className='logo'>
          Access your account
        </div>
      <form onSubmit={handleLogin}>
        <div>
          <label className='text'>Email:</label><br />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className='text'>Password: </label><br />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">
          <span class="shadow"></span>
          <span class="edge"></span>
          <span class="front text">Login</span>
          </button>
        </form>
        {error && <div className='error'>{error}</div>}
      </main>

    </div>
  );
}

export default Login;