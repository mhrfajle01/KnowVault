import React from 'react';
import { motion } from 'framer-motion';

const Loader = () => {
  // Core pulsation
  const coreVariants = {
    animate: {
      scale: [1, 1.2, 1],
      boxShadow: [
        "0 0 20px rgba(79, 172, 254, 0.4)",
        "0 0 60px rgba(0, 242, 254, 0.8)",
        "0 0 20px rgba(79, 172, 254, 0.4)"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Orbiting nodes
  const orbitVariants = (duration, delay) => ({
    animate: {
      rotate: 360,
      transition: {
        duration: duration,
        repeat: Infinity,
        ease: "linear",
        delay: delay
      }
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center"
      style={{
        zIndex: 9999,
        background: 'radial-gradient(circle at center, #1a1a2e 0%, #16213e 100%)', // Deep blue/black theme
        color: 'white'
      }}
    >
      <div className="position-relative" style={{ width: '200px', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        
        {/* Central Core */}
        <motion.div
          variants={coreVariants}
          animate="animate"
          className="rounded-circle"
          style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            zIndex: 10
          }}
        />

        {/* Orbit 1 */}
        <motion.div
          variants={orbitVariants(8, 0)}
          animate="animate"
          className="position-absolute rounded-circle border border-primary opacity-25"
          style={{ width: '120px', height: '120px' }}
        >
           <div className="position-absolute rounded-circle bg-info" style={{ width: '10px', height: '10px', top: '10px', left: '50%' }} />
        </motion.div>

        {/* Orbit 2 (Reverse) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="position-absolute rounded-circle border border-info opacity-25"
          style={{ width: '180px', height: '180px' }}
        >
           <div className="position-absolute rounded-circle bg-white" style={{ width: '8px', height: '8px', bottom: '20px', right: '20%' }} />
        </motion.div>

        {/* Orbit 3 (Fast, Elliptical-ish via CSS if we wanted, but keeping simple circular for now) */}
        <motion.div
           variants={orbitVariants(5, 1)}
           animate="animate"
           className="position-absolute"
           style={{ width: '100%', height: '100%' }}
        >
           {/* Node orbiting far out */}
           <motion.div 
             className="position-absolute rounded-circle bg-warning shadow-sm"
             style={{ width: '12px', height: '12px', top: '0', left: '50%' }}
             animate={{ scale: [1, 1.5, 1] }}
             transition={{ duration: 1, repeat: Infinity }}
           />
        </motion.div>

      </div>

      <motion.h4
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-5 fw-light letter-spacing-2"
        style={{ letterSpacing: '4px', textTransform: 'uppercase' }}
      >
        Initializing Vault
      </motion.h4>
      
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '200px' }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
        style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #4facfe, transparent)', marginTop: '1rem' }}
      />

    </motion.div>
  );
};

export default Loader;
