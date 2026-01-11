import type { ChangeEvent, FormEvent, RefObject } from 'react';
import { FaImage, FaSmile, FaTimes } from 'react-icons/fa';

interface MessageComposerProps {
  newMessage: string;
  onNewMessageChange: (value: string) => void;
  onTyping: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  imagePreview: string | null;
  onRemoveImage: () => void;
  showEmojiPicker: boolean;
  onToggleEmojiPicker: () => void;
  onEmojiSelect: (emoji: string) => void;
  emojiPickerRef: RefObject<HTMLDivElement>;
  onImageSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  imageRequired: boolean;
}

const MessageComposer = ({
  newMessage,
  onNewMessageChange,
  onTyping,
  onSubmit,
  textareaRef,
  imagePreview,
  onRemoveImage,
  showEmojiPicker,
  onToggleEmojiPicker,
  onEmojiSelect,
  emojiPickerRef,
  onImageSelect,
  imageRequired,
}: MessageComposerProps) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
      <span>✍️</span>
      <span>Nouveau message</span>
    </h2>
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={newMessage}
          onChange={(e) => {
            onNewMessageChange(e.target.value);
            onTyping();
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
          placeholder="Écrivez votre message..."
          rows={3}
          required={imageRequired}
        />

        {imagePreview && (
          <div className="mt-3 relative inline-block">
            <img src={imagePreview} alt="Preview" className="max-w-xs max-h-48 rounded-lg border-2 border-gray-300" />
            <button
              type="button"
              onClick={onRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <FaTimes size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative" ref={emojiPickerRef}>
          <button
            type="button"
            onClick={onToggleEmojiPicker}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
            title="Ajouter un emoji"
          >
            <FaSmile size={20} />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 w-80 max-h-64 overflow-y-auto animate-fade-in">
              <p className="text-xs font-semibold text-gray-500 mb-2">Emojis populaires</p>
              <div className="grid grid-cols-8 gap-2">
                {[
                  '😀',
                  '😂',
                  '🤣',
                  '😊',
                  '😍',
                  '🥰',
                  '😎',
                  '🤔',
                  '😮',
                  '😢',
                  '😭',
                  '😡',
                  '👍',
                  '👎',
                  '👏',
                  '🙏',
                  '💪',
                  '🎉',
                  '🎊',
                  '🎈',
                  '❤️',
                  '💙',
                  '💚',
                  '💛',
                  '🔥',
                  '⭐',
                  '✨',
                  '💯',
                  '🚀',
                  '🎯',
                  '💡',
                  '🎨',
                ].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onEmojiSelect(emoji)}
                    className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <label className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200 cursor-pointer">
          <FaImage size={20} />
          <input type="file" accept="image/*" onChange={onImageSelect} className="hidden" />
        </label>

        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
        >
          Envoyer le message
        </button>
      </div>
    </form>
  </div>
);

export default MessageComposer;
