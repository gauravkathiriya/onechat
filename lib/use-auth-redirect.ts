import { useState, useEffect } from 'react';
import { useSupabase } from './auth-provider';
import { useRouter } from 'next/navigation';

export function useAuthRedirect() {
  const { user, isLoading } = useSupabase();
  const [isAutoLoginChecked, setIsAutoLoginChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Wait for auth state to be determined
    if (!isLoading) {
      // If user is logged in, redirect to the appropriate page
      if (user) {
        if (!user.user_metadata?.has_completed_profile) {
          router.push('/profile-setup');
        } else {
          router.push('/dashboard');
        }
      }
      
      // Mark auto-login check as complete
      setIsAutoLoginChecked(true);
    }
  }, [user, isLoading, router]);

  return {
    isAutoLoginChecked,
    isLoading,
    user,
    isAutoLoggingIn: isLoading || (user && !isAutoLoginChecked),
  };
} 