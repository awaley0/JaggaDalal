import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function ImageUploader({ onImagesSelected, maxImages = 10 }) {
  const [uploads, setUploads] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = React.useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert('Please upload image files only');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newUpload = {
          id: Date.now() + Math.random(),
          file: file,
          preview: e.target.result,
          progress: 0,
          status: 'preview',
          size: (file.size / 1024 / 1024).toFixed(2),
        };

        setUploads((prev) => {
          if (prev.length < maxImages) {
            return [...prev, newUpload];
          }
          alert(`Maximum ${maxImages} images allowed`);
          return prev;
        });
      };
      reader.readAsDataURL(file);
    });
  }, [maxImages]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
  });

  const handleUpload = async () => {
    if (uploads.length === 0) return;
    
    setIsUploading(true);
    const formData = new FormData();

    uploads.forEach((upload) => {
      formData.append('images', upload.file);
    });

    try {
      const response = await fetch('/api/properties/upload-images', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        onImagesSelected(data.urls);
        setUploads([]);
        alert('✅ Images uploaded successfully!');
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      alert('Upload error: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeUpload = (id) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Drag & Drop Zone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 hover:border-blue-400 bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {isDragActive ? '📸 Drop your images here!' : 'Drag images here or click to browse'}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Supported formats: JPG, PNG, WebP (Max {maxImages} images, 5MB each)
        </p>
        <button
          onClick={(e) => e.stopPropagation()}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition font-semibold"
        >
          Choose Files
        </button>
      </div>

      {/* Image Preview & Management */}
      {uploads.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-800">
            Preview ({uploads.length}/{maxImages})
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition group"
              >
                <img
                  src={upload.preview}
                  alt="preview"
                  className="w-full h-32 object-cover"
                />

                {/* File Size Badge */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs font-semibold">
                  {upload.size} MB
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeUpload(upload.id)}
                  className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <XMarkIcon className="w-8 h-8 text-white" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isUploading ? '⏳ Uploading...' : '✅ Upload Images'}
          </button>
        </div>
      )}
    </div>
  );
}
