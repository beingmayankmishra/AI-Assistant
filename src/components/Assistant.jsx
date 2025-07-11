import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChatBubble from './ChatBubble';
import RegistrationForm from './RegistrationForm';
import { getResponse } from './KnowledgeEngine';
import './Assistant.css';

const Assistant = () => {
  // State management
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);

  // Refs
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const avatarRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Helper function to add messages
  const addMessage = (sender, text) => {
    setMessages(prev => [...prev, { sender, text }]);
  };

  // Text-to-speech with Indian accent (using useCallback for stable reference)
  const speak = useCallback((text, lang) => {
    if (synthRef.current?.speaking) {
      synthRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    // Try to find Indian voice
    const voices = synthRef.current?.getVoices() || [];
    const indianVoice = voices.find(voice => 
      voice.lang.includes('IN') || voice.name.includes('India')
    );
    if (indianVoice) utterance.voice = indianVoice;

    // Avatar animation while speaking
    const animateAvatar = () => {
      avatarRef.current?.classList.add('talking');
      setTimeout(() => {
        avatarRef.current?.classList.remove('talking');
      }, 200);
    };
    
    const interval = setInterval(animateAvatar, 300);
    utterance.onstart = () => setIsAssistantSpeaking(true);
    utterance.onend = () => {
      clearInterval(interval);
      setIsAssistantSpeaking(false);
      avatarRef.current?.classList.remove('talking');
    };

    synthRef.current?.speak(utterance);
    addMessage('assistant', text);
  }, []);

  // Initialize voice recognition and synthesis
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleUserInput(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Recognition error:', event.error);
        setIsListening(false);
        addMessage('system', "Sorry, I didn't catch that. Please try again.");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    synthRef.current = window.speechSynthesis;

    // Initial greeting
    const timer = setTimeout(() => {
      speak("Hello! I'm your virtual education assistant. How can I help you today?", 'en');
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [speak]); // Fixed dependency warning

  // Language detection
  const detectLanguage = (text) => {
    return /[\u0900-\u097F]/.test(text) ? 'hi' : 'en';
  };

  // Process user input
  const handleUserInput = (text) => {
    const lang = detectLanguage(text);
    addMessage('user', text);

    // Set language for next recognition
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    }

    // Handle registration intent
    if ((text.includes('yes') || text.includes('हां')) && 
       messages.some(msg => msg.sender === 'assistant' && 
       (msg.text.includes('register') || msg.text.includes('रजिस्टर')))) {
      setShowRegistration(true);
      speak(lang === 'hi' ? "फॉर्म खोल रहा हूँ..." : "Opening registration form...", lang);
      return;
    }

    // Get intelligent response
    const response = getResponse(text, lang);
    speak(response, lang);

    // Auto-prompt for registration if relevant
    if (response.includes('register') || response.includes('रजिस्टर')) {
      setTimeout(() => {
        speak(lang === 'hi' ? "क्या आप रजिस्टर करना चाहेंगे?" 
                           : "Would you like to register now?", lang);
      }, 1500);
    }
  };

  // Toggle microphone
  const toggleListening = () => {
    if (!recognitionRef.current) {
      addMessage('system', "Voice recognition not supported in this browser");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        addMessage('user', '...listening...');
      } catch (err) {
        console.error('Recognition start failed:', err);
        addMessage('system', "Couldn't access microphone. Please check permissions.");
      }
    }
  };

  // Handle form completion
  const handleRegistrationComplete = () => {
    setShowRegistration(false);
    speak("Thank you for registering! We'll contact you soon.", 'en');
  };

  return (
    <div className="assistant-container">
      {/* Left Side - Professional Avatar */}
      <div className="avatar-container">
        <div className="avatar" ref={avatarRef}>
          <div className="avatar-face">
            <div className="avatar-eyes">
              <div className="avatar-eye"></div>
              <div className="avatar-eye"></div>
            </div>
            <div className="avatar-mouth"></div>
          </div>
        </div>
      </div>

      {/* Right Side - Conversation */}
      <div className="chat-container" ref={chatContainerRef}>
        {messages.map((message, index) => (
          <ChatBubble key={index} sender={message.sender} text={message.text} />
        ))}
      </div>

      {/* Center - Voice Controls */}
      <div className="controls-container">
        <button 
          className={`mic-button ${isListening ? 'listening' : ''}`}
          onClick={toggleListening}
          disabled={isAssistantSpeaking}
        >
          {isListening ? (
            <>
              <div className="pulse-ring"></div>
              <span className="mic-icon">🛑</span>
            </>
          ) : (
            <span className="mic-icon">🎤</span>
          )}
        </button>
      </div>

      {/* Registration Modal */}
      {showRegistration && (
        <RegistrationForm 
          onComplete={handleRegistrationComplete} 
          onClose={() => setShowRegistration(false)} 
        />
      )}
    </div>
  );
};

export default Assistant;