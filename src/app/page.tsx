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
      <section className="py-8 relative" style={{
        backgroundImage: `linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 50%, #1e1e1e 100%), 
                          url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><defs><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/></filter></defs><rect width="100" height="100" fill="%23f5f5f0" filter="url(%23noise)" opacity="0.03"/></svg>')`,
        backgroundBlendMode: 'overlay'
      }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="mb-6 p-6 rounded-lg" style={{
            backgroundImage: `linear-gradient(135deg, rgba(245,245,240,0.05) 0%, rgba(200,200,190,0.03) 100%)`,
            border: '1px solid rgba(200,200,190,0.15)'
          }}>
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
          <div className="mb-8 rounded-xl overflow-hidden shadow-xl" style={{
            backgroundColor: '#f5f5f0',
            backgroundImage: `
              linear-gradient(135deg, transparent 0%, rgba(100,100,100,0.05) 20%, transparent 30%, transparent 70%, rgba(80,80,80,0.05) 80%, transparent 90%),
              linear-gradient(45deg, transparent 0%, rgba(120,120,100,0.03) 50%, transparent 100%),
              radial-gradient(circle at 20% 80%, rgba(150,150,140,0.05) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(100,100,90,0.05) 0%, transparent 50%)
            `
          }}>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Services</h2>
              <div className="space-y-3">
                {[
                  { name: 'Acrylic Sets - Short', price: '$50' },
                  { name: 'Acrylic Sets - Long', price: '$60' },
                  { name: 'Gel Manicure', price: '$35' },
                  { name: 'Rebase', price: '$40' },
                ].map((service) => (
                  <div
                    key={service.name}
                    className="flex justify-between items-center border-b pb-3"
                    style={{ borderColor: 'rgba(100,100,90,0.3)' }}
                  >
                    <span className="text-gray-900 text-lg font-medium">{service.name}</span>
                    <span className="text-gray-900 font-bold text-lg">{service.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Add-ons Table */}
          <div className="mb-12 rounded-xl overflow-hidden shadow-xl" style={{
            backgroundColor: '#f5f5f0',
            backgroundImage: `
              linear-gradient(135deg, transparent 0%, rgba(100,100,100,0.05) 20%, transparent 30%, transparent 70%, rgba(80,80,80,0.05) 80%, transparent 90%),
              linear-gradient(45deg, transparent 0%, rgba(120,120,100,0.03) 50%, transparent 100%),
              radial-gradient(circle at 20% 80%, rgba(150,150,140,0.05) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(100,100,90,0.05) 0%, transparent 50%)
            `
          }}>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Add Ons</h2>
              <div className="space-y-3">
                {[
                  { name: 'Nail Art', price: '$2-5 Per Nail' },
                  { name: 'Ombre or French', price: '$15' },
                  { name: 'Removal', price: '$20' },
                ].map((addon) => (
                  <div
                    key={addon.name}
                    className="flex justify-between items-center border-b pb-3"
                    style={{ borderColor: 'rgba(100,100,90,0.3)' }}
                  >
                    <span className="text-gray-900 text-lg font-medium">{addon.name}</span>
                    <span className="text-gray-900 font-bold text-lg">{addon.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* About Me Section */}
          <div className="rounded-xl overflow-hidden shadow-xl" style={{
            backgroundColor: '#f5f5f0',
            backgroundImage: `
              linear-gradient(135deg, transparent 0%, rgba(100,100,100,0.05) 20%, transparent 30%, transparent 70%, rgba(80,80,80,0.05) 80%, transparent 90%),
              linear-gradient(45deg, transparent 0%, rgba(120,120,100,0.03) 50%, transparent 100%),
              radial-gradient(circle at 20% 80%, rgba(150,150,140,0.05) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(100,100,90,0.05) 0%, transparent 50%)
            `
          }}>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">About Me</h2>
              <p className="text-gray-900 text-lg leading-relaxed text-center">
                I'm Kinsey, a passionate nail artist offering professional nail services from the comfort of my home studio in Evans, CO.<br /><br />
                You'll find a full list of services and pricing above, along with examples of my work on the Gallery page. If you're interested in booking a service, head over to the Bookings page to check my calendar for availability.<br /><br />
                I look forward to meeting you and making your nails shine!
              </p>
            </div>
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
