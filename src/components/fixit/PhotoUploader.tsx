import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { fixitApi } from '../../services/fixitApi';

interface PhotoUploaderProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
}

export default function PhotoUploader({ value, onChange, className = '' }: PhotoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);
    setLastFile(file);

    // Validate type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(file.type)) {
      setError('Unsupported file type. Please upload a JPG, PNG, or WebP photo.');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large. Maximum image size is 5MB.');
      return;
    }

    setUploading(true);
    try {
      const url = await fixitApi.uploadPhoto(file);
      onChange(url);
    } catch (err: any) {
      console.error('Photo upload error:', err);
      setError(err?.message || 'Failed to upload photo. Please check your network and retry.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
    setLastFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {value ? (
        // Preview State
        <div className="relative border-3 border-black rounded-2xl overflow-hidden bg-black/5 aspect-video max-h-56 w-full group brutal-shadow">
          <img
            src={value}
            alt="Complaint Attachment"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRemove}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold border-2 border-black flex items-center gap-1.5 transition-colors shadow-md"
              aria-label="Remove photo"
            >
              <X className="w-4 h-4" />
              <span>Remove Photo</span>
            </button>
          </div>
        </div>
      ) : (
        // Upload Dropzone
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-3 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            dragOver
              ? 'border-black bg-[#C8E64D]/30 scale-[1.01]'
              : 'border-black/30 hover:border-black bg-[#F7F6F2] hover:bg-white'
          }`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          aria-label="Upload maintenance issue photo"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-4 text-black">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Uploading photo securely...
              </span>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl border-2 border-black bg-white flex items-center justify-center brutal-shadow">
                <Upload className="w-6 h-6 text-black" />
              </div>

              <div>
                <span className="text-sm font-bold text-black block" style={{ fontFamily: 'Lexend' }}>
                  Choose a photo or drag file here
                </span>
                <span className="text-xs text-gray-500 font-medium mt-0.5 block">
                  Supports JPG, PNG, WebP up to 5MB
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Error state with retry */}
      {error && (
        <div className="p-3 bg-red-50 border-2 border-red-500 rounded-xl flex items-center justify-between gap-2 text-xs text-red-900 font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          {lastFile && !uploading && (
            <button
              type="button"
              onClick={() => processFile(lastFile)}
              className="text-[11px] font-bold text-red-700 hover:text-black flex items-center gap-1 flex-shrink-0 underline"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
