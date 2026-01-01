import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAI } from '../context/AIContext';
import { itemVariants, loadingDots, loadingDot } from '../utils/animations';

const AIChat = () => {
  const { 
    apiKey, 
    provider,
    saveConfig, 
    chatHistory, 
    askAI, 
    isAiLoading, 
    clearHistory, 
    isOpen, 
    toggleChat
  } = useAI();
  
  const [input, setInput] = useState('');
  const [tempKey, setTempKey] = useState(apiKey);
  const [tempProvider, setTempProvider] = useState(provider);
  const [showSettings, setShowSettings] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  // Speech Recognition Setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  if (recognition) {
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }

  const toggleVoiceInput = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      try {
        recognition?.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    }
  };

  useEffect(() => {
    setTempKey(apiKey);
    setTempProvider(provider);
  }, [apiKey, provider]);

  const handleSaveSettings = () => {
    saveConfig(tempKey, tempProvider);
    setShowSettings(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    askAI(input);
    setInput('');
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button 
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, rotate: 10 }}
        whileTap={{ scale: 0.9 }}
        className="btn btn-primary rounded-circle shadow-lg position-fixed d-flex align-items-center justify-content-center"
        style={{ 
            bottom: '30px', 
            right: '30px', 
            width: '60px', 
            height: '60px', 
            zIndex: 1060,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
        onClick={toggleChat}
        title="Ask AI"
      >
        <span style={{ fontSize: '24px' }}>{isOpen ? '✕' : '✨'}</span>
      </motion.button>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`position-fixed top-0 end-0 h-100 bg-body shadow-lg d-flex flex-column`}
            style={{  
                width: '350px', 
                maxWidth: '100%', 
                zIndex: 1070, 
            }}
          >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center p-3 bg-gradient-primary text-white">
              <h5 className="mb-0 fw-bold"><span className="me-2">✨</span>Vault AI</h5>
              <div>
                <button className="btn btn-sm btn-link text-white" onClick={() => setShowSettings(!showSettings)}>⚙️</button>
                <button className="btn btn-sm btn-link text-white" onClick={toggleChat}>✕</button>
              </div>
            </div>

            {/* Settings Area */}
            <AnimatePresence>
              {showSettings && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-3 bg-body-tertiary border-bottom overflow-hidden"
                  >
                      <div className="mb-2">
                          <label className="form-label small fw-bold">AI Provider</label>
                          <select 
                              className="form-select form-select-sm" 
                              value={tempProvider} 
                              onChange={(e) => setTempProvider(e.target.value)}
                          >
                              <option value="gemini">Google Gemini</option>
                              <option value="deepseek">DeepSeek (via OpenRouter)</option>
                              <option value="local">Local (Q&A)</option>
                          </select>
                      </div>
                      {tempProvider !== 'local' && (
                      <div className="mb-2">
                          <label className="form-label small fw-bold">API Key</label>
                          <input 
                              type="password" 
                              className="form-control form-control-sm" 
                              value={tempKey} 
                              onChange={(e) => setTempKey(e.target.value)} 
                              placeholder="Paste key here..."
                          />
                      </div>
                      )}
                      <button className="btn btn-sm btn-primary w-100" onClick={handleSaveSettings}>Save Configuration</button>
                  </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <div className="flex-grow-1 overflow-auto p-3 bg-body-tertiary" style={{ scrollBehavior: 'smooth' }}>
                {chatHistory.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center text-muted mt-5"
                    >
                        <p className="display-4">🤖</p>
                        <p>Ask me anything about your notes!</p>
                    </motion.div>
                )}
                
                {chatHistory.map((msg, idx) => (
                    <motion.div 
                      key={idx} 
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      className={`d-flex mb-3 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                    >
                        <div className={`p-3 rounded-4 shadow-sm ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-body-tertiary'}`} style={{ maxWidth: '85%' }}>
                            {msg.role === 'user' ? (
                                <div className="mb-0">{msg.text}</div>
                            ) : (
                                <div className="markdown-preview mb-0">
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
                {isAiLoading && (
                    <div className="d-flex justify-content-start mb-3">
                        <div className="bg-body p-3 rounded-4 shadow-sm border">
                            <motion.div 
                                variants={loadingDots}
                                initial="initial"
                                animate="animate"
                                className="d-flex gap-1 align-items-center"
                                style={{ height: '20px' }}
                            >
                                <motion.span variants={loadingDot} className="rounded-circle bg-primary" style={{ width: '8px', height: '8px' }} />
                                <motion.span variants={loadingDot} className="rounded-circle bg-primary" style={{ width: '8px', height: '8px' }} />
                                <motion.span variants={loadingDot} className="rounded-circle bg-primary" style={{ width: '8px', height: '8px' }} />
                            </motion.div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-body border-top">
                <form onSubmit={handleSubmit} className="d-flex gap-2">
                    {recognition && (
                        <motion.button 
                            whileTap={{ scale: 0.9 }}
                            type="button" 
                            className={`btn ${isListening ? 'btn-danger pulse-red' : 'btn-outline-secondary'}`}
                            onClick={toggleVoiceInput}
                            title={isListening ? "Stop listening" : "Voice input"}
                        >
                            {isListening ? '⏹️' : '🎤'}
                        </motion.button>
                    )}
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Ask your vault..." 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isAiLoading}
                    />
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      type="submit" 
                      className="btn btn-primary" 
                      disabled={isAiLoading || !input.trim()}
                    >
                        ➤
                    </motion.button>
                </form>
                {chatHistory.length > 0 && (
                    <div className="text-center mt-2">
                        <button className="btn btn-link btn-sm text-muted p-0" onClick={clearHistory} style={{fontSize: '0.8rem'}}>Clear Chat</button>
                    </div>
                )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChat;
