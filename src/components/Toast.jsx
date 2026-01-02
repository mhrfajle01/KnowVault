import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUI } from '../context/UIContext';

const Toast = () => {
  const { toast } = useUI();

  const variants = {
    initial: { opacity: 0, y: 50, scale: 0.8 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success': return '#40c057';
      case 'error': return '#fa5252';
      case 'warning': return '#fab005';
      default: return '#228be6';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <div 
      className="position-fixed start-50 translate-middle-x" 
      style={{ bottom: '30px', zIndex: 2000, pointerEvents: 'none' }}
    >
      <AnimatePresence>
        {toast.show && (
          <motion.div
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="d-flex align-items-center gap-3 px-4 py-3 rounded-pill shadow-lg text-white"
            style={{ 
              backgroundColor: getBackgroundColor(),
              backdropFilter: 'blur(10px)',
              minWidth: '300px',
              maxWidth: '90vw',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{getIcon()}</span>
            <span className="fw-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
