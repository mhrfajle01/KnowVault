import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cryptoUtils } from '../utils/crypto';
import { useVault } from '../context/VaultContext';
import { useTheme } from '../context/ThemeContext';
import { staggeredContainer, itemVariants, pop, slideInDown } from '../utils/animations';

const AuthScreen = ({ onUnlock, isSetup }) => {
  const { recoverVault, factoryReset } = useVault();
  const { theme, toggleTheme } = useTheme();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(0);
  const [panicPassword, setPanicPassword] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // New States
  const [generatedRecoveryCode, setGeneratedRecoveryCode] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');

  useEffect(() => {
    if (isSetup) {
      setStrength(calculateStrength(password));
    }
  }, [password, isSetup]);

  const calculateStrength = (pwd) => {
    let score = 0;
    if (!pwd) return 0;
    if (pwd.length > 6) score++;
    if (pwd.length > 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return Math.min(score, 4); 
  };

  const getStrengthLabel = (score) => {
    switch (score) {
      case 0: return { label: 'Very Weak', color: 'danger', width: '20%' };
      case 1: return { label: 'Weak', color: 'danger', width: '40%' };
      case 2: return { label: 'Fair', color: 'warning', width: '60%' };
      case 3: return { label: 'Good', color: 'info', width: '80%' };
      case 4: return { label: 'Strong', color: 'success', width: '100%' };
      default: return { label: '', color: 'secondary', width: '0%' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (isSetup) {
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }
        if (strength < 2) {
            setError("Password is too weak. Please use a stronger password.");
            return;
        }
        if (panicPassword && panicPassword === password) {
            setError("Panic password cannot be the same as master password.");
            return;
        }
    }

    setLoading(true);
    setTimeout(async () => {
        try {
            const code = await onUnlock(password, panicPassword);
            if (isSetup && code) {
                setGeneratedRecoveryCode(code);
            }
        } catch (err) {
            setError(err.message || "Authentication failed");
            setLoading(false);
        }
    }, 100);
  };

  const handleRecovery = async (e) => {
      e.preventDefault();
      try {
          await recoverVault(recoveryInput.trim());
          setShowForgotModal(false);
      } catch (err) {
          setError("Recovery failed. Check your code.");
      }
  };

  const handleFactoryReset = async () => {
      if (resetConfirm === 'DELETE') {
          await factoryReset();
      }
  };

  const strengthInfo = getStrengthLabel(strength);

  // Background Animation Elements
  const bgBubbles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      size: Math.random() * 100 + 50,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 10 + 10
  }));

  // 1. Show Recovery Code after Setup
  if (generatedRecoveryCode) {
      return (
        <div className="d-flex align-items-center justify-content-center vh-100 bg-body-tertiary overflow-hidden position-relative">
             {/* Animated Background */}
             <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0, opacity: 0.4 }}>
                {bgBubbles.map(b => (
                    <motion.div
                        key={b.id}
                        animate={{
                            y: [0, -1000],
                            x: [0, Math.random() * 200 - 100],
                            rotate: 360
                        }}
                        transition={{
                            duration: b.duration,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                        className="position-absolute rounded-circle"
                        style={{
                            width: b.size,
                            height: b.size,
                            left: `${b.x}%`,
                            bottom: `-10%`,
                            background: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
                            filter: 'blur(20px)',
                            opacity: 0.2
                        }}
                    />
                ))}
            </div>

            <motion.div 
                initial={{ scale: 0.8, opacity: 0, rotate: -5 }} 
                animate={{ scale: 1, opacity: 1, rotate: 0 }} 
                className="card shadow-lg border-0 position-relative" 
                style={{ maxWidth: '500px', zIndex: 1, borderRadius: '24px' }}
            >
                <div className="card-body p-5 text-center">
                    <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        transition={{ type: "spring", delay: 0.3 }}
                        className="display-1 mb-4"
                    >
                        🎉
                    </motion.div>
                    <h2 className="text-success mb-3 fw-bold">Setup Complete!</h2>
                    <p className="text-muted mb-4">Your vault is ready. Please save your <strong>Emergency Recovery Code</strong> immediately. This is the ONLY way to access your data if you forget your password.</p>
                    
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="p-4 bg-body-tertiary rounded-4 border border-success border-2 mb-4 position-relative overflow-hidden"
                    >
                        <code className="fs-4 fw-bold text-primary">{generatedRecoveryCode}</code>
                        <div className="position-absolute top-0 start-0 w-100 h-100 bg-success opacity-10" />
                    </motion.div>
                    
                    <div className="d-grid gap-2">
                        <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn btn-success py-3 rounded-pill fw-bold shadow-sm" 
                            onClick={() => setGeneratedRecoveryCode(null)}
                        >
                            I have saved this code safely
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>
      );
  }

  // 2. Normal Auth Screen
  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-body-tertiary position-relative overflow-hidden">
      {/* Theme Toggle in Corner */}
      <motion.button
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="btn btn-outline-secondary rounded-pill position-absolute top-0 end-0 m-4 shadow-sm"
        style={{ zIndex: 10, padding: '8px 16px' }}
        onClick={toggleTheme}
      >
        {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
      </motion.button>

      {/* Animated Background */}
      <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0, opacity: 0.4 }}>
        {bgBubbles.map(b => (
            <motion.div
                key={b.id}
                animate={{
                    y: [0, -1000],
                    x: [0, Math.random() * 200 - 100],
                    rotate: 360
                }}
                transition={{
                    duration: b.duration,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="position-absolute rounded-circle"
                style={{
                    width: b.size,
                    height: b.size,
                    left: `${b.x}%`,
                    bottom: `-10%`,
                    background: theme === 'light' ? 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)' : 'linear-gradient(45deg, #a18cd1 0%, #fbc2eb 100%)',
                    filter: 'blur(20px)',
                    opacity: 0.2
                }}
            />
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="card shadow-lg border-0" 
        style={{ maxWidth: '420px', width: '90%', zIndex: 1, borderRadius: '24px', overflow: 'hidden' }}
      >
        <div className="card-body p-5">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-5"
          >
            <motion.div 
                animate={{ 
                    rotateY: [0, 360],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="display-4 mb-3"
            >
                {isSetup ? '🛡️' : '🔒'}
            </motion.div>
            <h1 className="h3 mb-2 fw-bold text-gradient">
              {isSetup ? 'Welcome to Vault' : 'Welcome Back'}
            </h1>
            <p className="text-muted small">
              {isSetup 
                ? 'Create a secure master password to protect your knowledge.' 
                : 'Enter your password to unlock your knowledge vault.'}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit}>
            <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="form-floating mb-3"
            >
              <input
                type="password"
                className="form-control rounded-3 border-light-subtle"
                id="floatingPassword"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                style={{ height: '60px' }}
              />
              <label htmlFor="floatingPassword">Master Password</label>
            </motion.div>

            {isSetup && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
              >
                <div className="mb-3 px-1">
                    <div className="progress rounded-pill overflow-hidden" style={{ height: '6px', background: 'var(--bs-tertiary-bg)' }}>
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: strengthInfo.width }}
                        className={`progress-bar bg-${strengthInfo.color}`} 
                        role="progressbar" 
                    ></motion.div>
                    </div>
                    <div className="d-flex justify-content-between mt-1 px-1">
                        <small className="text-muted x-small">Password Strength</small>
                        <small className={`fw-bold x-small text-${strengthInfo.color}`}>
                            {strengthInfo.label}
                        </small>
                    </div>
                </div>
                <motion.div 
                     initial={{ x: -20, opacity: 0 }}
                     animate={{ x: 0, opacity: 1 }}
                     transition={{ delay: 0.4 }}
                     className="form-floating mb-3"
                >
                    <input
                    type="password"
                    className="form-control rounded-3 border-light-subtle"
                    id="floatingConfirm"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ height: '60px' }}
                    />
                    <label htmlFor="floatingConfirm">Confirm Password</label>
                </motion.div>
                <div className="mb-4">
                    <button 
                        type="button" 
                        className="btn btn-link btn-sm text-decoration-none p-0 mb-2 x-small fw-bold text-secondary"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        {showAdvanced ? '▼ Hide Advanced Options' : '▶ Advanced Security Options'}
                    </button>
                    <AnimatePresence>
                        {showAdvanced && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="card card-body bg-body-tertiary border-0 p-3 rounded-4 small mb-2">
                                    <label className="form-label fw-bold x-small mb-1">Panic Password (Optional)</label>
                                    <p className="x-small text-muted mb-2">A "dummy" password that opens an empty vault if forced to reveal.</p>
                                    <input
                                        type="password"
                                        className="form-control form-control-sm border-0 shadow-sm"
                                        placeholder="Different from master"
                                        value={panicPassword}
                                        onChange={(e) => setPanicPassword(e.target.value)}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
              </motion.div>
            )}

            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0, scale: 0.9 }}
                        animate={{ height: 'auto', opacity: 1, scale: 1 }}
                        exit={{ height: 0, opacity: 0, scale: 0.9 }}
                        className="alert alert-danger py-2 px-3 small rounded-3 border-0 shadow-sm mb-3" 
                        role="alert"
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" 
              type="submit" 
              disabled={loading}
              style={{ background: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)', border: 'none' }}
            >
              {loading ? <span className="spinner-border spinner-border-sm"></span> : <span>{isSetup ? 'Encrypt & Setup Vault' : 'Unlock Access'}</span>}
              {!loading && <span>✨</span>}
            </motion.button>
            
            {!isSetup && (
                <div className="text-center mt-4">
                    <button 
                        type="button" 
                        className="btn btn-link btn-sm text-muted text-decoration-none x-small fw-bold"
                        onClick={() => { setError(''); setShowForgotModal(true); }}
                    >
                        Forgot Password? Recover Vault
                    </button>
                </div>
            )}
          </form>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
            <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1050, backdropFilter: 'blur(5px)' }}>
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0, y: 20 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                    exit={{ scale: 0.8, opacity: 0, y: 20 }} 
                    className="card shadow-lg border-0 rounded-4 overflow-hidden" 
                    style={{ width: '100%', maxWidth: '400px' }}
                >
                    <div className="card-header bg-body-tertiary border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                        <h5 className="mb-0 fw-bold">Vault Recovery</h5>
                        <button className="btn-close" onClick={() => setShowForgotModal(false)}></button>
                    </div>
                    <div className="card-body p-4">
                        <ul className="nav nav-pills nav-fill mb-4 bg-body-tertiary p-1 rounded-pill" id="pills-tab" role="tablist">
                            <li className="nav-item">
                                <button className="nav-link active rounded-pill x-small fw-bold" id="pills-recover-tab" data-bs-toggle="pill" data-bs-target="#pills-recover" type="button">Recover</button>
                            </li>
                            <li className="nav-item">
                                <button className="nav-link rounded-pill x-small fw-bold text-danger" id="pills-reset-tab" data-bs-toggle="pill" data-bs-target="#pills-reset" type="button">Factory Reset</button>
                            </li>
                        </ul>
                        <div className="tab-content" id="pills-tabContent">
                            <div className="tab-pane fade show active" id="pills-recover" role="tabpanel">
                                <p className="small text-muted mb-4">Enter your 16-character Emergency Recovery Code to unlock your vault.</p>
                                <form onSubmit={handleRecovery}>
                                    <div className="mb-3">
                                        <input 
                                            type="text" 
                                            className="form-control form-control-lg rounded-3 border-light-subtle font-monospace text-uppercase text-center" 
                                            placeholder="XXXX-XXXX-XXXX-XXXX" 
                                            value={recoveryInput}
                                            onChange={(e) => setRecoveryInput(e.target.value)}
                                            required
                                            style={{ letterSpacing: '1px' }}
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-primary w-100 py-2 rounded-pill fw-bold">Recover Vault</button>
                                </form>
                            </div>
                            <div className="tab-pane fade" id="pills-reset" role="tabpanel">
                                <div className="alert alert-danger x-small mb-3 rounded-3 border-0">
                                    <strong>WARNING:</strong> This will permanently delete ALL your data. This action cannot be undone.
                                </div>
                                <p className="small text-muted mb-2">Type <strong>DELETE</strong> below to confirm.</p>
                                <input 
                                    type="text" 
                                    className="form-control mb-3 rounded-3" 
                                    placeholder="DELETE" 
                                    value={resetConfirm}
                                    onChange={(e) => setResetConfirm(e.target.value)}
                                />
                                <button 
                                    className="btn btn-danger w-100 py-2 rounded-pill fw-bold" 
                                    disabled={resetConfirm !== 'DELETE'}
                                    onClick={handleFactoryReset}
                                >
                                    Erase Everything Permanently
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthScreen;