'use client';

import { Header } from '@/components/ui/header';
import { Footer } from '@/components/ui/footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-8 text-center text-blue-700 dark:text-blue-400">Terms & Conditions</h1>
          
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Agreement to Terms</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              By accessing or using the OneChat platform, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you disagree with any part of the terms, you may not access the service.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Use of the Service</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              OneChat provides a platform for real-time communication. As a user, you agree to:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong className="text-blue-600 dark:text-blue-400">Provide accurate</strong> and complete information when creating your account</li>
              <li><strong className="text-blue-600 dark:text-blue-400">Maintain the security</strong> of your account and password</li>
              <li><strong className="text-blue-600 dark:text-blue-400">Accept responsibility</strong> for all activities that occur under your account</li>
              <li><strong className="text-blue-600 dark:text-blue-400">Not use the service</strong> for any illegal or unauthorized purpose</li>
              <li><strong className="text-blue-600 dark:text-blue-400">Not attempt to interfere</strong> with or disrupt the service or servers</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Content Guidelines</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              You are responsible for all content you post, send, or otherwise make available via our service. You agree not to transmit content that:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong className="text-blue-600 dark:text-blue-400">Is unlawful</strong>, harmful, threatening, abusive, harassing, or defamatory</li>
              <li><strong className="text-blue-600 dark:text-blue-400">Infringes</strong> on intellectual property rights of others</li>
              <li><strong className="text-blue-600 dark:text-blue-400">Contains</strong> software viruses or any other malicious code</li>
              <li><strong className="text-blue-600 dark:text-blue-400">Constitutes</strong> unsolicited or unauthorized advertising or spam</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Termination</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              We may terminate or suspend your account and access to the service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Changes to Terms</h2>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300">
              If you have questions about these Terms, please contact us at <a href="mailto:terms@onechat.com" className="text-blue-600 dark:text-blue-400 hover:underline">terms@onechat.com</a>.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 