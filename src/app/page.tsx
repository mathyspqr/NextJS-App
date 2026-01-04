'use client';

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FaTrash, FaHeart, FaRegHeart, FaArrowRight, FaUser, FaSignOutAlt, FaEdit, FaCheck, FaTimes, FaSmile, FaImage, FaCamera, FaUserFriends, FaUserPlus, FaUserCheck, FaBell, FaUserMinus, FaEnvelope, FaPaperPlane, FaChevronLeft, FaUsers } from 'react-icons/fa';
import Confetti from 'react-confetti';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CountUp from 'react-countup';

import LoginRegister from './LoginRegister';
import { createClient } from '../app/utils/supabase/client';
import OnlineStatusIndicator from './components/UI/OnlineStatusIndicator';

const supabase = createClient();

const BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : 'https://express-back-end-phi.vercel.app/api';
const CONFETTI_DURATION = 3000;

interface User {
  id: string;
  name: string;
  color?: string;
  avatar_url?: string;
  bio?: string;
  last_seen?: string | null;
}

interface Message {
  id: number;
  message: string;
  liked: boolean;
  likes: number;
  user_id: string;
  username?: string;
  user_color?: string;
  avatar_url?: string;
  image_url?: string;
  edited?: boolean;
  last_seen?: string | null;
}

interface Commentaire {
  id: number;
  message_id: number;
  user_id: string;
  commentaire: string;
  username?: string;
  user_color?: string;
  avatar_url?: string;
}

interface ProfileData {
  id: string;
  username: string;
  color: string;
  avatar_url: string | null;
  bio: string | null;
  last_seen: string | null;
  isFriend?: boolean;
}

interface FriendRequest {
  id: number;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  requester?: {
    username: string;
    color: string;
    avatar_url: string | null;
  };
  addressee?: {
    username: string;
    color: string;
    avatar_url: string | null;
  };
}

interface Friend {
  id: string;
  username: string;
  color: string;
  avatar_url: string | null;
  bio: string | null;
  last_seen: string | null;
}

interface PrivateMessage {
  id: number;
  sender_id: string;
  receiver_id: string;
  message: string;
  image_url?: string | null;
  created_at: string;
  read: boolean;
  sender?: {
    id: string;
    username: string;
    color: string;
    avatar_url: string | null;
  };
  receiver?: {
    id: string;
    username: string;
    color: string;
    avatar_url: string | null;
  };
}

