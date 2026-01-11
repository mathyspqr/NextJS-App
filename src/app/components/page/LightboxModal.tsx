import { FaImage, FaTimes } from 'react-icons/fa';

interface LightboxModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

const LightboxModal = ({ imageUrl, onClose }: LightboxModalProps) => {
  if (!imageUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] animate-fade-in cursor-zoom-out"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/50 rounded-full p-3 transition-colors z-10"
      >
        <FaTimes size={24} />
      </button>
      <img
        src={imageUrl}
        alt="Image en grand"
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      />
      <a
        href={imageUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-4 right-4 text-white/80 hover:text-white bg-black/50 rounded-full px-4 py-2 transition-colors flex items-center space-x-2"
      >
        <FaImage size={16} />
        <span>Ouvrir dans un nouvel onglet</span>
      </a>
    </div>
  );
};

export default LightboxModal;
