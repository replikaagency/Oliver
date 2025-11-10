import React, { useState, useEffect, useRef } from 'react';
import type { Message, UserLevel, Topic } from './types';
import { runStream } from './services/geminiService';
import InitialSetup from './components/InitialSetup';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
    }
    reader.onerror = (error) => reject(error);
  });


const App: React.FC = () => {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const hasSentInitialPrompt = useRef(false);

  useEffect(() => {
    if (userLevel && topic && !hasSentInitialPrompt.current) {
      setIsLoading(true);
      hasSentInitialPrompt.current = true;
      const initialPrompt = `He elegido el nivel ${userLevel} y el tema ${topic}. Por favor, salúdame y proponme un primer ejercicio sencillo o pregúntame qué quiero resolver.`;
      
      let firstChunk = true;
      (async () => {
        try {
          for await (const chunk of runStream(initialPrompt, [])) {
            setMessages(prev => {
              if (firstChunk) {
                firstChunk = false;
                return [{ role: 'assistant', content: chunk.content || '', imageUrl: chunk.imageUrl }];
              } else {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (chunk.content) {
                  lastMessage.content = (lastMessage.content || '') + chunk.content;
                }
                 if (chunk.imageUrl && !lastMessage.imageUrl) {
                  lastMessage.imageUrl = chunk.imageUrl;
                }
                return newMessages;
              }
            });
          }
        } catch (error) {
          console.error("Error with initial prompt stream:", error);
          setMessages([{ role: 'assistant', content: 'Hubo un error al contactar al asistente. Por favor, intenta de nuevo.' }]);
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [userLevel, topic]);

  const handleSendMessage = async (userInput: string, imageFile: File | null) => {
    if ((!userInput.trim() && !imageFile) || isLoading) return;
  
    setIsLoading(true);
    
    let userMessage: Message = { role: 'user', content: userInput };
    let imagePayload: { data: string; mimeType: string } | undefined = undefined;

    if (imageFile) {
        try {
            const base64Data = await fileToBase64(imageFile);
            userMessage.imageUrl = `data:${imageFile.type};base64,${base64Data}`;
            imagePayload = { data: base64Data, mimeType: imageFile.type };
        } catch(error) {
            console.error("Error converting file to base64:", error);
            setMessages(prev => [...prev, {role: 'assistant', content: 'Hubo un error al procesar la imagen.'}]);
            setIsLoading(false);
            return;
        }
    }

    const currentMessages: Message[] = [...messages, userMessage];
    setMessages(currentMessages);
  
    try {
      // Create the initial empty message for the assistant
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
  
      for await (const chunk of runStream(userInput, currentMessages.slice(0, -1), imagePayload)) {
        setMessages(prev => {
          const newMessages = [...prev];
          let lastMessage = newMessages[newMessages.length - 1];
          
          // If the last message is from the user, create a new assistant message
          if(lastMessage.role === 'user'){
            lastMessage = { role: 'assistant', content: ''};
            newMessages.push(lastMessage);
          }
  
          if (chunk.imageUrl) {
             // If content exists, or an image already exists, create a new bubble for the new image.
            if (lastMessage.content || lastMessage.imageUrl) {
              newMessages.push({ role: 'assistant', content: '', imageUrl: chunk.imageUrl });
            } else {
              lastMessage.imageUrl = chunk.imageUrl;
            }
          }
  
          if (chunk.content) {
            lastMessage.content += chunk.content;
          }
          
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setUserLevel(null);
    setTopic(null);
    setMessages([]);
    hasSentInitialPrompt.current = false;
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans">
      <header className="bg-gray-800 p-4 shadow-md flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-cyan-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Asistente de Dibujo Técnico AutoCAD
        </h1>
        {userLevel && topic && (
          <button
            onClick={handleReset}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out text-sm"
          >
            Reiniciar
          </button>
        )}
      </header>
      
      <main className="flex-1 overflow-hidden">
        {!userLevel || !topic ? (
          <InitialSetup
            userLevel={userLevel}
            onSetLevel={setUserLevel}
            onSetTopic={setTopic}
          />
        ) : (
          <div className="flex flex-col h-full">
            <ChatWindow messages={messages} isLoading={isLoading} />
            <InputBar onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;