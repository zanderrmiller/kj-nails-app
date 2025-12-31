'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function SMSConsentPage() {
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
    </main>
  );
}
