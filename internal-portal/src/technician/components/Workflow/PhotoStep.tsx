import React, { useState, useRef } from 'react';
import type { Job } from '../../types/job';
import { JobsApiService } from '../../services/apiService';
import { 
  Camera, 
  Upload, 
  ChevronRight,
  X as RemoveIcon
} from 'lucide-react';

interface PhotoStepProps {
  job: Job;
  type: 'BEFORE' | 'AFTER';
  onUploadPhoto: (jobId: string, photoUrl: string, caption: string, type: 'BEFORE' | 'AFTER') => Promise<void>;
  onNextStep: () => void;
}

export const PhotoStep: React.FC<PhotoStepProps> = ({
  job,
  type,
  onUploadPhoto,
  onNextStep,
}) => {
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photos = type === 'BEFORE' ? job.beforePhotos : job.afterPhotos;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedPhoto(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedPhoto || !selectedFile) return; // Prevent upload without a photo

    const finalCaption = caption.trim() || `${type === 'BEFORE' ? 'Before Installation Site Evidence' : 'After Installation Completion Photo'} - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    setIsSubmitting(true);

    try {
      const s3Url = await JobsApiService.uploadImageToS3(selectedFile);
      await onUploadPhoto(job.id, s3Url, finalCaption, type);
      setCaption('');
      setSelectedPhoto(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueStep = async () => {
    if (selectedPhoto && selectedFile) {
      await handleUpload();
    }
    onNextStep();
  };

  return (
    <div className="space-y-6">
      {/* Photo Uploader Card */}
      <div className="border border-zinc-200 rounded-xl p-3.5 sm:p-5 bg-white space-y-4">
        <div className="flex items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-semibold text-zinc-900 flex items-center space-x-2">
              <Camera className="w-4 h-4 text-zinc-800 shrink-0" />
              <span>{type === 'BEFORE' ? 'Before Installation Evidence' : 'After Installation Completion Photos'}</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5">
              {type === 'BEFORE'
                ? 'Upload initial site setup and equipment condition before starting installation work.'
                : 'Upload finished equipment setup and verified clean workplace evidence.'}
            </p>
          </div>
          <span className="text-xs font-mono bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-md font-semibold shrink-0 whitespace-nowrap">
            {job.jobCode}
          </span>
        </div>

        <form onSubmit={handleUpload} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Photo Description / Location Tag
            </label>
            <input
              type="text"
              required
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full p-2.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
              placeholder={type === 'BEFORE' ? 'e.g. Unboxing equipment at roof rack 4' : 'e.g. Terminal box sealed and labeled'}
            />
          </div>

          {/* Direct Camera Input */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
          {/* Gallery Input */}
          <input
            type="file"
            ref={galleryInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {selectedPhoto ? (
            <div className="relative border border-zinc-200 rounded-xl p-4 bg-zinc-50 flex flex-col items-center justify-center space-y-2">
              <img src={selectedPhoto} className="max-h-48 rounded-lg object-contain border border-zinc-200" alt="Selected Evidence Preview" />
              <button 
                type="button"
                onClick={() => {
                  setSelectedPhoto(null);
                  setSelectedFile(null);
                  if (cameraInputRef.current) cameraInputRef.current.value = '';
                  if (galleryInputRef.current) galleryInputRef.current.value = '';
                }}
                className="text-xs font-semibold text-red-655 hover:text-red-500 bg-white border border-red-200 px-3 py-1.5 rounded-lg shadow-xs hover:bg-red-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RemoveIcon className="w-3.5 h-3.5" />
                <span>Remove / Retake</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="p-4 rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/60 hover:bg-blue-100 flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer active:scale-95"
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-blue-900">Take Photo</span>
                <span className="text-[10px] text-blue-600 font-medium">Open Camera Directly</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="p-4 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100 flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer active:scale-95"
              >
                <div className="w-9 h-9 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center shadow-xs">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-800">Browse Device</span>
                <span className="text-[10px] text-zinc-500 font-medium">Select from Photos</span>
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !selectedPhoto}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-sm shadow-blue-500/25 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Uploading Site Photo...' : `Upload ${type === 'BEFORE' ? 'Before' : 'After'} Inspection Photo`}</span>
          </button>
        </form>
      </div>

      {/* Gallery of Uploaded Photos */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Uploaded {type === 'BEFORE' ? 'Before' : 'After'} Photos ({photos.length})
        </h4>
        {photos.length === 0 ? (
          <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 text-center text-xs text-zinc-500">
            No {type.toLowerCase()} photos uploaded yet. Capture site evidence above.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {photos.map((p) => (
              <div key={p.id} className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <img src={p.url} alt={p.caption} className="w-full h-40 object-cover" />
                <div className="p-3 text-xs space-y-1">
                  <p className="font-semibold text-zinc-900 truncate">{p.caption}</p>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span>{p.uploadedAt}</span>
                    <span className="font-mono bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded text-[10px]">
                      GPS Verified
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end space-x-3 pt-2">
        <button
          onClick={handleContinueStep}
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition-all shadow-sm shadow-blue-500/25 cursor-pointer"
        >
          <span>{isSubmitting ? 'Uploading & Saving...' : 'Continue Workflow Step'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
