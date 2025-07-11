import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatBubble from './ChatBubble';
import RegistrationForm from './RegistrationForm';
import { getResponse } from './KnowledgeEngine';
import './Assistant.css';

const Assistant = () => {
  // State
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);

  // Refs
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const chatContainerRef = useRef(null);

  // GIF Paths
  const SPEAKING_GIF = '/assets/pooja.gif'; // Your female avatar GIF
  const IDLE_GIF = '/assets/pooja.gif'; // Same or different idle state

  // Add message helper
  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text }]);
  };

  // Smooth scroll
  useEffect(() => {
    const observer = new MutationObserver(() => {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    });
    observer.observe(chatContainerRef.current, { childList: true });
    return () => observer.disconnect();
  }, []);

  // Load voices and initialize
  useEffect(() => {
    const handleVoicesChanged = () => {
      const voices = synthRef.current.getVoices();
      if (voices.length > 0) {
        setVoicesReady(true);
        console.log('Available voices:', voices);
      }
    };

    synthRef.current.addEventListener('voiceschanged', handleVoicesChanged);
    
    // Initial check
    handleVoicesChanged();

    return () => {
      synthRef.current.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, []);

  // Indian female voice with guaranteed output
  const speak = useCallback((text, lang = 'en') => {
    if (!voicesReady) {
      console.log('Voices not ready, retrying...');
      setTimeout(() => speak(text, lang), 200);
      return;
    }

    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.92;
    utterance.pitch = 1.18;

    // Priority list for Indian female voices
    const voices = synthRef.current.getVoices();
    const preferredVoices = [
      'Microsoft Priya Online (Natural) - English (India)',
      'Google हिन्दी',
      'Veena',
      'Neha',
      'Priya'
    ];

   const indianFemaleVoice = voices.find(v => 
  preferredVoices.some(name => v.name.includes(name)) ||
  (v.lang.includes('IN') && (v.name.includes('Female') || v.gender === 'female'))
);

    if (indianFemaleVoice) {
      utterance.voice = indianFemaleVoice;
      console.log('Selected voice:', indianFemaleVoice.name);
    } else {
      console.warn('Indian female voice not found, using default');
    }

    utterance.onstart = () => setIsAssistantSpeaking(true);
    utterance.onend = () => setIsAssistantSpeaking(false);

    synthRef.current.speak(utterance);
    addMessage('assistant', text);
  }, [voicesReady]);

  // Initialize voice recognition and greeting
  useEffect(() => {
    if (!voicesReady) return;

    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-IN';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        handleUserInput(transcript);
      };

      recognitionRef.current.onerror = (e) => {
        console.error('Recognition error:', e.error);
        setIsListening(false);
      };
    }

    // Initial greeting after 1 second
    const greetingTimer = setTimeout(() => {
      speak("Hello! I'm your AI assistant. How can I help you today?");
    }, 1000);

    return () => clearTimeout(greetingTimer);
  }, [voicesReady, speak]);

  // Handle user input
  const handleUserInput = (text) => {
    const lang = detectLanguage(text);
    addMessage('user', text);

    // Get response from knowledge engine
    const response = getResponse(text, lang);
    speak(response, lang);
  };

  // Detect language
  const detectLanguage = (text) => {
    return /[\u0900-\u097F]/.test(text) ? 'hi' : 'en';
  };

  // Toggle listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      addMessage('system', "Voice recognition not available");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      addMessage('user', '...listening...');
    }
  };

  return (
    <div className="modern-ai-assistant">
      {/* Left Side - 3D Avatar */}
      <div className="avatar-container">
        <img 
          src={isAssistantSpeaking ? SPEAKING_GIF : IDLE_GIF}
          alt="AI Assistant"
          className="avatar-gif"
        />
      </div>

      {/* Right Side - Chat */}
      <div className="chat-container" ref={chatContainerRef}>
        <div className="messages">
          {messages.map((message, index) => (
            <ChatBubble 
              key={index}
              sender={message.sender}
              text={message.text}
            />
          ))}
        </div>
      </div>

      {/* Center Mic Button */}
      <div className="mic-container">
        <button 
          className={`mic-button ${isListening ? 'active' : ''}`}
          onClick={toggleListening}
          disabled={isAssistantSpeaking}
        >
          <div className="mic-icon"></div>
          <div className="pulse-ring"></div>
        </button>
      </div>

      {/* Registration Modal */}
      {showRegistration && (
        <RegistrationForm 
          onComplete={() => {
            setShowRegistration(false);
            speak("Thank you for registering!");
          }}
          onClose={() => setShowRegistration(false)}
        />
      )}
    </div>
  );
};

export default Assistant;