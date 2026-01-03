'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PendingRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin page with pending filter
    router.push('/admin?tab=appointments&filter=pending');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </div>
  );
}
