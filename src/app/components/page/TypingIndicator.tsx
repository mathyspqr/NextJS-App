interface TypingIndicatorProps {
  usersTyping: Record<string, string>;
}

const TypingIndicator = ({ usersTyping }: TypingIndicatorProps) => {
  if (Object.keys(usersTyping).length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg animate-fade-in">
      <p className="text-blue-700 text-sm flex items-center space-x-2">
        <span className="inline-flex space-x-1">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </span>
        <span className="font-medium">
          {Object.values(usersTyping).join(', ')}{' '}
          {Object.keys(usersTyping).length > 1 ? "sont en train d'écrire" : "est en train d'écrire"}...
        </span>
      </p>
    </div>
  );
};

export default TypingIndicator;
