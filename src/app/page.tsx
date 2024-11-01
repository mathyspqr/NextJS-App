"use client";

import { useEffect, useState } from "react";

// Définir l'interface pour le message
interface Message {
  id: number;
  message: string; // Assurez-vous que cela correspond à la structure de votre objet
}

// Définir la base URL
const BASE_URL = 'https://express-back-end-phi.vercel.app';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]); // Utiliser l'interface Message ici
  const [error, setError] = useState<string | null>(null); // Définir le type pour l'erreur

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${BASE_URL}/mathys`); // Utiliser la base URL ici
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des messages');
        }
        const data: Message[] = await response.json(); // Typage de la réponse
        setMessages(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
      }
    };

    fetchMessages();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">Messages du Serveur récupérés dans ma base de données ahahahah</h1>
      {error && <p className="text-red-500">{error}</p>}
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
