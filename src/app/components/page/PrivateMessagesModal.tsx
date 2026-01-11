import type { ChangeEvent, RefObject } from 'react';
import { FaChevronLeft, FaEnvelope, FaImage, FaPaperPlane, FaTimes, FaTrash } from 'react-icons/fa';

import OnlineStatusIndicator from '../UI/OnlineStatusIndicator';
import { Conversation, ConversationUser, PrivateMessage } from '../../types/chat';

interface PrivateMessagesModalProps {
  show: boolean;
  isClosing: boolean;
  onClose: () => void;
  activeConversation: string | null;
  activeConversationUser: ConversationUser | null;
  onBackToConversations: () => void;
  onStartVoiceCall: () => void;
  incomingCallLabel: string | null;
  onAcceptIncomingCall: () => void;
  onDeclineIncomingCall: () => void;
  callStatusLabel: string | null;
  audioNeedsInteraction: boolean;
  onActivateAudio: () => void;
  isMuted: boolean;
  microphoneActive: boolean;
  onToggleMute: () => void;
  onHangupCall: () => void;
  remoteAudioRef: RefObject<HTMLAudioElement>;
  privateMessagesContainerRef: RefObject<HTMLDivElement>;
  privateMessagesEndRef: RefObject<HTMLDivElement>;
  loadingPrivateMessages: boolean;
  privateMessages: PrivateMessage[];
  privateTypingUser: string | null;
  currentUserId: string | undefined;
  lightboxImageSetter: (imageUrl: string) => void;
  privateImagePreview: string | null;
  hasPrivateImage: boolean;
  onCancelPrivateImage: () => void;
  privateImageInputRef: RefObject<HTMLInputElement>;
  onPrivateImageSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  sendingPrivateImage: boolean;
  newPrivateMessage: string;
  onNewPrivateMessageChange: (value: string) => void;
  onPrivateTyping: () => void;
  onStopPrivateTyping: () => void;
  onSendPrivateMessage: () => void;
  conversations: Conversation[];
  typingInConversations: Record<string, string>;
  loadingConversations: boolean;
  onOpenConversation: (user: ConversationUser) => void;
  onDeleteConversation: (userId: string) => void;
}

