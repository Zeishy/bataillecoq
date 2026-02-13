import { useEffect } from 'react';
import confetti from 'canvas-confetti';

// Confetti celebration effect
export const celebrateWin = () => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    
    // Fire from two sides
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
    });
    
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
    });
  }, 250);
};

// Simple burst celebration
export const celebrateSuccess = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#ef4444', '#f59e0b', '#10b981']
  });
};

// Fireworks effect
export const fireworks = () => {
  const duration = 5 * 1000;
  const animationEnd = Date.now() + duration;

  const interval = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#ef4444', '#f59e0b']
    });
    
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#10b981', '#3b82f6']
    });
  }, 200);
};

// Hook for auto-celebration on mount
export const useCelebration = (trigger, type = 'success') => {
  useEffect(() => {
    if (trigger) {
      switch (type) {
        case 'win':
          celebrateWin();
          break;
        case 'fireworks':
          fireworks();
          break;
        default:
          celebrateSuccess();
      }
    }
  }, [trigger, type]);
};

export default {
  celebrateWin,
  celebrateSuccess,
  fireworks,
  useCelebration
};
