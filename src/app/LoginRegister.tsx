'use client';
import React, { useState } from 'react';
import axios from 'axios';

const BASE_URL = 'https://express-back-end-phi.vercel.app';

const LoginRegister = ({ onLogin }: { onLogin: (username: string) => void }) => {
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
        onLogin(username);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage(error.response.data.error);
      } else {
        setMessage('Une erreur inattendue est survenue');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 border border-gray-300">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">{isLogin ? 'Connexion' : 'Inscription'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Nom d'utilisateur :</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          {!isLogin && (
            <div className="mb-4">
              <label className="block text-gray-700">Email :</label>
              <input
                type="email"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-gray-700">Mot de passe :</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition duration-200"
          >
            {isLogin ? 'Connexion' : 'Inscription'}
          </button>
          <button
            type="button"
            className="w-full mt-4 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition duration-200"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Passer à l&apos;inscription' : 'Passer à la connexion'}
          </button>
        </form>
        {message && <p className="mt-4 text-red-500 text-center">{message}</p>}
      </div>
    </div>
  );
};

export default LoginRegister;