const PrivateMessagesModal = ({
  show,
  isClosing,
  onClose,
  activeConversation,
  activeConversationUser,
  onBackToConversations,
  onStartVoiceCall,
  incomingCallLabel,
  onAcceptIncomingCall,
  onDeclineIncomingCall,
  callStatusLabel,
  audioNeedsInteraction,
  onActivateAudio,
  isMuted,
  microphoneActive,
  onToggleMute,
  onHangupCall,
  remoteAudioRef,
  privateMessagesContainerRef,
  privateMessagesEndRef,
  loadingPrivateMessages,
  privateMessages,
  privateTypingUser,
  currentUserId,
  lightboxImageSetter,
  privateImagePreview,
  hasPrivateImage,
  onCancelPrivateImage,
  privateImageInputRef,
  onPrivateImageSelect,
  sendingPrivateImage,
  newPrivateMessage,
  onNewPrivateMessageChange,
  onPrivateTyping,
  onStopPrivateTyping,
  onSendPrivateMessage,
  conversations,
  typingInConversations,
  loadingConversations,
  onOpenConversation,
  onDeleteConversation,
}: PrivateMessagesModalProps) => {
  if (!show && !isClosing) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[100] ${
        isClosing ? 'animate-fade-out' : 'animate-fade-in'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-hidden animate-scale-in flex flex-col ${
          isClosing ? 'animate-fade-out' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-500 to-purple-600">
          {activeConversation && activeConversationUser ? (
            <>
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBackToConversations}
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
                    <OnlineStatusIndicator
                      lastSeen={activeConversationUser.last_seen}
                      size="sm"
                      showOfflineAsOrange={true}
                      className="border-2 border-white"
                    />
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
          {activeConversation && activeConversationUser && (
            <button
              onClick={onStartVoiceCall}
              className="text-white/80 hover:text-white transition-colors mr-3"
              title="Appel vocal"
            >
              📞
            </button>
          )}

          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        <audio ref={remoteAudioRef} autoPlay playsInline />

        {incomingCallLabel && (
          <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200 flex items-center justify-between">
            <div className="text-sm text-yellow-800">{incomingCallLabel}</div>
            <div className="flex items-center gap-2">
              <button
                onClick={onAcceptIncomingCall}
                className="px-3 py-1 rounded-lg bg-green-600 text-white text-sm"
              >
                Accepter
              </button>
              <button
                onClick={onDeclineIncomingCall}
                className="px-3 py-1 rounded-lg bg-red-600 text-white text-sm"
              >
                Refuser
              </button>
            </div>
          </div>
        )}

        {callStatusLabel && (
          <div className="px-6 py-3 bg-purple-50 border-b border-purple-200 flex items-center justify-between">
            <div className="text-sm text-purple-800">
              {callStatusLabel}
              {audioNeedsInteraction && (
                <div className="mt-1 text-xs text-orange-600 font-medium">
                  🔊 Touchez l&apos;écran pour activer l&apos;audio
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {audioNeedsInteraction && (
                <button
                  onClick={onActivateAudio}
                  className="px-3 py-1 rounded-lg bg-orange-500 text-white text-sm hover:bg-orange-600"
                >
                  🔊 Activer audio
                </button>
              )}
              <button
                onClick={onToggleMute}
                className={`px-3 py-1 rounded-lg border text-sm flex items-center space-x-2 ${
                  isMuted ? 'bg-red-100 text-red-700 border-red-300' : 'bg-white text-gray-700 border-gray-300'
                }`}
              >
                <span>{isMuted ? '🔇' : '🎤'}</span>
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                {microphoneActive && !isMuted && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
              </button>
              <button onClick={onHangupCall} className="px-3 py-1 rounded-lg bg-red-600 text-white text-sm">
                Raccrocher
              </button>
            </div>
          </div>
        )}

        {activeConversation && activeConversationUser ? (
          <div className="flex flex-col flex-1 overflow-hidden">
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
                  <div key={msg.id} className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl ${
                        msg.sender_id === currentUserId
                          ? 'bg-purple-500 text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                      } ${msg.image_url ? 'p-1' : 'px-4 py-2'}`}
                    >
                      {msg.image_url && (
                        <img
                          src={msg.image_url}
                          alt="Image"
                          className="rounded-xl max-w-full max-h-64 object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                          onClick={() => lightboxImageSetter(msg.image_url!)}
                        />
                      )}
                      {msg.message && msg.message !== '📷 Image' && (
                        <p className={`break-words ${msg.image_url ? 'px-3 py-1' : ''}`}>{msg.message}</p>
                      )}
                      <p
                        className={`text-xs mt-1 ${msg.image_url ? 'px-3 pb-1' : ''} ${
                          msg.sender_id === currentUserId ? 'text-purple-200' : 'text-gray-400'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
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

            {privateImagePreview && (
              <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                <div className="relative inline-block">
                  <img src={privateImagePreview} alt="Preview" className="h-20 w-auto rounded-lg object-cover" />
                  <button
                    onClick={onCancelPrivateImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              </div>
            )}

            <div className="p-4 border-t border-gray-200 bg-white">
              <input
                type="file"
                ref={privateImageInputRef}
                onChange={onPrivateImageSelect}
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
                    onNewPrivateMessageChange(e.target.value);
                    if (e.target.value.trim()) {
                      onPrivateTyping();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onStopPrivateTyping();
                      onSendPrivateMessage();
                    }
                  }}
                  onBlur={onStopPrivateTyping}
                  placeholder="Écrivez un message..."
                  disabled={sendingPrivateImage}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                />
                <button
                  onClick={() => {
                    onStopPrivateTyping();
                    onSendPrivateMessage();
                  }}
                  disabled={(!newPrivateMessage.trim() && !hasPrivateImage) || sendingPrivateImage}
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
          <div className="overflow-y-auto flex-1 scrollbar-purple">
            {loadingConversations ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12">
                <FaEnvelope className="mx-auto mb-3 text-gray-300" size={48} />
                <p className="text-gray-500">Aucune conversation</p>
                <p className="text-sm text-gray-400 mt-1">
                  Cliquez sur le profil d&apos;un ami pour démarrer une conversation
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversations.map((conv) => (
                  <div key={conv.odId} className="group flex items-center hover:bg-gray-50 transition-colors">
                    <button
                      onClick={() =>
                        onOpenConversation({
                          id: conv.odId,
                          username: conv.odUsername,
                          color: conv.odColor,
                          avatar_url: conv.odAvatar,
                          last_seen: conv.odLastSeen,
                        })
                      }
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
                              month: '2-digit',
                            })}
                          </span>
                        </div>
                        {typingInConversations[conv.odId] ? (
                          <p className="text-sm text-purple-500 italic flex items-center">
                            <span>est en train d&apos;écrire</span>
                            <span className="flex ml-1 space-x-0.5">
                              <span
                                className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"
                                style={{ animationDelay: '0ms' }}
                              ></span>
                              <span
                                className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"
                                style={{ animationDelay: '150ms' }}
                              ></span>
                              <span
                                className="w-1 h-1 bg-purple-500 rounded-full animate-bounce"
                                style={{ animationDelay: '300ms' }}
                              ></span>
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.odId);
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
  );
};

export default PrivateMessagesModal;
