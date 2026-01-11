import { FaBell, FaCheck, FaEnvelope, FaTimes, FaUserFriends, FaUserMinus } from 'react-icons/fa';

import OnlineStatusIndicator from '../UI/OnlineStatusIndicator';
import { Friend, FriendRequest, User } from '../../types/chat';

interface FriendsModalProps {
  show: boolean;
  isClosing: boolean;
  onClose: () => void;
  currentUser: User | null;
  friendRequests: FriendRequest[];
  friends: Friend[];
  loadingFriends: boolean;
  onAcceptFriendRequest: (requestId: number, requesterId: string) => void;
  onRejectFriendRequest: (requestId: number) => void;
  onViewProfile: (userId: string) => void;
  onStartConversation: (friend: Friend) => void;
  onRemoveFriend: (friendId: string) => void;
}

const FriendsModal = ({
  show,
  isClosing,
  onClose,
  currentUser,
  friendRequests,
  friends,
  loadingFriends,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onViewProfile,
  onStartConversation,
  onRemoveFriend,
}: FriendsModalProps) => {
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
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden ${
          isClosing ? 'animate-fade-out' : 'animate-scale-in'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-4 border-b border-gray-200 flex items-center justify-between"
          style={{ backgroundColor: currentUser?.color || '#3B82F6' }}
        >
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FaUserFriends size={20} />
            <span>Mes amis</span>
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
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
                      onClick={() => onViewProfile(request.requester_id)}
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
                        onClick={() => onAcceptFriendRequest(request.id, request.requester_id)}
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <FaCheck size={12} />
                      </button>
                      <button
                        onClick={() => onRejectFriendRequest(request.id)}
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
                    onClick={() => onViewProfile(friend.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {friend.avatar_url ? (
                          <img
                            src={friend.avatar_url}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover border-2"
                            style={{ borderColor: friend.color }}
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                            style={{ backgroundColor: friend.color }}
                          >
                            {(friend.username || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0">
                          <OnlineStatusIndicator
                            lastSeen={friend.last_seen}
                            size="md"
                            showOfflineAsOrange={true}
                            className="border-2 border-white"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: friend.color }}>
                          {friend.username}
                        </p>
                        {friend.bio && <p className="text-xs text-gray-500 truncate max-w-[180px]">{friend.bio}</p>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartConversation(friend);
                        }}
                        className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Envoyer un message"
                      >
                        <FaEnvelope size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveFriend(friend.id);
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
                <p className="text-sm text-gray-400 mt-1">
                  Cliquez sur le profil d&apos;un utilisateur pour l&apos;ajouter
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsModal;
