import React, { useState, useRef } from 'react';

interface InputBarProps {
  onSendMessage: (input: string, imageFile: File | null) => void;
  isLoading: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || imageFile) && !isLoading) {
      onSendMessage(input, imageFile);
      setInput('');
      handleRemoveImage();
    }
  };

  return (
    <div className="p-4 bg-gray-800 border-t border-gray-700">
        {imagePreview && (
            <div className="mb-4 relative w-32 h-32 p-2 border border-gray-600 rounded-lg">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded" />
                <button 
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-700 focus:outline-none"
                    aria-label="Remove image"
                >
                    &times;
                </button>
            </div>
        )}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2 sm:space-x-4">
        <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            disabled={isLoading}
        />
        <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
            aria-label="Attach image"
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={imageFile ? "Describe qué quieres hacer con la imagen..." : "Describe tu ejercicio o haz una pregunta..."}
          disabled={isLoading}
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-3 px-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-300"
        />
        <button
          type="submit"
          disabled={isLoading || (!input.trim() && !imageFile)}
          className="bg-cyan-600 text-white font-bold py-3 px-4 sm:px-6 rounded-lg hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-300 ease-in-out flex items-center"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputBar;