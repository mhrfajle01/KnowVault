import React, { useEffect, useState } from 'react';
import { useUI } from '../context/UIContext';

const CustomModal = () => {
  const { modalConfig, closeModal } = useUI();
  const { isOpen, title, message, content, type, onConfirm } = modalConfig;
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimate(true), 10);
    } else {
      setAnimate(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeModal();
  };

  const getGradient = () => {
    switch (type) {
      case 'danger': return 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)';
      case 'confirm': return 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)';
      case 'read': return 'linear-gradient(120deg, #a18cd1 0%, #fbc2eb 100%)'; // Colorful reading gradient
      default: return 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)';
    }
  };

  const getIcon = () => {
      switch (type) {
          case 'danger': return '🗑️';
          case 'confirm': return '✅';
          case 'read': return '📖';
          default: return 'ℹ️';
      }
  };

  const isReadMode = type === 'read';

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
      style={{ 
        zIndex: 1050, 
        backgroundColor: 'rgba(0,0,0,0.4)', 
        backdropFilter: 'blur(5px)',
        opacity: animate ? 1 : 0,
        transition: 'opacity 0.3s ease'
      }}
      onClick={closeModal} // Close when clicking backdrop
    >
      <div 
        className="card shadow-lg border-0" 
        style={{ 
          maxWidth: isReadMode ? '800px' : '400px', 
          width: '90%', 
          maxHeight: isReadMode ? '90vh' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          transform: animate ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
          transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
            className="card-header text-white border-0 text-center py-4 flex-shrink-0" 
            style={{ 
                background: getGradient(), 
                borderTopLeftRadius: '12px', 
                borderTopRightRadius: '12px' 
            }}
        >
            <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
                {getIcon()}
            </div>
            <h4 className="mt-2 mb-0 fw-bold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{title}</h4>
        </div>
        <div 
            className={`card-body p-4 ${isReadMode ? 'text-start overflow-auto' : 'text-center'}`}
            style={{ minHeight: isReadMode ? '300px' : 'auto' }}
        >
          {content ? (
              <div className="fs-5 text-dark">
                  {content}
              </div>
          ) : (
              <p className="lead fs-6 text-secondary mb-4">{message}</p>
          )}
          
          <div className={`d-flex justify-content-center gap-2 ${isReadMode ? 'mt-4 pt-3 border-top' : ''}`}>
            {!isReadMode && (
                <button 
                    className="btn btn-light border px-4 rounded-pill" 
                    onClick={closeModal}
                >
                    Cancel
                </button>
            )}
            <button 
                className={`btn px-4 rounded-pill text-white shadow-sm`}
                style={{ background: type === 'danger' ? '#ff6b6b' : (isReadMode ? '#a18cd1' : '#4dabf7') }} 
                onClick={handleConfirm}
            >
                {type === 'danger' ? 'Yes, Delete' : (isReadMode ? 'Close' : 'Okay')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
