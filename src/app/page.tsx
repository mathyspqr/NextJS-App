'use client';

import { useState, useEffect } from 'react';
import { FaTrash, FaHeart, FaRegHeart, FaArrowRight } from 'react-icons/fa'; 
import Confetti from 'react-confetti';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginRegister from './LoginRegister';

const BASE_URL = 'https://express-back-end-phi.vercel.app';
const CONFETTI_DURATION = 3000; 

const Page = () => {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [commentingMessageId, setCommentingMessageId] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  interface Message {
    id: number;
    message: string;
    liked: boolean;
    likes: number;
  }

  interface Commentaire {
    id: number;
    message_id: number;
    commentaire: string;
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages();
    }
  }, [isAuthenticated]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${BASE_URL}/mathys`);
      const data = await response.json();
  
      const likeResponse = await fetch(`${BASE_URL}/likes/${user.id}`, {
        credentials: 'include',
      });
      const likeData = await likeResponse.json();
      const likedMessageIds = likeData.map((like: { message_id: number }) => like.message_id);
  
      const messagesWithLikes = data.map((message: Message) => ({
        ...message,
        liked: likedMessageIds.includes(message.id),
        likes: likedMessageIds.filter((id: number) => id === message.id).length,
      }));
  
      setMessages(messagesWithLikes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    }
  };

  const fetchCommentaires = async (messageId: number) => {
    try {
      const response = await fetch(`${BASE_URL}/messages/${messageId}/commentaires`);
      const data = await response.json();
      setCommentaires(data);
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

  const handleLike = async (id: number, liked: boolean) => {
    try {
      const url = liked ? `${BASE_URL}/unlike-message/${user.id}/${id}` : `${BASE_URL}/like-message/${user.id}/${id}`;
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Erreur lors de ${liked ? 'la suppression' : "l'ajout"} du like`);
      }
      fetchMessages(); // Reload messages after successful like/unlike
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    }
  };

  const handleComment = (id: number) => {
    setCommentingMessageId(commentingMessageId === id ? null : id);
    if (commentingMessageId !== id) {
      fetchCommentaires(id);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent, id: number) => {
    e.preventDefault();
    try {
      await fetch(`${BASE_URL}/messages/${id}/commentaires`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commentaire: newComment }),
      });
      toast.info('💬 Commentaire ajouté !', { autoClose: CONFETTI_DURATION });
      setNewComment('');
      fetchCommentaires(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    }
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), CONFETTI_DURATION);
  };

  if (!isAuthenticated) {
    return <LoginRegister onLogin={(user) => { setIsAuthenticated(true); setUser(user); }} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white text-black">
      {showConfetti && <Confetti />}
      <ToastContainer />
      <h1 className="text-3xl font-bold mb-4 text-center">🎉 Messages du Serveur récupérés dans ma base de données ! 🎉</h1>
      <p className="text-xl mb-4">Connecté en tant que : {user.id}</p>
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
          <li key={item.id} className="mb-2 flex flex-col bg-gray-200 p-2 rounded text-black">
            <div className="flex items-center justify-between">
              <span>{item.message}</span>
              <div className="flex items-center">
                <button onClick={() => handleLike(item.id, item.liked)} className="ml-2 text-red-500 hover:text-red-700 transition duration-300">
                  {item.liked ? <FaHeart /> : <FaRegHeart />}
                </button>
                <button onClick={() => handleComment(item.id)} className="ml-2 text-blue-500 hover:text-blue-700 transition duration-300">
                  <FaArrowRight />
                </button>
                <button onClick={() => handleDelete(item.id)} className="ml-2 text-red-500 hover:text-red-700 transition duration-300">
                  <FaTrash />
                </button>
              </div>
            </div>
            {commentingMessageId === item.id && (
              <div className="mt-2">
                <ul className="list-disc pl-4">
                  {commentaires.map((commentaire) => (
                    <li key={commentaire.id} className="mb-1">{commentaire.commentaire}</li>
                  ))}
                </ul>
                <form onSubmit={(e) => handleCommentSubmit(e, item.id)} className="mt-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="border p-2 mb-2 w-full rounded"
                    placeholder="✍️ Ajouter un commentaire"
                  />
                  <button type="submit" className="bg-green-500 text-white p-2 w-full rounded hover:bg-green-600 transition duration-300">
                    Envoyer le commentaire !
                  </button>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Page;