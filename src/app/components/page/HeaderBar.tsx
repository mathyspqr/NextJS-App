import type { ChangeEvent, RefObject } from 'react';
import CountUp from 'react-countup';
import {
  FaCamera,
  FaCheck,
  FaEdit,
  FaEnvelope,
  FaSignOutAlt,
  FaTimes,
  FaUser,
  FaUserFriends,
  FaUsers,
} from 'react-icons/fa';

import OnlineStatusIndicator from '../UI/OnlineStatusIndicator';
import { User } from '../../types/chat';

interface HeaderBarProps {
  user: User | null;
  showUserMenu: boolean;
  isClosingMenu: boolean;
  userMenuRef: RefObject<HTMLDivElement>;
  onToggleUserMenu: () => void;
  isEditingUsername: boolean;
  editingUsername: string;
  onEditingUsernameChange: (value: string) => void;
  isUpdatingUsername: boolean;
  onStartEditingUsername: () => void;
  onUpdateUsername: () => void;
  onCancelEditingUsername: () => void;
  isEditingColor: boolean;
  editingColor: string;
  onEditingColorChange: (value: string) => void;
  isUpdatingColor: boolean;
  onStartEditingColor: () => void;
  onUpdateColor: () => void;
  onCancelEditingColor: () => void;
  avatarInputRef: RefObject<HTMLInputElement>;
  onAvatarUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  isUploadingAvatar: boolean;
  isEditingBio: boolean;
  editingBio: string;
  onEditingBioChange: (value: string) => void;
  isUpdatingBio: boolean;
  onStartEditingBio: () => void;
  onUpdateBio: () => void;
  onCancelEditingBio: () => void;
  onLogout: () => void;
  onOpenFriends: () => void;
  friendRequestsCount: number;
  onOpenMessages: () => void;
  unreadMessagesCount: number;
  onOpenOnlineUsers: () => void;
  onlineUsersCount: number;
}

const HeaderBar = ({
  user,
  showUserMenu,
  isClosingMenu,
  userMenuRef,
  onToggleUserMenu,
  isEditingUsername,
  editingUsername,
  onEditingUsernameChange,
  isUpdatingUsername,
  onStartEditingUsername,
  onUpdateUsername,
  onCancelEditingUsername,
  isEditingColor,
  editingColor,
  onEditingColorChange,
  isUpdatingColor,
  onStartEditingColor,
  onUpdateColor,
  onCancelEditingColor,
  avatarInputRef,
  onAvatarUpload,
  isUploadingAvatar,
  isEditingBio,
  editingBio,
  onEditingBioChange,
  isUpdatingBio,
  onStartEditingBio,
  onUpdateBio,
  onCancelEditingBio,
  onLogout,
  onOpenFriends,
  friendRequestsCount,
  onOpenMessages,
  unreadMessagesCount,
  onOpenOnlineUsers,
  onlineUsersCount,
}: HeaderBarProps) => (
  <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={onToggleUserMenu}
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
                  <OnlineStatusIndicator
                    lastSeen={user?.last_seen}
                    size="sm"
                    className="border-2 border-white"
                    showOfflineAsOrange={true}
                  />
                </div>
              </div>
            ) : (
              <div className="relative bg-white rounded-full p-2">
                <FaUser style={{ color: user?.color || '#3B82F6' }} size={16} />
                <div className="absolute bottom-0 right-0">
                  <OnlineStatusIndicator
                    lastSeen={user?.last_seen}
                    size="sm"
                    className="border-2 border-white"
                    showOfflineAsOrange={true}
                  />
                </div>
              </div>
            )}
            <span className="font-medium">{user?.name}</span>
          </button>

          {showUserMenu && (
            <div
              className={`absolute left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 ${
                isClosingMenu ? 'animate-fade-out' : 'animate-fade-in'
              }`}
            >
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
                          onClick={onStartEditingUsername}
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
                          onChange={(e) => onEditingUsernameChange(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Nouveau nom"
                          autoFocus
                          disabled={isUpdatingUsername}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') onUpdateUsername();
                            if (e.key === 'Escape') onCancelEditingUsername();
                          }}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={onUpdateUsername}
                            disabled={isUpdatingUsername}
                            className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-1 disabled:bg-blue-400"
                          >
                            <FaCheck size={10} />
                            <span>{isUpdatingUsername ? 'Enregistrement...' : 'Valider'}</span>
                          </button>
                          <button
                            onClick={onCancelEditingUsername}
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
                          onClick={onStartEditingColor}
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
                            onChange={(e) => onEditingColorChange(e.target.value)}
                            className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                            disabled={isUpdatingColor}
                          />
                          <input
                            type="text"
                            value={editingColor}
                            onChange={(e) => onEditingColorChange(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="#3B82F6"
                            disabled={isUpdatingColor}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') onUpdateColor();
                              if (e.key === 'Escape') onCancelEditingColor();
                            }}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={onUpdateColor}
                            disabled={isUpdatingColor}
                            className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-1 disabled:bg-blue-400"
                          >
                            <FaCheck size={10} />
                            <span>{isUpdatingColor ? 'Enregistrement...' : 'Valider'}</span>
                          </button>
                          <button
                            onClick={onCancelEditingColor}
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
                      <label
                        className={`px-3 py-1.5 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors duration-200 cursor-pointer flex items-center space-x-1 ${
                          isUploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <FaCamera size={10} />
                        <span>{isUploadingAvatar ? 'Upload...' : 'Changer'}</span>
                        <input
                          ref={avatarInputRef}
                          type="file"
                          accept="image/*"
                          onChange={onAvatarUpload}
                          className="hidden"
                          disabled={isUploadingAvatar}
                        />
                      </label>
                    </div>
                  </div>
                </div>

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
                          onClick={onStartEditingBio}
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
                          onChange={(e) => onEditingBioChange(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          placeholder="Décrivez-vous en quelques mots..."
                          rows={2}
                          maxLength={200}
                          disabled={isUpdatingBio}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') onCancelEditingBio();
                          }}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={onUpdateBio}
                            disabled={isUpdatingBio}
                            className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-1 disabled:bg-blue-400"
                          >
                            <FaCheck size={10} />
                            <span>{isUpdatingBio ? 'Enregistrement...' : 'Valider'}</span>
                          </button>
                          <button
                            onClick={onCancelEditingBio}
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
                  onClick={onLogout}
                  className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center space-x-2"
                >
                  <FaSignOutAlt />
                  <span className="font-medium">Déconnexion</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onOpenFriends}
          className="relative flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow"
        >
          <FaUserFriends className="text-blue-500" size={18} />
          <span className="font-medium text-gray-700 hidden sm:inline">Amis</span>
          {friendRequestsCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full animate-pulse">
              {friendRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenMessages}
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

        <button
          onClick={onOpenOnlineUsers}
          className="relative flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow"
        >
          <FaUsers className="text-green-500" size={18} />
          <span className="font-medium text-gray-700 hidden sm:inline">En ligne</span>
          <span
            className={`absolute -top-2 -right-2 bg-green-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full transition-all duration-5000 ${
              onlineUsersCount > 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
            }`}
          >
            <CountUp key={onlineUsersCount} end={onlineUsersCount} duration={0.5} />
          </span>
        </button>
      </div>

      <h1 className="text-xl font-bold text-gray-800 hidden sm:block">💬 ChatFlow</h1>
    </div>
  </header>
);

export default HeaderBar;
