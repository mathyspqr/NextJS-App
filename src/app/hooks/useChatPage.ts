'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';

import { createClient } from '../utils/supabase/client';
import { ONLINE_THRESHOLD_MS } from '../constants/onlineStatus';
import { usePrivateMessages } from './chat/usePrivateMessages';
import { useVoiceCalls } from './chat/useVoiceCalls';
import {
  Commentaire,
  Friend,
  FriendRequest,
  FriendshipStatus,
  Message,
  ProfileData,
  User,
} from '../types/chat';

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

export const useChatPage = () => {  const [user, setUser] = useState<User | null>(null);
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
  const [showOnlineUsersModal, setShowOnlineUsersModal] = useState(false);
  const [closingOnlineUsersModal, setClosingOnlineUsersModal] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<ProfileData[]>([]);
  const [loadingOnlineUsers, setLoadingOnlineUsers] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
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
  const {
    activeConversation,
    activeConversationUser,
    closingMessagesModal,
    closeMessagesModal,
    conversations,
    deleteConversation,
    handlePrivateImageSelect,
    handlePrivateTyping,
    loadConversations,
    loadingConversations,
    loadingPrivateMessages,
    newPrivateMessage,
    openConversation,
    openMessagesModal,
    privateImageFile,
    privateImageInputRef,
    privateImagePreview,
    privateMessages,
    privateMessagesContainerRef,
    privateMessagesEndRef,
    privateTypingUser,
    sendPrivateMessage,
    sendingPrivateImage,
    setActiveConversation,
    setActiveConversationUser,
    setConversations,
    setNewPrivateMessage,
    setPrivateImageFile,
    setPrivateImagePreview,
    setPrivateMessages,
    setShowMessagesModal,
    showMessagesModal,
    stopPrivateTyping,
    typingInConversations,
    unreadMessagesCount,
    cancelPrivateImage,
  } = usePrivateMessages({ isAuthenticated, user });
  const {
    acceptVoiceCall,
    activateAudio,
    activeCall,
    audioNeedsInteraction,
    callStatus,
    declineVoiceCall,
    hangupVoiceCall,
    incomingCall,
    isMuted,
    microphoneActive,
    remoteAudioRef,
    startVoiceCall,
    toggleMute,
  } = useVoiceCalls({ activeConversationUser, isAuthenticated, user });

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

      const { error: messagesError } = await supabase
        .from('private_messages')
        .delete()
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`);

      if (messagesError) {
        console.error('Erreur lors de la suppression des messages:', messagesError);
      }

      setConversations(prev => prev.filter(c => c.odId !== friendId));

      if (activeConversation === friendId) {
        setActiveConversation(null);
        setActiveConversationUser(null);
        setPrivateMessages([]);
        setNewPrivateMessage('');
        setPrivateImagePreview(null);
        setPrivateImageFile(null);
      }

      toast.success('Ami et conversation supprim�s');
      setFriends(prev => prev.filter(f => f.id !== friendId));

      if (viewingProfile?.id === friendId) {
        setFriendshipStatus('none');
      }
    } catch (err) {
      console.error('Erreur suppression ami:', err);
      toast.error('Erreur lors de la suppression');
    }
  };
  // ✅ Ouvrir la modale amis
  // const openFriendsModal = () => {
  //   setShowFriendsModal(true);
  //   loadFriends();
  // };

  // ✅ Charger les conversations
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

  const handleLogin = (u: User) => {
    setIsAuthenticated(true);
    setUser(u);
  };

  return {
    activeCall,
    activeConversation,
    activeConversationUser,
    audioNeedsInteraction,
    avatarInputRef,
    callStatus,
    closingFriendsModal,
    closingMessagesModal,
    closingOnlineUsersModal,
    closingProfileModal,
    closeFriendsModal,
    closeMessagesModal,
    closeOnlineUsersModal,
    closeProfileModal,
    closeUserMenu,
    commentairesByMessage,
    commentingMessageId,
    closingMessageId,
    conversations,
    deleteConversation,
    editingBio,
    editingColor,
    editingMessageId,
    editingMessageText,
    editingUsername,
    emojiPickerRef,
    error,
    friendRequests,
    friendshipStatus,
    friends,
    handleAvatarUpload,
    handleCancelEditMessage,
    handleComment,
    handleCommentSubmit,
    handleDelete,
    handleEmojiSelect,
    handleImageSelect,
    handleLike,
    handleLogin,
    handleLogout,
    handlePrivateImageSelect,
    handlePrivateTyping,
    handleStartEditMessage,
    handleSubmit,
    handleTyping,
    handleUpdateBio,
    handleUpdateColor,
    handleUpdateMessage,
    handleUpdateUsername,
    handleViewProfile,
    hangupVoiceCall,
    imageFile,
    imagePreview,
    incomingCall,
    isAuthenticated,
    isClosingMenu,
    isEditingBio,
    isEditingColor,
    isEditingUsername,
    isMuted,
    isUpdatingBio,
    isUpdatingColor,
    isUpdatingUsername,
    isUploadingAvatar,
    lightboxImage,
    loadingComments,
    loadingConversations,
    loadingFriends,
    loadingMessages,
    loadingOnlineUsers,
    loadingPrivateMessages,
    loadingProfile,
    loadConversations,
    loadFriends,
    loadOnlineUsers,
    messages,
    microphoneActive,
    newComment,
    newMessage,
    newPrivateMessage,
    onlineUsers,
    openConversation,
    openMessagesModal,
    privateImageFile,
    privateImageInputRef,
    privateImagePreview,
    privateMessages,
    privateMessagesContainerRef,
    privateMessagesEndRef,
    privateTypingUser,
    profileModalRef,
    remoteAudioRef,
    removeFriend,
    removeImage,
    sendFriendRequest,
    sendPrivateMessage,
    setActiveConversation,
    setActiveConversationUser,
    setEditingBio,
    setEditingColor,
    setEditingMessageText,
    setEditingUsername,
    setLightboxImage,
    setNewComment,
    setNewMessage,
    setNewPrivateMessage,
    setShowEmojiPicker,
    setShowFriendsModal,
    setShowMessagesModal,
    setShowOnlineUsersModal,
    setShowUserMenu,
    showConfetti,
    showEmojiPicker,
    showFriendsModal,
    showMessagesModal,
    showOnlineUsersModal,
    showProfileModal,
    showUserMenu,
    sendingFriendRequest,
    sendingPrivateImage,
    startConversationFromProfile,
    startEditingBio,
    startEditingColor,
    startEditingUsername,
    startVoiceCall,
    stopPrivateTyping,
    textareaRef,
    toggleMute,
    typingInConversations,
    unreadMessagesCount,
    user,
    userMenuRef,
    usersTyping,
    viewingProfile,
    acceptFriendRequest,
    acceptFriendRequestFromProfile,
    acceptVoiceCall,
    activateAudio,
    cancelEditingBio,
    cancelEditingColor,
    cancelEditingUsername,
    cancelPrivateImage,
    declineVoiceCall,
    rejectFriendRequest,
    rejectFriendRequestFromProfile,
  };
};











