'use client';
import { useEffect, useCallback } from 'react';

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity

export function useSessionTimeout() {
  const logout = useCallback(() => {
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminRefreshToken');
    sessionStorage.removeItem('adminUser');
    sessionStorage.removeItem('lastActivity');
    document.cookie = 'adminToken=;path=/;max-age=0';
    window.location.href = '/login?reason=idle';
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, IDLE_TIMEOUT);
      // Update last activity timestamp
      sessionStorage.setItem('lastActivity', Date.now().toString());
    };

    // Listen for user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Check if session already expired on mount — but only if lastActivity
    // was set during this session (not stale from a previous one)
    const lastActivity = sessionStorage.getItem('lastActivity');
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity);
      if (elapsed > IDLE_TIMEOUT) {
        // Reset lastActivity so a fresh login isn't immediately expired
        sessionStorage.setItem('lastActivity', Date.now().toString());
      }
    }

    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [logout]);
}
