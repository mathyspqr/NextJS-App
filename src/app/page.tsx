'use client';

import Confetti from 'react-confetti';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LoginRegister from './LoginRegister';
import FriendsModal from './components/page/FriendsModal';
import HeaderBar from './components/page/HeaderBar';
import LightboxModal from './components/page/LightboxModal';
import MessageComposer from './components/page/MessageComposer';
import MessageList from './components/page/MessageList';
import OnlineUsersModal from './components/page/OnlineUsersModal';
import PrivateMessagesModal from './components/page/PrivateMessagesModal';
import ProfileModal from './components/page/ProfileModal';
import TypingIndicator from './components/page/TypingIndicator';
import { useChatPage } from './hooks/useChatPage';

const Page = () => {
  const {
    isAuthenticated,
    handleLogin,
    user,
    showConfetti,
    lightboxImage,
    setLightboxImage,
    showProfileModal,
    closingProfileModal,
    closeProfileModal,
    profileModalRef,
    loadingProfile,
    viewingProfile,
    friendshipStatus,
    sendingFriendRequest,
    sendFriendRequest,
    acceptFriendRequestFromProfile,
    rejectFriendRequestFromProfile,
    removeFriend,
    startConversationFromProfile,
    showFriendsModal,
    closingFriendsModal,
    closeFriendsModal,
    friendRequests,
    friends,
    loadingFriends,
    acceptFriendRequest,
    rejectFriendRequest,
    handleViewProfile,
    setShowFriendsModal,
    setShowMessagesModal,
    openConversation,
    showOnlineUsersModal,
    closingOnlineUsersModal,
    closeOnlineUsersModal,
    loadingOnlineUsers,
    onlineUsers,
    setShowOnlineUsersModal,
    showMessagesModal,
    closingMessagesModal,
    closeMessagesModal,
    activeConversation,
    activeConversationUser,
    setActiveConversation,
    setActiveConversationUser,
    loadConversations,
    startVoiceCall,
    incomingCall,
    acceptVoiceCall,
    declineVoiceCall,
    callStatus,
    activeCall,
    audioNeedsInteraction,
    activateAudio,
    isMuted,
    microphoneActive,
    toggleMute,
    hangupVoiceCall,
    remoteAudioRef,
    privateMessagesContainerRef,
    privateMessagesEndRef,
    loadingPrivateMessages,
    privateMessages,
    privateTypingUser,
    privateImagePreview,
    privateImageFile,
    cancelPrivateImage,
    privateImageInputRef,
    handlePrivateImageSelect,
    sendingPrivateImage,
    newPrivateMessage,
    setNewPrivateMessage,
    handlePrivateTyping,
    stopPrivateTyping,
    sendPrivateMessage,
    conversations,
    typingInConversations,
    loadingConversations,
    deleteConversation,
    showUserMenu,
    isClosingMenu,
    userMenuRef,
    setShowUserMenu,
    isEditingUsername,
    editingUsername,
    setEditingUsername,
    isUpdatingUsername,
    startEditingUsername,
    handleUpdateUsername,
    cancelEditingUsername,
    isEditingColor,
    editingColor,
    setEditingColor,
    isUpdatingColor,
    startEditingColor,
    handleUpdateColor,
    cancelEditingColor,
    avatarInputRef,
    handleAvatarUpload,
    isUploadingAvatar,
    isEditingBio,
    editingBio,
    setEditingBio,
    isUpdatingBio,
    startEditingBio,
    handleUpdateBio,
    cancelEditingBio,
    handleLogout,
    loadFriends,
    openMessagesModal,
    unreadMessagesCount,
    loadOnlineUsers,
    error,
    newMessage,
    setNewMessage,
    handleTyping,
    handleSubmit,
    textareaRef,
    imagePreview,
    removeImage,
    showEmojiPicker,
    setShowEmojiPicker,
    handleEmojiSelect,
    emojiPickerRef,
    handleImageSelect,
    imageFile,
    usersTyping,
    loadingMessages,
    messages,
    editingMessageId,
    editingMessageText,
    setEditingMessageText,
    handleUpdateMessage,
    handleCancelEditMessage,
    handleStartEditMessage,
    handleDelete,
    handleLike,
    handleComment,
    commentingMessageId,
    closingMessageId,
    loadingComments,
    commentairesByMessage,
    newComment,
    setNewComment,
    handleCommentSubmit,
  } = useChatPage();
  if (!isAuthenticated) {
    return (
      <LoginRegister
        onLogin={handleLogin}
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
        onActivateAudio={activateAudio}
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




