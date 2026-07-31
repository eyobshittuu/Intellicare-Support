/**
 * Notification Debug Helper
 * Add this to localStorage to enable debug logging
 */

export const enableNotificationDebug = () => {
  localStorage.setItem('debug:notifications', 'true');
  console.log('✅ Notification debugging enabled');
  console.log('Reload the page to see debug logs');
};

export const disableNotificationDebug = () => {
  localStorage.removeItem('debug:notifications');
  console.log('❌ Notification debugging disabled');
};

export const isDebugEnabled = () => {
  return localStorage.getItem('debug:notifications') === 'true';
};

export const debugLog = (component, message, data) => {
  if (isDebugEnabled()) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [${component}] ${message}`, data || '');
  }
};

// Make available globally for easy access in console
if (typeof window !== 'undefined') {
  window.enableNotificationDebug = enableNotificationDebug;
  window.disableNotificationDebug = disableNotificationDebug;
}

export default {
  enableNotificationDebug,
  disableNotificationDebug,
  isDebugEnabled,
  debugLog
};
