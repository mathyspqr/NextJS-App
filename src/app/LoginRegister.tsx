'use client';

import React, { useState } from 'react';
import { createClient } from '../app/utils/supabase/client';

const supabase = createClient();

interface User {
  id: string;   // UUID Supabase
  name: string; // username (metadata) ou email
}

interface LoginRegisterProps {
  onLogin: (user: User) => void;
}

const LoginRegister: React.FC<LoginRegisterProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);

  // Register only
  const [username, setUsername] = useState('');

  // Both login + register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      if (isLogin) {
        // ✅ Login via Supabase (email + password)
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const u = data.user;
        onLogin({
          id: u?.id ?? '',
          name: (u?.user_metadata?.username as string) ?? u?.email ?? 'Utilisateur',
        });

        setMessage('Connexion réussie ✅');
      } else {
        // ✅ Register via Supabase
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username }, // stocké dans user_metadata
          },
        });

        if (error) throw error;

        // Si "Confirm email" est ON dans Supabase, l'utilisateur devra confirmer son email avant login
        setMessage('Inscription réussie ✅');
      }
    } catch (err: any) {
      setMessage(err?.message ?? 'Une erreur inattendue est survenue');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-200">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 border border-gray-300">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {isLogin ? 'Connexion' : 'Inscription'}
        </h2>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-4">
              <label className="block text-gray-700">Nom utilisateur :</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}

          {/* ✅ Email requis pour login ET register */}
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
            {isLogin ? 'Inscription' : 'Passer à la connexion'}
          </button>
        </form>

        {message && <p className="mt-4 text-red-500 text-center">{message}</p>}
      </div>
    </div>
  );
};

export default LoginRegister;
