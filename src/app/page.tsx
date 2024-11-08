'use client';
import React, { useState } from 'react';
import axios from 'axios';

const BASE_URL = 'https://express-back-end-phi.vercel.app';

const LoginRegister = ({ onLogin }: { onLogin: (username: string, id: number) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isLogin ? `${BASE_URL}/login` : `${BASE_URL}/register`;
    const data = isLogin ? { username, password } : { username, email, password };
    console.log('Sending data:', data); // Log data being sent
    try {
      const response = await axios.post(url, data);
      console.log('Received response:', response.data); // Log response data
      setMessage(response.data.message);
      if (response.status === 200) {
        onLogin(username, response.data.id); // Pass the user ID to onLogin
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage(error.response.data.error);
      } else {
        setMessage('An unexpected error occurred');
      }
    }
  };

  return (
    <div>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        {!isLogin && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        )}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
      </form>
      <p>{message}</p>
      <button onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Switch to Register' : 'Switch to Login'}
      </button>
    </div>
  );
};

export default LoginRegister;