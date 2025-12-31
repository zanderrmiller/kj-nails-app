'use client';

import Link from 'next/link';
import Image from 'next/image';
import NavMenu from '@/components/NavMenu';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-black border-b border-gray-900 flex justify-between items-center" style={{height: '80px', padding: '4px 0 4px 10px', margin: 0, overflow: 'hidden'}}>
        <Link href="/" className="flex-shrink-0" style={{padding: 0, margin: 0, display: 'flex', alignItems: 'center', height: '72px'}}>
          <Image
            src="/images/clear logo.png"
            alt="KJ Nails Logo"
            width={200}
            height={200}
            style={{display: 'block', height: '64px', width: 'auto', margin: 0, padding: 0}}
            priority
          />
        </Link>
        <div style={{margin: 0, height: '100%', marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: '16px'}}>
          <NavMenu />
        </div>
      </nav>

      {/* Hero Section - Services Overview */}
      <section className="bg-black py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 text-center">Welcome to KJ Nails!</h1>
          </div>

          {/* Book Appointment & View Gallery Buttons */}
          <div className="flex flex-row gap-3 justify-center mb-8 flex-wrap">
            <Link
              href="/book"
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold text-sm sm:text-base transition text-center flex-1 sm:flex-initial"
            >
              Book Appointment
            </Link>
            <Link
              href="/art"
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold text-sm sm:text-base transition text-center flex-1 sm:flex-initial"
            >
              View Gallery
            </Link>
          </div>

          {/* Services Table */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Services</h2>
            <div className="space-y-3">
              {[
                { name: 'Acrylic Sets - Short', price: '$50' },
                { name: 'Acrylic Sets - Long', price: '$60' },
                { name: 'Gel Manicure', price: '$35' },
                { name: 'Rebase', price: '$40' },
              ].map((service) => (
                <div
                  key={service.name}
                  className="flex justify-between items-center border-b border-gray-700 pb-3"
                >
                  <span className="text-white text-lg">{service.name}</span>
                  <span className="text-white font-bold text-lg">{service.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Add-ons Table */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Add Ons</h2>
            <div className="space-y-3">
              {[
                { name: 'Nail Art', price: '$2-5 Per Nail' },
                { name: 'Ombre or French', price: '$15' },
                { name: 'Removal', price: '$20' },
              ].map((addon) => (
                <div
                  key={addon.name}
                  className="flex justify-between items-center border-b border-gray-700 pb-3"
                >
                  <span className="text-white text-lg">{addon.name}</span>
                  <span className="text-white font-bold text-lg">{addon.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* About Me Section */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 text-center">About Me</h2>
            <p className="text-white text-lg leading-relaxed text-center">
              I'm Kinsey, a passionate nail artist offering professional nail services from the comfort of my home studio in Evans, CO.<br /><br />
              You'll find a full list of services and pricing above, along with examples of my work on the Gallery page. If you're interested in booking a service, head over to the Bookings page to check my calendar for availability.<br /><br />
              I look forward to meeting you and making your nails shine!
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>&copy; 2025 KJ Nails. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy" className="text-gray-400 hover:text-gray-200 transition">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
