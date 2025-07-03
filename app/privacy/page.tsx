'use client';

import { Header } from '@/components/ui/header';
import { Footer } from '@/components/ui/footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-8 text-center">Privacy & Security</h1>
          
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Our Commitment to Privacy</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              At OneChat, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully to understand our practices regarding your personal data.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              We collect several types of information from and about users of our platform, including:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Personal identifiers such as name and email address</li>
              <li>Profile information you provide (display name, avatar)</li>
              <li>Content of messages you send through our platform</li>
              <li>Usage data and analytics</li>
              <li>Device and connection information</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and complete transactions</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Protect the security and integrity of our platform</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized or unlawful processing, accidental loss, destruction, or damage. All information you provide to us is stored on secure servers, and we use encryption when transmitting sensitive information.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300">
              If you have questions or concerns about this Privacy Policy or our practices, please contact us at privacy@onechat.com.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 