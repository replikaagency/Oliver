import React from 'react';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const bubbleClasses = isUser
    ? 'bg-cyan-700 text-white self-end'
    : 'bg-gray-700 text-gray-200 self-start';

  const containerClasses = isUser ? 'justify-end' : 'justify-start';
  
  const { content, imageUrl } = message;

  const renderContent = () => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactElement[] = [];
    let currentList: React.ReactElement[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ol key={`list-${elements.length}`} className="list-decimal list-inside my-2 space-y-1 pl-4">
            {currentList}
          </ol>
        );
        currentList = [];
      }
    };

    const renderTextWithBold = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
        return parts.map((part, i) =>
            part.startsWith('**') && part.endsWith('**') ? (
            <strong key={i} className="text-cyan-400 font-bold">{part.slice(2, -2)}</strong>
            ) : (
            part
            )
        );
    }

    lines.forEach((line, index) => {
      const numberedListMatch = line.match(/^\s*(\d+)\.\s*(.*)/);

      if (numberedListMatch) {
        const itemContent = numberedListMatch[2];
        currentList.push(
          <li key={index}>
            {renderTextWithBold(itemContent)}
          </li>
        );
      } else {
        flushList();
        elements.push(
          <p key={index} className={line.trim() === '' ? 'h-4' : ''}>
            {renderTextWithBold(line)}
          </p>
        );
      }
    });
    
    flushList();

    return elements;
  };

  const hasContent = content && content.trim().length > 0;
  const imageMargin = hasContent ? 'mt-4 border-t border-gray-600 pt-4' : '';

  return (
    <div className={`flex ${containerClasses}`}>
      <div className={`rounded-xl p-4 max-w-3xl shadow-lg ${bubbleClasses}`}>
        {hasContent && (
            <div className="text-base leading-relaxed space-y-2">
                {renderContent()}
            </div>
        )}
        {imageUrl && (
          <div className={imageMargin}>
            <img 
              src={imageUrl} 
              alt={isUser ? "Imagen subida por el usuario" : "Dibujo técnico generado"}
              className="rounded-lg w-full h-auto object-contain bg-white p-1" 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;