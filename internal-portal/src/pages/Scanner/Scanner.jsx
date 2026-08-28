import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiUpload, FiTrash2, FiImage, FiCheckCircle } from 'react-icons/fi';
import { addQRCode, removeQRCode } from '../../redux/dashboardSlice';
import toast from 'react-hot-toast';

export default function Scanner() {
  const dispatch = useDispatch();
  const qrCodes = useSelector(state => state.dashboard?.qrCodes) || [];
  
  const [title, setTitle] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title || !imageFile) {
      toast.error('Please provide a title and select an image');
      return;
    }
    
    setIsUploading(true);
    const toastId = toast.loading('Uploading QR Code to S3...');
    
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('folder', 'qrcodes');

      const apiUrl = import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io';
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to upload image');
      }

      const imageUrl = data.imageUrl;
      
      dispatch(addQRCode({
        id: `QR-${Date.now()}`,
        title,
        image: imageUrl,
        date: new Date().toISOString()
      }));
      
      toast.success('QR Code uploaded and saved to S3 successfully!', { id: toastId });
      setTitle('');
      setImageFile(null);
      setImagePreview('');
    } catch (error) {
      console.error('QR Upload error:', error);
      toast.error(error.message || 'Error uploading image to S3', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">QR Scanner Management</h1>
          <p className="text-sm text-slate-500 mt-1">Upload QR codes (e.g. Payments) to be shown in the Technician Portal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
            <FiUpload /> Add New QR Code
          </h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">QR Title</label>
              <input
                type="text"
                placeholder="e.g., GPay Payment QR"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-sm p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Upload Image</label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center">
                {imagePreview ? (
                  <div className="relative group">
                    <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                    <button type="button" onClick={() => setImagePreview('')} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center space-y-2 py-6">
                    <FiImage size={24} className="text-slate-400" />
                    <span className="text-xs text-slate-500">Click to upload QR Image</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {isUploading ? 'Uploading to S3...' : 'Save QR Code'}
            </button>
          </form>
        </div>

        {/* Existing QR Codes */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <FiCheckCircle /> Active QR Codes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {qrCodes.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500">No QR codes uploaded yet.</p>
              </div>
            ) : (
              qrCodes.map(qr => (
                <div key={qr.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex gap-4">
                  <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={qr.image} alt={qr.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{qr.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">Uploaded: {new Date(qr.date).toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={() => dispatch(removeQRCode(qr.id))}
                      className="self-start text-xs text-red-500 font-medium hover:text-red-600 flex items-center gap-1 mt-2"
                    >
                      <FiTrash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
