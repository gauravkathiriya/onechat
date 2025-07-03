import Link from 'next/link';
import { Button } from './button';
import { ThemeToggle } from './theme-toggle';

export function Header() {
  return (
    <header className="bg-black text-white py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          OneChat
        </Link>
        
        <nav className="hidden md:flex space-x-6">
          <Link href="/" className="hover:text-gray-300 transition-colors">
            Home
          </Link>
          <Link href="/about" className="hover:text-gray-300 transition-colors">
            About
          </Link>
          <Link href="/contact" className="hover:text-gray-300 transition-colors">
            Contact
          </Link>
          <Link href="/privacy" className="hover:text-gray-300 transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-gray-300 transition-colors">
            Terms
          </Link>
        </nav>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="outline" size="sm" className="border-white text-white hover:bg-white hover:text-black">
              Login
            </Button>
          </Link>
          <Link href="/login?signup=true">
            <Button size="sm">Sign Up</Button>
          </Link>
        </div>
      </div>
    </header>
  );
} 