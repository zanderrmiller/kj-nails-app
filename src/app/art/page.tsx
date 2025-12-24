'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import NavMenu from '@/components/NavMenu';

interface GalleryImage {
  id: string;
  image_url: string;
  display_order: number;
}

export default function ArtPage() {
  const [models, setModels] = useState<GalleryImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await fetch('/api/gallery-images');
        const data = await response.json();
        if (data.success) {
          setModels(data.images);
        }
      } catch (error) {
        console.error('Failed to fetch gallery images:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
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

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-1">Gallery</h1>
        <p className="text-gray-400 text-sm sm:text-base">Below are examples of my work</p>
      </section>

      {/* Gallery Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20">
        {loading ? (
          <p className="text-center text-gray-400">Loading gallery...</p>
        ) : models.length === 0 ? (
          <p className="text-center text-gray-400">Gallery coming soon!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedId(model.id)}
                className="group relative overflow-hidden rounded-lg aspect-square bg-slate-800 hover:ring-2 hover:ring-pink-500 transition cursor-pointer"
              >
                <Image
                  src={model.image_url}
                  alt="Gallery"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox Modal */}
      {selectedId !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedId(null)}
        >
          <div className="relative max-w-2xl w-full h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={models.find((m) => m.id === selectedId)!.image_url}
              alt="Full view"
              fill
              className="object-contain"
            />
            <button
              onClick={() => setSelectedId(null)}
              className="absolute -top-10 right-0 text-white text-2xl font-bold hover:text-gray-400 transition"
            >
              ✕
            </button>
            <div className="absolute bottom-4 left-0 right-0 text-center text-gray-300">
              {models.findIndex((m) => m.id === selectedId) + 1} / {models.length}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>Want to book your own nail art appointment?</p>
          <Link
            href="/book"
            className="inline-block bg-pink-600 hover:bg-pink-700 px-6 py-2 rounded-lg font-semibold transition mt-4"
          >
            Book Now
          </Link>
        </div>
      </footer>
    </main>
  );
}
