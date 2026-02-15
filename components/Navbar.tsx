'use client';

import Link from 'next/link';
import { SignInButton, SignUpButton, UserButton, useAuth, useSession } from '@clerk/nextjs';
import { Leaf, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { isSignedIn, isLoaded } = useAuth();
  const { session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if user is admin
  const isAdmin = (session?.user?.publicMetadata as { role?: string })?.role === 'admin';

  return (
    <nav className="bg-green-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Leaf className="h-8 w-8 text-green-200" />
            <span className="text-xl font-bold tracking-tight">Al-Hakim Store</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-green-100 hover:text-white transition-colors font-medium"
            >
              Shop
            </Link>
            
            {isAdmin && (
              <Link 
                href="/admin" 
                className="text-green-200 hover:text-white transition-colors font-medium bg-green-700 px-3 py-1.5 rounded-lg"
              >
                Dashboard
              </Link>
            )}

            <div className="flex items-center gap-3 ml-4">
              {!isLoaded ? (
                <div className="h-8 w-8 animate-pulse bg-green-600 rounded-full" />
              ) : !isSignedIn ? (
                <>
                  <SignInButton mode="modal">
                    <button className="text-green-100 hover:text-white transition-colors font-medium">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="bg-white text-green-800 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors">
                      Sign Up
                    </button>
                  </SignUpButton>
                </>
              ) : (
                <UserButton afterSignOutUrl="/" />
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 hover:bg-green-700 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-green-700 border-t border-green-600">
          <div className="px-4 py-4 space-y-3">
            <Link 
              href="/" 
              className="block text-green-100 hover:text-white transition-colors font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Shop
            </Link>
            
            {isAdmin && (
              <Link 
                href="/admin" 
                className="block text-green-200 hover:text-white transition-colors font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}

            <div className="pt-3 border-t border-green-600">
              {!isLoaded ? null : !isSignedIn ? (
                <div className="flex flex-col gap-2">
                  <SignInButton mode="modal">
                    <button className="text-left text-green-100 hover:text-white transition-colors font-medium py-2">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="bg-white text-green-800 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors text-center">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <UserButton afterSignOutUrl="/" />
                  <span className="text-green-100">Account</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
