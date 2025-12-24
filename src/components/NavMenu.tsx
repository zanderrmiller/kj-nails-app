'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function NavMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-col gap-1.5 justify-center items-center p-2"
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
              href="/book"
              className="text-white font-bold text-lg py-4 px-4 border-b border-gray-700 hover:text-pink-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Book an Appointment
            </Link>
            <Link
              href="/art"
              className="text-white font-bold text-lg py-4 px-4 hover:text-pink-600 transition"
              onClick={() => setIsOpen(false)}
            >
              Gallery
            </Link>
          </div>
        </>
      )}

      {/* Desktop Sidebar Menu */}
      {isOpen && (
        <div className="hidden md:flex fixed inset-0 z-40">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black bg-opacity-50"
            onClick={() => setIsOpen(false)}
          />
          {/* Sidebar */}
          <div className="w-72 bg-black shadow-lg flex flex-col z-50">
            <button
              onClick={() => setIsOpen(false)}
              className="self-end p-6 text-2xl font-bold text-white hover:text-pink-600"
            >
              ✕
            </button>
            <div className="flex-1 flex flex-col justify-center px-8 gap-6">
              <Link
                href="/book"
                className="text-white font-bold text-2xl hover:text-pink-600 transition py-4"
                onClick={() => setIsOpen(false)}
              >
                Book an Appointment
              </Link>
              <Link
                href="/art"
                className="text-white font-bold text-2xl hover:text-pink-600 transition py-4"
                onClick={() => setIsOpen(false)}
              >
                Gallery
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
