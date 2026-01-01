export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
};

export const slideIn = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
  transition: { type: "spring", stiffness: 300, damping: 30 }
};

export const scaleUp = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
  transition: { type: "spring", stiffness: 300, damping: 25 }
};

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

export const hoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 }
};

export const slideInRight = {
  initial: { x: 50, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
  transition: { type: "spring", stiffness: 300, damping: 30 }
};

export const slideInDown = {
  initial: { y: -20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.5, ease: "easeOut" }
};

export const bounce = {
  whileHover: { scale: 1.1 },
  whileTap: { scale: 0.9 },
  transition: { type: "spring", stiffness: 400, damping: 10 }
};

export const pageTransition = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
  transition: { duration: 0.3 }
};

export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

export const staggeredContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const loadingDots = {
  animate: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

export const loadingDot = {
  animate: {
    y: ["0%", "-50%", "0%"],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const skeleton = {
  initial: { opacity: 0.3 },
  animate: {
    opacity: [0.3, 0.6, 0.3],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const rotate = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

export const glow = {
  initial: { boxShadow: "0 0 0px rgba(var(--bs-primary-rgb), 0)" },
  animate: {
    boxShadow: [
      "0 0 0px rgba(var(--bs-primary-rgb), 0)",
      "0 0 20px rgba(var(--bs-primary-rgb), 0.6)",
      "0 0 0px rgba(var(--bs-primary-rgb), 0)"
    ],
    transition: { duration: 0.8 }
  }
};

export const accordion = {
  initial: { height: 0, opacity: 0, overflow: 'hidden' },
  animate: { height: 'auto', opacity: 1, transition: { duration: 0.3, ease: "easeInOut" } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.3, ease: "easeInOut" } }
};
