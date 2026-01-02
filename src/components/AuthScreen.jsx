import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cryptoUtils } from '../utils/crypto';
import { useVault } from '../context/VaultContext';

const AuthScreen = ({ onUnlock, isSetup }) => {
  const { recoverVault, factoryReset } = useVault();
  
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

  // 1. Show Recovery Code after Setup
  if (generatedRecoveryCode) {
      return (
        <div className="d-flex align-items-center justify-content-center vh-100 bg-body-tertiary">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card shadow-lg border-0" style={{ maxWidth: '500px' }}>
                <div className="card-body p-5 text-center">
                    <h2 className="text-success mb-3">Setup Complete! 🎉</h2>
                    <p className="text-muted mb-4">Your vault is ready. Please save your <strong>Emergency Recovery Code</strong> immediately. This is the ONLY way to access your data if you forget your password.</p>
                    
                    <div className="p-3 bg-light rounded-3 border border-success mb-4 position-relative">
                        <code className="fs-5 fw-bold text-dark">{generatedRecoveryCode}</code>
                    </div>
                    
                    <div className="d-grid gap-2">
                        <button className="btn btn-success" onClick={() => setGeneratedRecoveryCode(null)}>
                            I have saved this code safely
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
      );
  }

  // 2. Normal Auth Screen
  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-body-tertiary position-relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card shadow-lg border-0" 
        style={{ maxWidth: '400px', width: '100%' }}
      >
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h1 className="h3 mb-3 fw-normal">
              {isSetup ? 'Setup Vault Lock' : 'Unlock Vault'}
            </h1>
            <p className="text-muted">
              {isSetup 
                ? 'Create a master password to encrypt your data.' 
                : 'Enter your master password.'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-floating mb-3">
              <input
                type="password"
                className="form-control"
                id="floatingPassword"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <label htmlFor="floatingPassword">Master Password</label>
            </div>

            {isSetup && (
              <>
                <div className="mb-3">
                    <div className="progress" style={{ height: '5px' }}>
                    <div 
                        className={`progress-bar bg-${strengthInfo.color}`} 
                        role="progressbar" 
                        style={{ width: strengthInfo.width, transition: 'width 0.3s ease' }}
                    ></div>
                    </div>
                    <small className={`text-${strengthInfo.color} mt-1 d-block text-end`}>
                    {strengthInfo.label}
                    </small>
                </div>
                <div className="form-floating mb-3">
                    <input
                    type="password"
                    className="form-control"
                    id="floatingConfirm"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <label htmlFor="floatingConfirm">Confirm Password</label>
                </div>
                <div className="mb-3">
                    <button 
                        type="button" 
                        className="btn btn-link btn-sm text-decoration-none p-0 mb-2"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        {showAdvanced ? '▼ Hide Advanced' : '▶ Advanced Security'}
                    </button>
                    {showAdvanced && (
                        <div className="card card-body bg-light border-0 small">
                            <label className="form-label fw-bold">Panic Password (Optional)</label>
                            <input
                                type="password"
                                className="form-control form-control-sm mb-1"
                                placeholder="Enter a different password"
                                value={panicPassword}
                                onChange={(e) => setPanicPassword(e.target.value)}
                            />
                        </div>
                    )}
                </div>
              </>
            )}

            {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}

            <button 
              className="btn btn-primary w-100 py-2" 
              type="submit" 
              disabled={loading}
            >
              {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
              {isSetup ? 'Encrypt & Enter' : 'Unlock'}
            </button>
            
            {!isSetup && (
                <div className="text-center mt-3">
                    <button 
                        type="button" 
                        className="btn btn-link btn-sm text-muted text-decoration-none"
                        onClick={() => { setError(''); setShowForgotModal(true); }}
                    >
                        Forgot Password?
                    </button>
                </div>
            )}
          </form>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
            <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center" style={{ zIndex: 1050 }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="card shadow rounded-4" style={{ width: '90%', maxWidth: '400px' }}>
                    <div className="card-header bg-white border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Vault Recovery</h5>
                        <button className="btn-close" onClick={() => setShowForgotModal(false)}></button>
                    </div>
                    <div className="card-body p-4">
                        <ul className="nav nav-pills nav-fill mb-3" id="pills-tab" role="tablist">
                            <li className="nav-item">
                                <button className="nav-link active small" id="pills-recover-tab" data-bs-toggle="pill" data-bs-target="#pills-recover" type="button">Recover</button>
                            </li>
                            <li className="nav-item">
                                <button className="nav-link small text-danger" id="pills-reset-tab" data-bs-toggle="pill" data-bs-target="#pills-reset" type="button">Factory Reset</button>
                            </li>
                        </ul>
                        <div className="tab-content" id="pills-tabContent">
                            <div className="tab-pane fade show active" id="pills-recover" role="tabpanel">
                                <p className="small text-muted mb-3">Enter your 16-character Emergency Recovery Code to unlock your vault.</p>
                                <form onSubmit={handleRecovery}>
                                    <input 
                                        type="text" 
                                        className="form-control mb-3 font-monospace text-uppercase" 
                                        placeholder="ABCD-1234-..." 
                                        value={recoveryInput}
                                        onChange={(e) => setRecoveryInput(e.target.value)}
                                        required
                                    />
                                    <button type="submit" className="btn btn-primary w-100">Recover Vault</button>
                                </form>
                            </div>
                            <div className="tab-pane fade" id="pills-reset" role="tabpanel">
                                <div className="alert alert-danger small mb-3">
                                    <strong>WARNING:</strong> This will permanently delete ALL your data. This action cannot be undone.
                                </div>
                                <p className="small text-muted mb-2">Type <strong>DELETE</strong> below to confirm.</p>
                                <input 
                                    type="text" 
                                    className="form-control mb-3" 
                                    placeholder="DELETE" 
                                    value={resetConfirm}
                                    onChange={(e) => setResetConfirm(e.target.value)}
                                />
                                <button 
                                    className="btn btn-danger w-100" 
                                    disabled={resetConfirm !== 'DELETE'}
                                    onClick={handleFactoryReset}
                                >
                                    Erase Everything
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