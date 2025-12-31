'use client';

import Link from 'next/link';
import Image from 'next/image';
import NavMenu from '@/components/NavMenu';

export default function PrivacyPolicy() {
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

      {/* Privacy Policy Content */}
      <section className="bg-black py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

          <div className="space-y-6 text-gray-300">
            {/* Last Updated */}
            <p className="text-sm text-gray-400 italic">Last Updated: December 31, 2025</p>

            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Introduction</h2>
              <p>
                KJ Nails ("we", "us", "our", or "Company") operates the kj-nails-app website and mobile application (the "Service"). 
                This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service.
              </p>
            </section>

            {/* Information Collection */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Information We Collect</h2>
              <div className="space-y-3 ml-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">Personal Information</h3>
                  <p>
                    When you book an appointment, we collect the following information:
                  </p>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Full Name</li>
                    <li>Phone Number</li>
                    <li>Email Address (optional)</li>
                    <li>Appointment Date and Time</li>
                    <li>Service Selections and Notes</li>
                    <li>Any Nail Art Reference Images</li>
                  </ul>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">Automatically Collected Information</h3>
                  <p>
                    We may automatically collect certain information about your device and how you use our Service:
                  </p>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>IP Address</li>
                    <li>Browser Type and Operating System</li>
                    <li>Pages Visited and Time Spent</li>
                    <li>Referring/Exit Pages</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Use of Information */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">How We Use Your Information</h2>
              <p>We use the information we collect for the following purposes:</p>
              <ul className="list-disc ml-5 mt-3 space-y-2">
                <li>To process and manage your appointment bookings</li>
                <li>To send you appointment confirmations, reminders, and updates via SMS</li>
                <li>To respond to your inquiries and provide customer support</li>
                <li>To improve our Service and user experience</li>
                <li>To prevent fraud and maintain security</li>
                <li>To comply with legal obligations</li>
              </ul>
            </section>

            {/* SMS Communications */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">SMS Communications</h2>
              <p>
                By booking an appointment, you agree to receive text messages from KJ Nails regarding appointment scheduling, 
                confirmation, and feedback. You can opt out of SMS communications by contacting us directly. Message and data rates may apply.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Data Retention</h2>
              <p>
                We retain your personal information for as long as necessary to provide our Service and fulfill the purposes outlined 
                in this Privacy Policy. You can request deletion of your data at any time by contacting us.
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Data Security</h2>
              <p>
                We take the security of your personal information seriously and implement appropriate technical and organizational measures 
                to protect your data. However, no method of transmission over the Internet or electronic storage is 100% secure.
              </p>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Third-Party Services</h2>
              <p>
                We use third-party services to support our operations, including:
              </p>
              <ul className="list-disc ml-5 mt-3 space-y-2">
                <li><strong>Supabase</strong> - Database and backend services</li>
                <li><strong>ClickSend</strong> - SMS delivery service</li>
                <li><strong>Vercel</strong> - Application hosting</li>
              </ul>
              <p className="mt-3">
                These services have their own privacy policies governing their use of your data. We recommend reviewing their privacy 
                policies before using our Service.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Your Privacy Rights</h2>
              <p>Depending on your location, you may have the following rights:</p>
              <ul className="list-disc ml-5 mt-3 space-y-2">
                <li><strong>Right to Access</strong> - Request a copy of your personal data</li>
                <li><strong>Right to Correction</strong> - Update or correct inaccurate information</li>
                <li><strong>Right to Deletion</strong> - Request deletion of your personal data</li>
                <li><strong>Right to Opt-Out</strong> - Opt out of SMS communications and marketing</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us using the information provided below.
              </p>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <p className="font-semibold text-gray-100">KJ Nails</p>
                <p>Evans, CO</p>
                <p className="text-sm mt-2">
                  <a href="mailto:Millerkam22@gmail.com" className="text-blue-400 hover:text-blue-300 transition">
                    Millerkam22@gmail.com
                  </a>
                </p>
              </div>
            </section>

            {/* Policy Changes */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-3">Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" 
                date of this Privacy Policy. Your continued use of the Service after such modifications constitutes your acceptance of 
                the updated Privacy Policy.
              </p>
            </section>
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
