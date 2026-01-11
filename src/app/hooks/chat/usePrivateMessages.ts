'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { supabase } from './shared';
import {
  Conversation,
  ConversationUser,
  PrivateMessage,
  User,
} from '../../types/chat';

type UsePrivateMessagesParams = {
  isAuthenticated: boolean;
  user: User | null;
};

export const usePrivateMessages = ({ isAuthenticated, user }: UsePrivateMessagesParams) => {
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [closingMessagesModal, setClosingMessagesModal] = useState(false);
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
  const privateMessagesEndRef = useRef<HTMLDivElement>(null);
  const privateMessagesContainerRef = useRef<HTMLDivElement>(null);
  const activeConversationRef = useRef<string | null>(null);
  const [privateTypingUser, setPrivateTypingUser] = useState<string | null>(null);
  const [typingInConversations, setTypingInConversations] = useState<Record<string, string>>({});
  const typingInConversationsTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const privateTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const privateTypingBroadcastRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  const closeMessagesModal = () => {
    setClosingMessagesModal(true);
    setTimeout(() => {
      setShowMessagesModal(false);
      setClosingMessagesModal(false);
      setActiveConversation(null);
      setActiveConversationUser(null);
    }, 200);
  };

  const handlePrivateImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont autorisées');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setPrivateImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPrivateImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const cancelPrivateImage = () => {
    setPrivateImageFile(null);
    setPrivateImagePreview(null);
    if (privateImageInputRef.current) {
      privateImageInputRef.current.value = '';
    }
  };

  const scrollToBottomPrivate = useCallback((smooth = true) => {
    if (privateMessagesContainerRef.current) {
      privateMessagesContainerRef.current.scrollTop = privateMessagesContainerRef.current.scrollHeight;
    }
    if (privateMessagesEndRef.current) {
      privateMessagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  useEffect(() => {
    scrollToBottomPrivate(true);
  }, [privateMessages, privateTypingUser, scrollToBottomPrivate]);

  useEffect(() => {
    if (activeConversation) {
      setTimeout(() => {
        scrollToBottomPrivate(false);
      }, 150);
    }
  }, [activeConversation, scrollToBottomPrivate]);

  useEffect(() => {
    if (!loadingPrivateMessages && privateMessages.length > 0) {
      setTimeout(() => {
        scrollToBottomPrivate(false);
      }, 50);
    }
  }, [loadingPrivateMessages, privateMessages.length, scrollToBottomPrivate]);

  const loadConversations = async () => {
    if (!user) return;
    setLoadingConversations(true);

    try {
      const { data: hiddenData } = await supabase
        .from('hidden_conversations')
        .select('hidden_user_id, created_at')
        .eq('user_id', user.id);

      const resetDates = new Map(hiddenData?.map(h => [h.hidden_user_id, new Date(h.created_at)]) || []);

      const { data: messages, error } = await supabase
        .from('private_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const otherUserIds = new Set<string>();
      messages?.forEach(msg => {
        const odId = msg.sender_id !== user.id ? msg.sender_id : msg.receiver_id;
        const resetDate = resetDates.get(odId);
        if (!resetDate || new Date(msg.created_at) > resetDate) {
          otherUserIds.add(odId);
        }
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, color, avatar_url, last_seen')
        .in('id', Array.from(otherUserIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const conversationMap = new Map<string, Conversation>();
      let totalUnread = 0;

      messages?.forEach((msg) => {
        const otherUserId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherUserProfile = profileMap.get(otherUserId);
        if (!otherUserProfile) return;

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

        if (msg.receiver_id === user.id && !msg.read) {
          const conv = conversationMap.get(otherUserId)!;
          conv.unreadCount++;
          totalUnread++;
        }
      });

      setConversations(Array.from(conversationMap.values()));
      setUnreadMessagesCount(totalUnread);
    } catch (err) {
      console.error('Erreur chargement conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      loadConversations();
    }
  }, [isAuthenticated, user]);

  const loadPrivateMessages = async (otherUserId: string) => {
    if (!user) return;
    setLoadingPrivateMessages(true);

    try {
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

      if (resetData?.created_at) {
        query = query.gt('created_at', resetData.created_at);
      }

      const { data, error } = await query.order('created_at', { ascending: true });
      if (error) throw error;

      setPrivateMessages(data || []);

      await supabase
        .from('private_messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherUserId)
        .eq('read', false);

      setConversations(prev => prev.map(c =>
        c.odId === otherUserId ? { ...c, unreadCount: 0 } : c
      ));

      setUnreadMessagesCount(prev => {
        const conv = conversations.find(c => c.odId === otherUserId);
        return prev - (conv?.unreadCount || 0);
      });
    } catch (err) {
      console.error('Erreur chargement messages prives:', err);
    } finally {
      setLoadingPrivateMessages(false);
    }
  };

  const openConversation = (otherUser: ConversationUser) => {
    setActiveConversation(otherUser.id);
    setActiveConversationUser(otherUser);
    loadPrivateMessages(otherUser.id);
    cancelPrivateImage();
  };

  const openMessagesModal = () => {
    setShowMessagesModal(true);
    setActiveConversation(null);
    setActiveConversationUser(null);
    loadConversations();
    cancelPrivateImage();
  };

  const deleteConversation = async (odId: string) => {
    if (!user) return;

    setConversations(prev => prev.filter(c => c.odId !== odId));

    try {
      const { data: existingEntry, error: fetchError } = await supabase
        .from('hidden_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('hidden_user_id', odId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Erreur verification existence:', fetchError);
        toast.error('Erreur lors de la suppression');
        return;
      }

      if (existingEntry) {
        const { error: updateError } = await supabase
          .from('hidden_conversations')
          .update({ created_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('hidden_user_id', odId);

        if (updateError) {
          console.error('Erreur mise a jour suppression:', updateError);
          toast.error('Erreur lors de la suppression');
          loadConversations();
          return;
        }

        toast.success('Conversation masquee a nouveau.');
        if (activeConversation === odId) {
          setPrivateMessages([]);
          setNewPrivateMessage('');
          setPrivateImagePreview(null);
          setPrivateImageFile(null);
        }
        return;
      }

      const { error } = await supabase
        .from('hidden_conversations')
        .upsert({
          user_id: user.id,
          hidden_user_id: odId
        });

      if (error) throw error;
      toast.success('Conversation supprimee');
      if (activeConversation === odId) {
        setPrivateMessages([]);
        setNewPrivateMessage('');
        setPrivateImagePreview(null);
        setPrivateImageFile(null);
      }
    } catch (err) {
      console.error('Erreur suppression conversation:', err);
      toast.error('Erreur lors de la suppression');
      loadConversations();
    }
  };

  const sendPrivateMessage = async () => {
    if (!user || !activeConversation || (!newPrivateMessage.trim() && !privateImageFile)) return;

    const messageContent = newPrivateMessage.trim();
    setNewPrivateMessage('');

    let imageUrl: string | null = null;

    try {
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
      console.error('Erreur envoi message prive:', err);
      toast.error('Erreur lors de l\'envoi du message');
      setNewPrivateMessage(messageContent);
    } finally {
      setSendingPrivateImage(false);
    }
  };

  const handlePrivateTyping = useCallback(() => {
    if (!user || !activeConversation || !activeConversationUser) return;

    supabase.channel('private-typing-indicator').send({
      type: 'broadcast',
      event: 'private_typing',
      payload: {
        senderId: user.id,
        senderUsername: user.name,
        receiverId: activeConversation
      }
    });

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

  useEffect(() => {
    if (!isAuthenticated || !user) return;

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
          const newMessage = payload.new as PrivateMessage;

          if (newMessage.receiver_id !== user.id) {
            return;
          }

          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('id, username, color, avatar_url, last_seen')
            .eq('id', newMessage.sender_id)
            .single();

          const currentActiveConversation = activeConversationRef.current;

          if (currentActiveConversation === newMessage.sender_id) {
            setPrivateMessages(prev => [...prev, newMessage]);

            await supabase
              .from('private_messages')
              .update({ read: true })
              .eq('id', newMessage.id);
          } else {
            setUnreadMessagesCount(prev => prev + 1);

            const notifMessage = newMessage.image_url
              ? '📷 Image'
              : `${newMessage.message.substring(0, 50)}${newMessage.message.length > 50 ? '...' : ''}`;

            toast.info(`📩 ${senderProfile?.username || 'Quelqu\'un'}: ${notifMessage}`, {
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
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const privateTypingChannel = supabase
      .channel('private-typing-indicator')
      .on('broadcast', { event: 'private_typing' }, ({ payload }) => {
        if (payload.receiverId === user.id && payload.senderId !== user.id) {
          setTypingInConversations(prev => ({
            ...prev,
            [payload.senderId]: payload.senderUsername
          }));

          if (typingInConversationsTimeouts.current[payload.senderId]) {
            clearTimeout(typingInConversationsTimeouts.current[payload.senderId]);
          }

          typingInConversationsTimeouts.current[payload.senderId] = setTimeout(() => {
            setTypingInConversations(prev => {
              const newState = { ...prev };
              delete newState[payload.senderId];
              return newState;
            });
            delete typingInConversationsTimeouts.current[payload.senderId];
          }, 2500);

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
          if (typingInConversationsTimeouts.current[payload.senderId]) {
            clearTimeout(typingInConversationsTimeouts.current[payload.senderId]);
            delete typingInConversationsTimeouts.current[payload.senderId];
          }
          setTypingInConversations(prev => {
            const newState = { ...prev };
            delete newState[payload.senderId];
            return newState;
          });

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

  return {
    activeConversation,
    activeConversationUser,
    closingMessagesModal,
    closeMessagesModal,
    conversations,
    deleteConversation,
    handlePrivateImageSelect,
    handlePrivateTyping,
    loadConversations,
    loadPrivateMessages,
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
  };
};
