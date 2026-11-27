import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { bargainApi } from '../services/api';
import { useCart } from './CartContext';

const BargainContext = createContext();

export function BargainProvider({ children }) {
  const { addToCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [language, setLanguage] = useState('en'); // 'en' | 'ta' | 'hi'
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [roundsUsed, setRoundsUsed] = useState(0);
  const [roundsRemaining, setRoundsRemaining] = useState(3);
  const [approvedPrice, setApprovedPrice] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'active' | 'accepted' | 'rejected'
  const [isLoading, setIsLoading] = useState(false);

  // Web Speech State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);

  // Check SpeechRecognition support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Text to Speech synthesis function
  const speak = (text, lang = language) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);

      const langMap = {
        ta: 'ta-IN',
        hi: 'hi-IN',
        en: 'en-IN'
      };
      utterance.lang = langMap[lang] || 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select matching voice if available
      const voices = window.speechSynthesis.getVoices();
      const targetVoice = voices.find(v => v.lang.startsWith(lang) || v.lang.includes(lang));
      if (targetVoice) utterance.voice = targetVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      setIsSpeaking(false);
    }
  };

  // Start Voice Recognition
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser. Please type below.');
      return;
    }

    try {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }

      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      const langCodeMap = {
        ta: 'ta-IN',
        hi: 'hi-IN',
        en: 'en-IN'
      };
      recognition.lang = langCodeMap[language] || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript && transcript.trim()) {
          sendCustomerMessage(transcript);
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition error:', event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Open Bargaining Modal for a Product
  const openBargaining = async (product, initialLang = language) => {
    setActiveProduct(product);
    setLanguage(initialLang);
    setIsOpen(true);
    setIsLoading(true);
    setStatus('active');
    setApprovedPrice(null);
    setRoundsUsed(0);
    setRoundsRemaining(3);

    try {
      const session = await bargainApi.start(product.id, initialLang);
      setSessionId(session.session_id);
      const greetingMsg = {
        sender: 'assistant',
        text: session.greeting_message,
        timestamp: new Date().toISOString()
      };
      setMessages([greetingMsg]);
      speak(session.greeting_message, initialLang);
    } catch (err) {
      console.error('Failed to start bargaining:', err);
      toast.error('Unable to connect to AI Bargaining assistant');
    } finally {
      setIsLoading(false);
    }
  };

  // Send Customer message (voice or text)
  const sendCustomerMessage = async (text) => {
    if (!text.trim() || !sessionId) return;

    const userMsg = {
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await bargainApi.sendMessage(sessionId, text);
      const assistantMsg = {
        sender: 'assistant',
        text: res.message,
        action: res.action,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (res.approved_price) {
        setApprovedPrice(res.approved_price);
      }
      setRoundsUsed(res.rounds_used);
      setRoundsRemaining(res.rounds_remaining);

      if (res.action === 'accept') {
        setStatus('accepted');
      } else if (res.action === 'reject' || res.action === 'max_rounds') {
        setStatus('rejected');
      }

      speak(res.message, language);
    } catch (err) {
      console.error('Error submitting offer:', err);
      toast.error('Error communicating with assistant');
    } finally {
      setIsLoading(false);
    }
  };

  // Accept counteroffer and proceed to checkout
  const acceptOffer = () => {
    const finalPrice = approvedPrice || activeProduct.price;
    addToCart(activeProduct, 1, finalPrice, sessionId);
    setIsOpen(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    toast.success(`🎉 Deal finalized at ₹${finalPrice.toLocaleString('en-IN')}! Added to cart.`);
  };

  // Reject counteroffer
  const rejectOffer = async () => {
    try {
      const res = await bargainApi.reject(sessionId);
      setStatus('rejected');
      setMessages(prev => [...prev, {
        sender: 'assistant',
        text: res.message,
        action: 'reject',
        timestamp: new Date().toISOString()
      }]);
      speak(res.message, language);
    } catch {
      setStatus('rejected');
    }
  };

  const closeBargaining = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.abort();
    setIsListening(false);
    setIsSpeaking(false);
    setIsOpen(false);
  };

  return (
    <BargainContext.Provider
      value={{
        isOpen,
        activeProduct,
        language,
        setLanguage,
        sessionId,
        messages,
        roundsUsed,
        roundsRemaining,
        approvedPrice,
        status,
        isLoading,
        isListening,
        isSpeaking,
        speechSupported,
        openBargaining,
        closeBargaining,
        toggleListening,
        sendCustomerMessage,
        acceptOffer,
        rejectOffer,
      }}
    >
      {children}
    </BargainContext.Provider>
  );
}

export function useBargain() {
  return useContext(BargainContext);
}