interface Conversation {
  odId: string;
  odUsername: string;
  odColor: string;
  odAvatar: string | null;
  odLastSeen: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
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
  const [closingMessageId, setClosingMessageId] = useState<number | null>(null);
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
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingMessageText, setEditingMessageText] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editingBio, setEditingBio] = useState('');
  const [isUpdatingBio, setIsUpdatingBio] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [closingProfileModal, setClosingProfileModal] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [closingFriendsModal, setClosingFriendsModal] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted'>('none');
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [closingMessagesModal, setClosingMessagesModal] = useState(false);
  const [showOnlineUsersModal, setShowOnlineUsersModal] = useState(false);
  const [closingOnlineUsersModal, setClosingOnlineUsersModal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<ProfileData[]>([]);
  const [loadingOnlineUsers, setLoadingOnlineUsers] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [activeConversationUser, setActiveConversationUser] = useState<{id: string, username: string, color: string, avatar_url: string | null, last_seen?: string | null} | null>(null);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>([]);
  const [newPrivateMessage, setNewPrivateMessage] = useState('');
  const [privateImagePreview, setPrivateImagePreview] = useState<string | null>(null);
  const [privateImageFile, setPrivateImageFile] = useState<File | null>(null);
  const [sendingPrivateImage, setSendingPrivateImage] = useState(false);
  const privateImageInputRef = useRef<HTMLInputElement>(null);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingPrivateMessages, setLoadingPrivateMessages] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const privateMessagesEndRef = useRef<HTMLDivElement>(null);
  const privateMessagesContainerRef = useRef<HTMLDivElement>(null);
  const activeConversationRef = useRef<string | null>(null);
  const [privateTypingUser, setPrivateTypingUser] = useState<string | null>(null);
  const [typingInConversations, setTypingInConversations] = useState<Record<string, string>>({});
  const typingInConversationsTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const privateTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const privateTypingBroadcastRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const profileModalRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [usersTyping, setUsersTyping] = useState<Record<string, string>>({});
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const [lastCommentCount, setLastCommentCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const typingBroadcastInterval = useRef<NodeJS.Timeout | null>(null);
  const typingRemovalTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const lastActivityUpdate = useRef<number>(0);

  // ✅ Restore session on refresh
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        const u = data.session.user;
        
        // Récupérer la couleur, avatar et bio depuis profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('color, avatar_url, bio, last_seen')
          .eq('id', u.id)
          .single();
        
        const userColor = profile?.color || '#3B82F6';
        const userAvatar = profile?.avatar_url || null;
        const userBio = profile?.bio || '';
        const userLastSeen = profile?.last_seen || null;
        
        setIsAuthenticated(true);
        setUser({
          id: u.id,
          name: (u.user_metadata?.username as string) ?? u.email ?? 'Utilisateur',
          color: userColor,
          avatar_url: userAvatar,
          bio: userBio,
          last_seen: userLastSeen,
        });
        setEditingColor(userColor);
        setEditingBio(userBio);

        // ✅ Charger les demandes d'amis en attente
        const { data: pendingRequests } = await supabase
          .from('friendships')
          .select(`
            id,
            requester_id,
            addressee_id,
            status,
            created_at,
            requester:profiles!friendships_requester_id_fkey(username, color, avatar_url)
          `)
          .eq('addressee_id', u.id)
          .eq('status', 'pending');

        if (pendingRequests) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const formattedRequests = pendingRequests.map((r: any) => ({
            id: r.id,
            requester_id: r.requester_id,
            addressee_id: r.addressee_id,
            status: r.status,
            created_at: r.created_at,
            requester: Array.isArray(r.requester) ? r.requester[0] : r.requester,
          }));
          setFriendRequests(formattedRequests);
        }
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
            .select('color, last_seen, avatar_url')
            .eq('id', message.user_id)
            .single();
          
          if (profileError) {
            console.warn('⚠️ Erreur récupération couleur pour user', message.user_id, profileError);
          }
          
          const userColor = profile?.color || '#3B82F6';
          const avatarUrl = profile?.avatar_url;
          console.log('🎨 Message', message.id, 'user', message.user_id, 'couleur:', userColor);
          
          return {
            ...message,
            liked: likedMessageIds.includes(message.id),
            likes: likedMessageIds.filter((id: number) => id === message.id).length,
            user_color: userColor,
            avatar_url: avatarUrl,
            last_seen: profile?.last_seen || null,
            edited: message.edited ?? false,
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
            .select('username, color, avatar_url, last_seen')
            .eq('id', newMsg.user_id)
            .single();
          
          const username = profile?.username || 'Utilisateur';
          const userColor = profile?.color || '#3B82F6';
          const avatarUrl = profile?.avatar_url;
          
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
          setMessages(prev => {
            // ✅ Vérifier si le message n'existe pas déjà (éviter les doublons)
            const exists = prev.some(msg => msg.id === newMsg.id);
            if (exists) {
              console.log('⚠️ Message déjà présent, ignoré');
              return prev;
            }

            return [...prev, {
              id: newMsg.id,
              message: newMsg.message || "",
              liked: false,
              likes: 0,
              user_id: newMsg.user_id,
              username: username,
              user_color: userColor,
              avatar_url: avatarUrl,
              last_seen: profile?.last_seen,
              image_url: newMsg.image_url ?? undefined,
              edited: newMsg.edited ?? false
            }];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('✏️ Message modifié via Realtime:', payload);
          const updated = payload.new as Message & { user_id: string };

          // Récupérer le username/couleur si elles ne sont pas dans le payload
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, color')
            .eq('id', updated.user_id)
            .single();

          const username = profile?.username || 'Utilisateur';
          const userColor = profile?.color || '#3B82F6';

          setMessages(prev => prev.map(msg =>
            msg.id === updated.id
              ? {
                  ...msg,
                  message: updated.message,
                  edited: updated.edited ?? true,
                  image_url: updated.image_url ?? undefined,
                  user_color: userColor,
                  username
                }
              : msg
          ));
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
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [isAuthenticated, user]);

  // ✅ Realtime - Commentaires en temps réel
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Initialisation du canal commentaires

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
            .select('username, color, avatar_url')
            .eq('id', newComment.user_id)
            .single();
          
          const username = profile?.username || 'Utilisateur';
          const userColor = profile?.color || '#3B82F6';
          const avatarUrl = profile?.avatar_url;
          
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
                  user_color: userColor,
                  avatar_url: avatarUrl
                }
              ]
            };
            
            console.log('✅ Commentaires mis à jour pour message', newComment.message_id, ':', updated[newComment.message_id]);
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
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

          // ✅ Annuler l'ancien timeout pour cet utilisateur
          if (typingRemovalTimeouts.current[payload.userId]) {
            clearTimeout(typingRemovalTimeouts.current[payload.userId]);
          }

          // ✅ Créer un nouveau timeout - supprimer après 2.5 secondes d'inactivité
          typingRemovalTimeouts.current[payload.userId] = setTimeout(() => {
            setUsersTyping(prev => {
              const newState = { ...prev };
              delete newState[payload.userId];
              return newState;
            });
            delete typingRemovalTimeouts.current[payload.userId];
          }, 2500);
        }
      })
      .on('broadcast', { event: 'stop_typing' }, ({ payload }) => {
        if (payload.userId !== user.id) {
          // ✅ Arrêter immédiatement l'indicateur
          if (typingRemovalTimeouts.current[payload.userId]) {
            clearTimeout(typingRemovalTimeouts.current[payload.userId]);
            delete typingRemovalTimeouts.current[payload.userId];
          }
          setUsersTyping(prev => {
            const newState = { ...prev };
            delete newState[payload.userId];
            return newState;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(typingChannel);
    };
  }, [isAuthenticated, user]);

  // ✅ Realtime - Demandes d'amis en temps réel
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Initialisation du canal friendships

    const friendshipsChannel = supabase
      .channel('friendships-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friendships',
          filter: `addressee_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('👥 Nouvelle demande d\'ami reçue:', payload);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newRequest = payload.new as any;
          
          if (newRequest.status === 'pending') {
            // Récupérer les infos du demandeur
            const { data: requesterProfile } = await supabase
              .from('profiles')
              .select('username, color, avatar_url')
              .eq('id', newRequest.requester_id)
              .single();

            const formattedRequest = {
              id: newRequest.id,
              requester_id: newRequest.requester_id,
              addressee_id: newRequest.addressee_id,
              status: newRequest.status,
              created_at: newRequest.created_at,
              requester: requesterProfile || { username: 'Utilisateur', color: '#3B82F6', avatar_url: null },
            };

            setFriendRequests(prev => [...prev, formattedRequest]);
            
            toast.info(`👋 ${requesterProfile?.username || 'Quelqu\'un'} vous a envoyé une demande d'ami !`, {
              autoClose: 5000,
              position: 'top-right'
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'friendships'
        },
        async (payload) => {
          console.log('👥 Demande d\'ami mise à jour:', payload);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updated = payload.new as any;
          
          // Si quelqu'un a accepté ma demande
          if (updated.status === 'accepted' && updated.requester_id === user.id) {
            const { data: addresseeProfile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', updated.addressee_id)
              .single();
            
            toast.success(`🎉 ${addresseeProfile?.username || 'Utilisateur'} a accepté votre demande d'ami !`, {
              autoClose: 5000,
              position: 'top-right'
            });
          }
          
          // Mettre à jour la liste si c'est une de mes demandes reçues
          if (updated.addressee_id === user.id) {
            setFriendRequests(prev => prev.filter(r => r.id !== updated.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'friendships'
        },
        (payload) => {
          console.log('👥 Amitié supprimée:', payload);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const deleted = payload.old as any;
          
          // Retirer de la liste des demandes si c'était en attente
          setFriendRequests(prev => prev.filter(r => r.id !== deleted.id));
          
          // Retirer de la liste des amis
          setFriends(prev => prev.filter(f => 
            f.id !== deleted.requester_id && f.id !== deleted.addressee_id
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(friendshipsChannel);
    };
  }, [isAuthenticated, user]);

  // ✅ Realtime - Statut en ligne (last_seen) en temps réel
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Initialisation du canal online-status

    const onlineStatusChannel = supabase
      .channel('online-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=neq.${user.id}` // Exclure nos propres mises à jour
        },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updated = payload.new as any;
          const userId = updated.id;
          const newLastSeen = updated.last_seen;

          // Mettre à jour dans la liste des amis si présent
          setFriends(prev => prev.map(friend => 
            friend.id === userId 
              ? { ...friend, last_seen: newLastSeen }
              : friend
          ));

          // Mettre à jour dans les conversations si présent
          setConversations(prev => prev.map(conv => 
            conv.odId === userId 
              ? { ...conv, odLastSeen: newLastSeen }
              : conv
          ));

          // Mettre à jour dans la conversation active
          if (activeConversationUser && activeConversationUser.id === userId) {
            setActiveConversationUser(prev => prev ? { ...prev, last_seen: newLastSeen } : null);
          }

          // Mettre à jour dans le profil affiché
          if (viewingProfile && viewingProfile.id === userId) {
            setViewingProfile(prev => prev ? { ...prev, last_seen: newLastSeen } : null);
          }

          // Mettre à jour dans les messages publics
          setMessages(prev => prev.map(msg => 
            msg.user_id === userId 
              ? { ...msg, last_seen: newLastSeen }
              : msg
          ));

          // Mettre à jour dans la liste des utilisateurs en ligne
          setOnlineUsers(prev => {
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            const lastSeenTime = new Date(newLastSeen).getTime();
            const isOnline = lastSeenTime >= fiveMinutesAgo;
            
            // Si l'utilisateur est déjà dans la liste
            const existingIndex = prev.findIndex(u => u.id === userId);
            
            if (existingIndex >= 0) {
              if (isOnline) {
                // Mettre à jour last_seen
                return prev.map(u => u.id === userId ? { ...u, last_seen: newLastSeen } : u);
              } else {
                // Retirer de la liste (plus en ligne)
                return prev.filter(u => u.id !== userId);
              }
            } else if (isOnline) {
              // Ajouter à la liste (nouvel utilisateur en ligne)
              // On recharge la liste pour avoir toutes les infos
              loadOnlineUsers();
              return prev;
            }
            
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(onlineStatusChannel);
    };
  }, [isAuthenticated, user, activeConversationUser, viewingProfile]);

  // ✅ Realtime - Changements de profil en temps réel
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const profileChangesChannel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updated = payload.new as any;
          const userId = updated.id;

          // Ne pas traiter nos propres changements (déjà gérés localement)
          if (userId === user.id) return;

          const updatedProfile = {
            id: updated.id,
            username: updated.username,
            color: updated.color,
            avatar_url: updated.avatar_url,
            bio: updated.bio,
            last_seen: updated.last_seen
          };

          // Mettre à jour dans la liste des amis si présent
          setFriends(prev => prev.map(friend =>
            friend.id === userId
              ? { ...friend, ...updatedProfile }
              : friend
          ));

          // Mettre à jour dans les conversations si présent
          setConversations(prev => prev.map(conv =>
            conv.odId === userId
              ? {
                  ...conv,
                  odUsername: updatedProfile.username,
                  odColor: updatedProfile.color,
                  odAvatar: updatedProfile.avatar_url,
                  odLastSeen: updatedProfile.last_seen
                }
              : conv
          ));

          // Mettre à jour dans la conversation active
          if (activeConversationUser && activeConversationUser.id === userId) {
            setActiveConversationUser(prev => prev ? {
              ...prev,
              username: updatedProfile.username,
              color: updatedProfile.color,
              avatar_url: updatedProfile.avatar_url,
              last_seen: updatedProfile.last_seen
            } : null);
          }

          // Mettre à jour dans le profil affiché
          if (viewingProfile && viewingProfile.id === userId) {
            setViewingProfile(prev => prev ? { ...prev, ...updatedProfile } : null);
          }

          // Mettre à jour dans onlineUsers si présent
          setOnlineUsers(prev => {
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            const lastSeenTime = updated.last_seen ? new Date(updated.last_seen).getTime() : 0;
            const isOnline = lastSeenTime >= fiveMinutesAgo;

            const existingIndex = prev.findIndex(u => u.id === userId);
            if (existingIndex >= 0) {
              if (isOnline) {
                // Mettre à jour
                return prev.map(u => u.id === userId ? { ...u, ...updatedProfile } : u);
              } else {
                // Retirer
                return prev.filter(u => u.id !== userId);
              }
            }
            return prev;
          });

          // Mettre à jour dans les messages publics
          setMessages(prev => prev.map(msg =>
            msg.user_id === userId
              ? {
                  ...msg,
                  username: updatedProfile.username,
                  user_color: updatedProfile.color,
                  avatar_url: updatedProfile.avatar_url,
                  last_seen: updatedProfile.last_seen
                }
              : msg
          ));

          // Mettre à jour dans les commentaires
          setCommentairesByMessage(prev => {
            const newCommentairesByMessage = { ...prev };
            Object.keys(newCommentairesByMessage).forEach(messageId => {
              newCommentairesByMessage[Number(messageId)] = newCommentairesByMessage[Number(messageId)].map(comment =>
                comment.user_id === userId
                  ? {
                      ...comment,
                      username: updatedProfile.username,
                      user_color: updatedProfile.color,
                      avatar_url: updatedProfile.avatar_url
                    }
                  : comment
              );
            });
            return newCommentairesByMessage;
          });

          // Mettre à jour dans la liste des utilisateurs en ligne
          setOnlineUsers(prev => prev.map(u =>
            u.id === userId
              ? { ...u, ...updatedProfile }
              : u
          ));

          console.log('👤 Profil mis à jour en temps réel:', updatedProfile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileChangesChannel);
    };
  }, [isAuthenticated, user]);

  // ✅ Garder la ref à jour pour le Realtime
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // ✅ Realtime pour les messages privés
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Configuration du canal private_messages

    const privateMessagesChannel = supabase
      .channel(`private-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages'
        },
        async (payload) => {
          console.log('💬 Nouveau message privé détecté:', payload);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newMessage = payload.new as any;
          
          // Ignorer si ce n'est pas pour nous
          if (newMessage.receiver_id !== user.id) {
            console.log('Message pas pour nous, ignoré');
            return;
          }
          
          console.log('💬 Message pour nous!');
          
          // Récupérer le profil de l'expéditeur
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('id, username, color, avatar_url, last_seen')
            .eq('id', newMessage.sender_id)
            .single();

          const currentActiveConversation = activeConversationRef.current;

          // Si on est dans la conversation avec cet utilisateur, ajouter le message
          if (currentActiveConversation === newMessage.sender_id) {
            setPrivateMessages(prev => [...prev, newMessage]);
            
            // Marquer comme lu immédiatement
            await supabase
              .from('private_messages')
              .update({ read: true })
              .eq('id', newMessage.id);
          } else {
            // Sinon, incrémenter le compteur de non lus
            setUnreadMessagesCount(prev => prev + 1);
            
            // Notification toast - adapter le message si c'est une image
            const notifMessage = newMessage.image_url 
              ? '📷 Image' 
              : `${newMessage.message.substring(0, 50)}${newMessage.message.length > 50 ? '...' : ''}`;
            
            toast.info(`💬 ${senderProfile?.username || 'Quelqu\'un'}: ${notifMessage}`, {
              autoClose: 5000,
              onClick: () => {
                setShowMessagesModal(true);
                if (senderProfile) {
                  openConversation({
                    id: senderProfile.id,
                    username: senderProfile.username,
                    color: senderProfile.color || '#3B82F6',
                    avatar_url: senderProfile.avatar_url,
                    last_seen: senderProfile.last_seen || null
                  });
                }
              }
            });
          }

          // Mettre à jour la liste des conversations
          const lastMsg = newMessage.image_url ? '📷 Image' : newMessage.message;
          setConversations(prev => {
            const existing = prev.find(c => c.odId === newMessage.sender_id);
            if (existing) {
              return prev.map(c => c.odId === newMessage.sender_id 
                ? { 
                    ...c, 
                    lastMessage: lastMsg, 
                    lastMessageTime: newMessage.created_at,
                    unreadCount: currentActiveConversation === newMessage.sender_id ? 0 : c.unreadCount + 1
                  }
                : c
              ).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
            } else if (senderProfile) {
              return [{
                odId: newMessage.sender_id,
                odUsername: senderProfile.username,
                odColor: senderProfile.color || '#3B82F6',
                odAvatar: senderProfile.avatar_url,
                odLastSeen: null,
                lastMessage: lastMsg,
                lastMessageTime: newMessage.created_at,
                unreadCount: 1
              }, ...prev];
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(privateMessagesChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // ✅ Realtime - Indicateur "typing..." pour messages privés
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const privateTypingChannel = supabase
      .channel('private-typing-indicator')
      .on('broadcast', { event: 'private_typing' }, ({ payload }) => {
        // Vérifier que c'est pour nous et pas de nous-même
        if (payload.receiverId === user.id && payload.senderId !== user.id) {
          // Mettre à jour l'indicateur dans la liste des conversations
          setTypingInConversations(prev => ({
            ...prev,
            [payload.senderId]: payload.senderUsername
          }));

          // Annuler l'ancien timeout pour cette conversation
          if (typingInConversationsTimeouts.current[payload.senderId]) {
            clearTimeout(typingInConversationsTimeouts.current[payload.senderId]);
          }

          // Supprimer après 2.5 secondes d'inactivité
          typingInConversationsTimeouts.current[payload.senderId] = setTimeout(() => {
            setTypingInConversations(prev => {
              const newState = { ...prev };
              delete newState[payload.senderId];
              return newState;
            });
            delete typingInConversationsTimeouts.current[payload.senderId];
          }, 2500);

          // Si on est dans la bonne conversation, mettre à jour aussi l'indicateur actif
          if (activeConversationRef.current === payload.senderId) {
            setPrivateTypingUser(payload.senderUsername);

            if (privateTypingTimeoutRef.current) {
              clearTimeout(privateTypingTimeoutRef.current);
            }

            privateTypingTimeoutRef.current = setTimeout(() => {
              setPrivateTypingUser(null);
            }, 2500);
          }
        }
      })
      .on('broadcast', { event: 'private_stop_typing' }, ({ payload }) => {
        if (payload.receiverId === user.id && payload.senderId !== user.id) {
          // Retirer de la liste des conversations
          if (typingInConversationsTimeouts.current[payload.senderId]) {
            clearTimeout(typingInConversationsTimeouts.current[payload.senderId]);
            delete typingInConversationsTimeouts.current[payload.senderId];
          }
          setTypingInConversations(prev => {
            const newState = { ...prev };
            delete newState[payload.senderId];
            return newState;
          });

          // Retirer aussi l'indicateur actif
          if (privateTypingTimeoutRef.current) {
            clearTimeout(privateTypingTimeoutRef.current);
          }
          setPrivateTypingUser(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(privateTypingChannel);
    };
  }, [isAuthenticated, user]);
  // ✅ Fonction pour broadcaster le typing privé
  const handlePrivateTyping = useCallback(() => {
    if (!user || !activeConversation || !activeConversationUser) return;

    // Broadcaster immédiatement
    supabase.channel('private-typing-indicator').send({
      type: 'broadcast',
      event: 'private_typing',
      payload: {
        senderId: user.id,
        senderUsername: user.name,
        receiverId: activeConversation
      }
    });

    // Répéter toutes les 2 secondes tant qu'on tape
    if (!privateTypingBroadcastRef.current) {
      privateTypingBroadcastRef.current = setInterval(() => {
        supabase.channel('private-typing-indicator').send({
          type: 'broadcast',
          event: 'private_typing',
          payload: {
            senderId: user.id,
            senderUsername: user.name,
            receiverId: activeConversation
          }
        });
      }, 2000);
    }
  }, [user, activeConversation, activeConversationUser]);

  // ✅ Arrêter le typing privé
  const stopPrivateTyping = useCallback(() => {
    if (!user || !activeConversation) return;

    if (privateTypingBroadcastRef.current) {
      clearInterval(privateTypingBroadcastRef.current);
      privateTypingBroadcastRef.current = null;
    }

    supabase.channel('private-typing-indicator').send({
      type: 'broadcast',
      event: 'private_stop_typing',
      payload: {
        senderId: user.id,
        receiverId: activeConversation
      }
    });
  }, [user, activeConversation]);

  // ✅ Fonction pour scroller en bas des commentaires
  const scrollToBottomComments = useCallback((smooth = true) => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  }, []);

  // ✅ Fonction pour scroller en bas des messages privés
  const scrollToBottomPrivate = useCallback((smooth = true) => {
    if (privateMessagesContainerRef.current) {
      privateMessagesContainerRef.current.scrollTop = privateMessagesContainerRef.current.scrollHeight;
    }
    if (privateMessagesEndRef.current) {
      privateMessagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  // ✅ Scroll automatique pour les messages privés
  useEffect(() => {
    // Scroll vers le bas quand les messages changent ou quand quelqu'un tape
    scrollToBottomPrivate(true);
  }, [privateMessages, privateTypingUser, scrollToBottomPrivate]);

  // ✅ Scroll initial quand on ouvre une conversation
  useEffect(() => {
    if (activeConversation) {
      // Attendre que les messages soient chargés puis scroller
      setTimeout(() => {
        scrollToBottomPrivate(false);
      }, 150);
    }
  }, [activeConversation, scrollToBottomPrivate]);

  // ✅ Scroll quand le chargement des messages est terminé
  useEffect(() => {
    if (!loadingPrivateMessages && privateMessages.length > 0) {
      setTimeout(() => {
        scrollToBottomPrivate(false);
      }, 50);
    }
  }, [loadingPrivateMessages, privateMessages.length, scrollToBottomPrivate]);

  // ✅ Charger les messages non lus au démarrage
  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  // ✅ Détecter quand l'utilisateur tape
  const handleTyping = useCallback(() => {
    if (!user) return;

    // ✅ Si pas encore en train de broadcaster, démarrer
    if (!typingBroadcastInterval.current) {
      // Broadcaster immédiatement
      supabase.channel('public-typing-indicator').send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, username: user.name }
      });

      // ✅ Broadcaster toutes les 1.5 secondes tant que l'utilisateur tape
      typingBroadcastInterval.current = setInterval(() => {
        supabase.channel('public-typing-indicator').send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: user.id, username: user.name }
        });
      }, 1500);
    }

    // ✅ Annuler le timeout précédent
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // ✅ Arrêter de broadcaster après 2 secondes d'inactivité
    typingTimeoutRef.current = setTimeout(() => {
      if (typingBroadcastInterval.current) {
        clearInterval(typingBroadcastInterval.current);
        typingBroadcastInterval.current = null;
      }
      // Broadcaster l'arrêt
      supabase.channel('public-typing-indicator').send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { userId: user.id }
      });
    }, 2000);
  }, [user]);

  // ✅ Arrêter le typing indicator quand le composant se démonte
  useEffect(() => {
    return () => {
      if (typingBroadcastInterval.current) {
        clearInterval(typingBroadcastInterval.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // ✅ Scroll automatique vers le bas quand un nouveau message arrive
  useEffect(() => {
    if (messages.length > lastMessageCount) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setLastMessageCount(messages.length);
    }
  }, [messages.length, lastMessageCount]);

  // ✅ Scroll automatique vers le bas quand un nouveau commentaire arrive
  useEffect(() => {
    if (commentingMessageId) {
      const currentComments = commentairesByMessage[commentingMessageId] || [];
      if (currentComments.length > lastCommentCount) {
        // Délai pour laisser l'animation du nouveau commentaire se terminer
        setTimeout(() => scrollToBottomComments(true), 150);
        setLastCommentCount(currentComments.length);
      }
    }
  }, [commentairesByMessage, commentingMessageId, lastCommentCount, scrollToBottomComments]);

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
            .select('color, avatar_url')
            .eq('id', comment.user_id)
            .single();
          
          if (profileError) {
            console.warn('⚠️ Erreur récupération couleur commentaire pour user', comment.user_id, profileError);
          }
          
          const userColor = profile?.color || '#10B981';
          const avatarUrl = profile?.avatar_url;
          console.log('🎨 Commentaire', comment.id, 'user', comment.user_id, 'couleur:', userColor);
          
          return {
            ...comment,
            user_color: userColor,
            avatar_url: avatarUrl
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

      // ✅ Arrêter le typing indicator
      if (typingBroadcastInterval.current) {
        clearInterval(typingBroadcastInterval.current);
        typingBroadcastInterval.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      supabase.channel('public-typing-indicator').send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { userId: user?.id }
      });

      setNewMessage('');
      setImageFile(null);
      setImagePreview(null);
      
      // ✅ Plus besoin d'ajouter localement - le realtime s'en charge
      // Le message sera ajouté automatiquement via le listener realtime
      
      // ✅ Mettre à jour le statut en ligne après un court délai pour éviter les conflits de rendu
      setTimeout(() => updateOnlineStatus(), 100);
      
      // ✅ Le realtime ajoutera le message pour tous les utilisateurs (y compris l'auteur)
      triggerConfetti();
      toast.success('🎉 Message ajouté avec succès !', { autoClose: CONFETTI_DURATION });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const handleStartEditMessage = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditingMessageText(msg.message);
  };

  const handleCancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingMessageText('');
  };

  const handleUpdateMessage = async (id: number) => {
    if (!editingMessageText.trim()) {
      toast.error('Le message ne peut pas être vide');
      return;
    }

    try {
      setError('');
      const auth = await getAuthHeader();

      const response = await fetch(`${BASE_URL}/messages/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...auth
        },
        body: JSON.stringify({ message: editingMessageText.trim() })
      });

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Erreur lors de la mise à jour (${response.status}) : ${txt}`);
      }

      setMessages(prev => prev.map(msg =>
        msg.id === id
          ? { ...msg, message: editingMessageText.trim(), edited: true }
          : msg
      ));

      setEditingMessageId(null);
      setEditingMessageText('');
      toast.success('✏️ Message modifié');
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

  const handleComment = useCallback(async (id: number) => {
    const isOpening = commentingMessageId !== id;
    
    if (isOpening) {
      // ✅ Ouvrir immédiatement l'interface (optimistic UI)
      setCommentingMessageId(id);
      setClosingMessageId(null); // reset
      
      // ✅ Remettre le compteur de commentaires à 0 pour le scroll
      setLastCommentCount(0);
      
      // ✅ Charger les commentaires en arrière-plan
      await fetchCommentaires(id);
      // ✅ Scroller vers le bas après le chargement avec délai pour laisser les animations se terminer
      setTimeout(() => scrollToBottomComments(true), 300);
    } else {
      // ✅ Fermer avec animation
      setClosingMessageId(id);
      setTimeout(() => {
        setCommentingMessageId(null);
        setClosingMessageId(null);
      }, 200); // durée de fadeOut
    }
  }, [commentingMessageId, fetchCommentaires, scrollToBottomComments]);

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

      // ✅ Récupérer l'ID du nouveau commentaire
      const newCommentData = await response.json();

      toast.info('💬 Commentaire ajouté !', { autoClose: CONFETTI_DURATION });
      setNewComment('');
      
      // ✅ Plus besoin d'ajouter localement - le realtime s'en charge
      // Le commentaire sera ajouté automatiquement via le listener realtime
      
      // ✅ Mettre à jour le statut en ligne après un court délai
      setTimeout(() => updateOnlineStatus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inconnue est survenue');
    }
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), CONFETTI_DURATION);
  };

// ✅ Mise à jour du statut en ligne
const updateOnlineStatus = useCallback(async () => {
  if (!user) return;

  const now = new Date().toISOString();
  console.log('📝 Mise à jour last_seen:', now);

  try {
    await supabase
      .from('profiles')
      .update({ last_seen: now })
      .eq('id', user.id);

    console.log('✅ last_seen mis à jour dans la DB');

    // ✅ IMPORTANT : met à jour l'utilisateur local (sinon le header ne bouge pas)
    setUser(prev => (prev ? { ...prev, last_seen: now } : prev));

    // Mettre à jour localement partout où l'utilisateur actuel peut apparaître
    // Mais différer pour éviter les conflits de rendu
    setTimeout(() => {
      // Dans les messages publics
      setMessages(prev => prev.map(msg =>
        msg.user_id === user.id
          ? { ...msg, last_seen: now }
          : msg
      ));

      // Dans le profil visionné (si on regarde son propre profil)
      if (viewingProfile && viewingProfile.id === user.id) {
        setViewingProfile(prev => (prev ? { ...prev, last_seen: now } : null));
      }
    }, 0);

    console.log('✅ État local mis à jour pour user actuel');

    lastActivityUpdate.current = Date.now();
  } catch (err) {
    console.error('❌ Erreur mise à jour last_seen:', err);
  }
}, [user?.id, viewingProfile?.id]);


  // ✅ Mise à jour lors de l'activité utilisateur (throttled à 30 secondes)
  const handleUserActivity = useCallback(() => {
    if (!user) return;
    
    const now = Date.now();
    const timeSinceLastUpdate = now - lastActivityUpdate.current;
    
    // Ne mettre à jour que si 30 secondes se sont écoulées
    if (timeSinceLastUpdate >= 30000) {
      console.log('🖱️ Activité détectée - Mise à jour du statut');
      updateOnlineStatus();
    }
  }, [user, updateOnlineStatus]);

// ✅ Mise à jour initiale au montage (arrivée sur le site)
useEffect(() => {
  if (!user?.id) return;

  console.log('🟢 Arrivée sur le site - Passage en ligne');
  updateOnlineStatus();

  loadOnlineUsers();

  const interval = setInterval(() => {
    loadOnlineUsers();
  }, 5 * 1000);

  const handleBeforeUnload = () => {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`/api/update-last-seen?userId=${user.id}`);
    }
  };
  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    clearInterval(interval);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [user?.id, updateOnlineStatus]);


  // ✅ Event listeners pour l'activité utilisateur (clics et mouvements)
  useEffect(() => {
    if (!user) return;

    window.addEventListener('click', handleUserActivity);
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    return () => {
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
}, [user, handleUserActivity]);

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

  // ✅ Upload d'avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image doit faire moins de 2MB');
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Supprimer l'ancien avatar s'il existe
      if (user.avatar_url) {
        const oldPath = user.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload du nouveau fichier
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtenir l'URL publique
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData.publicUrl;

      // Mettre à jour le profil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Mettre à jour l'état local
      setUser(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);

      // Mettre à jour les messages avec le nouvel avatar
      setMessages(prev => prev.map(msg => 
        msg.user_id === user.id ? { ...msg, avatar_url: avatarUrl } : msg
      ));

      toast.success('📸 Photo de profil mise à jour !');
    } catch (err) {
      console.error('❌ Erreur upload avatar:', err);
      toast.error('Erreur lors de l\'upload de l\'avatar');
    } finally {
      setIsUploadingAvatar(false);
      // Réinitialiser l'input
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
    }
  };

  // ✅ Fonctions pour éditer la bio
  const startEditingBio = () => {
    setEditingBio(user?.bio || '');
    setIsEditingBio(true);
  };

  const cancelEditingBio = () => {
    setIsEditingBio(false);
    setEditingBio(user?.bio || '');
  };

  const handleUpdateBio = async () => {
    if (!user) return;

    setIsUpdatingBio(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio: editingBio })
        .eq('id', user.id);

      if (error) throw error;

      setUser(prev => prev ? { ...prev, bio: editingBio } : null);
      toast.success('✍️ Biographie mise à jour !');
      setIsEditingBio(false);
    } catch (err) {
      console.error('❌ Erreur:', err);
      toast.error('Erreur lors de la mise à jour de la bio');
    } finally {
      setIsUpdatingBio(false);
    }
  };

  // ✅ Fonction pour voir le profil d'un utilisateur
  const handleViewProfile = async (userId: string) => {
    setLoadingProfile(true);
    setShowProfileModal(true);
    setFriendshipStatus('none');

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, color, avatar_url, bio, last_seen')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setViewingProfile(data as ProfileData);

      // Vérifier le statut d'amitié si ce n'est pas notre propre profil
      if (user && userId !== user.id) {
        const { data: friendship } = await supabase
          .from('friendships')
          .select('*')
          .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
          .single();

        if (friendship) {
          if (friendship.status === 'accepted') {
            setFriendshipStatus('accepted');
          } else if (friendship.status === 'pending') {
            if (friendship.requester_id === user.id) {
              setFriendshipStatus('pending_sent');
            } else {
              setFriendshipStatus('pending_received');
            }
          }
        }
      }
    } catch (err) {
      console.error('❌ Erreur chargement profil:', err);
      toast.error('Impossible de charger le profil');
      setShowProfileModal(false);
    } finally {
      setLoadingProfile(false);
    }
  };

  const closeProfileModal = () => {
    setClosingProfileModal(true);
    setTimeout(() => {
      setShowProfileModal(false);
      setClosingProfileModal(false);
      setViewingProfile(null);
      setFriendshipStatus('none');
    }, 200);
  };

  const closeFriendsModal = () => {
    setClosingFriendsModal(true);
    setTimeout(() => {
      setShowFriendsModal(false);
      setClosingFriendsModal(false);
    }, 200);
  };

  const closeMessagesModal = () => {
    setClosingMessagesModal(true);
    setTimeout(() => {
      setShowMessagesModal(false);
      setClosingMessagesModal(false);
      setActiveConversation(null);
      setActiveConversationUser(null);
    }, 200);
  };

  const closeOnlineUsersModal = () => {
    setClosingOnlineUsersModal(true);
    setTimeout(() => {
      setShowOnlineUsersModal(false);
      setClosingOnlineUsersModal(false);
    }, 200);
  };

  // ✅ Charger la liste d'amis et les demandes
  const loadFriends = async () => {
    if (!user) return;
    setLoadingFriends(true);

    try {
      // Charger les amis acceptés
      const { data: friendships, error: friendsError } = await supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          addressee_id,
          requester:profiles!friendships_requester_id_fkey(id, username, color, avatar_url, bio, last_seen),
          addressee:profiles!friendships_addressee_id_fkey(id, username, color, avatar_url, bio, last_seen)
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (friendsError) throw friendsError;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const friendsList: Friend[] = (friendships || []).map((f: any) => {
        const friendProfile = f.requester_id === user.id ? f.addressee : f.requester;
        // Supabase peut retourner un objet ou un tableau selon la relation
        const profile = Array.isArray(friendProfile) ? friendProfile[0] : friendProfile;
        return {
          id: profile?.id || '',
          username: profile?.username || 'Utilisateur',
          color: profile?.color || '#3B82F6',
          avatar_url: profile?.avatar_url || null,
          bio: profile?.bio || null,
          last_seen: profile?.last_seen || null,
        };
      });

      setFriends(friendsList);

      // Charger les demandes reçues en attente
      const { data: requests, error: requestsError } = await supabase
        .from('friendships')
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at,
          requester:profiles!friendships_requester_id_fkey(username, color, avatar_url)
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (requestsError) throw requestsError;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedRequests: FriendRequest[] = (requests || []).map((r: any) => ({
        id: r.id,
        requester_id: r.requester_id,
        addressee_id: r.addressee_id,
        status: r.status,
        created_at: r.created_at,
        requester: Array.isArray(r.requester) ? r.requester[0] : r.requester,
      }));

      setFriendRequests(formattedRequests);
    } catch (err) {
      console.error('❌ Erreur chargement amis:', err);
      toast.error('Erreur lors du chargement des amis');
    } finally {
      setLoadingFriends(false);
    }
  };

  // ✅ Charger les utilisateurs en ligne
  const loadOnlineUsers = useCallback(async () => {
    if (!user) return;
    setLoadingOnlineUsers(true);

    try {
      // Récupérer tous les utilisateurs en ligne (actifs dans les 5 dernières minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      // Récupérer les IDs de tous les amis
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id, status')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');
      
      // Créer un Set des IDs d'amis
      const friendIds = new Set<string>();
      friendships?.forEach(f => {
        friendIds.add(f.requester_id === user.id ? f.addressee_id : f.requester_id);
      });
      
      // Récupérer tous les utilisateurs en ligne sauf soi-même
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, username, color, avatar_url, bio, last_seen')
        .gte('last_seen', fiveMinutesAgo)
        .neq('id', user.id);

      if (error) throw error;

      // Ajouter l'info si c'est un ami
      const usersWithFriendStatus = (users || []).map(u => ({
        ...u,
        isFriend: friendIds.has(u.id)
      }));

      setOnlineUsers(usersWithFriendStatus);
    } catch (err) {
      console.error('❌ Erreur chargement utilisateurs en ligne:', err);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoadingOnlineUsers(false);
    }
  }, [user?.id]);

  // ✅ Envoyer une demande d'ami
  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) return;
    setSendingFriendRequest(true);

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: targetUserId,
          status: 'pending'
        });

      if (error) throw error;

      setFriendshipStatus('pending_sent');
      toast.success('📨 Demande d\'ami envoyée !');
    } catch (err) {
      console.error('❌ Erreur envoi demande:', err);
      toast.error('Erreur lors de l\'envoi de la demande');
    } finally {
      setSendingFriendRequest(false);
    }
  };

  // ✅ Accepter une demande d'ami
  const acceptFriendRequest = async (requestId: number, requesterId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('🎉 Demande acceptée !');
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      
      // Recharger la liste d'amis
      loadFriends();

      // Mettre à jour le statut si on est sur le profil
      if (viewingProfile?.id === requesterId) {
        setFriendshipStatus('accepted');
      }
    } catch (err) {
      console.error('❌ Erreur acceptation:', err);
      toast.error('Erreur lors de l\'acceptation');
    }
  };

  // ✅ Refuser une demande d'ami
  const rejectFriendRequest = async (requestId: number) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Demande refusée');
      setFriendRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('❌ Erreur refus:', err);
      toast.error('Erreur lors du refus');
    }
  };

  // ✅ Supprimer un ami
  const removeFriend = async (friendId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`);

      if (error) throw error;

      toast.success('Ami supprimé');
      setFriends(prev => prev.filter(f => f.id !== friendId));
      
      if (viewingProfile?.id === friendId) {
        setFriendshipStatus('none');
      }
    } catch (err) {
      console.error('❌ Erreur suppression ami:', err);
      toast.error('Erreur lors de la suppression');
    }
  };



  // ✅ Charger les conversations
  const loadConversations = async () => {
    if (!user) return;
    setLoadingConversations(true);

    try {
      // Récupérer les dates de "reset" des conversations (quand l'utilisateur a supprimé)
      const { data: hiddenData } = await supabase
        .from('hidden_conversations')
        .select('hidden_user_id, created_at')
        .eq('user_id', user.id);
      
      // Map: userId -> date à partir de laquelle voir les messages
      const resetDates = new Map(hiddenData?.map(h => [h.hidden_user_id, new Date(h.created_at)]) || []);

      // Récupérer tous les messages privés de l'utilisateur
      const { data: messages, error } = await supabase
        .from('private_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Récupérer tous les IDs uniques des autres utilisateurs
      const otherUserIds = new Set<string>();
      messages?.forEach(msg => {
        const odId = msg.sender_id !== user.id ? msg.sender_id : msg.receiver_id;
        const resetDate = resetDates.get(odId);
        // Inclure seulement si pas de reset OU si le message est après le reset
        if (!resetDate || new Date(msg.created_at) > resetDate) {
          otherUserIds.add(odId);
        }
      });

      // Charger les profils de ces utilisateurs
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, color, avatar_url, last_seen')
        .in('id', Array.from(otherUserIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Grouper par conversation (autre utilisateur)
      const conversationMap = new Map<string, Conversation>();
      let totalUnread = 0;

      messages?.forEach((msg) => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherUserProfile = profileMap.get(otherUserId);
        if (!otherUserProfile) return;

        // Vérifier si ce message est après la date de reset
        const resetDate = resetDates.get(otherUserId);
        if (resetDate && new Date(msg.created_at) <= resetDate) return;

        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            odId: otherUserId,
            odUsername: otherUserProfile.username,
            odColor: otherUserProfile.color || '#3B82F6',
            odAvatar: otherUserProfile.avatar_url,
            odLastSeen: otherUserProfile.last_seen || null,
            lastMessage: msg.message || '📷 Image',
            lastMessageTime: msg.created_at,
            unreadCount: 0
          });
        }

        // Compter les non lus (messages reçus non lus)
        if (msg.receiver_id === user.id && !msg.read) {
          const conv = conversationMap.get(otherUserId)!;
          conv.unreadCount++;
          totalUnread++;
        }
      });

      setConversations(Array.from(conversationMap.values()));
      setUnreadMessagesCount(totalUnread);
    } catch (err) {
      console.error('❌ Erreur chargement conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // ✅ Charger les messages d'une conversation
  const loadPrivateMessages = async (otherUserId: string) => {
    if (!user) return;
    setLoadingPrivateMessages(true);

    try {
      // Vérifier s'il y a une date de reset pour cette conversation
      const { data: resetData } = await supabase
        .from('hidden_conversations')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('hidden_user_id', otherUserId)
        .single();

      let query = supabase
        .from('private_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`);

      // Si une date de reset existe, ne charger que les messages après
      if (resetData?.created_at) {
        query = query.gt('created_at', resetData.created_at);
      }

      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;

      setPrivateMessages(data || []);

      // Marquer les messages comme lus
      await supabase
        .from('private_messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherUserId)
        .eq('read', false);

      // Mettre à jour le compteur
      setConversations(prev => prev.map(c => 
        c.odId === otherUserId ? { ...c, unreadCount: 0 } : c
      ));
      
      // Recalculer le total
      setUnreadMessagesCount(prev => {
        const conv = conversations.find(c => c.odId === otherUserId);
        return prev - (conv?.unreadCount || 0);
      });
    } catch (err) {
      console.error('❌ Erreur chargement messages privés:', err);
    } finally {
      setLoadingPrivateMessages(false);
    }
  };

  // ✅ Envoyer un message privé
  const sendPrivateMessage = async () => {
    if (!user || !activeConversation || (!newPrivateMessage.trim() && !privateImageFile)) return;

    const messageContent = newPrivateMessage.trim();
    setNewPrivateMessage('');
    
    let imageUrl: string | null = null;

    try {
      // Upload de l'image si présente
      if (privateImageFile) {
        setSendingPrivateImage(true);
        const fileExt = privateImageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('private-messages')
          .upload(fileName, privateImageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('private-messages')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
        
        // Nettoyer la preview
        setPrivateImagePreview(null);
        setPrivateImageFile(null);
      }

      const { data, error } = await supabase
        .from('private_messages')
        .insert({
          sender_id: user.id,
          receiver_id: activeConversation,
          message: messageContent || (imageUrl ? '📷 Image' : ''),
          image_url: imageUrl
        })
        .select('*')
        .single();

      if (error) throw error;

      setPrivateMessages(prev => [...prev, data]);

      // Mettre à jour la conversation
      const lastMsg = imageUrl ? '📷 Image' : messageContent;
      setConversations(prev => {
        const existing = prev.find(c => c.odId === activeConversation);
        if (existing) {
          return prev.map(c => c.odId === activeConversation 
            ? { ...c, lastMessage: lastMsg, lastMessageTime: new Date().toISOString() }
            : c
          ).sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
        } else if (activeConversationUser) {
          return [{
            odId: activeConversation,
            odUsername: activeConversationUser.username,
            odColor: activeConversationUser.color,
            odAvatar: activeConversationUser.avatar_url,
            odLastSeen: null,
            lastMessage: lastMsg,
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0
          }, ...prev];
        }
        return prev;
      });
    } catch (err) {
      console.error('❌ Erreur envoi message privé:', err);
      toast.error('Erreur lors de l\'envoi du message');
      setNewPrivateMessage(messageContent);
    } finally {
      setSendingPrivateImage(false);
    }
  };

  // ✅ Gérer la sélection d'image pour message privé
  const handlePrivateImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont autorisées');
      return;
    }

    // Vérifier la taille (max 5MB)

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setPrivateImageFile(file);
    
    // Créer une preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPrivateImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ✅ Annuler l'image sélectionnée
  const cancelPrivateImage = () => {
    setPrivateImageFile(null);
    setPrivateImagePreview(null);
    if (privateImageInputRef.current) {
      privateImageInputRef.current.value = '';
    }
  };

  // ✅ Ouvrir une conversation
  const openConversation = (otherUser: {id: string, username: string, color: string, avatar_url: string | null, last_seen?: string | null}) => {
    setActiveConversation(otherUser.id);
    setActiveConversationUser(otherUser);
    loadPrivateMessages(otherUser.id);
    // Réinitialiser l'image
    cancelPrivateImage();
  };

  // ✅ Ouvrir la modale messages
  const openMessagesModal = () => {
    setShowMessagesModal(true);
    setActiveConversation(null);
    setActiveConversationUser(null);
    loadConversations();
    cancelPrivateImage();
  };

  // ✅ Supprimer une conversation (masquer pour l'utilisateur, persiste en BDD)
  const deleteConversation = async (odId: string) => {
    if (!user) return;
    
    // Supprimer visuellement immédiatement
    setConversations(prev => prev.filter(c => c.odId !== odId));
    
    try {
      // Vérifier si l'entrée existe déjà avant l'upsert
      const { data: existingEntry, error: fetchError } = await supabase
        .from('hidden_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('hidden_user_id', odId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // Code pour "aucune entrée trouvée"
        console.error('❌ Erreur lors de la vérification de l\'existence:', fetchError);
        toast.error('Erreur lors de la suppression');
        return;
      }

      if (existingEntry) {
        console.warn('⚠️ Entrée déjà existante, aucune action nécessaire.');
        toast.info('La conversation est déjà masquée.');
        return;
      }

      // Sauvegarder en base pour que ça persiste après refresh
      const { error } = await supabase
        .from('hidden_conversations')
        .upsert({
          user_id: user.id,
          hidden_user_id: odId
        });
      
      if (error) throw error;
      toast.success('Conversation supprimée');
    } catch (err) {
      console.error('❌ Erreur suppression conversation:', err);
      toast.error('Erreur lors de la suppression');
      // Recharger pour annuler le changement visuel
      loadConversations();
    }
  };

  // ✅ Démarrer une conversation depuis le profil
  const startConversationFromProfile = () => {
    if (!viewingProfile) return;
    closeProfileModal();
    setShowMessagesModal(true);
    openConversation({
      id: viewingProfile.id,
      username: viewingProfile.username,
      color: viewingProfile.color || '#3B82F6',
      avatar_url: viewingProfile.avatar_url,
      last_seen: viewingProfile.last_seen
    });
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

      {/* ✅ Lightbox pour afficher les images en grand */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] animate-fade-in cursor-zoom-out"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/50 rounded-full p-3 transition-colors z-10"
          >
            <FaTimes size={24} />
          </button>
          <img 
            src={lightboxImage} 
            alt="Image en grand" 
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={lightboxImage}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 right-4 text-white/80 hover:text-white bg-black/50 rounded-full px-4 py-2 transition-colors flex items-center space-x-2"
          >
            <FaImage size={16} />
            <span>Ouvrir dans un nouvel onglet</span>
          </a>
        </div>
      )}

      {/* ✅ Modale de profil utilisateur */}
      {(showProfileModal || closingProfileModal) && (
        <div 
          className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[100] ${closingProfileModal ? 'animate-fade-out' : 'animate-fade-in'}`}
          onClick={closeProfileModal}
        >
          <div 
            ref={profileModalRef}
            className={`bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 ${closingProfileModal ? 'animate-fade-out' : 'animate-scale-in'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {loadingProfile ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">Chargement du profil...</p>
              </div>
            ) : viewingProfile ? (
              <>
                {/* Header coloré */}
                <div 
                  className="h-24 relative rounded-t-2xl"
                  style={{ backgroundColor: viewingProfile.color || '#3B82F6' }}
                >
                  <button
                    onClick={closeProfileModal}
                    className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/20 rounded-full p-2 transition-colors"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>

                {/* Avatar */}
                <div className="flex justify-center -mt-12 relative z-10">
                  <div className="relative">
                    {viewingProfile.avatar_url ? (
                      <img 
                        src={viewingProfile.avatar_url} 
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div 
                        className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg"
                        style={{ backgroundColor: viewingProfile.color || '#3B82F6' }}
                      >
                        {(viewingProfile.username || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    {viewingProfile.id !== user?.id && (
                      <div className="absolute bottom-0 right-0">
                        <OnlineStatusIndicator lastSeen={viewingProfile.last_seen} size="lg" showOfflineAsOrange={true} className="border-2 border-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Infos */}
                <div className="p-6 text-center">
                  <h2 
                    className="text-2xl font-bold mb-1"
                    style={{ color: viewingProfile.color || '#3B82F6' }}
                  >
                    {viewingProfile.username || 'Utilisateur'}
                  </h2>
                  
                  {viewingProfile.id === user?.id && (
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full mb-3">
                      C&apos;est vous !
                    </span>
                  )}

                  <div className="mt-4 bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2 font-semibold">Biographie</p>
                    {viewingProfile.bio ? (
                      <p className="text-gray-700 whitespace-pre-wrap">{viewingProfile.bio}</p>
                    ) : (
                      <p className="text-gray-400 italic">Aucune biographie</p>
                    )}
                  </div>

                  {/* Boutons d'action amitié */}
                  {viewingProfile.id !== user?.id && (
                    <div className="mt-4">
                      {friendshipStatus === 'none' && (
                        <button
                          onClick={() => sendFriendRequest(viewingProfile.id)}
                          disabled={sendingFriendRequest}
                          className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:bg-blue-400"
                        >
                          <FaUserPlus size={16} />
                          <span>{sendingFriendRequest ? 'Envoi...' : 'Ajouter en ami'}</span>
                        </button>
                      )}
                      {friendshipStatus === 'pending_sent' && (
                        <button
                          disabled
                          className="w-full py-3 bg-yellow-100 text-yellow-700 rounded-xl font-medium flex items-center justify-center space-x-2"
                        >
                          <FaUserPlus size={16} />
                          <span>Demande envoyée</span>
                        </button>
                      )}
                      {friendshipStatus === 'pending_received' && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500 text-center mb-2">Cette personne vous a envoyé une demande</p>
                          <div className="flex space-x-2">
                            <button
                              onClick={async () => {
                                const { data } = await supabase
                                  .from('friendships')
                                  .select('id')
                                  .eq('requester_id', viewingProfile.id)
                                  .eq('addressee_id', user?.id)
                                  .single();
                                if (data) acceptFriendRequest(data.id, viewingProfile.id);
                              }}
                              className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                            >
                              <FaCheck size={14} />
                              <span>Accepter</span>
                            </button>
                            <button
                              onClick={async () => {
                                const { data } = await supabase
                                  .from('friendships')
                                  .select('id')
                                  .eq('requester_id', viewingProfile.id)
                                  .eq('addressee_id', user?.id)
                                  .single();
                                if (data) rejectFriendRequest(data.id);
                              }}
                              className="flex-1 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors font-medium flex items-center justify-center space-x-2"
                            >
                              <FaTimes size={14} />
                              <span>Refuser</span>
                            </button>
                          </div>
                        </div>
                      )}
                      {friendshipStatus === 'accepted' && (
                        <div className="space-y-2">
                          <div className="py-3 bg-green-100 text-green-700 rounded-xl font-medium flex items-center justify-center space-x-2">
                            <FaUserCheck size={16} />
                            <span>Vous êtes amis</span>
                            <button
                              onClick={startConversationFromProfile}
                              className="ml-2 p-2 text-green-600 hover:text-purple-500 hover:bg-purple-50 rounded-full transition-colors"
                              title="Envoyer un message"
                            >
                              <FaEnvelope size={16} />
                            </button>
                          </div>
                          <button
                            onClick={() => removeFriend(viewingProfile.id)}
                            className="w-full py-2 text-red-500 hover:text-red-600 text-sm transition-colors"
                          >
                            Retirer des amis
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={closeProfileModal}
                    className="mt-4 w-full py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Fermer
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ✅ Modale liste d'amis */}
      {(showFriendsModal || closingFriendsModal) && (
        <div 
          className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[100] ${closingFriendsModal ? 'animate-fade-out' : 'animate-fade-in'}`}
          onClick={closeFriendsModal}
        >
          <div 
            className={`bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden ${closingFriendsModal ? 'animate-fade-out' : 'animate-scale-in'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between" style={{ backgroundColor: user?.color || '#3B82F6' }}>
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <FaUserFriends size={20} />
                <span>Mes amis</span>
              </h2>
              <button
                onClick={closeFriendsModal}
                className="text-white/80 hover:text-white transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* Demandes en attente */}
              {friendRequests.length > 0 && (
                <div className="p-4 bg-yellow-50 border-b border-yellow-100">
                  <p className="text-sm font-semibold text-yellow-800 mb-3 flex items-center space-x-2">
                    <FaBell size={14} />
                    <span>Demandes en attente ({friendRequests.length})</span>
                  </p>
                  <div className="space-y-2">
                    {friendRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                        <div 
                          className="flex items-center space-x-3 cursor-pointer"
                          onClick={() => {
                            closeFriendsModal();
                            handleViewProfile(request.requester_id);
                          }}
                        >
                          {request.requester?.avatar_url ? (
                            <img src={request.requester.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: request.requester?.color || '#3B82F6' }}
                            >
                              {(request.requester?.username || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-gray-800">{request.requester?.username}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => acceptFriendRequest(request.id, request.requester_id)}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <FaCheck size={12} />
                          </button>
                          <button
                            onClick={() => rejectFriendRequest(request.id)}
                            className="p-2 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <FaTimes size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Liste d'amis */}
              <div className="p-4">
                {loadingFriends ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p className="text-gray-500">Chargement...</p>
                  </div>
                ) : friends.length > 0 ? (
                  <div className="space-y-2">
                    {friends.map((friend) => (
                      <div 
                        key={friend.id} 
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          closeFriendsModal();
                          handleViewProfile(friend.id);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {friend.avatar_url ? (
                              <img src={friend.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border-2" style={{ borderColor: friend.color }} />
                            ) : (
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: friend.color }}
                              >
                                {(friend.username || 'U')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="absolute bottom-0 right-0">
                              <OnlineStatusIndicator lastSeen={friend.last_seen} size="md" showOfflineAsOrange={true} className="border-2 border-white" />
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold" style={{ color: friend.color }}>{friend.username}</p>
                            {friend.bio && (
                              <p className="text-xs text-gray-500 truncate max-w-[180px]">{friend.bio}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              closeFriendsModal();
                              setShowMessagesModal(true);
                              openConversation({
                                id: friend.id,
                                username: friend.username,
                                color: friend.color,
                                avatar_url: friend.avatar_url,
                                last_seen: friend.last_seen
                              });
                            }}
                            className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Envoyer un message"
                          >
                            <FaEnvelope size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFriend(friend.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Retirer des amis"
                          >
                            <FaUserMinus size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaUserFriends className="mx-auto text-gray-300 mb-3" size={48} />
                    <p className="text-gray-500">Vous n&apos;avez pas encore d&apos;amis</p>
                    <p className="text-sm text-gray-400 mt-1">Cliquez sur le profil d&apos;un utilisateur pour l&apos;ajouter</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modale Messages privés */}
      {/* Modal Utilisateurs en ligne */}
      {(showOnlineUsersModal || closingOnlineUsersModal) && (
        <div 
          className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[100] ${closingOnlineUsersModal ? 'animate-fade-out' : 'animate-fade-in'}`}
          onClick={closeOnlineUsersModal}
        >
          <div 
            className={`bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden ${closingOnlineUsersModal ? 'animate-fade-out' : 'animate-scale-in'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FaUsers className="text-white" size={20} />
                <h2 className="text-xl font-bold text-white">Utilisateurs en ligne</h2>
              </div>
              <button
                onClick={closeOnlineUsersModal}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors duration-200"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Liste des utilisateurs */}
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              {loadingOnlineUsers ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
              ) : onlineUsers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FaUsers size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Aucun utilisateur en ligne pour le moment</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {onlineUsers.map((onlineUser) => (
                    <div
                      key={onlineUser.id}
                      className="p-4 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 cursor-pointer group" onClick={() => {
                          handleViewProfile(onlineUser.id);
                          closeOnlineUsersModal();
                        }}>
                          {/* Avatar */}
                          <div className="relative">
                            {onlineUser.avatar_url ? (
                              <img
                                src={onlineUser.avatar_url}
                                alt={onlineUser.username}
                                className="w-12 h-12 rounded-full object-cover border-2 group-hover:scale-110 transition-transform"
                                style={{ borderColor: onlineUser.color || '#3B82F6' }}
                              />
                            ) : (
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: onlineUser.color || '#3B82F6' }}
                              >
                                <FaUser className="text-white" size={20} />
                              </div>
                            )}
                            <OnlineStatusIndicator
                              lastSeen={onlineUser.last_seen}
                              size="md"
                              className="absolute bottom-0 right-0 border-2 border-white"
                            />
                          </div>

                          {/* Info utilisateur */}
                          <div className="flex-1 min-w-0 text-left">
                            <p
                              className="font-semibold truncate group-hover:underline cursor-pointer transition-all"
                              style={{ color: onlineUser.color || '#3B82F6' }}
                            >
                              {onlineUser.username}
                            </p>
                            {onlineUser.bio && (
                              <p className="text-xs text-gray-500 truncate">{onlineUser.bio}</p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-2">
                          {onlineUser.isFriend ? (
                            <div className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm font-medium">
                              <FaUserCheck size={14} />
                              <span>Ami</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                sendFriendRequest(onlineUser.id);
                              }}
                              className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors duration-200"
                              title="Ajouter en ami"
                            >
                              <FaUserPlus size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(showMessagesModal || closingMessagesModal) && (
        <div 
          className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[100] ${closingMessagesModal ? 'animate-fade-out' : 'animate-fade-in'}`}
          onClick={closeMessagesModal}
        >
          <div 
            className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden animate-scale-in flex flex-col ${closingMessagesModal ? 'animate-fade-out' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-500 to-purple-600">
              {activeConversation && activeConversationUser ? (
                <>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setActiveConversation(null);
                        setActiveConversationUser(null);
                        loadConversations();
                      }}
                      className="text-white/80 hover:text-white transition-colors p-1"
                    >
                      <FaChevronLeft size={18} />
                    </button>
                    <div className="relative">
                      {activeConversationUser.avatar_url ? (
                        <img 
                          src={activeConversationUser.avatar_url} 
                          alt="" 
                          className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
                        />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: activeConversationUser.color }}
                        >
                          {activeConversationUser.username[0].toUpperCase()}
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0">
                        <OnlineStatusIndicator lastSeen={activeConversationUser.last_seen} size="sm" showOfflineAsOrange={true} className="border-2 border-white" />
                      </div>
                    </div>
                    <span className="text-white font-semibold">{activeConversationUser.username}</span>
                  </div>
                </>
              ) : (
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <FaEnvelope size={20} />
                  <span>Messages privés</span>
                </h2>
              )}
              <button
                onClick={closeMessagesModal}
                className="text-white/80 hover:text-white transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>

            {/* Contenu */}
            {activeConversation && activeConversationUser ? (
              // Vue conversation
              <div className="flex flex-col flex-1 overflow-hidden">
                {/* Messages */}
                <div ref={privateMessagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 scrollbar-purple">
                  {loadingPrivateMessages ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : privateMessages.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FaEnvelope className="mx-auto mb-3 text-gray-300" size={40} />
                      <p>Aucun message pour le moment</p>
                      <p className="text-sm mt-1">Envoyez le premier message !</p>
                    </div>
                  ) : (
                    privateMessages.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[75%] rounded-2xl ${
                            msg.sender_id === user?.id 
                              ? 'bg-purple-500 text-white rounded-br-md' 
                              : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                          } ${msg.image_url ? 'p-1' : 'px-4 py-2'}`}
                        >
                          {msg.image_url && (
                            <img 
                              src={msg.image_url} 
                              alt="Image" 
                              className="rounded-xl max-w-full max-h-64 object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                              onClick={() => setLightboxImage(msg.image_url!)}
                            />
                          )}
                          {msg.message && msg.message !== '📷 Image' && (
                            <p className={`break-words ${msg.image_url ? 'px-3 py-1' : ''}`}>{msg.message}</p>
                          )}
                          <p className={`text-xs mt-1 ${msg.image_url ? 'px-3 pb-1' : ''} ${msg.sender_id === user?.id ? 'text-purple-200' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  {/* Indicateur de frappe */}
                  {privateTypingUser && (
                    <div className="flex justify-start">
                      <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-2xl rounded-bl-md text-sm italic flex items-center space-x-2">
                        <span>{privateTypingUser} est en train d&apos;écrire</span>
                        <span className="flex ml-1 space-x-0.5">
                          <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </span>
                      </div>
                    </div>
                  )}
                  <div ref={privateMessagesEndRef} />
                </div>

                {/* Preview image */}
                {privateImagePreview && (
                  <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                    <div className="relative inline-block">
                      <img 
                        src={privateImagePreview} 
                        alt="Preview" 
                        className="h-20 w-auto rounded-lg object-cover"
                      />
                      <button
                        onClick={cancelPrivateImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-gray-200 bg-white">
                  {/* Input caché pour l'image */}
                  <input
                    type="file"
                    ref={privateImageInputRef}
                    onChange={handlePrivateImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => privateImageInputRef.current?.click()}
                      disabled={sendingPrivateImage}
                      className="p-2 text-gray-500 hover:text-purple-500 hover:bg-purple-50 rounded-full transition-colors disabled:opacity-50"
                      title="Envoyer une image"
                    >
                      <FaImage size={18} />
                    </button>
                    <input
                      type="text"
                      value={newPrivateMessage}
                      onChange={(e) => {
                        setNewPrivateMessage(e.target.value);
                        if (e.target.value.trim()) {
                          handlePrivateTyping();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          stopPrivateTyping();
                          sendPrivateMessage();
                        }
                      }}
                      onBlur={stopPrivateTyping}
                      placeholder="Écrivez un message..."
                      disabled={sendingPrivateImage}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    />
                    <button
                      onClick={() => {
                        stopPrivateTyping();
                        sendPrivateMessage();
                      }}
                      disabled={(!newPrivateMessage.trim() && !privateImageFile) || sendingPrivateImage}
                      className="p-3 bg-purple-500 text-white rounded-full hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {sendingPrivateImage ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <FaPaperPlane size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Liste des conversations
              <div className="overflow-y-auto flex-1 scrollbar-purple">
                {loadingConversations ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-12">
                    <FaEnvelope className="mx-auto mb-3 text-gray-300" size={48} />
                    <p className="text-gray-500">Aucune conversation</p>
                    <p className="text-sm text-gray-400 mt-1">Cliquez sur le profil d&apos;un ami pour démarrer une conversation</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {conversations.map((conv) => (
                      <div
                        key={conv.odId}
                        className="group flex items-center hover:bg-gray-50 transition-colors"
                      >
                        <button
                          onClick={() => openConversation({
                            id: conv.odId,
                            username: conv.odUsername,
                            color: conv.odColor,
                            avatar_url: conv.odAvatar,
                            last_seen: conv.odLastSeen
                          })}
                          className="flex-1 px-4 py-3 flex items-center space-x-3 text-left"
                        >
                          <div className="relative">
                            {conv.odAvatar ? (
                              <img 
                                src={conv.odAvatar} 
                                alt="" 
                                className="w-12 h-12 rounded-full object-cover border-2"
                                style={{ borderColor: conv.odColor }}
                              />
                            ) : (
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: conv.odColor }}
                              >
                                {conv.odUsername[0].toUpperCase()}
                              </div>
                            )}
                            <div className="absolute bottom-0 right-0">
                              <OnlineStatusIndicator lastSeen={conv.odLastSeen} size="md" showOfflineAsOrange={true} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold truncate" style={{ color: conv.odColor }}>
                                {conv.odUsername}
                              </p>
                              <span className="text-xs text-gray-400">
                                {new Date(conv.lastMessageTime).toLocaleDateString('fr-FR', { 
                                  day: '2-digit', 
                                  month: '2-digit' 
                                })}
                              </span>
                            </div>
                            {typingInConversations[conv.odId] ? (
                              <p className="text-sm text-purple-500 italic flex items-center">
                                <span>est en train d&apos;écrire</span>
                                <span className="flex ml-1 space-x-0.5">
                                  <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                  <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                  <span className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </span>
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                            )}
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="bg-purple-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </button>
                        {/* Bouton supprimer - toujours visible */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conv.odId);
                          }}
                          className="mr-2 p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-all"
                          title="Supprimer la conversation"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Header avec menu utilisateur */}
      <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Menu utilisateur */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="relative flex items-center space-x-3 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all duration-200 shadow-md hover:shadow-lg"
                style={{ backgroundColor: user?.color || '#3B82F6' }}
              >
                {user?.avatar_url ? (
                  <div className="relative">
                    <img 
                      src={user.avatar_url} 
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover border-2 border-white"
                    />
                    <div className="absolute bottom-0 right-0">
                      <OnlineStatusIndicator lastSeen={user?.last_seen} size="sm" className="border-2 border-white" showOfflineAsOrange={true}  />
                    </div>
                  </div>
                ) : (
                  <div className="relative bg-white rounded-full p-2">
                    <FaUser style={{ color: user?.color || '#3B82F6' }} size={16} />
                    <div className="absolute bottom-0 right-0">
                      <OnlineStatusIndicator lastSeen={user?.last_seen} size="sm" className="border-2 border-white" showOfflineAsOrange={true} />
                    </div>
                  </div>
                )}
                <span className="font-medium">{user?.name}</span>
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <div className={`absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 ${
                  isClosingMenu ? 'animate-fade-out' : 'animate-fade-in'
                }`}>
                  <div className="px-4 py-3 text-white" style={{ backgroundColor: user?.color || '#3B82F6' }}>
                    <p className="text-sm font-semibold">Informations du compte</p>
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

                    {/* Photo de profil */}
                    <div className="flex items-start space-x-3 pt-3 border-t border-gray-100">
                      <FaCamera className="text-purple-500 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-2">Photo de profil</p>
                        <div className="flex items-center space-x-3">
                          {user?.avatar_url ? (
                            <img 
                              src={user.avatar_url} 
                              alt="Avatar"
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div 
                              className="w-12 h-12 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: user?.color || '#3B82F6' }}
                            >
                              <FaUser className="text-white" size={20} />
                            </div>
                          )}
                          <label className={`px-3 py-1.5 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors duration-200 cursor-pointer flex items-center space-x-1 ${isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <FaCamera size={10} />
                            <span>{isUploadingAvatar ? 'Upload...' : 'Changer'}</span>
                            <input
                              ref={avatarInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                              disabled={isUploadingAvatar}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Biographie */}
                    <div className="flex items-start space-x-3 pt-3 border-t border-gray-100">
                      <FaEdit className="text-blue-500 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Biographie</p>
                        {!isEditingBio ? (
                          <div className="flex items-center space-x-2 group">
                            <p className="text-sm font-medium text-gray-900">
                              {user?.bio || <span className="italic font-normal text-gray-400">Aucune bio</span>}
                            </p>
                            <button
                              onClick={startEditingBio}
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-blue-500 hover:text-blue-600 p-1"
                              title="Modifier la bio"
                            >
                              <FaEdit size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <textarea
                              value={editingBio}
                              onChange={(e) => setEditingBio(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              placeholder="Décrivez-vous en quelques mots..."
                              rows={2}
                              maxLength={200}
                              disabled={isUpdatingBio}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') cancelEditingBio();
                              }}
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={handleUpdateBio}
                                disabled={isUpdatingBio}
                                className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-1 disabled:bg-blue-400"
                              >
                                <FaCheck size={10} />
                                <span>{isUpdatingBio ? 'Enregistrement...' : 'Valider'}</span>
                              </button>
                              <button
                                onClick={cancelEditingBio}
                                disabled={isUpdatingBio}
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

                  <div className="border-t border-gray-100">
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

            {/* Bouton Mes amis */}
            <button
              onClick={() => {
                setShowFriendsModal(true);
                loadFriends();
              }}
              className="relative flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow"
            >
              <FaUserFriends className="text-blue-500" size={18} />
              <span className="font-medium text-gray-700 hidden sm:inline">Amis</span>
              {friendRequests.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                  {friendRequests.length}
                </span>
              )}
            </button>

            {/* Bouton Messages privés */}
            <button
              onClick={openMessagesModal}
              className="relative flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow"
            >
              <FaEnvelope className="text-purple-500" size={18} />
              <span className="font-medium text-gray-700 hidden sm:inline">Messages</span>
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </button>

            {/* Bouton Utilisateurs en ligne */}
            <button
              onClick={() => {
                setShowOnlineUsersModal(true);
                loadOnlineUsers();
              }}
              className="relative flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow"
            >
              <FaUsers className="text-green-500" size={18} />
              <span className="font-medium text-gray-700 hidden sm:inline">En ligne</span>
              <span className={`absolute -top-2 -right-2 bg-green-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full transition-all duration-5000 ${onlineUsers.length > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                <CountUp key={onlineUsers.length} end={onlineUsers.length} duration={0.5} />
              </span>
            </button>
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
              <span className="inline-flex space-x-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
              <span className="font-medium">
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
                  key={`message-${item.id}`} 
                  className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 ease-out border-l-4"
                  style={{ 
                    opacity: 0,
                    animation: `fadeInUp 0.5s ease-out ${index * 50}ms forwards`,
                    borderLeftColor: item.user_color || '#3B82F6'
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div 
                        className="flex items-center space-x-3 mb-2 cursor-pointer group"
                        onClick={() => handleViewProfile(item.user_id)}
                      >
                        <div className="relative">
                          {item.avatar_url ? (
                            <img 
                              src={item.avatar_url} 
                              alt="Avatar"
                              className="w-10 h-10 rounded-full object-cover border-2 group-hover:scale-110 transition-transform"
                              style={{ borderColor: item.user_color || '#3B82F6' }}
                            />
                          ) : (
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform"
                              style={{ backgroundColor: item.user_color || '#3B82F6' }}
                            >
                              {(item.username || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="absolute bottom-0 right-0">
                            <OnlineStatusIndicator lastSeen={item.last_seen} size="sm" showOfflineAsOrange={true} />
                          </div>
                        </div>
                        <p className="font-semibold group-hover:underline" style={{ color: item.user_color || '#3B82F6' }}>
                          {item.username || 'Utilisateur'}
                        </p>
                      </div>
                      
                      {/* Message texte */}
                      {editingMessageId === item.id ? (
                        <div className="space-y-2 mb-2">
                          <textarea
                            value={editingMessageText}
                            onChange={(e) => setEditingMessageText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            rows={3}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUpdateMessage(item.id)}
                              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                            >
                              <FaCheck size={14} />
                              <span>Enregistrer</span>
                            </button>
                            <button
                              onClick={handleCancelEditMessage}
                              className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center space-x-2"
                            >
                              <FaTimes size={14} />
                              <span>Annuler</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        item.message && (
                          <p className="text-gray-800 leading-relaxed mb-2">
                            {item.message}
                            {item.edited && (
                              <span className="text-xs text-gray-500 ml-2">(modifié)</span>
                            )}
                          </p>
                        )
                      )}
                      
                      {/* Image si présente */}
                      {item.image_url && (
                        <div className="mt-2">
                          <img 
                            src={item.image_url} 
                            alt="Message image" 
                            className="max-w-md rounded-lg border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity"
                            onClick={() => setLightboxImage(item.image_url!)}
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

                      {item.user_id === user?.id && (
                        <>
                          <button
                            onClick={() => handleStartEditMessage(item)}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700 transition-all duration-200"
                            title="Modifier"
                          >
                            <FaEdit size={16} />
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-all duration-200"
                            title="Supprimer"
                          >
                            <FaTrash size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {(commentingMessageId === item.id || closingMessageId === item.id) && (
                    <div className={`mt-6 pt-6 border-t border-gray-200 ${closingMessageId === item.id ? 'animate-fade-out' : 'animate-fade-in'}`}>
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
                                key={`comment-${commentaire.id}`} 
                                className="bg-gray-50 p-4 rounded-lg transition-all duration-300 ease-out border-l-4"
                                style={{
                                  opacity: 0,
                                  animation: `fadeInUp 0.4s ease-out ${idx * 80}ms forwards`,
                                  borderLeftColor: commentaire.user_color || '#10B981'
                                }}
                              >
                                <div 
                                  className="flex items-center space-x-2 mb-1 cursor-pointer group"
                                  onClick={() => handleViewProfile(commentaire.user_id)}
                                >
                                  {commentaire.avatar_url ? (
                                    <img 
                                      src={commentaire.avatar_url} 
                                      alt="Avatar"
                                      className="w-7 h-7 rounded-full object-cover border-2 group-hover:scale-110 transition-transform"
                                      style={{ borderColor: commentaire.user_color || '#10B981' }}
                                    />
                                  ) : (
                                    <div 
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs group-hover:scale-110 transition-transform"
                                      style={{ backgroundColor: commentaire.user_color || '#10B981' }}
                                    >
                                      {(commentaire.username || 'U')[0].toUpperCase()}
                                    </div>
                                  )}
                                  <p 
                                    className="font-semibold text-sm group-hover:underline"
                                    style={{ color: commentaire.user_color || '#10B981' }}
                                  >
                                    {commentaire.username || 'Utilisateur'}
                                  </p>
                                </div>
                                <p className="text-gray-700 ml-9">{commentaire.commentaire}</p>
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
                  {/* ✅ Référence pour scroll automatique des commentaires */}
                  <div ref={commentsEndRef} />
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
