import { FaUser, FaUserCheck, FaUserPlus, FaUsers, FaTimes } from 'react-icons/fa';

import OnlineStatusIndicator from '../UI/OnlineStatusIndicator';
import { ProfileData } from '../../types/chat';

interface OnlineUsersModalProps {
  show: boolean;
  isClosing: boolean;
  onClose: () => void;
  loadingOnlineUsers: boolean;
  onlineUsers: ProfileData[];
  onViewProfile: (userId: string) => void;
  onSendFriendRequest: (userId: string) => void;
}

const OnlineUsersModal = ({
  show,
  isClosing,
  onClose,
  loadingOnlineUsers,
  onlineUsers,
  onViewProfile,
  onSendFriendRequest,
}: OnlineUsersModalProps) => {
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
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FaUsers className="text-white" size={20} />
            <h2 className="text-xl font-bold text-white">Utilisateurs en ligne</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors duration-200"
          >
            <FaTimes size={20} />
          </button>
        </div>

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
                <div key={onlineUser.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center space-x-3 flex-1 cursor-pointer group"
                      onClick={() => onViewProfile(onlineUser.id)}
                    >
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

                      <div className="flex-1 min-w-0 text-left">
                        <p
                          className="font-semibold truncate group-hover:underline cursor-pointer transition-all"
                          style={{ color: onlineUser.color || '#3B82F6' }}
                        >
                          {onlineUser.username}
                        </p>
                        {onlineUser.bio && <p className="text-xs text-gray-500 truncate">{onlineUser.bio}</p>}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-2">
                      {onlineUser.isFriend ? (
                        <div className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm font-medium">
                          <FaUserCheck size={14} />
                          <span>Ami</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => onSendFriendRequest(onlineUser.id)}
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
  );
};

export default OnlineUsersModal;
