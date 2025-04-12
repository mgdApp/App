import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';

function SignUp({ onSignUpSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        // Registro exitoso
        onSignUpSuccess(data);
        navigate('/login');
      } else {
        // Error en el registro
        setError(data.message || 'Error when registering the user:');
      }
    } catch (err) {
      console.error('Error en la petición:', err);
      setError('Server connection error.');
    }
  };

  return (
    <div className='sign-up-container'>
      
      <main>
        <div className='logo'>
          Create your account
        </div>
        <form onSubmit={handleSignUp}>
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
            <label className='text'>Password:</label><br />
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
            <span class="front text">Register</span>
          </button>
        </form>
        {error && <div className='error'>{error}</div>}
      </main>

    </div>
    
  );
}

export default SignUp;
