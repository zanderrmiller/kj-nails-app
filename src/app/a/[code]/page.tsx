'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShortLinkRedirect({ params }: { params: { code: string } }) {
  const router = useRouter();

  useEffect(() => {
    // Look up the appointment ID from the short code
    const resolveShortCode = async () => {
      try {
        const response = await fetch(`/api/short-codes/${params.code}`);
        if (response.ok) {
          const data = await response.json();
          // Redirect to full appointment URL
          router.push(`/customer/appointment/${data.appointmentId}`);
        } else {
          // Code not found, redirect to home
          router.push('/');
        }
      } catch (error) {
        console.error('Error resolving short code:', error);
        router.push('/');
      }
    };

    resolveShortCode();
  }, [params.code, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">Loading appointment...</p>
    </div>
  );
}
