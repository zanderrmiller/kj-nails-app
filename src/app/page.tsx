import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-pink-600">KJ Nails</h1>
            <nav className="hidden md:flex gap-8">
              <Link href="#services" className="text-gray-600 hover:text-pink-600">
                Services
              </Link>
              <Link href="/book" className="text-gray-600 hover:text-pink-600">
                Book Now
              </Link>
              <Link href="/admin" className="text-gray-600 hover:text-pink-600">
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Beautiful Nails, Professional Service
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Book your appointment today and experience premium nail care
          </p>
          <Link
            href="/book"
            className="inline-block bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-700 transition"
          >
            Book an Appointment
          </Link>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="bg-gray-50 py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-12 text-center">Our Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service Card - Manicure */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Manicure</h4>
              <p className="text-gray-600 mb-4">Professional nail care and design</p>
              <p className="text-2xl font-bold text-pink-600">$25 - $45</p>
              <p className="text-sm text-gray-500 mt-2">30 - 60 min</p>
            </div>

            {/* Service Card - Pedicure */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Pedicure</h4>
              <p className="text-gray-600 mb-4">Relaxing foot treatment and polish</p>
              <p className="text-2xl font-bold text-pink-600">$35 - $55</p>
              <p className="text-sm text-gray-500 mt-2">45 - 90 min</p>
            </div>

            {/* Service Card - Gel */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Gel Polish</h4>
              <p className="text-gray-600 mb-4">Long-lasting gel manicure & design</p>
              <p className="text-2xl font-bold text-pink-600">$40 - $60</p>
              <p className="text-sm text-gray-500 mt-2">60 - 75 min</p>
            </div>

            {/* Service Card - Extensions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Nail Extensions</h4>
              <p className="text-gray-600 mb-4">Acrylic or dip powder extensions</p>
              <p className="text-2xl font-bold text-pink-600">$45 - $75</p>
              <p className="text-sm text-gray-500 mt-2">90 - 120 min</p>
            </div>

            {/* Service Card - Design */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Custom Design</h4>
              <p className="text-gray-600 mb-4">Art and nail design services</p>
              <p className="text-2xl font-bold text-pink-600">+$10 - $25</p>
              <p className="text-sm text-gray-500 mt-2">30 - 45 min</p>
            </div>

            {/* Service Card - Removal */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Removal</h4>
              <p className="text-gray-600 mb-4">Safe removal of extensions</p>
              <p className="text-2xl font-bold text-pink-600">$15 - $25</p>
              <p className="text-sm text-gray-500 mt-2">15 - 30 min</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-pink-600 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-6">Ready to Book?</h3>
          <Link
            href="/book"
            className="inline-block bg-white text-pink-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Schedule Your Appointment
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">KJ Nails</h4>
              <p className="text-sm">Professional nail care and design services</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Hours</h4>
              <p className="text-sm">Mon - Fri: 9am - 7pm</p>
              <p className="text-sm">Sat: 10am - 6pm</p>
              <p className="text-sm">Sun: Closed</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Contact</h4>
              <p className="text-sm">Phone: (555) 123-4567</p>
              <p className="text-sm">Email: info@kjnails.com</p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-sm">
            <p>&copy; 2025 KJ Nails. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
