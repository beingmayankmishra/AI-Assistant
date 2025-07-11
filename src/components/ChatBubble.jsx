import React from 'react';

const ChatBubble = ({ sender, text }) => {
  return (
    <div className={`chat-bubble ${sender}`}>
      <div className="bubble-content">
        {text}
      </div>
    </div>
  );
};

export default ChatBubble;