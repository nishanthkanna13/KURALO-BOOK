import React from 'react';

export default function VoiceVisualizer({ isListening, isSpeaking }) {
  if (!isListening && !isSpeaking) return null;

  return (
    <div className="flex items-center justify-center space-x-1.5 py-2 px-4 rounded-full bg-amber-50 border border-amber-200/60 shadow-sm transition-all duration-300">
      <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-amber-500 animate-pulse'}`} />
      <span className="text-xs font-semibold text-amber-900 tracking-wide uppercase mr-2">
        {isListening ? 'Listening to your price...' : 'Assistant Speaking...'}
      </span>
      <div className="flex items-center space-x-1 text-amber-600">
        <span className="wave-bar h-4" />
        <span className="wave-bar h-6" />
        <span className="wave-bar h-3" />
        <span className="wave-bar h-5" />
        <span className="wave-bar h-4" />
      </div>
    </div>
  );
}
