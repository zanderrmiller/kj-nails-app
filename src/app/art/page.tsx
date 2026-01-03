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
  const [touchStart, setTouchStart] = useState<{ time: number; id: string | null }>({ time: 0, id: null });

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

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (selectedId !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedId]);

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleImageClick = (imageId: string) => {
    // Only open modal on desktop
    if (!isMobile) {
      setSelectedId(imageId);
    }
  };

  const handleSaveImage = async () => {
    console.log('Save button clicked');
    const selectedImage = models.find((m) => m.id === selectedId);
    console.log('Selected image:', selectedImage);
    if (!selectedImage) return;

    try {
      console.log('Starting download for:', selectedImage.image_url);
      // Fetch the image blob
      const response = await fetch(selectedImage.image_url, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const blob = await response.blob();
      console.log('Blob created:', blob);
      
      // Create a blob URL and trigger download
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `kj-nails-${Date.now()}.webp`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      console.log('Download triggered');
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Unable to download image. Try right-clicking the image to save it.');
    }
  };

  const handleShareImage = async () => {
    const selectedImage = models.find((m) => m.id === selectedId);
    if (!selectedImage) return;

    const shareText = 'Check out this nail art from KJ Nails!';
    const shareUrl = `${window.location.origin}/art`;

    // Check if native Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KJ Nails Gallery',
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (error) {
        // User cancelled the share dialog, don't show error
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
        return;
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Final fallback: show the URL for manual copy
      alert(`Share this link:\n${shareUrl}`);
    }
  };

  return (
    <main 
      className="min-h-screen text-white"
      style={{
        backgroundImage: `url('/images/white-marble-texture.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-black/70 border-b border-gray-900 flex justify-between items-center" style={{height: '80px', padding: '4px 0 4px 10px', margin: 0, overflow: 'hidden'}}>
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
        <h1 className="text-4xl sm:text-5xl font-bold mb-1 text-black">Gallery</h1>
        <p className="text-gray-700 text-sm sm:text-base font-medium">Below are examples of my work</p>
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
              <div
                key={model.id}
                className="group relative overflow-hidden rounded-lg aspect-square bg-slate-800 cursor-pointer select-none"
              >
                <img
                  src={model.image_url}
                  alt="Gallery"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  onClick={() => handleImageClick(model.id)}
                  draggable="false"
                />
                <div 
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition pointer-events-none" 
                  onClick={() => handleImageClick(model.id)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox Modal */}
      {selectedId !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setSelectedId(null)}
        >
          <div className="relative max-w-2xl w-full h-[85vh] sm:h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedId(null)}
              className="absolute top-3 right-3 sm:top-2 sm:right-2 z-10 bg-black/60 hover:bg-black/80 rounded-full p-3 sm:p-2 transition"
              aria-label="Close"
            >
              <svg className="w-7 h-7 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image Container */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <Image
                src={models.find((m) => m.id === selectedId)!.image_url}
                alt="Full view"
                fill
                className="object-contain"
              />
            </div>

            {/* Counter */}
            <div className="py-2 px-3 text-center text-xs sm:text-sm text-gray-300 bg-black/30">
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
