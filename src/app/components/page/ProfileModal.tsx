import type { RefObject } from 'react';
import { FaCheck, FaEnvelope, FaTimes, FaUserCheck, FaUserPlus } from 'react-icons/fa';

import OnlineStatusIndicator from '../UI/OnlineStatusIndicator';
import { FriendshipStatus, ProfileData, User } from '../../types/chat';

interface ProfileModalProps {
  show: boolean;
  isClosing: boolean;
  onClose: () => void;
  profileModalRef: RefObject<HTMLDivElement>;
  loadingProfile: boolean;
  viewingProfile: ProfileData | null;
  currentUser: User | null;
  friendshipStatus: FriendshipStatus;
  sendingFriendRequest: boolean;
  onSendFriendRequest: (userId: string) => void;
  onAcceptFriendRequest: () => void;
  onRejectFriendRequest: () => void;
  onRemoveFriend: (userId: string) => void;
  onStartConversation: () => void;
}

const ProfileModal = ({
  show,
  isClosing,
  onClose,
  profileModalRef,
  loadingProfile,
  viewingProfile,
  currentUser,
  friendshipStatus,
  sendingFriendRequest,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onRemoveFriend,
  onStartConversation,
}: ProfileModalProps) => {
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
        ref={profileModalRef}
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 ${
          isClosing ? 'animate-fade-out' : 'animate-scale-in'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {loadingProfile ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Chargement du profil...</p>
          </div>
        ) : viewingProfile ? (
          <>
            <div
              className="h-24 relative rounded-t-2xl"
              style={{ backgroundColor: viewingProfile.color || '#3B82F6' }}
            >
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/20 rounded-full p-2 transition-colors"
              >
                <FaTimes size={16} />
              </button>
            </div>

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
                {viewingProfile.id !== currentUser?.id && (
                  <div className="absolute bottom-0 right-0">
                    <OnlineStatusIndicator
                      lastSeen={viewingProfile.last_seen}
                      size="lg"
                      showOfflineAsOrange={true}
                      className="border-2 border-white"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 text-center">
              <h2
                className="text-2xl font-bold mb-1"
                style={{ color: viewingProfile.color || '#3B82F6' }}
              >
                {viewingProfile.username || 'Utilisateur'}
              </h2>

              {viewingProfile.id === currentUser?.id && (
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

              {viewingProfile.id !== currentUser?.id && (
                <div className="mt-4">
                  {friendshipStatus === 'none' && (
                    <button
                      onClick={() => onSendFriendRequest(viewingProfile.id)}
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
                      <p className="text-sm text-gray-500 text-center mb-2">
                        Cette personne vous a envoyé une demande
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={onAcceptFriendRequest}
                          className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                        >
                          <FaCheck size={14} />
                          <span>Accepter</span>
                        </button>
                        <button
                          onClick={onRejectFriendRequest}
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
                          onClick={onStartConversation}
                          className="ml-2 p-2 text-green-600 hover:text-purple-500 hover:bg-purple-50 rounded-full transition-colors"
                          title="Envoyer un message"
                        >
                          <FaEnvelope size={16} />
                        </button>
                      </div>
                      <button
                        onClick={() => onRemoveFriend(viewingProfile.id)}
                        className="w-full py-2 text-red-500 hover:text-red-600 text-sm transition-colors"
                      >
                        Retirer des amis
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={onClose}
                className="mt-4 w-full py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ProfileModal;
