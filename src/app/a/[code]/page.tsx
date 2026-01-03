'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function ShortLinkRedirect() {
  const router = useRouter();
  const params = useParams();
  const code = params?.code as string;

  useEffect(() => {
    // Look up the appointment ID from the short code
    const resolveShortCode = async () => {
      if (!code) {
        router.push('/');
        return;
      }

      try {
        const response = await fetch(`/api/short-codes/${code}`);
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
  }, [code, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-600">Loading appointment...</p>
    </div>
  );
}
