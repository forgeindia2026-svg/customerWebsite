import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addBanner, editBanner, deleteBanner, toggleBannerStatus } from '../../redux/dashboardSlice';
import { FiSearch, FiPlus, FiImage, FiLink, FiCheck, FiX, FiTrash2, FiInfo, FiLayers, FiEdit } from 'react-icons/fi';
import Modal from '../../components/Modal';

export default function Banners() {
  const dispatch = useDispatch();
  const banners = useSelector(state => state.dashboard?.banners) || [];

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: '',
    linkUrl: '',
    position: 'Home Hero Slider',
    status: 'Active',
    imageUrl: ''
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateModal = () => {
    setForm({
      title: '',
      linkUrl: '',
      position: 'Home Hero Slider',
      status: 'Active',
      imageUrl: ''
    });
    setEditingBannerId(null);
    setModalOpen(true);
  };

  const openEditModal = (banner) => {
    setForm({
      title: banner.title,
      linkUrl: banner.linkUrl,
      position: banner.position,
      status: banner.status,
      imageUrl: banner.imageUrl
    });
    setEditingBannerId(banner.id);
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.imageUrl) {
      alert('Please upload a banner image.');
      return;
    }
    if (editingBannerId) {
      dispatch(editBanner({ id: editingBannerId, ...form }));
    } else {
      dispatch(addBanner(form));
    }
    setForm({
      title: '',
      linkUrl: '',
      position: 'Home Hero Slider',
      status: 'Active',
      imageUrl: ''
    });
    setEditingBannerId(null);
    setModalOpen(false);
  };

  const filteredBanners = banners.filter(b => {
    return b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
           b.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
           b.linkUrl.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      
      {/* Header controls (Search & Create) */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center transition-colors">
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <FiSearch size={15} />
          </span>
          <input
            type="text"
            placeholder="Search banners by title, layout position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Add Action */}
        <button 
          onClick={openCreateModal}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
        >
          <FiPlus /> Add New Banner
        </button>

      </div>

      {/* Banners Grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBanners.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-450 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
            <FiInfo size={40} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs">No website banners matched your query.</p>
          </div>
        ) : (
          filteredBanners.map((banner) => (
            <div 
              key={banner.id} 
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all text-left"
            >
              <div>
                {/* Image Banner preview */}
                <div className="h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.title} 
                    className="w-full h-full object-cover"
                  />
                  <span className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                    banner.status === 'Active' 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'bg-slate-400 text-white shadow-sm'
                  }`}>
                    {banner.status}
                  </span>
                  <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded">
                    {banner.position}
                  </span>
                </div>

                {/* Banner Content */}
                <div className="p-4">
                  <h4 className="font-semibold text-slate-850 dark:text-slate-100 text-sm leading-snug">
                    {banner.title}
                  </h4>
                  
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <FiLink className="text-slate-400 flex-shrink-0 w-3.5 h-3.5" />
                    <span className="truncate" title={banner.linkUrl}>{banner.linkUrl}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons bar */}
              <div className="p-4 border-t border-slate-50 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/10 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{banner.id}</span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => dispatch(toggleBannerStatus(banner.id))}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      banner.status === 'Active'
                        ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/50'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50'
                    }`}
                  >
                    {banner.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => openEditModal(banner)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-955/30 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                    title="Edit Banner"
                  >
                    <FiEdit size={14} />
                  </button>
                  <button
                    onClick={() => dispatch(deleteBanner(banner.id))}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-955/30 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    title="Remove Banner"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Post New Banner Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingBannerId ? "Edit Promotion Banner" : "Add Website Promotion Banner"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Banner Campaign Title</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Festival Season Sale: 20% OFF all kits" 
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Action Link / URL</label>
              <input 
                required
                type="text" 
                placeholder="e.g. /offers/discount-20" 
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Placement Position</label>
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              >
                <option value="Home Hero Slider">Home Hero Slider</option>
                <option value="Sidebar Banner">Sidebar Banner</option>
                <option value="Footer Banner">Footer Banner</option>
                <option value="Popup Announcement">Popup Announcement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Upload Banner Graphic</label>
            <div className="flex items-center gap-4 border border-dashed border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/10 transition-colors">
              <div className="w-24 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                {form.imageUrl ? (
                  <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <FiImage className="text-slate-400 w-6 h-6" />
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-slate-755 dark:text-slate-200">Select banner layout image</p>
                <p className="text-xs text-slate-400 dark:text-slate-550 mt-0.5">Supports PNG, JPG, or SVG banner designs</p>
                <label className="inline-block mt-2 cursor-pointer bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors">
                  Choose Image
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button 
              type="button" 
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-205 dark:border-slate-700 text-slate-500 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl transition-colors"
            >
              {editingBannerId ? "Save Changes" : "Publish Banner"}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
