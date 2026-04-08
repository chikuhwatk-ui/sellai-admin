'use client';
import { useEffect, useCallback } from 'react';

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity

export function useSessionTimeout() {
  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    document.cookie = 'adminToken=;path=/;max-age=0';
    window.location.href = '/login?reason=idle';
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, IDLE_TIMEOUT);
      // Update last activity timestamp
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    // Listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Check if session already expired on mount
    const lastActivity = localStorage.getItem('lastActivity');
    if (lastActivity && Date.now() - parseInt(lastActivity) > IDLE_TIMEOUT) {
      logout();
      return;
    }

    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [logout]);
}
