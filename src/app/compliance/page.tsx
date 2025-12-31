'use client';

import Link from 'next/link';

export default function SMSConsentPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-black border-b border-gray-900 flex justify-between items-center px-6" style={{height: '80px'}}>
        <Link href="/" className="text-white font-bold text-xl hover:text-gray-400 transition">
          KJ Nails
        </Link>
      </nav>

      {/* Content */}
      <section className="bg-black py-12">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">SMS Consent Message</h1>
          
          <div className="bg-gray-900 p-8 rounded-lg border border-gray-700">
            <div className="flex items-start gap-4 mb-6">
              <input
                type="checkbox"
                id="smsConsent"
                defaultChecked
                className="mt-1 w-5 h-5 accent-gray-400 border-gray-600 rounded focus:ring-gray-400 cursor-pointer"
                disabled
              />
              <label htmlFor="smsConsent" className="text-sm text-gray-300 cursor-pointer">
                I agree to receive text messages from KJNails in regards to appointment scheduling, confirmation, and feedback. *
              </label>
            </div>
            <p className="text-xs text-gray-400 text-center">This is the SMS consent message shown to customers during booking</p>
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
