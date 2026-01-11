export interface User {
  id: string;
  name: string;
  color?: string;
  avatar_url?: string;
  bio?: string;
  last_seen?: string | null;
}

export interface Message {
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

export interface Commentaire {
  id: number;
  message_id: number;
  user_id: string;
  commentaire: string;
  username?: string;
  user_color?: string;
  avatar_url?: string;
}

export interface ProfileData {
  id: string;
  username: string;
  color: string;
  avatar_url: string | null;
  bio: string | null;
  last_seen: string | null;
  isFriend?: boolean;
}

export interface FriendRequest {
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

export interface Friend {
  id: string;
  username: string;
  color: string;
  avatar_url: string | null;
  bio: string | null;
  last_seen: string | null;
}

export interface PrivateMessage {
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

export interface Conversation {
  odId: string;
  odUsername: string;
  odColor: string;
  odAvatar: string | null;
  odLastSeen: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface ConversationUser {
  id: string;
  username: string;
  color: string;
  avatar_url: string | null;
  last_seen?: string | null;
}

export interface VoiceCall {
  id: string;
  caller_id: string;
  receiver_id: string;
  status: 'calling' | 'ringing' | 'connected' | 'ended' | 'missed';
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface WebRTCSignal {
  id: string;
  call_id: string;
  sender_id: string;
  receiver_id: string;
  signal_type: 'offer' | 'answer' | 'ice_candidate';
  signal_data: RTCSessionDescriptionInit | RTCIceCandidateInit | null;
  created_at: string;
}

export type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted';
