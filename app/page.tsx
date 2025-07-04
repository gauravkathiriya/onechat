'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuthRedirect } from '@/lib/use-auth-redirect';
import { Header } from '@/components/ui/header';
import { Footer } from '@/components/ui/footer';

export default function HomePage() {
  const { isAutoLoggingIn } = useAuthRedirect();
  const router = useRouter();

  if (isAutoLoggingIn) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="mb-6 text-center animate-pulse">
          <div className="flex items-center justify-center mb-2">
            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">One</span>
            <span className="text-4xl font-bold">Chat</span>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <div className="h-2 w-24 bg-blue-600 dark:bg-blue-400 rounded-full mb-3 animate-pulse"></div>
          <p className="text-sm text-muted-foreground">Checking login status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16 flex flex-col items-center">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              OneChat
            </h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-700 dark:text-gray-300">
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
                className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-gray-800"
              >
                Create Account
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
            <FeatureCard
              icon="/file.svg"
              title="Direct Messages"
              description="Start private conversations with other users by adding them via email."
            />
            <FeatureCard
              icon="/window.svg"
              title="User Profiles"
              description="Customize your profile with a display name and avatar to stand out."
            />
          </div>
        </div>
      </main>
      
      <Footer />
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
      <h3 className="text-xl font-semibold mb-2 text-blue-600 dark:text-blue-400">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  );
}
