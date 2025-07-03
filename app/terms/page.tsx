'use client';

import { Header } from '@/components/ui/header';
import { Footer } from '@/components/ui/footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-8 text-center">Terms & Conditions</h1>
          
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Agreement to Terms</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              By accessing or using the OneChat platform, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you disagree with any part of the terms, you may not access the service.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Use of the Service</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              OneChat provides a platform for real-time communication. As a user, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Provide accurate and complete information when creating your account</li>
              <li>Maintain the security of your account and password</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Not use the service for any illegal or unauthorized purpose</li>
              <li>Not attempt to interfere with or disrupt the service or servers</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mb-4">Content Guidelines</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              You are responsible for all content you post, send, or otherwise make available via our service. You agree not to transmit content that:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Is unlawful, harmful, threatening, abusive, harassing, or defamatory</li>
              <li>Infringes on intellectual property rights of others</li>
              <li>Contains software viruses or any other malicious code</li>
              <li>Constitutes unsolicited or unauthorized advertising or spam</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mb-4">Termination</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Changes to Terms</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300">
              If you have any questions about these Terms, please contact us at terms@onechat.com.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 