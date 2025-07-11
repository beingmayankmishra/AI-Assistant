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
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);
  const chatContainerRef = useRef(null);

  // GIF Paths
  const SPEAKING_GIF = '/assets/pooja.gif';
  const LISTENING_GIF = '/assets/pooja.gif'; 
  const IDLE_GIF = '/assets/pooja.gif';

  // Add message helper
  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text }]);
  };

  // Smooth scroll with no flickering
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const observer = new MutationObserver(() => {
      chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
      });
    });

    observer.observe(chatContainer, { childList: true });
    return () => observer.disconnect();
  }, []);

  // Load voices
  useEffect(() => {
    if (!synthRef.current) return;

    const handleVoicesChanged = () => {
      const voices = synthRef.current.getVoices();
      if (voices.length > 0) {
        setVoicesReady(true);
      }
    };

    synthRef.current.addEventListener('voiceschanged', handleVoicesChanged);
    handleVoicesChanged();

    return () => {
      synthRef.current.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, []);

  // Indian female voice with guaranteed output
  const speak = useCallback((text, lang = 'en') => {
    if (!voicesReady || !synthRef.current) {
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
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      setIsAssistantSpeaking(false);
    };

    synthRef.current.speak(utterance);
    addMessage('assistant', text);
  }, [voicesReady]);

  // Initialize voice recognition and greeting
  useEffect(() => {
    if (!voicesReady) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'en-IN';
      recognitionRef.current.interimResults = false;
      recognitionRef.current.continuous = false; // Important: Only listen for single utterance

      recognitionRef.current.onresult = (e) => {
        const transcript = e.results[0][0].transcript.trim();
        if (transcript) {
          handleUserInput(transcript);
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = (e) => {
        console.error('Recognition error:', e.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          // Only restart if we're still supposed to be listening
          recognitionRef.current.start();
        }
      };
    }

    // Initial greeting after 1 second
    const greetingTimer = setTimeout(() => {
      speak("Hello! I'm Pooja, your virtual assistant. How can I help you today?");
    }, 1000);

    return () => {
      clearTimeout(greetingTimer);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
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
      // Clear any previous listening message
      setMessages(prev => prev.filter(msg => msg.text !== '...listening...'));
      
      recognitionRef.current.start();
      setIsListening(true);
      addMessage('user', '...listening...');
    }
  };

  return (
    <div className="pooja-assistant">
      {/* Header */}
      <div className="assistant-header">
        <h1>Pooja Virtual Assistant</h1>
        <div className={`voice-animation ${isListening ? 'active' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Main Content */}
      <div className="assistant-container">
        {/* Left Side - Larger Avatar */}
        <div className="avatar-section">
          <div className="avatar-wrapper">
            <img 
              src={
                isAssistantSpeaking ? SPEAKING_GIF :
                isListening ? LISTENING_GIF :
                IDLE_GIF
              }
              alt="Pooja Virtual Assistant"
              className="avatar-gif"
            />
          </div>
        </div>

        {/* Right Side - Compact Chat */}
        <div className="chat-section">
          <div className="chat-container" ref={chatContainerRef}>
            {messages.map((message, index) => (
              <ChatBubble 
                key={index}
                sender={message.sender}
                text={message.text}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Center Mic Button */}
      <div className="mic-container">
        <button 
          className={`mic-button ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          disabled={isAssistantSpeaking}
        >
          <div className="mic-icon">
            <div className="mic-lines"></div>
          </div>
          <div className="pulse-effect"></div>
        </button>
      </div>

      {/* Registration Modal */}
      {showRegistration && (
        <RegistrationForm 
          onComplete={() => {
            setShowRegistration(false);
            speak("Thank you for registering with us!");
          }}
          onClose={() => setShowRegistration(false)}
        />
      )}
    </div>
  );
};

export default Assistant;