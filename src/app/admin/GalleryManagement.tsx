'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface GalleryImage {
  id: string;
  image_url: string;
  display_order: number;
  created_at: string;
}

export default function GalleryManagement() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch gallery images
  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/gallery-images', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
      const data = await response.json();
      console.log('Fetched gallery images:', data);
      if (data.success) {
        setImages(data.images);
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const totalFiles = files.length;
    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/gallery-images', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();

          if (data.success) {
            successCount++;
          } else {
            failCount++;
            console.error(`Upload error for ${file.name}:`, data.error);
          }
        } catch (error) {
          failCount++;
          console.error(`Upload error for ${file.name}:`, error);
        }
      }

      // Set appropriate message based on results
      if (failCount === 0) {
        setMessage(`${successCount} image${successCount !== 1 ? 's' : ''} uploaded successfully!`);
      } else if (successCount === 0) {
        setMessage(`Failed to upload ${failCount} image${failCount !== 1 ? 's' : ''}`);
      } else {
        setMessage(`${successCount} uploaded, ${failCount} failed`);
      }

      fetchImages();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(`Error uploading images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const response = await fetch(`/api/gallery-images/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Image deleted successfully');
        fetchImages();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to delete image');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage('Error deleting image');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading gallery...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Art Gallery Management</h2>

      {/* Upload Section */}
      <div className="bg-gray-900 p-4 sm:p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white">Upload New Images</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="flex-1 p-2 border border-gray-700 rounded text-sm text-white bg-gray-800"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded disabled:bg-gray-800 font-semibold whitespace-nowrap"
          >
            {uploading ? 'Uploading...' : 'Choose & Upload'}
          </button>
        </div>
        {message && (
          <p className={`mt-2 text-sm ${message.includes('success') || message.includes('uploaded') ? 'text-gray-400' : 'text-gray-400'}`}>
            {message}
          </p>
        )}
      </div>

      {/* Gallery Images */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Current Gallery ({images.length} images)</h3>
        {images.length === 0 ? (
          <p className="text-gray-400">No images in gallery yet. Upload one to get started!</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative bg-gray-800 rounded-lg overflow-hidden aspect-square cursor-pointer"
              >
                <Image
                  src={image.image_url}
                  alt="Gallery"
                  fill
                  className="object-cover"
                  onClick={() => setSelectedImageUrl(image.image_url)}
                />
                {/* Desktop hover delete button */}
                <div className="hidden sm:flex absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
                {/* Mobile visible delete button */}
                <div className="sm:hidden absolute top-2 right-2">
                  <button
                    onClick={() => handleDelete(image.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-semibold"
                  >
                    Delete
                  </button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-gray-400 text-xs p-2">
                  #{image.display_order}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImageUrl(null)}
        >
          <div
            className="relative bg-white rounded-lg shadow-2xl max-w-2xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImageUrl(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition z-10"
            >
              <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <img
              src={selectedImageUrl}
              alt="Full size gallery"
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
