'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FaTrash, FaHeart, FaRegHeart, FaArrowRight, FaUser, FaSignOutAlt, FaEdit, FaCheck, FaTimes, FaSmile, FaImage } from 'react-icons/fa';
import Confetti from 'react-confetti';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LoginRegister from './LoginRegister';
import { createClient } from '../app/utils/supabase/client';

const supabase = createClient();

const BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : 'https://express-back-end-phi.vercel.app/api';
const CONFETTI_DURATION = 3000;

interface User {
  id: string;
  name: string;
  color?: string;
}

interface Message {
  id: number;
  message: string;
  liked: boolean;
  likes: number;
  username?: string;
  user_color?: string;
  image_url?: string;
}

interface Commentaire {
  id: number;
  message_id: number;
  user_id: string;
  commentaire: string;
  username?: string;
  user_color?: string;
}

async function getAuthHeader(): Promise<{ Authorization?: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : { Authorization: undefined };
}

const Page = () => {
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [commentingMessageId, setCommentingMessageId] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commentairesByMessage, setCommentairesByMessage] = useState<Record<number, Commentaire[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({});
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isClosingMenu, setIsClosingMenu] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editingUsername, setEditingUsername] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [isEditingColor, setIsEditingColor] = useState(false);
  const [editingColor, setEditingColor] = useState('#3B82F6');
  const [isUpdatingColor, setIsUpdatingColor] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [usersTyping, setUsersTyping] = useState<Record<string, string>>({});
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ✅ Restore session on refresh
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const u = data.session.user;
        
        // Récupérer la couleur depuis profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('color')
          .eq('id', u.id)
          .single();
        
        const userColor = profile?.color || '#3B82F6';
        
        setIsAuthenticated(true);
        setUser({
          id: u.id,
          name: (u.user_metadata?.username as string) ?? u.email ?? 'Utilisateur',
          color: userColor,
        });
        setEditingColor(userColor);
      }
    });
  }, []);

  // ✅ Fermer le menu utilisateur au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        closeUserMenu();
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showUserMenu || showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showEmojiPicker]);

  const closeUserMenu = () => {
    setIsClosingMenu(true);
    setTimeout(() => {
      setShowUserMenu(false);
      setIsClosingMenu(false);
    }, 200); // Correspond à la durée de l'animation
  };

  const fetchMessages = useCallback(async () => {
    try {
      setError('');
      setLoadingMessages(true);

      const response = await fetch(`${BASE_URL}/mathys`);
      const data = await response.json();

      // likes (optionnel) — ton endpoint ne demande pas auth, donc pas de token ici
      const likeResponse = await fetch(`${BASE_URL}/likes/${user?.id ?? ''}`);
      const likeData = await likeResponse.json();
      const likedMessageIds = Array.isArray(likeData)
        ? likeData.map((like: { message_id: number }) => like.message_id)
        : [];

      // Récupérer les couleurs des utilisateurs depuis profiles
      const messagesWithLikesAndColors = await Promise.all(
        (Array.isArray(data) ? data : []).map(async (message: Message & { user_id: string }) => {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('color')
            .eq('id', message.user_id)
            .single();
          
          if (profileError) {
            console.warn('⚠️ Erreur récupération couleur pour user', message.user_id, profileError);
          }
          
          const userColor = profile?.color || '#3B82F6';
          console.log('🎨 Message', message.id, 'user', message.user_id, 'couleur:', userColor);
          
          return {
            ...message,
            liked: likedMessageIds.includes(message.id),
            likes: likedMessageIds.filter((id: number) => id === message.id).length,
            user_color: userColor,
          };
        })
      );

      setMessages(messagesWithLikesAndColors);
      console.log('Messages fetched:', messagesWithLikesAndColors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    } finally {
      setLoadingMessages(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated) fetchMessages();
  }, [isAuthenticated, fetchMessages]);

  // ✅ Supabase Realtime - Écoute des nouveaux messages
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const messagesChannel = supabase
      .channel('public-messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('📨 Nouveau message reçu via Realtime:', payload);
          const newMsg = payload.new as Message & { user_id: string };
          console.log('🔍 Données du nouveau message:', {
            id: newMsg.id,
            message: newMsg.message,
            image_url: newMsg.image_url,
            user_id: newMsg.user_id
          });
          
          // ✅ Récupérer le username depuis la table profiles avec le user_id
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, color')
            .eq('id', newMsg.user_id)
            .single();
          
          const username = profile?.username || 'Utilisateur';
          const userColor = profile?.color || '#3B82F6';
          
          // ✅ Notification si le message n'est pas de l'utilisateur actuel
          if (newMsg.user_id !== user?.id) {
            const notifText = newMsg.image_url 
              ? `📨 ${username} a envoyé une image`
              : `📨 Nouveau message de ${username}`;
            toast.info(notifText, {
              autoClose: 3000,
              position: 'top-right'
            });
          }

          console.log('✅ Ajout du message avec image_url:', newMsg.image_url);

          // ✅ Ajouter le message à la liste avec le username et la couleur
          setMessages(prev => [...prev, {
            id: newMsg.id,
            message: newMsg.message || "",
            liked: false,
            likes: 0,
            username: username,
            user_color: userColor,
            image_url: newMsg.image_url ?? undefined
          }]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('🗑️ Message supprimé via Realtime:', payload);
          const deletedId = payload.old.id;
          setMessages(prev => prev.filter(msg => msg.id !== deletedId));
        }
      )
      .subscribe((status) => {
        console.log('📡 Canal messages status:', status);
      });

    return () => {
      console.log('🔌 Déconnexion du canal messages');
      supabase.removeChannel(messagesChannel);
    };
  }, [isAuthenticated, user]);

  // ✅ Realtime - Commentaires en temps réel
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    console.log('🔧 Initialisation du canal commentaires pour user:', user.id, user.name);

    const commentChannel = supabase
      .channel('public-commentaires-channel', {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments'
        },
        async (payload) => {
          console.log('📨 Nouveau commentaire reçu via Realtime:', payload);
          console.log('📨 User actuel:', user.id, user.name);
          const newComment = payload.new as Commentaire & { user_id: string };
          
          // ✅ Récupérer le username et la couleur depuis la table profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, color')
            .eq('id', newComment.user_id)
            .single();
          
          const username = profile?.username || 'Utilisateur';
          const userColor = profile?.color || '#3B82F6';
          
          console.log('✅ Commentaire traité:', { 
            id: newComment.id, 
            message_id: newComment.message_id,
            username,
            commentaire: newComment.commentaire,
            isCurrentUser: newComment.user_id === user?.id
          });

          // ✅ Notification si le commentaire n'est pas de l'utilisateur actuel
          if (newComment.user_id !== user?.id) {
            console.log('🔔 Affichage notification pour commentaire de:', username);
            toast.info(`📨 Nouveau commentaire de ${username}`, {
              autoClose: 2500,
              position: 'top-right'
            });
          } else {
            console.log('⏭️ Pas de notification, c\'est mon propre commentaire');
          }

          // ✅ Ajouter le commentaire à la liste du bon message
          setCommentairesByMessage(prev => {
            const currentComments = prev[newComment.message_id] || [];
            
            // ✅ Vérifier si le commentaire n'existe pas déjà (éviter les doublons)
            const exists = currentComments.some(c => c.id === newComment.id);
            if (exists) {
              console.log('⚠️ Commentaire déjà présent, ignoré');
              return prev;
            }

            const updated = {
              ...prev,
              [newComment.message_id]: [
                ...currentComments,
                {
                  id: newComment.id,
                  message_id: newComment.message_id,
                  user_id: newComment.user_id,
                  commentaire: newComment.commentaire,
                  username: username,
                  user_color: userColor
                }
              ]
            };
            
            console.log('✅ Commentaires mis à jour pour message', newComment.message_id, ':', updated[newComment.message_id]);
            return updated;
          });
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Canal commentaires status:', status);
        if (err) console.error('❌ Erreur canal commentaires:', err);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Canal commentaires opérationnel, en attente d\'événements...');
        }
      });

    return () => {
      console.log('🔌 Déconnexion du canal commentaires');
      supabase.removeChannel(commentChannel);
    };
  }, [isAuthenticated, user]);

  // ✅ Realtime - Indicateur "typing..."
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const typingChannel = supabase
      .channel('public-typing-indicator')
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== user.id) {
          setUsersTyping(prev => ({
            ...prev,
            [payload.userId]: payload.username
          }));

          // ✅ Supprimer l'indicateur après 3 secondes
          setTimeout(() => {
            setUsersTyping(prev => {
              const newState = { ...prev };
              delete newState[payload.userId];
              return newState;
            });
          }, 3000);
        }
      })
      .subscribe((status) => {
        console.log('📡 Canal typing status:', status);
      });

    return () => {
      console.log('🔌 Déconnexion du canal typing');
      supabase.removeChannel(typingChannel);
    };
  }, [isAuthenticated, user]);

  // ✅ Détecter quand l'utilisateur tape
  const handleTyping = useCallback(() => {
    if (!user) return;

    // ✅ Annuler le timeout précédent
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // ✅ Broadcaster que l'utilisateur tape
    supabase.channel('public-typing-indicator').send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, username: user.name }
    });

    // ✅ Arrêter de broadcaster après 2 secondes
    typingTimeoutRef.current = setTimeout(() => {
      // L'indicateur s'arrête automatiquement
    }, 2000);
  }, [user]);

  // ✅ Scroll automatique vers le bas quand un nouveau message arrive
  useEffect(() => {
    if (messages.length > lastMessageCount) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setLastMessageCount(messages.length);
    }
  }, [messages.length, lastMessageCount]);

  const fetchCommentaires = useCallback(async (messageId: number, forceReload = false) => {
    // ✅ Ne charger que si pas déjà en cache ou si rechargement forcé
    if (commentairesByMessage[messageId] && !forceReload) {
      return;
    }

    try {
      setError('');
      setLoadingComments(prev => ({ ...prev, [messageId]: true }));
      
      const response = await fetch(`${BASE_URL}/messages/${messageId}/commentaires`);
      const data = await response.json();
      const commentsData = Array.isArray(data) ? data : [];
      
      // Récupérer les couleurs des utilisateurs pour chaque commentaire
      const commentsWithColors = await Promise.all(
        commentsData.map(async (comment: Commentaire & { user_id: string }) => {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('color')
            .eq('id', comment.user_id)
            .single();
          
          if (profileError) {
            console.warn('⚠️ Erreur récupération couleur commentaire pour user', comment.user_id, profileError);
          }
          
          const userColor = profile?.color || '#10B981';
          console.log('🎨 Commentaire', comment.id, 'user', comment.user_id, 'couleur:', userColor);
          
          return {
            ...comment,
            user_color: userColor
          };
        })
      );
      
      setCommentairesByMessage(prev => ({
        ...prev,
        [messageId]: commentsWithColors
      }));
      
      console.log('Commentaires fetched:', commentsWithColors);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    } finally {
      setLoadingComments(prev => ({ ...prev, [messageId]: false }));
    }
  }, [commentairesByMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError('');
      const auth = await getAuthHeader();
      
      let imageUrl = null;

      // ✅ Upload de l'image si présente
      if (imageFile && user) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        console.log('📤 Upload de l\'image:', fileName);
        
        const { error: uploadError } = await supabase.storage
          .from('message-images')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ Erreur upload:', uploadError);
          throw new Error(`Erreur lors de l'upload de l'image: ${uploadError.message}`);
        }

        // Récupérer l'URL publique de l'image
        const { data: urlData } = supabase.storage
          .from('message-images')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
        console.log('✅ Image uploadée:', imageUrl);
      }

      const response = await fetch(`${BASE_URL}/insert-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth,
        },
        body: JSON.stringify({ 
          message: newMessage,
          image_url: imageUrl
        }),
      });

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Erreur lors de l'envoi du message (${response.status}) : ${txt}`);
      }

      setNewMessage('');
      setImageFile(null);
      setImagePreview(null);
      await fetchMessages();
      triggerConfetti();
      toast.success('🎉 Message ajouté avec succès !', { autoClose: CONFETTI_DURATION });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setError('');
      const auth = await getAuthHeader();

      const response = await fetch(`${BASE_URL}/delete-message/${id}`, {
        method: 'DELETE',
        headers: {
          ...auth, // ✅ Bearer token
        },
      });

      if (!response.ok) {
        const txt = await response.text();
        toast.error(`❌ ${txt}`, { autoClose: 3000 });
        return;
      }

      await fetchMessages();
      triggerConfetti();
      toast.success('🗑️ Message supprimé avec succès !', { autoClose: CONFETTI_DURATION });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Une erreur inconnue est survenue', { autoClose: 3000 });
    }
  };

  const handleLike = async (id: number, liked: boolean) => {
    try {
      setError('');
      
      // ✅ Mise à jour optimiste locale
      setMessages(prev => prev.map(msg => 
        msg.id === id 
          ? { ...msg, liked: !liked, likes: liked ? msg.likes - 1 : msg.likes + 1 }
          : msg
      ));

      const auth = await getAuthHeader();

      const url = liked
        ? `${BASE_URL}/unlike-message/${user?.id}/${id}`
        : `${BASE_URL}/like-message/${user?.id}/${id}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...auth,
        },
      });

      if (!response.ok) {
        // ✅ Annuler la mise à jour optimiste en cas d'erreur
        setMessages(prev => prev.map(msg => 
          msg.id === id 
            ? { ...msg, liked: liked, likes: liked ? msg.likes + 1 : msg.likes - 1 }
            : msg
        ));
        const txt = await response.text();
        throw new Error(`Erreur lors du like (${response.status}) : ${txt}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    }
  };

  const handleComment = useCallback((id: number) => {
    const isOpening = commentingMessageId !== id;
    
    // ✅ Ouvrir immédiatement l'interface (optimistic UI)
    setCommentingMessageId(isOpening ? id : null);
    
    // ✅ Charger les commentaires en arrière-plan
    if (isOpening) {
      fetchCommentaires(id);
    }
  }, [commentingMessageId, fetchCommentaires]);

  const handleCommentSubmit = async (e: React.FormEvent, id: number) => {
    e.preventDefault();

    try {
      setError('');
      const auth = await getAuthHeader();

      const response = await fetch(`${BASE_URL}/messages/${id}/commentaires`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...auth, // ✅ Bearer token
        },
        body: JSON.stringify({ commentaire: newComment }),
      });

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Erreur ajout commentaire (${response.status}) : ${txt}`);
      }

      toast.info('💬 Commentaire ajouté !', { autoClose: CONFETTI_DURATION });
      setNewComment('');
      
      // ✅ Recharger uniquement les commentaires de ce message
      const commResponse = await fetch(`${BASE_URL}/messages/${id}/commentaires`);
      const commData = await commResponse.json();
      setCommentairesByMessage(prev => ({
        ...prev,
        [id]: Array.isArray(commData) ? commData : []
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    }
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), CONFETTI_DURATION);
  };

  const handleLogout = async () => {
    closeUserMenu();
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
    setMessages([]);
    toast.info('👋 Déconnexion réussie', { autoClose: 2000 });
  };

  const startEditingUsername = () => {
    setEditingUsername(user?.name || '');
    setIsEditingUsername(true);
  };

  const cancelEditingUsername = () => {
    setIsEditingUsername(false);
    setEditingUsername('');
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = newMessage;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      setNewMessage(newText);
      
      // Remettre le focus et la position du curseur
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setNewMessage(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('L\'image est trop grande (max 5MB)');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleUpdateUsername = async () => {
    if (!editingUsername.trim()) {
      toast.error('Le nom d\'utilisateur ne peut pas être vide');
      return;
    }

    if (editingUsername.trim() === user?.name) {
      setIsEditingUsername(false);
      return;
    }

    try {
      setIsUpdatingUsername(true);
      
      // ✅ Mise à jour du username dans auth.users (le trigger mettra à jour la table profile automatiquement)
      const { error } = await supabase.auth.updateUser({
        data: { username: editingUsername.trim() }
      });

      if (error) throw error;

      // ✅ Mettre à jour l'état local
      setUser(prev => prev ? { ...prev, name: editingUsername.trim() } : null);
      
      toast.success('✅ Nom d\'utilisateur mis à jour !');
      setIsEditingUsername(false);
      
      // ✅ Recharger les messages pour voir le nouveau username
      await fetchMessages();
    } catch (err) {
      toast.error((err as Error)?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const startEditingColor = () => {
    setEditingColor(user?.color || '#3B82F6');
    setIsEditingColor(true);
  };

  const cancelEditingColor = () => {
    setIsEditingColor(false);
    setEditingColor(user?.color || '#3B82F6');
  };

  const handleUpdateColor = async () => {
    if (!user?.id) {
      toast.error('Utilisateur non connecté');
      return;
    }

    if (editingColor === user?.color) {
      setIsEditingColor(false);
      return;
    }

    try {
      setIsUpdatingColor(true);
      
      console.log('🎨 Mise à jour de la couleur:', editingColor, 'pour user:', user.id);
      
      // ✅ Mettre à jour la couleur dans la table profiles
      const { data: updateData, error } = await supabase
        .from('profiles')
        .update({ color: editingColor })
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour:', error);
        throw error;
      }

      console.log('✅ Résultat de la mise à jour:', updateData);

      // ✅ Vérifier que la mise à jour a bien été effectuée
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('color')
        .eq('id', user.id)
        .single();

      if (verifyError) {
        console.error('❌ Erreur lors de la vérification:', verifyError);
        throw verifyError;
      }

      console.log('🔍 Vérification - Couleur dans la BDD:', verifyData?.color);

      if (verifyData?.color !== editingColor) {
        throw new Error(`La couleur n'a pas été mise à jour dans la BDD. Couleur actuelle: ${verifyData?.color}`);
      }

      console.log('✅ Couleur mise à jour avec succès');

      // ✅ Mettre à jour l'état local
      setUser(prev => prev ? { ...prev, color: editingColor } : null);
      
      // ✅ Mettre à jour immédiatement la couleur de tous les messages de cet utilisateur
      setMessages(prev => prev.map(msg => 
        msg.username === user.name ? { ...msg, user_color: editingColor } : msg
      ));

      // ✅ Mettre à jour immédiatement la couleur de tous les commentaires de cet utilisateur
      setCommentairesByMessage(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(messageId => {
          updated[parseInt(messageId)] = updated[parseInt(messageId)].map(comment =>
            comment.username === user.name ? { ...comment, user_color: editingColor } : comment
          );
        });
        return updated;
      });
      
      toast.success('🎨 Couleur mise à jour !');
      setIsEditingColor(false);
      
      // ✅ Recharger les messages en arrière-plan pour synchroniser avec la BDD
      fetchMessages();
    } catch (err) {
      console.error('❌ Erreur:', err);
      toast.error((err as Error)?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsUpdatingColor(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginRegister
        onLogin={(u) => {
          setIsAuthenticated(true);
          setUser(u);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {showConfetti && <Confetti />}
      <ToastContainer position="top-right" />
      
      {/* Header avec menu utilisateur */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Menu utilisateur */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <div className="bg-white rounded-full p-2">
                  <FaUser className="text-blue-600" size={16} />
                </div>
                <span className="font-medium">{user?.name}</span>
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div className={`absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 ${
                  isClosingMenu ? 'animate-fade-out' : 'animate-fade-in'
                }`}>
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">Informations du compte</p>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    <div className="flex items-start space-x-3">
                      <FaUser className="text-blue-500 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Nom d&apos;utilisateur</p>
                        {!isEditingUsername ? (
                          <div className="flex items-center space-x-2 group">
                            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                            <button
                              onClick={startEditingUsername}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-500 hover:text-blue-600 p-1"
                              title="Modifier le nom"
                            >
                              <FaEdit size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingUsername}
                              onChange={(e) => setEditingUsername(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Nouveau nom"
                              autoFocus
                              disabled={isUpdatingUsername}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateUsername();
                                if (e.key === 'Escape') cancelEditingUsername();
                              }}
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={handleUpdateUsername}
                                disabled={isUpdatingUsername}
                                className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-1 disabled:bg-blue-400"
                              >
                                <FaCheck size={10} />
                                <span>{isUpdatingUsername ? 'Enregistrement...' : 'Valider'}</span>
                              </button>
                              <button
                                onClick={cancelEditingUsername}
                                disabled={isUpdatingUsername}
                                className="flex-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center space-x-1 disabled:opacity-50"
                              >
                                <FaTimes size={10} />
                                <span>Annuler</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sélecteur de couleur */}
                    <div className="flex items-start space-x-3 pt-3 border-t border-gray-100">
                      <div className="mt-1 flex-shrink-0">
                        <div 
                          className="w-5 h-5 rounded-full border-2 border-gray-300"
                          style={{ backgroundColor: user?.color || '#3B82F6' }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Couleur</p>
                        {!isEditingColor ? (
                          <div className="flex items-center space-x-2 group">
                            <p className="text-sm font-medium text-gray-900">{user?.color || '#3B82F6'}</p>
                            <button
                              onClick={startEditingColor}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-500 hover:text-blue-600 p-1"
                              title="Modifier la couleur"
                            >
                              <FaEdit size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={editingColor}
                                onChange={(e) => setEditingColor(e.target.value)}
                                className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                                disabled={isUpdatingColor}
                              />
                              <input
                                type="text"
                                value={editingColor}
                                onChange={(e) => setEditingColor(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="#3B82F6"
                                disabled={isUpdatingColor}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateColor();
                                  if (e.key === 'Escape') cancelEditingColor();
                                }}
                              />
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={handleUpdateColor}
                                disabled={isUpdatingColor}
                                className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-1 disabled:bg-blue-400"
                              >
                                <FaCheck size={10} />
                                <span>{isUpdatingColor ? 'Enregistrement...' : 'Valider'}</span>
                              </button>
                              <button
                                onClick={cancelEditingColor}
                                disabled={isUpdatingColor}
                                className="flex-1 px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center space-x-1 disabled:opacity-50"
                              >
                                <FaTimes size={10} />
                                <span>Annuler</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 mt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <FaSignOutAlt />
                      <span className="font-medium">Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
            💬 ChatFlow
          </h1>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg animate-fade-in">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Formulaire de nouveau message */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <span>✍️</span>
            <span>Nouveau message</span>
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                placeholder="Écrivez votre message..."
                rows={3}
                required={!imageFile}
              />
              
              {/* Prévisualisation de l'image */}
              {imagePreview && (
                <div className="mt-3 relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-xs max-h-48 rounded-lg border-2 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Boutons emoji et image */}
            <div className="flex items-center space-x-2">
              <div className="relative" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
                  title="Ajouter un emoji"
                >
                  <FaSmile size={20} />
                </button>

                {/* Sélecteur d'emoji */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 w-80 max-h-64 overflow-y-auto animate-fade-in">
                    <p className="text-xs font-semibold text-gray-500 mb-2">Emojis populaires</p>
                    <div className="grid grid-cols-8 gap-2">
                      {['😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤔', '😮', '😢', '😭', '😡', '👍', '👎', '👏', '🙏', '💪', '🎉', '🎊', '🎈', '❤️', '💙', '💚', '💛', '🔥', '⭐', '✨', '💯', '🚀', '🎯', '💡', '🎨'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiSelect(emoji)}
                          className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <label className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 cursor-pointer">
                <FaImage size={20} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>

              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                Envoyer le message
              </button>
            </div>
          </form>
        </div>

        {/* ✅ Indicateur "typing..." */}
        {Object.keys(usersTyping).length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg animate-fade-in">
            <p className="text-blue-700 text-sm flex items-center space-x-2">
              <span className="animate-pulse">💬</span>
              <span>
                {Object.values(usersTyping).join(', ')} {Object.keys(usersTyping).length > 1 ? 'sont en train d\'écrire' : 'est en train d\'écrire'}...
              </span>
            </p>
          </div>
        )}

        {/* Liste des messages */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">💬 Messages</h2>
          {loadingMessages ? (
            // Skeleton loader
            <div className="space-y-4">
              {[...Array(3)].map((_, idx) => (
                <div key={`skeleton-${idx}`} className="bg-white p-6 rounded-2xl shadow-md animate-pulse">
                  <div className="h-5 bg-gray-200 rounded-lg w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((item, index) => (
                <div 
                  key={item.id} 
                  className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 ease-out border-l-4"
                  style={{ 
                    opacity: 0,
                    animation: `fadeInUp 0.5s ease-out ${index * 50}ms forwards`,
                    borderLeftColor: item.user_color || '#3B82F6'
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.user_color || '#3B82F6' }}
                        />
                        <p 
                          className="font-semibold text-sm"
                          style={{ color: item.user_color || '#3B82F6' }}
                        >
                          {item.username || 'Utilisateur'}
                        </p>
                      </div>
                      
                      {/* Message texte */}
                      {item.message && (
                        <p className="text-gray-800 leading-relaxed mb-2">{item.message}</p>
                      )}
                      
                      {/* Image si présente */}
                      {item.image_url && (
                        <div className="mt-2">
                          <img 
                            src={item.image_url} 
                            alt="Message image" 
                            className="max-w-md rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(item.image_url, '_blank')}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 self-end sm:self-center">
                      <button
                        onClick={() => handleLike(item.id, item.liked)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          item.liked 
                            ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                        title="J'aime"
                      >
                        {item.liked ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
                      </button>

                      <button
                        onClick={() => handleComment(item.id)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          commentingMessageId === item.id
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-blue-50'
                        }`}
                        title="Commentaires"
                      >
                        <FaArrowRight size={18} className={commentingMessageId === item.id ? 'rotate-90 transition-transform duration-200' : 'transition-transform duration-200'} />
                      </button>

                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-all duration-200"
                        title="Supprimer"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </div>

                  {commentingMessageId === item.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200 animate-fade-in">
                      {loadingComments[item.id] ? (
                        <p className="text-gray-400 text-sm mb-4 animate-pulse flex items-center space-x-2">
                          <span>💬</span>
                          <span>Chargement des commentaires...</span>
                        </p>
                      ) : (
                        <div className="space-y-3 mb-4">
                          {(commentairesByMessage[item.id] || []).length > 0 ? (
                            (commentairesByMessage[item.id] || []).map((commentaire, idx) => (
                              <div 
                                key={commentaire.id} 
                                className="bg-gray-50 p-4 rounded-lg transition-all duration-300 ease-out border-l-4"
                                style={{
                                  opacity: 0,
                                  animation: `fadeInUp 0.4s ease-out ${idx * 80}ms forwards`,
                                  borderLeftColor: commentaire.user_color || '#10B981'
                                }}
                              >
                                <div className="flex items-center space-x-2 mb-1">
                                  <div 
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: commentaire.user_color || '#10B981' }}
                                  />
                                  <p 
                                    className="font-semibold text-sm"
                                    style={{ color: commentaire.user_color || '#10B981' }}
                                  >
                                    {commentaire.username || 'Utilisateur'}
                                  </p>
                                </div>
                                <p className="text-gray-700">{commentaire.commentaire}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-gray-400 text-sm italic">Aucun commentaire pour le moment</p>
                          )}
                        </div>
                      )}

                      <form onSubmit={(e) => handleCommentSubmit(e, item.id)} className="space-y-3">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          placeholder="💬 Ajouter un commentaire..."
                          required
                        />
                        <button
                          type="submit"
                          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                        >
                          Publier le commentaire
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
              {/* ✅ Référence pour scroll automatique */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Page;
