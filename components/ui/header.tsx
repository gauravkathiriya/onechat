import Link from 'next/link';
import { Button } from './button';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          <span className="text-white">One</span>
          <span className="text-blue-200">Chat</span>
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className="text-blue-100 hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/about" className="text-blue-100 hover:text-white transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-blue-100 hover:text-white transition-colors">
            Contact
          </Link>
          <Link href="/privacy" className="text-blue-100 hover:text-white transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="text-blue-100 hover:text-white transition-colors">
            Terms
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="outline" size="sm" className="border-blue-200 text-white hover:bg-blue-500">
              Login
            </Button>
          </Link>
          <Link href="/login?signup=true">
            <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-100">Sign Up</Button>
          </Link>
        </div>
      </div>
    </header>
  );
} 