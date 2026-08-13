import React, { useState, useEffect } from 'react';
import { 
  FiPlus, 
  FiEdit3, 
  FiTrash2, 
  FiInfo, 
  FiUploadCloud,
} from 'react-icons/fi';
import Modal from '../../components/Modal';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    image: '',
    isFeaturedOnHome: false
  });

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/categories`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCategoryForm(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...categoryForm,
          image: categoryForm.image || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=300&auto=format&fit=crop',
          slug: categoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
        setModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`https://cctvwebsite.onrender.com/api/categories/${editingCategory._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...categoryForm,
          slug: categoryForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
        setEditModalOpen(false);
        setEditingCategory(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        const res = await fetch(`https://cctvwebsite.onrender.com/api/categories/${id}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (data.success) {
          fetchCategories();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      image: cat.image,
      isFeaturedOnHome: cat.isFeaturedOnHome
    });
    setEditModalOpen(true);
  };

  const toggleFeatured = async (cat) => {
    try {
      const res = await fetch(`https://cctvwebsite.onrender.com/api/categories/${cat._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeaturedOnHome: !cat.isFeaturedOnHome })
      });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
        <div className="text-left">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Categories Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage product categories and choose which appear on the customer home page.</p>
        </div>
        <button 
          onClick={() => {
            setCategoryForm({
              name: '',
              slug: '',
              image: '',
              isFeaturedOnHome: false
            });
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-colors sm:ml-auto flex-shrink-0"
        >
          <FiPlus /> Add Category
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
            <FiInfo className="mx-auto mb-2 opacity-40" size={32} />
            <p className="text-xs">No categories found. Click Add Category to create one.</p>
          </div>
        ) : (
          categories.map((cat) => (
            <div 
              key={cat._id} 
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 relative group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center p-1.5 overflow-hidden border border-slate-100 dark:border-slate-750">
                    <img 
                      src={cat.image} 
                      alt={cat.name} 
                      className="w-full h-full object-contain rounded-lg"
                    />
                  </div>
                  <button 
                    onClick={() => toggleFeatured(cat)}
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      cat.isFeaturedOnHome 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {cat.isFeaturedOnHome ? 'Featured on Home' : 'Hidden from Home'}
                  </button>
                </div>

                <div className="mt-4 text-left">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight">{cat.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">/{cat.slug}</p>
                </div>
              </div>

              <div className="mt-4 pt-3.5 border-t border-slate-50 dark:border-slate-800 flex gap-2">
                <button 
                  onClick={() => openEditModal(cat)}
                  className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-bold rounded-xl transition-colors border border-blue-100 flex items-center justify-center gap-1"
                >
                  <FiEdit3 size={11} /> Edit
                </button>
                <button 
                  onClick={() => handleDeleteCategory(cat._id)}
                  className="p-1.5 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                  title="Remove category"
                >
                  <FiTrash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Category">
        <form onSubmit={handleAddCategory} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. CCTV Cameras" 
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category Image</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex flex-col items-center justify-center p-3 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <FiUploadCloud className="text-slate-400 mb-1" size={16} />
                <span className="text-[10px] font-semibold text-slate-500">Upload Image</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden" 
                />
              </label>
              {categoryForm.image && (
                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 border rounded-xl flex items-center justify-center p-1 relative overflow-hidden flex-shrink-0">
                  <img src={categoryForm.image} alt="preview" className="w-full h-full object-cover rounded" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input 
              type="checkbox" 
              id="featureAdd"
              checked={categoryForm.isFeaturedOnHome}
              onChange={(e) => setCategoryForm({ ...categoryForm, isFeaturedOnHome: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="featureAdd" className="text-xs font-semibold text-slate-700">Show on Customer Home Page</label>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button 
              type="button" 
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              Save Category
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Category">
        <form onSubmit={handleEditCategory} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category Name</label>
            <input 
              required
              type="text" 
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent rounded-xl focus:outline-none focus:border-primary text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category Image</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex flex-col items-center justify-center p-3 border border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <FiUploadCloud className="text-slate-400 mb-1" size={16} />
                <span className="text-[10px] font-semibold text-slate-500">Upload New Image</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden" 
                />
              </label>
              {categoryForm.image && (
                <div className="w-14 h-14 bg-slate-50 border rounded-xl flex items-center justify-center p-1 relative overflow-hidden flex-shrink-0">
                  <img src={categoryForm.image} alt="preview" className="w-full h-full object-cover rounded" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <input 
              type="checkbox" 
              id="featureEdit"
              checked={categoryForm.isFeaturedOnHome}
              onChange={(e) => setCategoryForm({ ...categoryForm, isFeaturedOnHome: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300"
            />
            <label htmlFor="featureEdit" className="text-xs font-semibold text-slate-700">Show on Customer Home Page</label>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button 
              type="button" 
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
