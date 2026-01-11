'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Confetti from 'react-confetti';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LoginRegister from './LoginRegister';
import { createClient } from '../app/utils/supabase/client';
import { ONLINE_THRESHOLD_MS } from './constants/onlineStatus';
import FriendsModal from './components/page/FriendsModal';
import HeaderBar from './components/page/HeaderBar';
import LightboxModal from './components/page/LightboxModal';
import MessageComposer from './components/page/MessageComposer';
import MessageList from './components/page/MessageList';
import OnlineUsersModal from './components/page/OnlineUsersModal';
import PrivateMessagesModal from './components/page/PrivateMessagesModal';
import ProfileModal from './components/page/ProfileModal';
import TypingIndicator from './components/page/TypingIndicator';
import {
  Commentaire,
  Conversation,
  ConversationUser,
  Friend,
  FriendRequest,
  FriendshipStatus,
  Message,
  PrivateMessage,
  ProfileData,
  User,
  VoiceCall,
  WebRTCSignal,
} from './types/chat';

const supabase = createClient();

const BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : 'https://express-back-end-phi.vercel.app/api';
const CONFETTI_DURATION = 3000;

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
    // 🎙️ Voice calls (1v1)
  const [incomingCall, setIncomingCall] = useState<VoiceCall | null>(null);
  const [activeCall, setActiveCall] = useState<VoiceCall | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connecting' | 'connected'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [microphoneActive, setMicrophoneActive] = useState(false);
  const [audioNeedsInteraction, setAudioNeedsInteraction] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

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
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none');
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [closingMessagesModal, setClosingMessagesModal] = useState(false);
  const [showOnlineUsersModal, setShowOnlineUsersModal] = useState(false);
  const [closingOnlineUsersModal, setClosingOnlineUsersModal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<ProfileData[]>([]);
  const [loadingOnlineUsers, setLoadingOnlineUsers] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [activeConversationUser, setActiveConversationUser] = useState<ConversationUser | null>(null);
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
  const userMenuRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
          const newMsg = payload.new as Message & { user_id: string };
          
          // ✅ Récupérer le username depuis la table profiles avec le user_id
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, color, avatar_url, last_seen')
            .eq('id', newMsg.user_id)
            .single();
          
          const username = profile?.username || 'Utilisateur';
          const userColor = profile?.color || '#3B82F6';
          const avatarUrl = profile?.avatar_url;

          // ✅ Ajouter le message à la liste avec le username et la couleur
          setMessages(prev => {
            const exists = prev.some(msg => msg.id === newMsg.id);
            if (exists) {
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

          // ✅ Ajouter le commentaire à la liste du bon message
          setCommentairesByMessage(prev => {
            const currentComments = prev[newComment.message_id] || [];
            
            const exists = currentComments.some(c => c.id === newComment.id);
            if (exists) {
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

  // ✅ Charger les utilisateurs en ligne
  const loadOnlineUsers = useCallback(async () => {
    if (!user) return;
    setLoadingOnlineUsers(true);

    try {
      // Récupérer tous les utilisateurs en ligne (actifs dans les dernières secondes configurées)
      const thresholdAgo = new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString();
      
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
        .gte('last_seen', thresholdAgo)
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
  }, [user]);

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
            const thresholdAgo = Date.now() - ONLINE_THRESHOLD_MS;
            const lastSeenTime = new Date(newLastSeen).getTime();
            const isOnline = lastSeenTime >= thresholdAgo;
            
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
  }, [isAuthenticated, user, activeConversationUser, viewingProfile, loadOnlineUsers]);

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
            const thresholdAgo = Date.now() - ONLINE_THRESHOLD_MS;
            const lastSeenTime = updated.last_seen ? new Date(updated.last_seen).getTime() : 0;
            const isOnline = lastSeenTime >= thresholdAgo;

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const newMessage = payload.new as any;
          
          // Ignorer si ce n'est pas pour nous
          if (newMessage.receiver_id !== user.id) {
            return;
          }
          
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

  // ✅ Realtime - appels vocaux entrants (voice_calls)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const ch = supabase
      .channel(`voice-calls-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'voice_calls' },
        (payload) => {
          const call = payload.new as VoiceCall;

          // Si c'est un appel entrant pour moi
          if (call.receiver_id === user.id && call.status === 'calling') {
            setIncomingCall(call);
            setCallStatus('ringing');
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'voice_calls' },
        (payload) => {
          const call = payload.new as VoiceCall;

          // si l'appel actif est terminé
          if (activeCall?.id === call.id && (call.status === 'ended' || call.status === 'missed')) {
            setActiveCall(null);
            setIncomingCall(null);
            setCallStatus('idle');
            cleanupWebRTC();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [isAuthenticated, user, activeCall]);

  
    // ✅ Realtime - signaux WebRTC (offer/answer/ice)
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const currentCall = activeCall || incomingCall;
    if (!currentCall) return;

    const ch = supabase
      .channel(`webrtc-signals-${currentCall.id}-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'webrtc_signals' },
        async (payload) => {
          const sig = payload.new as WebRTCSignal;

          // ignorer si ce signal n'est pas pour moi ou pas sur cet appel
          if (sig.call_id !== currentCall.id) return;
          if (sig.receiver_id !== user.id) return;
          if (sig.sender_id === user.id) return; // ignorer ses propres signaux

          const otherUserId = sig.sender_id;

          try {
            console.log('📥 Signal reçu:', sig.signal_type, 'de', sig.sender_id);
            
            const pc = pcRef.current;
            if (!pc) {
              console.warn('⚠️ Peer connection not found, ignoring signal');
              return;
            }

            if (sig.signal_type === 'offer') {
              console.log('📥 Remote description set from offer');
              await pc.setRemoteDescription(sig.signal_data as RTCSessionDescriptionInit);
              // Appliquer ICE bufferisés maintenant que remoteDescription existe
for (const c of pendingIceRef.current) {
  try { await pc.addIceCandidate(c); console.log('🧊 ICE buffered ajouté'); } catch (e) { console.warn("ICE buffered failed", e); }
}
pendingIceRef.current = [];

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
console.log('📤 Local description set for answer');

              console.log('📤 Envoi answer');
              await supabase.from('webrtc_signals').insert({
                call_id: activeCall?.id,
                sender_id: user.id,
                receiver_id: otherUserId,
                signal_type: 'answer',
                signal_data: answer,
              });
            }

            if (sig.signal_type === 'answer') {
              console.log('📥 Remote description set from answer');
              await pc.setRemoteDescription(sig.signal_data as RTCSessionDescriptionInit);
              // Appliquer ICE bufferisés maintenant que remoteDescription existe
for (const c of pendingIceRef.current) {
  try { await pc.addIceCandidate(c); console.log('🧊 ICE buffered ajouté'); } catch (e) { console.warn("ICE buffered failed", e); }
}
pendingIceRef.current = [];

            }

            if (sig.signal_type === 'ice_candidate') {
console.log('🧊 ICE reçu de', sig.sender_id);
if (!pc.remoteDescription) {
  // Pas encore de remoteDescription -> on bufferise
  pendingIceRef.current.push(sig.signal_data as RTCIceCandidateInit);
  return;
}

await pc.addIceCandidate(sig.signal_data as RTCIceCandidateInit);
console.log('🧊 ICE candidate ajouté');
            }
          } catch (e) {
            console.error(e);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [isAuthenticated, user, activeCall]);


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

  // Auto-scroll des commentaires désactivé (conserver uniquement le scroll privé)

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

  // Auto-scroll des messages publics désactivé (conserver uniquement le scroll privé)

  // Auto-scroll des commentaires désactivé

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
      
      // ✅ Charger les commentaires en arrière-plan
      await fetchCommentaires(id);
      // Auto-scroll des commentaires désactivé (aucune action de scroll)
    } else {
      // ✅ Fermer avec animation
      setClosingMessageId(id);
      setTimeout(() => {
        setCommentingMessageId(null);
        setClosingMessageId(null);
      }, 200); // durée de fadeOut
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

      // ✅ Consommer la réponse (le realtime ajoutera le commentaire)
      await response.json();

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

  try {
    await supabase
      .from('profiles')
      .update({ last_seen: now })
      .eq('id', user.id);

    // ✅ IMPORTANT : met à jour l'utilisateur local (sinon le header ne bouge pas)
    setUser(prev => (prev ? { ...prev, last_seen: now } : prev));

    // ✅ Diffuser immédiatement une notification broadcast pour propager l'activité
    // Cela permet aux autres onglets/clients de réagir sans attendre l'événement postgres_changes
    try {
      const broadcastChannel = supabase.channel('public-online-activity');
      await broadcastChannel.send({
        type: 'broadcast',
        event: 'user_active',
        payload: { userId: user.id, lastSeen: now }
      });
    } catch (bErr) {
      console.warn('⚠️ Échec du broadcast user_active:', bErr);
    }

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

    lastActivityUpdate.current = Date.now();
  } catch (err) {
    console.error('❌ Erreur mise à jour last_seen:', err);
  }
}, [user, viewingProfile]);


  // ✅ Mise à jour lors de l'activité utilisateur (throttled à 30 secondes)
  const handleUserActivity = useCallback(() => {
    if (!user) return;
    
    const now = Date.now();
    const timeSinceLastUpdate = now - lastActivityUpdate.current;
    
    // Ne mettre à jour que si le seuil configuré s'est écoulé
    if (timeSinceLastUpdate >= ONLINE_THRESHOLD_MS) {
      updateOnlineStatus();
    }
  }, [user]);

// ✅ Mise à jour initiale au montage (arrivée sur le site)
useEffect(() => {
  if (!user?.id) return;

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
}, [user?.id]);


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
}, [user?.id, handleUserActivity, user]);

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
      
      // ✅ Mettre à jour la couleur dans la table profiles
      const { error } = await supabase
        .from('profiles')
        .update({ color: editingColor })
        .eq('id', user.id)
        .select();

      if (error) {
        console.error('❌ Erreur lors de la mise à jour:', error);
        throw error;
      }

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

      if (verifyData?.color !== editingColor) {
        throw new Error(`La couleur n'a pas été mise à jour dans la BDD. Couleur actuelle: ${verifyData?.color}`);
      }

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

// ✅ Realtime broadcast listener pour 'user_active' (activité utilisateur instantanée)
useEffect(() => {
  if (!isAuthenticated || !user) return;

  const activityChannel = supabase
    .channel('public-online-activity')
    .on('broadcast', { event: 'user_active' }, ({ payload }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { userId, lastSeen } = payload as any;
      if (!userId || !lastSeen) return;

      // Mettre à jour partout où apparaît cet utilisateur
      setFriends(prev => prev.map(f => f.id === userId ? { ...f, last_seen: lastSeen } : f));
      setConversations(prev => prev.map(conv => conv.odId === userId ? { ...conv, odLastSeen: lastSeen } : conv));
      setMessages(prev => prev.map(msg => msg.user_id === userId ? { ...msg, last_seen: lastSeen } : msg));
      if (activeConversationUser && activeConversationUser.id === userId) {
        setActiveConversationUser(prev => prev ? { ...prev, last_seen: lastSeen } : null);
      }
      if (viewingProfile && viewingProfile.id === userId) {
        setViewingProfile(prev => prev ? { ...prev, last_seen: lastSeen } : null);
      }

      setOnlineUsers(prev => {
        const thresholdAgo = Date.now() - ONLINE_THRESHOLD_MS;
        const lastSeenTime = new Date(lastSeen).getTime();
        const isOnline = lastSeenTime >= thresholdAgo;

        const existingIndex = prev.findIndex(u => u.id === userId);
        if (existingIndex >= 0) {
          if (isOnline) return prev.map(u => u.id === userId ? { ...u, last_seen: lastSeen } : u);
          return prev.filter(u => u.id !== userId);
        } else if (isOnline) {
          // si on ne le connaissait pas et qu'il est online, recharger
          loadOnlineUsers();
          return prev;
        }
        return prev;
      });
    })
    .subscribe();

  return () => {
    supabase.removeChannel(activityChannel);
  };
}, [isAuthenticated, user, activeConversationUser, viewingProfile, loadOnlineUsers]);

  // ✅ Envoyer une demande d'ami
  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) return;
    setSendingFriendRequest(true);

    try {
      // Vérifier s'il existe déjà une relation d'ami ou une demande en cours
      const { data: existingRequests, error: checkError } = await supabase
        .from('friendships')
        .select('id, status, requester_id, addressee_id')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${user.id})`);

      if (checkError) throw checkError;

      // Vérifier s'il y a déjà une demande ou une amitié
      const existingRequest = existingRequests?.find(req =>
        (req.status === 'pending' || req.status === 'accepted')
      );

      if (existingRequest) {
        if (existingRequest.status === 'accepted') {
          toast.info('Vous êtes déjà amis !');
        } else if (existingRequest.requester_id === user.id) {
          toast.info('Vous avez déjà envoyé une demande à cette personne');
        } else {
          toast.info('Cette personne vous a déjà envoyé une demande d\'ami');
        }
        return;
      }

      // Si aucune relation existante, créer la demande
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

      // Supprimer tous les messages privés entre les deux utilisateurs
      const { error: messagesError } = await supabase
        .from('private_messages')
        .delete()
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`);

      if (messagesError) {
        console.error('Erreur lors de la suppression des messages:', messagesError);
        // Ne pas échouer complètement si la suppression des messages échoue
      }

      // Supprimer la conversation de la liste visible
      setConversations(prev => prev.filter(c => c.odId !== friendId));

      // Si la conversation supprimée est celle actuellement ouverte, la fermer
      if (activeConversation === friendId) {
        setActiveConversation(null);
        setActiveConversationUser(null);
        setPrivateMessages([]);
        setNewPrivateMessage('');
        setPrivateImagePreview(null);
        setPrivateImageFile(null);
      }

      toast.success('Ami et conversation supprimés');
      setFriends(prev => prev.filter(f => f.id !== friendId));
      
      if (viewingProfile?.id === friendId) {
        setFriendshipStatus('none');
      }
    } catch (err) {
      console.error('❌ Erreur suppression ami:', err);
      toast.error('Erreur lors de la suppression');
    }
  };

  // ✅ Ouvrir la modale amis
  // const openFriendsModal = () => {
  //   setShowFriendsModal(true);
  //   loadFriends();
  // };

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

    const cleanupWebRTC = () => {
    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    localStreamRef.current = null;

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(t => t.stop());
    }
    remoteStreamRef.current = null;

    // Clear audio element
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    pendingIceRef.current = [];
    setIsMuted(false);
    setMicrophoneActive(false);
    setAudioNeedsInteraction(false);
  };

  const ensurePeerConnection = async (callId: string, otherUserId: string) => {
    // 1) Get microphone access if not already done
    if (!localStreamRef.current) {
      try {
        const audioConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: { ideal: 48000, min: 16000 },
            channelCount: 1
          }
        };

        localStreamRef.current = await navigator.mediaDevices.getUserMedia(audioConstraints);
      } catch {
        throw new Error("Microphone access required for voice calls");
      }
    }

    // 2) Create peer connection if needed
    if (!pcRef.current) {
      const iceServers = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        // TURN server for cross-network connectivity
        { 
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject"
        }
      ];
      
      const pc = new RTCPeerConnection({
        iceServers: iceServers,
        iceCandidatePoolSize: 10
      });

      pcRef.current = pc;

      // 3) Add local audio track to peer connection
      const localAudioTrack = localStreamRef.current.getAudioTracks()[0];
      if (localAudioTrack) {
        pc.addTrack(localAudioTrack, localStreamRef.current);
      }

      // 4) Handle remote tracks
      pc.ontrack = (event) => {
        if (event.track.kind === 'audio') {
          remoteStreamRef.current = new MediaStream([event.track]);

          const audioElement = remoteAudioRef.current;
          if (audioElement) {
            audioElement.srcObject = remoteStreamRef.current;
            audioElement.volume = 1.0;
            audioElement.muted = false;

            const playPromise = audioElement.play();
            if (playPromise !== undefined) {
              playPromise.then(() => {
                setAudioNeedsInteraction(false);
              }).catch(() => {
                setAudioNeedsInteraction(true);
                
                const resumeAudio = () => {
                  audioElement.play().catch(() => {});
                  document.removeEventListener('touchstart', resumeAudio);
                  document.removeEventListener('click', resumeAudio);
                };
                
                document.addEventListener('touchstart', resumeAudio, { once: true });
                document.addEventListener('click', resumeAudio, { once: true });
              });
            }
          }
        }
      };

      // 5) Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate && user) {
          try {
            await supabase.from('webrtc_signals').insert({
              call_id: callId,
              sender_id: user.id,
              receiver_id: otherUserId,
              signal_type: 'ice_candidate',
              signal_data: event.candidate
            });
          } catch (error) {
            console.error("Failed to send ICE candidate:", error);
          }
        }
      };

      // 6) Monitor connection state
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          // Connection established successfully
        } else if (pc.connectionState === 'failed') {
          cleanupWebRTC();
        }
      };

      console.log("🧩 Peer connection setup complete");
    };
  };

  const startVoiceCall = async () => {
    if (!user || !activeConversationUser) return;

    try {
      setCallStatus('calling');

      // 1) Create call record
      const { data: call, error: callError } = await supabase
        .from('voice_calls')
        .insert({
          caller_id: user.id,
          receiver_id: activeConversationUser.id,
          status: 'calling',
        })
        .select('*')
        .single();

      if (callError) throw callError;
      setActiveCall(call);

      // 2) Setup WebRTC
      await ensurePeerConnection(call.id, activeConversationUser.id);

      // 3) Create and send offer
      const pc = pcRef.current!;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await supabase.from('webrtc_signals').insert({
        call_id: call.id,
        sender_id: user.id,
        receiver_id: activeConversationUser.id,
        signal_type: 'offer',
        signal_data: offer,
      });

      console.log('📞 Call initiated');
    } catch (e) {
      console.error('❌ Failed to start call:', e);
      toast.error("Impossible de démarrer l'appel");
      setCallStatus('idle');
      setActiveCall(null);
      cleanupWebRTC();
    }
  };

  const acceptVoiceCall = async (call: VoiceCall) => {
    if (!user) return;

    try {
      setCallStatus('connecting');
      setActiveCall(call);
      setIncomingCall(null);

      // 1) Update call status
      await supabase.from('voice_calls')
        .update({ status: 'connected', started_at: new Date().toISOString() })
        .eq('id', call.id);

      // 2) Setup WebRTC
      const otherUserId = call.caller_id;
      await ensurePeerConnection(call.id, otherUserId);

      // 3) Get offer and create answer
      const { data: existingOffer } = await supabase
        .from('webrtc_signals')
        .select('*')
        .eq('call_id', call.id)
        .eq('signal_type', 'offer')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingOffer?.signal_data) {
        const pc = pcRef.current!;
        await pc.setRemoteDescription(existingOffer.signal_data);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await supabase.from('webrtc_signals').insert({
          call_id: call.id,
          sender_id: user.id,
          receiver_id: otherUserId,
          signal_type: 'answer',
          signal_data: answer,
        });

        setCallStatus('connected');
        console.log('📞 Call accepted');
      }
    } catch (e) {
      console.error('❌ Failed to accept call:', e);
      toast.error("Erreur lors de l'acceptation");
      setCallStatus('idle');
      setActiveCall(null);
      cleanupWebRTC();
    }
  };

  const declineVoiceCall = async (call: VoiceCall) => {
    try {
      await supabase.from('voice_calls')
        .update({ status: 'missed', ended_at: new Date().toISOString() })
        .eq('id', call.id);
    } catch {}
    setIncomingCall(null);
    setCallStatus('idle');
  };

  const hangupVoiceCall = async () => {
    if (!activeCall) return;

    try {
      await supabase.from('voice_calls')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', activeCall.id);
    } catch {}

    setActiveCall(null);
    setIncomingCall(null);
    setCallStatus('idle');
    cleanupWebRTC();
  };

  const toggleMute = () => {
    const s = localStreamRef.current;
    if (!s) return;
    const enabled = isMuted; // si muted=true -> on veut réactiver
    s.getAudioTracks().forEach(t => (t.enabled = enabled));
    setIsMuted(!isMuted);
    setMicrophoneActive(enabled);
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
  const openConversation = (otherUser: ConversationUser) => {
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
        // Mettre à jour created_at pour permettre de "masquer à nouveau" (reset des messages)
        const { error: updateError } = await supabase
          .from('hidden_conversations')
          .update({ created_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('hidden_user_id', odId);

        if (updateError) {
          console.error('❌ Erreur lors de la mise à jour de la suppression:', updateError);
          toast.error('Erreur lors de la suppression');
          // Recharger pour annuler le changement visuel
          loadConversations();
          return;
        }

        toast.success('Conversation masquée à nouveau.');
        // Si la conversation masquée est celle actuellement ouverte, vider les messages pour la rendre vierge
        if (activeConversation === odId) {
          setPrivateMessages([]);
          setNewPrivateMessage('');
          setPrivateImagePreview(null);
          setPrivateImageFile(null);
        }
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
      // Si la conversation supprimée est celle actuellement ouverte, vider les messages pour la rendre vierge
      if (activeConversation === odId) {
        setPrivateMessages([]);
        setNewPrivateMessage('');
        setPrivateImagePreview(null);
        setPrivateImageFile(null);
      }
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

  const acceptFriendRequestFromProfile = async () => {
    if (!viewingProfile || !user?.id) return;
    const { data } = await supabase
      .from('friendships')
      .select('id')
      .eq('requester_id', viewingProfile.id)
      .eq('addressee_id', user.id)
      .single();
    if (data) acceptFriendRequest(data.id, viewingProfile.id);
  };

  const rejectFriendRequestFromProfile = async () => {
    if (!viewingProfile || !user?.id) return;
    const { data } = await supabase
      .from('friendships')
      .select('id')
      .eq('requester_id', viewingProfile.id)
      .eq('addressee_id', user.id)
      .single();
    if (data) rejectFriendRequest(data.id);
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

      <LightboxModal imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />

      <ProfileModal
        show={showProfileModal}
        isClosing={closingProfileModal}
        onClose={closeProfileModal}
        profileModalRef={profileModalRef}
        loadingProfile={loadingProfile}
        viewingProfile={viewingProfile}
        currentUser={user}
        friendshipStatus={friendshipStatus}
        sendingFriendRequest={sendingFriendRequest}
        onSendFriendRequest={sendFriendRequest}
        onAcceptFriendRequest={acceptFriendRequestFromProfile}
        onRejectFriendRequest={rejectFriendRequestFromProfile}
        onRemoveFriend={removeFriend}
        onStartConversation={startConversationFromProfile}
      />

      <FriendsModal
        show={showFriendsModal}
        isClosing={closingFriendsModal}
        onClose={closeFriendsModal}
        currentUser={user}
        friendRequests={friendRequests}
        friends={friends}
        loadingFriends={loadingFriends}
        onAcceptFriendRequest={acceptFriendRequest}
        onRejectFriendRequest={rejectFriendRequest}
        onViewProfile={(userId) => {
          closeFriendsModal();
          handleViewProfile(userId);
        }}
        onStartConversation={(friend) => {
          closeFriendsModal();
          setShowMessagesModal(true);
          openConversation({
            id: friend.id,
            username: friend.username,
            color: friend.color,
            avatar_url: friend.avatar_url,
            last_seen: friend.last_seen,
          });
        }}
        onRemoveFriend={removeFriend}
      />

      <OnlineUsersModal
        show={showOnlineUsersModal}
        isClosing={closingOnlineUsersModal}
        onClose={closeOnlineUsersModal}
        loadingOnlineUsers={loadingOnlineUsers}
        onlineUsers={onlineUsers}
        onViewProfile={(userId) => {
          handleViewProfile(userId);
          closeOnlineUsersModal();
        }}
        onSendFriendRequest={sendFriendRequest}
      />

      <PrivateMessagesModal
        show={showMessagesModal}
        isClosing={closingMessagesModal}
        onClose={closeMessagesModal}
        activeConversation={activeConversation}
        activeConversationUser={activeConversationUser}
        onBackToConversations={() => {
          setActiveConversation(null);
          setActiveConversationUser(null);
          loadConversations();
        }}
        onStartVoiceCall={startVoiceCall}
        incomingCallLabel={incomingCall ? 'Appel entrant…' : null}
        onAcceptIncomingCall={() => {
          if (incomingCall) acceptVoiceCall(incomingCall);
        }}
        onDeclineIncomingCall={() => {
          if (incomingCall) declineVoiceCall(incomingCall);
        }}
        callStatusLabel={
          activeCall && callStatus !== 'idle'
            ? callStatus === 'calling'
              ? 'Appel en cours…'
              : callStatus === 'ringing'
                ? 'Ça sonne…'
                : callStatus === 'connecting'
                  ? 'Connexion en cours…'
                  : 'En appel'
            : null
        }
        audioNeedsInteraction={audioNeedsInteraction}
        onActivateAudio={() => {
          if (remoteAudioRef.current) {
            remoteAudioRef.current
              .play()
              .then(() => {
                console.log('🎧 Manual audio play successful');
                setAudioNeedsInteraction(false);
              })
              .catch((e) => {
                console.error('❌ Manual audio play failed:', e);
              });
          }
        }}
        isMuted={isMuted}
        microphoneActive={microphoneActive}
        onToggleMute={toggleMute}
        onHangupCall={hangupVoiceCall}
        remoteAudioRef={remoteAudioRef}
        privateMessagesContainerRef={privateMessagesContainerRef}
        privateMessagesEndRef={privateMessagesEndRef}
        loadingPrivateMessages={loadingPrivateMessages}
        privateMessages={privateMessages}
        privateTypingUser={privateTypingUser}
        currentUserId={user?.id}
        lightboxImageSetter={(imageUrl) => setLightboxImage(imageUrl)}
        privateImagePreview={privateImagePreview}
        hasPrivateImage={Boolean(privateImageFile)}
        onCancelPrivateImage={cancelPrivateImage}
        privateImageInputRef={privateImageInputRef}
        onPrivateImageSelect={handlePrivateImageSelect}
        sendingPrivateImage={sendingPrivateImage}
        newPrivateMessage={newPrivateMessage}
        onNewPrivateMessageChange={setNewPrivateMessage}
        onPrivateTyping={handlePrivateTyping}
        onStopPrivateTyping={stopPrivateTyping}
        onSendPrivateMessage={sendPrivateMessage}
        conversations={conversations}
        typingInConversations={typingInConversations}
        loadingConversations={loadingConversations}
        onOpenConversation={openConversation}
        onDeleteConversation={deleteConversation}
      />
      
      <HeaderBar
        user={user}
        showUserMenu={showUserMenu}
        isClosingMenu={isClosingMenu}
        userMenuRef={userMenuRef}
        onToggleUserMenu={() => setShowUserMenu(!showUserMenu)}
        isEditingUsername={isEditingUsername}
        editingUsername={editingUsername}
        onEditingUsernameChange={setEditingUsername}
        isUpdatingUsername={isUpdatingUsername}
        onStartEditingUsername={startEditingUsername}
        onUpdateUsername={handleUpdateUsername}
        onCancelEditingUsername={cancelEditingUsername}
        isEditingColor={isEditingColor}
        editingColor={editingColor}
        onEditingColorChange={setEditingColor}
        isUpdatingColor={isUpdatingColor}
        onStartEditingColor={startEditingColor}
        onUpdateColor={handleUpdateColor}
        onCancelEditingColor={cancelEditingColor}
        avatarInputRef={avatarInputRef}
        onAvatarUpload={handleAvatarUpload}
        isUploadingAvatar={isUploadingAvatar}
        isEditingBio={isEditingBio}
        editingBio={editingBio}
        onEditingBioChange={setEditingBio}
        isUpdatingBio={isUpdatingBio}
        onStartEditingBio={startEditingBio}
        onUpdateBio={handleUpdateBio}
        onCancelEditingBio={cancelEditingBio}
        onLogout={handleLogout}
        onOpenFriends={() => {
          setShowFriendsModal(true);
          loadFriends();
        }}
        friendRequestsCount={friendRequests.length}
        onOpenMessages={openMessagesModal}
        unreadMessagesCount={unreadMessagesCount}
        onOpenOnlineUsers={() => {
          setShowOnlineUsersModal(true);
          loadOnlineUsers();
        }}
        onlineUsersCount={onlineUsers.length}
      />

      {/* Contenu principal */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg animate-fade-in">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <MessageComposer
          newMessage={newMessage}
          onNewMessageChange={setNewMessage}
          onTyping={handleTyping}
          onSubmit={handleSubmit}
          textareaRef={textareaRef}
          imagePreview={imagePreview}
          onRemoveImage={removeImage}
          showEmojiPicker={showEmojiPicker}
          onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
          onEmojiSelect={handleEmojiSelect}
          emojiPickerRef={emojiPickerRef}
          onImageSelect={handleImageSelect}
          imageRequired={!imageFile}
        />

        <TypingIndicator usersTyping={usersTyping} />

        <MessageList
          loadingMessages={loadingMessages}
          messages={messages}
          onViewProfile={handleViewProfile}
          editingMessageId={editingMessageId}
          editingMessageText={editingMessageText}
          onEditingMessageTextChange={setEditingMessageText}
          onUpdateMessage={handleUpdateMessage}
          onCancelEditMessage={handleCancelEditMessage}
          onStartEditMessage={handleStartEditMessage}
          onDeleteMessage={handleDelete}
          onLike={handleLike}
          onToggleComments={handleComment}
          commentingMessageId={commentingMessageId}
          closingMessageId={closingMessageId}
          loadingComments={loadingComments}
          commentairesByMessage={commentairesByMessage}
          newComment={newComment}
          onNewCommentChange={setNewComment}
          onSubmitComment={handleCommentSubmit}
          currentUser={user}
          lightboxImageSetter={(imageUrl) => setLightboxImage(imageUrl)}
        />
      </main>
    </div>
  );
};

export default Page;
