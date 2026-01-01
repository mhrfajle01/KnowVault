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
    onCancel: null
  });

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const showModal = ({ title, message, content, item, type = 'info', onConfirm, onCancel }) => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      content,
      item,
      type,
      onConfirm,
      onCancel
    });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <UIContext.Provider value={{ modalConfig, showModal, closeModal, isSearchFocused, setIsSearchFocused }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => useContext(UIContext);
