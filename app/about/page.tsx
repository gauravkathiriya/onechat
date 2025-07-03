'use client';

import { Header } from '@/components/ui/header';
import { Footer } from '@/components/ui/footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-8 text-center">About Us</h1>
          
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              At OneChat, our mission is to create a seamless and secure communication platform that brings people together. 
              We believe in the power of real-time conversations to build connections and foster collaboration.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Founded in 2023, OneChat was born from the idea that communication should be simple, secure, and accessible to everyone. 
              Our team of passionate developers and designers has worked tirelessly to create an intuitive platform that prioritizes user experience and privacy.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Privacy:</strong> We prioritize your data security and privacy in all our design decisions.</li>
              <li><strong>Simplicity:</strong> We believe great technology should be easy to use.</li>
              <li><strong>Connection:</strong> We're dedicated to helping people build meaningful connections.</li>
              <li><strong>Innovation:</strong> We continuously improve our platform with the latest technologies.</li>
            </ul>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 