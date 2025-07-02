'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/auth-provider';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function HomePage() {
  const { user, isLoading } = useSupabase();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (!user.user_metadata?.has_completed_profile) {
          router.push('/profile-setup');
        } else {
          router.push('/chat');
        }
      }
    }
  }, [user, isLoading, router]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
            OneChat
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
            A modern real-time chat application. Connect instantly with friends and colleagues.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              onClick={() => router.push('/login')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get Started
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/login?signup=true')}
            >
              Create Account
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          <FeatureCard 
            icon="/globe.svg"
            title="Global Chat"
            description="Chat with everyone in a single global stream. Messages are delivered in real-time."
          />
          <FeatureCard 
            icon="/file.svg"
            title="User Profiles"
            description="Customize your profile with a display name and avatar to stand out."
          />
          <FeatureCard 
            icon="/window.svg"
            title="Emoji Support"
            description="Express yourself with a wide range of emojis using our built-in emoji picker."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: { 
  icon: string; 
  title: string; 
  description: string 
}) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col items-center text-center transition-transform hover:scale-105">
      <div className="mb-4 bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
        <Image src={icon} alt={title} width={24} height={24} />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}
