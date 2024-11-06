"use client";

import { useEffect, useState } from "react";

interface Message {
  id: number;
  message: string; 
}

const BASE_URL = 'https://express-back-end-phi.vercel.app';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null); 
  const [newMessage, setNewMessage] = useState<string>("");

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${BASE_URL}/mathys`); 
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des messages');
      }
      const data: Message[] = await response.json();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: newMessage }),
      });
      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi du message');
      }
      setNewMessage("");
      fetchMessages(); // Reload messages after successful submission
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">Messages du Serveur récupérés dans ma base de données ahahahah</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="border p-2 mr-2"
          placeholder="Entrez votre message"
        />
        <button type="submit" className="bg-blue-500 text-white p-2">Envoyer</button>
      </form>
      <ul className="list-disc">
        {messages.map((item) => (
          <li key={item.id} className="mb-2"> {/* Utiliser 'item.id' pour la clé */}
            {item.message} {/* Affichage de la propriété 'message' */}
          </li>
        ))}
      </ul>
    </div>
  );
}