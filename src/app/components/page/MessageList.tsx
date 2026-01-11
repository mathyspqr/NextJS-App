import type { FormEvent } from 'react';
import { FaArrowRight, FaCheck, FaEdit, FaHeart, FaRegHeart, FaTimes, FaTrash } from 'react-icons/fa';

import OnlineStatusIndicator from '../UI/OnlineStatusIndicator';
import { Commentaire, Message, User } from '../../types/chat';

interface MessageListProps {
  loadingMessages: boolean;
  messages: Message[];
  onViewProfile: (userId: string) => void;
  editingMessageId: number | null;
  editingMessageText: string;
  onEditingMessageTextChange: (value: string) => void;
  onUpdateMessage: (messageId: number) => void;
  onCancelEditMessage: () => void;
  onStartEditMessage: (message: Message) => void;
  onDeleteMessage: (messageId: number) => void;
  onLike: (messageId: number, liked: boolean) => void;
  onToggleComments: (messageId: number) => void;
  commentingMessageId: number | null;
  closingMessageId: number | null;
  loadingComments: Record<number, boolean>;
  commentairesByMessage: Record<number, Commentaire[]>;
  newComment: string;
  onNewCommentChange: (value: string) => void;
  onSubmitComment: (event: FormEvent<HTMLFormElement>, messageId: number) => void;
  currentUser: User | null;
  lightboxImageSetter: (imageUrl: string) => void;
}

const MessageList = ({
  loadingMessages,
  messages,
  onViewProfile,
  editingMessageId,
  editingMessageText,
  onEditingMessageTextChange,
  onUpdateMessage,
  onCancelEditMessage,
  onStartEditMessage,
  onDeleteMessage,
  onLike,
  onToggleComments,
  commentingMessageId,
  closingMessageId,
  loadingComments,
  commentairesByMessage,
  newComment,
  onNewCommentChange,
  onSubmitComment,
  currentUser,
  lightboxImageSetter,
}: MessageListProps) => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold text-gray-800 mb-6">💬 Messages</h2>
    {loadingMessages ? (
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
              borderLeftColor: item.user_color || '#3B82F6',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div
                  className="flex items-center space-x-3 mb-2 cursor-pointer group"
                  onClick={() => onViewProfile(item.user_id)}
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

                {editingMessageId === item.id ? (
                  <div className="space-y-2 mb-2">
                    <textarea
                      value={editingMessageText}
                      onChange={(e) => onEditingMessageTextChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onUpdateMessage(item.id)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <FaCheck size={14} />
                        <span>Enregistrer</span>
                      </button>
                      <button
                        onClick={onCancelEditMessage}
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
                      {item.edited && <span className="text-xs text-gray-500 ml-2">(modifié)</span>}
                    </p>
                  )
                )}

                {item.image_url && (
                  <div className="mt-2">
                    <img
                      src={item.image_url}
                      alt="Message image"
                      className="max-w-md rounded-lg border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity"
                      onClick={() => lightboxImageSetter(item.image_url!)}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 self-end sm:self-center">
                <button
                  onClick={() => onLike(item.id, item.liked)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    item.liked ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                  title="J'aime"
                >
                  {item.liked ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
                </button>

                <button
                  onClick={() => onToggleComments(item.id)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    commentingMessageId === item.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600 hover:bg-blue-50'
                  }`}
                  title="Commentaires"
                >
                  <FaArrowRight
                    size={18}
                    className={
                      commentingMessageId === item.id ? 'rotate-90 transition-transform duration-200' : 'transition-transform duration-200'
                    }
                  />
                </button>

                {item.user_id === currentUser?.id && (
                  <>
                    <button
                      onClick={() => onStartEditMessage(item)}
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700 transition-all duration-200"
                      title="Modifier"
                    >
                      <FaEdit size={16} />
                    </button>

                    <button
                      onClick={() => onDeleteMessage(item.id)}
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
              <div
                className={`mt-6 pt-6 border-t border-gray-200 ${
                  closingMessageId === item.id ? 'animate-fade-out' : 'animate-fade-in'
                }`}
              >
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
                            borderLeftColor: commentaire.user_color || '#10B981',
                          }}
                        >
                          <div
                            className="flex items-center space-x-2 mb-1 cursor-pointer group"
                            onClick={() => onViewProfile(commentaire.user_id)}
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

                <form onSubmit={(e) => onSubmitComment(e, item.id)} className="space-y-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => onNewCommentChange(e.target.value)}
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
      </div>
    )}
  </div>
);

export default MessageList;
