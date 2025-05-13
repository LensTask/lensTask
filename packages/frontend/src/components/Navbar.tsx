'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import LoginButton from './LoginButton'; // Import the new LoginButton

// Styles (assuming you want to keep your original Navbar.module.css)
// If you are using Tailwind classes directly in this file, you might not need this import.
// However, your original Navbar.tsx did not import Navbar.module.css, so I'm keeping it that way.
// If styles are missing, ensure Navbar.module.css is imported or styles are applied directly.
// import styles from './Navbar.module.css'; // Example: if you were using CSS Modules

const menuItems = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' }, // Example item
  { label: 'Ask', href: '/ask' },
  // ... other items
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    // Using Tailwind classes as in your original Navbar.tsx
    <nav className="bg-gray-800 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold hover:text-purple-300 transition-colors">
          LensIntel
        </Link>

        {/* Desktop Menu & Login Button */}
        <div className="hidden md:flex items-center space-x-4">
          <ul className="flex space-x-4">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`hover:bg-gray-700 px-3 py-2 rounded transition-colors ${
                    pathname === item.href ? 'bg-gray-900 font-semibold' : ''
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="ml-4"> {/* Separator for Login Button */}
            <LoginButton />
          </div>
        </div>

        {/* Hamburger and Mobile Login Button Container */}
        <div className="md:hidden flex items-center">
           <div className="mr-2"> {/* Login button for mobile, appears before hamburger */}
            <LoginButton />
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            className="p-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu (conditionally rendered) */}
      {isOpen && (
        <div className="md:hidden mt-2 pb-2 border-t border-gray-700">
          <ul className="flex flex-col space-y-1 px-2 pt-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)} // Close menu on item click
                  className={`block hover:bg-gray-700 px-3 py-2 rounded transition-colors ${
                    pathname === item.href ? 'bg-gray-900 font-semibold' : ''
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {/* Login Button can also be placed inside the mobile dropdown if preferred over being always visible */}
          {/* <div className="p-4 mt-2 border-t border-gray-700 md:hidden">
            <LoginButton />
          </div> */}
        </div>
      )}
    </nav>
  );
}
