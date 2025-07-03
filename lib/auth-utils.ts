// Auth utilities for handling session persistence

/**
 * Sets the "remember me" preference
 */
export function setRememberMe(value: boolean): void {
  if (typeof window !== 'undefined') {
    if (value) {
      localStorage.setItem('onechat-remember-me', 'true');
    } else {
      // If remember me is disabled, remove the item
      localStorage.removeItem('onechat-remember-me');
      // Clear any existing session data from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('supabase.auth') || key.startsWith('onechat-auth')) {
          localStorage.removeItem(key);
        }
      });
    }
  }
}

/**
 * Checks if "remember me" is enabled
 */
export function isRememberMeEnabled(): boolean {
  if (typeof window !== 'undefined') {
    // Default to true if not explicitly set to false
    return localStorage.getItem('onechat-remember-me') !== 'false';
  }
  return true;
} 