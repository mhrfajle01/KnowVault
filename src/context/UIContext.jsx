import React, { createContext, useContext, useState } from 'react';

const UIContext = createContext();

export const UIProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    content: null,
    item: null,
    type: 'info', // info, confirm, danger, read
    onConfirm: null,
    onCancel: null,
    isLoading: false
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const showModal = ({ title, message, content, item, type = 'info', onConfirm, onCancel, isLoading = false }) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      content,
      item,
      type,
      onConfirm,
      onCancel,
      isLoading
    });
  };

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const setModalLoading = (isLoading) => {
    setModalConfig(prev => ({ ...prev, isLoading }));
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false, isLoading: false }));
  };

  return (
    <UIContext.Provider value={{ modalConfig, showModal, closeModal, setModalLoading, isSearchFocused, setIsSearchFocused, toast, showToast }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);
