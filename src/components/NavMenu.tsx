'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function NavMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Navigation Menu */}
      <div className="hidden md:flex gap-8 items-center">
        <Link
          href="/book"
          className="text-white font-bold hover:text-gray-400 transition"
        >
          Book Appointment
        </Link>
        <Link
          href="/art"
          className="text-white font-bold hover:text-gray-400 transition"
        >
          Gallery
        </Link>
        <Link
          href="/privacy"
          className="text-white font-bold hover:text-gray-400 transition"
        >
          Privacy
        </Link>
      </div>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex flex-col gap-1.5 justify-center items-center p-2"
        style={{ width: '50px', height: '50px' }}
      >
        <div style={{ width: '28px', height: '3px', backgroundColor: 'white' }}></div>
        <div style={{ width: '28px', height: '3px', backgroundColor: 'white' }}></div>
        <div style={{ width: '28px', height: '3px', backgroundColor: 'white' }}></div>
      </button>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="md:hidden fixed top-20 left-0 right-0 bg-black z-50 flex flex-col w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href="/"
              className="text-white font-bold text-lg py-4 px-4 border-b border-gray-700 hover:text-gray-400 transition"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/book"
              className="text-white font-bold text-lg py-4 px-4 border-b border-gray-700 hover:text-gray-400 transition"
              onClick={() => setIsOpen(false)}
            >
              Book Appointment
            </Link>
            <Link
              href="/art"
              className="text-white font-bold text-lg py-4 px-4 border-b border-gray-700 hover:text-gray-400 transition"
              onClick={() => setIsOpen(false)}
            >
              Gallery
            </Link>
            <Link
              href="/privacy"
              className="text-white font-bold text-lg py-4 px-4 hover:text-gray-400 transition"
              onClick={() => setIsOpen(false)}
            >
              Privacy
            </Link>
          </div>
        </>
      )}
    </>
  );
}
