'use client'

import { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa'; 
import Confetti from 'react-confetti';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASE_URL = 'https://express-back-end-phi.vercel.app';
const CONFETTI_DURATION = 3000; // Durée des confettis et des toasts en millisecondes

const Page = () => {
  interface Message {
    id: number;
    message: string; 
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${BASE_URL}/mathys`);
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_URL}/insert-message`, {
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
      triggerConfetti();
      toast.success('🎉 Message ajouté avec succès !', { autoClose: CONFETTI_DURATION });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`${BASE_URL}/delete-message/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du message');
      }
      fetchMessages(); // Reload messages after successful deletion
      triggerConfetti();
      toast.success('🗑️ Message supprimé avec succès !', { autoClose: CONFETTI_DURATION });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    }
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), CONFETTI_DURATION); // Affiche les confettis pendant la durée définie
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white text-black">
      {showConfetti && <Confetti />}
      <ToastContainer />
      <h1 className="text-3xl font-bold mb-4 text-center">🎉 Messages du Serveur récupérés dans ma base de données ! 🎉</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="mb-4 w-full max-w-md">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="border p-2 mb-2 w-full rounded"
          placeholder="✍️ Nouveau message"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 w-full rounded hover:bg-blue-600 transition duration-300">
          Envoyer
        </button>
      </form>
      <ul className="list-disc w-full max-w-md">
        {messages.map((item) => (
          <li key={item.id} className="mb-2 flex items-center justify-between bg-gray-200 p-2 rounded text-black">
            {item.message}
            <button onClick={() => handleDelete(item.id)} className="ml-2 text-red-500 hover:text-red-700 transition duration-300">
              <FaTrash />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Page;