import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addProduct, deleteProduct, editProduct, setProducts } from '../../redux/dashboardSlice';
import { FiPlus, FiTrash2, FiSearch, FiLayers, FiDollarSign, FiInfo, FiBox, FiGrid, FiAward, FiPackage } from 'react-icons/fi';
import Modal from '../../components/Modal';

import Categories from '../Categories/Categories';
import Brands from '../Brands/Brands';
import Inventory from '../Inventory/Inventory';

import { getApiUrl } from '../../utils/config';

function getFallbackSrc(category) {
  const baseUrl = `${getApiUrl()}/images`;
  const catLower = (category || '').toLowerCase();
  if (catLower.includes('ip')) return `${baseUrl}/ip_camera.png`;
  if (catLower.includes('analog') || catLower.includes('bullet')) return `${baseUrl}/bullet_camera.png`;
  if (catLower.includes('dome')) return `${baseUrl}/dome_camera.png`;
  if (catLower.includes('wifi')) return `${baseUrl}/wifi_camera.png`;
  if (catLower.includes('ptz')) return `${baseUrl}/ptz_camera.png`;
  if (catLower.includes('nvr') || catLower.includes('dvr')) return `${baseUrl}/dvr_nvr.png`;
  if (catLower.includes('hard') || catLower.includes('hdd') || catLower.includes('disk') || catLower.includes('storage')) return `${baseUrl}/surveillance_hdd.png`;
  if (catLower.includes('vdp') || catLower.includes('door')) return `${baseUrl}/video_door_phone.png`;
  return `${baseUrl}/cctv_cable.png`;
}

function ProductCard({ prod, onDelete, onEdit }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const rawImages = prod.imageUrls && prod.imageUrls.length > 0 
    ? prod.imageUrls 
    : [prod.imageUrl || getFallbackSrc(prod.category)];

  const images = rawImages.map(img => {
    if (!img || img.startsWith('blob:')) return getFallbackSrc(prod.category);
    return img.replace('https://65.0.45.64.sslip.io', getApiUrl());
  });

  const currentImage = images[activeImageIndex] || images[0] || getFallbackSrc(prod.category);

  const hasOfferPrice = prod.offerPrice && Number(prod.offerPrice) > 0;
  const computedDiscount = hasOfferPrice && Number(prod.price) > 0
    ? Math.round(((Number(prod.price) - Number(prod.offerPrice)) / Number(prod.price)) * 100)
    : Number(prod.discount || 0);

  const displayPrice = hasOfferPrice ? prod.offerPrice : prod.price;
  const originalPrice = hasOfferPrice 
    ? prod.price 
    : (Number(prod.discount) > 0 ? Math.round(prod.price * (1 + Number(prod.discount) / 100)) : null);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between hover:border-primary/20 dark:hover:border-primary/20 transition-all text-left relative overflow-hidden">
      <div>
        {/* Float badges for New, Best Seller and Discount */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
          {prod.isNew && (
            <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
              New
            </span>
          )}
          {prod.isBestSeller && (
            <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
              Best Seller
            </span>
          )}
          {prod.isFlashDeal && (
            <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
              ⚡ Flash Deal
            </span>
          )}
          {computedDiscount > 0 ? (
            <span className="px-2 py-0.5 rounded bg-rose-500 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
              {computedDiscount}% OFF
            </span>
          ) : null}
        </div>

        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-855 text-slate-550 dark:text-slate-350 text-[10px] font-bold uppercase tracking-wider">{prod.category}</span>
          <button 
            onClick={() => onDelete(prod.id)}
            className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            title="Remove product"
          >
            <FiTrash2 size={13} />
          </button>
        </div>

        {/* Product Image Frame */}
        <div className="mt-3.5 relative group">
          <div className="w-full h-36 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center relative overflow-hidden border border-slate-100 dark:border-slate-800">
            <img 
              src={currentImage} 
              alt={prod.name} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = getFallbackSrc(prod.category);
              }}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Multiple Image Thumbnails Indicator on Card */}
          {images.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-2 overflow-x-auto pb-1 max-w-full">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-7 h-7 rounded border transition-all overflow-hidden flex-shrink-0 ${
                    activeImageIndex === idx ? 'border-primary scale-105 ring-1 ring-primary' : 'border-slate-150 dark:border-slate-750 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-3">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs leading-normal line-clamp-2">{prod.name}</h4>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">Model: {prod.model}</span>
        </div>

        <p className="text-[11px] text-slate-650 dark:text-slate-350 mt-2.5 leading-normal line-clamp-3">{prod.description}</p>
        
        {/* Additional details */}
        <div className="mt-3.5 space-y-2 border-t border-slate-50 dark:border-slate-855/50 pt-2.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500 text-xs">★</span>
            <span>Rating: {prod.rating || '4.5'} / 5</span>
          </div>
          {prod.warranty && (
            <div className="flex items-center gap-1.5">
              <span>🛡️</span>
              <span>Warranty: {prod.warranty}</span>
            </div>
          )}
          {prod.delivery && (
            <div className="flex items-center gap-1.5">
              <span>🚚</span>
              <span>Delivery: {prod.delivery}</span>
            </div>
          )}
          {prod.offers && (
            <div className="flex items-center gap-1.5">
              <span>🏷️</span>
              <span className="text-rose-600 dark:text-rose-455 truncate">Offer: {prod.offers}</span>
            </div>
          )}
        </div>

      </div>

      <div className="mt-4 border-t border-slate-50 dark:border-slate-855 pt-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Price</span>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-slate-900 dark:text-white text-xs">₹{(displayPrice || 0).toLocaleString('en-IN')}</span>
              {originalPrice ? (
                <span className="text-[9px] line-through text-slate-400 font-semibold">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </span>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Stock In Hand</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${prod.stock > 10 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' : 'text-amber-600 bg-amber-50 dark:bg-amber-955/20'}`}>
              {prod.stock} units
            </span>
          </div>
        </div>
        <button
          onClick={() => onEdit(prod)}
          className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 text-xs font-semibold rounded-xl transition-colors border border-blue-100 dark:border-blue-900/30"
        >
          Edit Product
        </button>
      </div>

    </div>
  );
}

const emptyProductForm = {
  name: '', 
  brand: '',
  category: 'CCTV Cameras', 
  subCategory: 'IP Cameras',
  customCategory: '',
  price: '', 
  offerPrice: '',
  stock: '', 
  description: '', 
  model: '',
  imageUrl: '',
  imageUrls: [],
  discount: '',
  delivery: '',
  warranty: '',
  rating: '',
  offers: '',
  isNew: false,
  isBestSeller: false,
  isFlashDeal: false,
  dynamicFeatures: [],
  dynamicOffers: [],
  relatedProducts: []
};

export default function Products() {
  const dispatch = useDispatch();
  const products = useSelector(state => state.dashboard.products);

  const [prodTab, setProdTab] = useState('catalog'); // 'catalog', 'categories', 'brands', 'inventory'

  React.useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const mapped = data.data.map(item => {
            const hasSpecialOffer = item.originalPrice && item.originalPrice > item.price;
            const originalMrp = hasSpecialOffer ? item.originalPrice : item.price;
            const effectiveOfferPrice = hasSpecialOffer ? item.price : '';

            return {
              id: item._id || item.id,
              name: item.title,
              category: item.category || 'CCTV Cameras',
              subCategory: item.subCategory || '',
              brand: item.brand || '',
              model: item.specs?.[0] || item.modelName || '',
              price: originalMrp,
              offerPrice: effectiveOfferPrice,
              stock: item.stock || 0,
              description: item.description || '',
              imageUrl: item.image,
              imageUrls: item.images || [item.image],
              discount: item.discount || (item.badge && item.badge.includes('%') ? parseInt(item.badge) : ''),
              delivery: item.delivery || '',
              warranty: item.warranty || '',
              rating: item.rating || '',
              offers: item.promotionalOffer || '',
              isNew: item.isNew || false,
              isBestSeller: item.isBestSeller || false,
              isFlashDeal: item.isFlashDeal || false,
              features: item.features || [],
              offersList: item.offers || [],
              relatedProducts: item.relatedProducts || [],
            };
          });
          dispatch(setProducts(mapped));
        }
      })
      .catch(err => console.error('Failed to fetch products:', err));
  }, [dispatch]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const subCategoriesMap = {
    'CCTV Cameras': ['IP Cameras', 'WiFi Cameras', 'PTZ Cameras', 'Dome Cameras', 'Bullet Cameras'],
    'DVR': ['4 Channel DVR', '8 Channel DVR', '16 Channel DVR', '32 Channel DVR'],
    'NVR': ['4 Channel NVR', '8 Channel NVR', '16 Channel NVR', '32 Channel NVR', '64 Channel NVR'],
    'Accessories': ['BNC Connectors', 'DC Pins', 'Power Supply Boxes', 'Mounting Brackets', 'Junction Boxes'],
    'Hard Disk': ['1 TB Hard Disk', '2 TB Hard Disk', '4 TB Hard Disk', '6 TB Hard Disk', '8 TB+ Hard Disk'],
    'Video Door Phone': ['Single Apartment VDP', 'Multi Apartment VDP', 'Wireless VDP'],
    'Alarm Systems': ['Motion Sensors', 'Door Sensors', 'Siren & Alarms', 'Control Panels'],
    'Networking': ['Cat6 Cable Box', 'PoE Switches', 'Routers & Access Points', 'RJ45 Connectors'],
    'Installation Kit': ['Tool Kit', 'Cable Testers', 'Wire Strippers', 'Crimp Tools'],
    'SSD': ['128 GB SSD', '256 GB SSD', '512 GB SSD', '1 TB SSD'],
    'Pendrive': ['32 GB Pendrive', '64 GB Pendrive', '128 GB Pendrive'],
    'HDMI Cables': ['1.5m HDMI Cable', '3m HDMI Cable', '5m HDMI Cable', '10m+ HDMI Cable'],
  };

  const defaultCategories = Object.keys(subCategoriesMap);

  const [productForm, setProductForm] = useState(emptyProductForm);

  const [isUploading, setIsUploading] = useState(false);

  // 2-Way Auto Calculation Handlers for Price, Offer Price, and Discount
  const handlePriceChange = (val) => {
    const newPrice = val;
    if (newPrice && productForm.offerPrice && Number(newPrice) > 0 && Number(productForm.offerPrice) > 0) {
      if (Number(newPrice) >= Number(productForm.offerPrice)) {
        const newDisc = Math.round(((Number(newPrice) - Number(productForm.offerPrice)) / Number(newPrice)) * 100);
        setProductForm(prev => ({ ...prev, price: newPrice, discount: newDisc }));
        return;
      }
    } else if (newPrice && productForm.discount && Number(newPrice) > 0 && Number(productForm.discount) > 0) {
      const calculatedOffer = Math.round(Number(newPrice) * (1 - Number(productForm.discount) / 100));
      setProductForm(prev => ({ ...prev, price: newPrice, offerPrice: calculatedOffer }));
      return;
    }
    setProductForm(prev => ({ ...prev, price: newPrice }));
  };

  const handleOfferPriceChange = (val) => {
    const newOffer = val;
    let newDiscount = productForm.discount;
    if (productForm.price && newOffer && Number(productForm.price) > 0 && Number(newOffer) > 0) {
      if (Number(productForm.price) >= Number(newOffer)) {
        newDiscount = Math.round(((Number(productForm.price) - Number(newOffer)) / Number(productForm.price)) * 100);
      } else {
        newDiscount = '';
      }
    } else if (!newOffer) {
      newDiscount = '';
    }
    setProductForm(prev => ({ ...prev, offerPrice: newOffer, discount: newDiscount }));
  };

  const handleDiscountChange = (val) => {
    const newDiscount = val;
    let newOffer = productForm.offerPrice;
    if (productForm.price && newDiscount && Number(productForm.price) > 0 && Number(newDiscount) > 0) {
      newOffer = Math.round(Number(productForm.price) * (1 - Number(newDiscount) / 100));
    } else if (!newDiscount) {
      newOffer = '';
    }
    setProductForm(prev => ({ ...prev, discount: newDiscount, offerPrice: newOffer }));
  };

    const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // 1. Immediately read file locally so client sees image instantly with ZERO errors
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductForm(prev => ({ ...prev, imageUrl: reader.result }));
      setIsUploading(false);
    };
    reader.readAsDataURL(file);

    // 2. Background attempt to upload to AWS S3 Server
    try {
      const formData = new FormData();
      formData.append('image', file);
      const apiUrl = import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io';

      fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        if (data && data.success && data.imageUrl) {
          setProductForm(prev => ({ ...prev, imageUrl: data.imageUrl }));
        }
      })
      .catch((err) => {
        console.warn('Background upload note (using local image):', err);
      });
    } catch (_) {}
  };

  const addDynamicFeature = () => {
    setProductForm(prev => ({
      ...prev,
      dynamicFeatures: [...prev.dynamicFeatures, { iconName: '', label: '' }]
    }));
  };

  const updateDynamicFeature = (index, field, value) => {
    setProductForm(prev => {
      const newFeatures = [...prev.dynamicFeatures];
      newFeatures[index][field] = value;
      return { ...prev, dynamicFeatures: newFeatures };
    });
  };

  const removeDynamicFeature = (index) => {
    setProductForm(prev => {
      const newFeatures = prev.dynamicFeatures.filter((_, i) => i !== index);
      return { ...prev, dynamicFeatures: newFeatures };
    });
  };

  const addDynamicOffer = () => {
    setProductForm(prev => ({
      ...prev,
      dynamicOffers: [...prev.dynamicOffers, { title: '', subtitle: '' }]
    }));
  };

  const updateDynamicOffer = (index, field, value) => {
    setProductForm(prev => {
      const newOffers = [...prev.dynamicOffers];
      newOffers[index][field] = value;
      return { ...prev, dynamicOffers: newOffers };
    });
  };

  const removeDynamicOffer = (index) => {
    setProductForm(prev => {
      const newOffers = prev.dynamicOffers.filter((_, i) => i !== index);
      return { ...prev, dynamicOffers: newOffers };
    });
  };

  const handleMultipleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => {
          const newUrls = [...(prev.imageUrls || []), reader.result];
          return {
            ...prev,
            imageUrls: newUrls,
            imageUrl: prev.imageUrl || reader.result
          };
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (imgUrl) => {
    setProductForm(prev => {
      const newUrls = (prev.imageUrls || []).filter(url => url !== imgUrl);
      return {
        ...prev,
        imageUrls: newUrls,
        imageUrl: prev.imageUrl === imgUrl ? (newUrls[0] || '') : prev.imageUrl
      };
    });
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    const finalCategory = productForm.category === 'Other' ? (productForm.customCategory || 'Other') : productForm.category;

    const dbProduct = {
      title: productForm.name,
      category: finalCategory,
      subCategory: productForm.subCategory || '',
      brand: productForm.brand || '',
      price: parseFloat(productForm.offerPrice) > 0 ? parseFloat(productForm.offerPrice) : parseFloat(productForm.price),
      originalPrice: parseFloat(productForm.offerPrice) > 0 ? parseFloat(productForm.price) : undefined,
      badge: productForm.offers || (productForm.discount ? `${productForm.discount}% OFF` : undefined),
      rating: parseFloat(productForm.rating) || undefined,
      image: productForm.imageUrl || '',
      images: productForm.imageUrls || [],
      specs: productForm.model ? [productForm.model] : [],
      modelName: productForm.model || '',
      discount: parseFloat(productForm.discount) || 0,
      stock: parseInt(productForm.stock) || 0,
      description: productForm.description || '',
      warranty: productForm.warranty || '',
      delivery: productForm.delivery || '',
      promotionalOffer: productForm.offers || '',
      isNew: productForm.isNew || false,
      isFlashDeal: productForm.isFlashDeal || false,
      isBestSeller: productForm.isBestSeller || false,
      features: productForm.dynamicFeatures || [],
      offers: productForm.dynamicOffers || [],
      relatedProducts: productForm.relatedProducts || [],
    };

    fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dbProduct)
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            throw new Error(errData.message || 'Server error');
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.data) {
          const item = data.data;
          dispatch(addProduct({
            id: item._id,
            name: item.title,
            brand: productForm.brand || item.brand || '',
            category: finalCategory,
            subCategory: productForm.subCategory || item.subCategory || '',
            model: item.specs?.[0] || 'Generic Model',
            price: parseFloat(productForm.price) || 0,
            offerPrice: parseFloat(productForm.offerPrice) || '',
            stock: item.stock || 0,
            description: item.description || '',
            imageUrl: item.image,
            imageUrls: [item.image],
            discount: productForm.discount || '',
            delivery: item.delivery || productForm.delivery || '',
            warranty: item.warranty || productForm.warranty || '',
            rating: item.rating || productForm.rating || 4.5,
            offers: item.badge || productForm.offers || '',
            isNew: productForm.isNew || false,
            isBestSeller: productForm.isBestSeller || false,
            isFlashDeal: productForm.isFlashDeal || false,
            features: item.features || [],
            offersList: item.offers || [],
            relatedProducts: item.relatedProducts || [],
          }));
        }
      })
      .catch(err => {
        console.error('Failed to add product to database:', err);
        alert('Failed to save product in database: ' + err.message);
      });

    setProductForm({ 
      name: '', 
      brand: '',
      category: 'CCTV Cameras', 
      subCategory: 'IP Cameras',
      customCategory: '',
      price: '', 
      offerPrice: '',
      stock: '', 
      description: '', 
      model: '',
      imageUrl: '',
      imageUrls: [],
      discount: '',
      delivery: '',
      warranty: '',
      rating: '',
      offers: '',
      isNew: false,
      isBestSeller: false,
      isFlashDeal: false,
      dynamicFeatures: [],
      dynamicOffers: [],
      relatedProducts: []
    });
    setModalOpen(false);
  };

  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          prod.model.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || prod.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">

      {/* 🎛️ Products Hub Primary Sub-Tabs Switcher */}
      <div className="flex bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs justify-between items-center overflow-x-auto gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setProdTab('catalog')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              prodTab === 'catalog'
                ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FiBox size={16} />
            <span>📦 Products Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setProdTab('categories')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              prodTab === 'categories'
                ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FiGrid size={16} />
            <span>🏷️ Categories</span>
          </button>

          <button
            onClick={() => setProdTab('brands')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              prodTab === 'brands'
                ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FiAward size={16} />
            <span>🏷️ Brands</span>
          </button>

          <button
            onClick={() => setProdTab('inventory')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              prodTab === 'inventory'
                ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FiPackage size={16} />
            <span>📊 Stock Inventory</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 font-bold hidden md:block px-3">
          ● Products Hub
        </div>
      </div>

      {prodTab === 'categories' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-xs">
          <Categories />
        </div>
      )}

      {prodTab === 'brands' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-xs">
          <Brands />
        </div>
      )}

      {prodTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-xs">
          <Inventory />
        </div>
      )}

      {prodTab === 'catalog' && (
        <>
      {/* Header Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center transition-colors">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <FiSearch size={15} />
          </span>
          <input
            type="text"
            placeholder="Search products by model, name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Action & Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-lg px-2.5 py-1.5 focus:outline-none"
          >
            <option value="All">All Categories</option>
            <option value="IP Camera">IP Cameras</option>
            <option value="Analog Camera">Analog Cameras</option>
            <option value="NVR">NVRs</option>
            <option value="DVR">DVRs</option>
            <option value="Hard Disk">Surveillance HDD</option>
            <option value="SSD">SSD</option>
            <option value="Pendrive">Pendrive</option>
            <option value="Cables">Cables</option>
            <option value="HDMI Cables">HDMI Cables</option>
          </select>

          <button 
            onClick={() => {
              setProductForm(emptyProductForm);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
          >
            <FiPlus /> Add Product
          </button>
          </div>

      </div>

      {/* Grid of Products */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <FiInfo className="mx-auto mb-2 opacity-50" size={32} />
            <p className="text-xs">No products found matching that filter.</p>
          </div>
        ) : (
          filteredProducts.map((prod) => (
            <ProductCard 
              key={prod.id} 
              prod={prod} 
              onDelete={(id) => {
                  // Optimistically delete from UI instantly for snappy UX
                  if (id) {
                    dispatch(deleteProduct(id));
                  }
                  
                  fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/products/${id}`, {
                    method: 'DELETE',
                  })
                    .then(res => res.json())
                    .then(data => {
                      if (!data.success && typeof id === 'string' && !id.startsWith('PROD-')) {
                        if (data.message && !data.message.toLowerCase().includes('not found')) {
                          console.warn('Backend delete issue:', data.message);
                        }
                      }
                    })
                    .catch(err => {
                      console.error('Failed to delete product from API:', err);
                    });
                }}
              onEdit={(p) => {
                setEditingProduct(p);
                const isDefault = defaultCategories.includes(p.category);
                setProductForm({
                  name: p.name,
                  brand: p.brand || '',
                  category: isDefault ? p.category : 'Other',
                  subCategory: p.subCategory || 'IP Cameras',
                  customCategory: isDefault ? '' : p.category,
                  price: p.price,
                  offerPrice: p.offerPrice || '',
                  stock: p.stock,
                  description: p.description || '',
                  model: p.model || '',
                  imageUrl: p.imageUrl || '',
                  imageUrls: p.imageUrls || [],
                  discount: p.discount !== undefined && p.discount !== null ? p.discount : '',
                  delivery: p.delivery || '',
                  warranty: p.warranty || '',
                  rating: p.rating !== undefined && p.rating !== null ? p.rating : '',
                  offers: p.offers || '',
                  isNew: p.isNew || false,
                  isBestSeller: p.isBestSeller || false,
                  isFlashDeal: p.isFlashDeal || false,
                  dynamicFeatures: p.features || [],
                  dynamicOffers: p.offersList || [],
                  relatedProducts: p.relatedProducts || [],
                });
                setEditModalOpen(true);
              }}
            />
          ))
        )}
      </div>
      </>
      )}

      {/* Modal Add Product */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setProductForm(emptyProductForm); }} title="Register New CCTV Device">
        <form onSubmit={handleAddProduct} className="space-y-4 text-left">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Product Name</label>
              <input 
                required
                type="text" 
                placeholder="e.g. CP Plus Dome Camera" 
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Model Number</label>
              <input 
                required
                type="text" 
                placeholder="e.g. CP-UNC-DA21L2" 
                value={productForm.model}
                onChange={(e) => setProductForm({ ...productForm, model: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Brand</label>
              <input 
                required
                type="text" 
                placeholder="e.g. CP Plus, Hikvision" 
                value={productForm.brand}
                onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category</label>
              <select 
                value={productForm.category}
                onChange={(e) => {
                  const newCat = e.target.value;
                  const subs = subCategoriesMap[newCat] || [];
                  setProductForm({ 
                    ...productForm, 
                    category: newCat,
                    subCategory: subs.length > 0 ? subs[0] : ''
                  });
                }}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100 font-semibold"
              >
                {Object.keys(subCategoriesMap).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="Other" style={{ color: '#2563eb', fontWeight: 'bold' }}>Add Category</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Sub Category</label>
              <select 
                value={productForm.subCategory}
                onChange={(e) => setProductForm({ ...productForm, subCategory: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100 font-semibold"
              >
                {(subCategoriesMap[productForm.category] || []).map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
                {(!subCategoriesMap[productForm.category] || subCategoriesMap[productForm.category].length === 0) && (
                  <option value="">General</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Initial Stock</label>
              <input 
                required
                type="number" 
                placeholder="10" 
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Price / M.R.P. (₹)</label>
              <input 
                required
                type="number" 
                placeholder="2500" 
                value={productForm.price}
                onChange={(e) => handlePriceChange(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Offer Price (₹) (Optional)</label>
              <input 
                type="number" 
                placeholder="Discounted selling price" 
                value={productForm.offerPrice}
                onChange={(e) => handleOfferPriceChange(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100 font-bold text-emerald-600 dark:text-emerald-400"
              />
            </div>
          </div>

          {productForm.category === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Custom Category Name</label>
              <input 
                required
                type="text" 
                placeholder="Type custom category name" 
                value={productForm.customCategory}
                onChange={(e) => setProductForm({ ...productForm, customCategory: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Discount (%)</label>
              <input 
                type="number" 
                placeholder="e.g. 10" 
                value={productForm.discount}
                onChange={(e) => handleDiscountChange(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100 font-bold text-blue-600 dark:text-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Rating (1.0 - 5.0)</label>
              <input 
                type="number" 
                step="0.1" 
                min="1" 
                max="5"
                placeholder="e.g. 4.8" 
                value={productForm.rating}
                onChange={(e) => setProductForm({ ...productForm, rating: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Warranty</label>
              <input 
                type="text" 
                placeholder="e.g. 1 Year Warranty" 
                value={productForm.warranty}
                onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Delivery Info</label>
              <input 
                type="text" 
                placeholder="e.g. Free delivery in 2 days" 
                value={productForm.delivery}
                onChange={(e) => setProductForm({ ...productForm, delivery: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Promotional Offers</label>
              <input 
                type="text" 
                placeholder="e.g. Flat ₹500 off with HDFC Card" 
                value={productForm.offers}
                onChange={(e) => setProductForm({ ...productForm, offers: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="md:col-span-2 py-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Related Products (Frequently Bought Together)</label>
            <select
              multiple
              value={productForm.relatedProducts || []}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                setProductForm({ ...productForm, relatedProducts: selectedOptions });
              }}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              style={{ minHeight: '100px' }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} - {p.model}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-6 py-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-350 cursor-pointer">
              <input 
                type="checkbox"
                checked={productForm.isNew}
                onChange={(e) => setProductForm({ ...productForm, isNew: e.target.checked })}
                className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
              />
              Mark as New Product
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-350 cursor-pointer">
              <input 
                type="checkbox"
                checked={productForm.isBestSeller}
                onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })}
                className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
              />
              Mark as Best Seller
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-350 cursor-pointer">
              <input 
                type="checkbox"
                checked={productForm.isFlashDeal}
                onChange={(e) => setProductForm({ ...productForm, isFlashDeal: e.target.checked })}
                className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
              />
              Mark as Flash Deal
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Product Description</label>
            <textarea 
              rows={2}
              placeholder="Provide specifications, camera features..." 
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Product Image Upload</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
            />
            {isUploading && <span className="text-[10px] text-blue-500 mt-1 block">Uploading image to AWS S3...</span>}
            {productForm.imageUrl && (
              <div className="mt-2 relative inline-block">
                <img src={productForm.imageUrl} alt="Preview" className="h-16 w-16 object-contain border border-slate-200 dark:border-slate-700 rounded-lg p-1" />
              </div>
            )}
          </div>

          {/* Dynamic Features Section */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/10">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Highlight Features (e.g. 2MP Full HD)</label>
              <button type="button" onClick={addDynamicFeature} className="text-xs text-primary font-bold flex items-center gap-1"><FiPlus /> Add Feature</button>
            </div>
            <div className="space-y-3">
              {productForm.dynamicFeatures.map((feat, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <input type="text" placeholder="Icon Name (e.g. camera)" value={feat.iconName} onChange={(e) => updateDynamicFeature(idx, 'iconName', e.target.value)} className="w-1/3 text-xs p-2 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-lg focus:border-primary text-slate-800 dark:text-slate-100" />
                  <input type="text" placeholder="Feature Label (e.g. 2MP Full HD)" value={feat.label} onChange={(e) => updateDynamicFeature(idx, 'label', e.target.value)} className="w-2/3 text-xs p-2 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-lg focus:border-primary text-slate-800 dark:text-slate-100" />
                  <button type="button" onClick={() => removeDynamicFeature(idx)} className="text-red-500 hover:text-red-700"><FiTrash2 size={16} /></button>
                </div>
              ))}
              {productForm.dynamicFeatures.length === 0 && <p className="text-xs text-slate-400">No dynamic features added yet.</p>}
            </div>
          </div>

          {/* Dynamic Offers Section */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/10">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Bank & EMI Offers</label>
              <button type="button" onClick={addDynamicOffer} className="text-xs text-primary font-bold flex items-center gap-1"><FiPlus /> Add Offer</button>
            </div>
            <div className="space-y-3">
              {productForm.dynamicOffers.map((offer, idx) => (
                <div key={idx} className="flex flex-col gap-2 relative border border-slate-100 dark:border-slate-800 p-3 rounded-xl bg-white dark:bg-slate-850">
                  <button type="button" onClick={() => removeDynamicOffer(idx)} className="absolute top-3 right-3 text-red-400 hover:text-red-600"><FiTrash2 size={14} /></button>
                  <input type="text" placeholder="Offer Title (e.g. Bank Offer)" value={offer.title} onChange={(e) => updateDynamicOffer(idx, 'title', e.target.value)} className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-lg focus:border-primary text-slate-800 dark:text-slate-100 pr-8" />
                  <input type="text" placeholder="Offer Subtitle (e.g. Flat 10% Discount)" value={offer.subtitle} onChange={(e) => updateDynamicOffer(idx, 'subtitle', e.target.value)} className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-lg focus:border-primary text-slate-800 dark:text-slate-100" />
                </div>
              ))}
              {productForm.dynamicOffers.length === 0 && <p className="text-xs text-slate-400">No dynamic offers added yet.</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Upload Device Photo(s) (Supports multiple)</label>
            <div className="border border-dashed border-slate-200 dark:border-slate-800 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/10 transition-colors">
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors">
                  Choose Photos
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    className="hidden" 
                    onChange={handleMultipleFilesChange} 
                  />
                </label>
                <span className="text-xs text-slate-400">Supports PNG, JPG, or GIF formats</span>
              </div>
              
              {productForm.imageUrls && productForm.imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2.5 mt-4">
                  {productForm.imageUrls.map((url, index) => (
                    <div key={index} className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden bg-white dark:bg-slate-800 flex-shrink-0 group">
                      <img src={url} alt="upload preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(url)}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Image"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button 
              type="button" 
              onClick={() => { setModalOpen(false); setProductForm(emptyProductForm); }}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Add Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Product Details">
        {editingProduct && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const finalCategory = productForm.category === 'Other' ? (productForm.customCategory || 'Other') : productForm.category;

              const dbProduct = {
                title: productForm.name,
                category: finalCategory,
                subCategory: productForm.subCategory || '',
                brand: productForm.brand || '',
                price: parseFloat(productForm.offerPrice) > 0 ? parseFloat(productForm.offerPrice) : parseFloat(productForm.price),
                originalPrice: parseFloat(productForm.offerPrice) > 0 ? parseFloat(productForm.price) : undefined,
                badge: productForm.offers || (productForm.discount ? `${productForm.discount}% OFF` : undefined),
                rating: parseFloat(productForm.rating) || undefined,
                image: productForm.imageUrl || '',
                images: productForm.imageUrls || [],
                specs: productForm.model ? [productForm.model] : [],
                modelName: productForm.model || '',
                discount: parseFloat(productForm.discount) || 0,
                stock: parseInt(productForm.stock) || 0,
                description: productForm.description || '',
                warranty: productForm.warranty || '',
                delivery: productForm.delivery || '',
                promotionalOffer: productForm.offers || '',
                isNew: productForm.isNew || false,
                isFlashDeal: productForm.isFlashDeal || false,
                isBestSeller: productForm.isBestSeller || false,
                features: productForm.dynamicFeatures || [],
                offers: productForm.dynamicOffers || [],
                relatedProducts: productForm.relatedProducts || [],
              };

              fetch(`${import.meta.env.VITE_API_URL || 'https://65.0.45.64.sslip.io'}/api/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dbProduct)
              })
                .then(res => {
                  if (!res.ok) {
                    return res.json().then(errData => {
                      throw new Error(errData.message || 'Server error');
                    });
                  }
                  return res.json();
                })
                .then(data => {
                  if (data.success) {
                    dispatch(editProduct({
                      id: editingProduct.id,
                      name: productForm.name,
                      brand: productForm.brand || '',
                      category: productForm.category,
                      subCategory: productForm.subCategory || '',
                      price: parseFloat(productForm.price) || 0,
                      offerPrice: parseFloat(productForm.offerPrice) || '',
                      stock: parseInt(productForm.stock) || 0,
                      description: productForm.description,
                      model: productForm.model,
                      imageUrl: productForm.imageUrl,
                      imageUrls: productForm.imageUrls || [],
                      discount: parseFloat(productForm.discount) || 0,
                      delivery: productForm.delivery,
                      warranty: productForm.warranty,
                      rating: parseFloat(productForm.rating) || 4.5,
                      offers: productForm.offers,
                      isNew: productForm.isNew || false,
                      isBestSeller: productForm.isBestSeller || false,
                      isFlashDeal: productForm.isFlashDeal || false,
                      features: productForm.dynamicFeatures || [],
                      offersList: productForm.dynamicOffers || [],
                      relatedProducts: productForm.relatedProducts || [],
                    }));
                  }
                })
                .catch(err => {
                  console.error('Failed to edit product in database:', err);
                  alert('Failed to update product in database: ' + err.message);
                });

              setEditModalOpen(false);
              setEditingProduct(null);
            }}
            className="space-y-4 text-left"
          >
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Product Name</label>
                <input
                  required
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Model Number</label>
                <input
                  type="text"
                  value={productForm.model}
                  onChange={(e) => setProductForm({ ...productForm, model: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Brand</label>
                <input
                  required
                  type="text"
                  value={productForm.brand}
                  onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category</label>
                <select
                  value={productForm.category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    const subs = subCategoriesMap[newCat] || [];
                    setProductForm({
                      ...productForm,
                      category: newCat,
                      subCategory: subs.length > 0 ? subs[0] : ''
                    });
                  }}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100 font-semibold"
                >
                  {Object.keys(subCategoriesMap).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Other" style={{ color: '#2563eb', fontWeight: 'bold' }}>Add Category</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Sub Category</label>
                <select
                  value={productForm.subCategory}
                  onChange={(e) => setProductForm({ ...productForm, subCategory: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100 font-semibold"
                >
                  {(subCategoriesMap[productForm.category] || []).map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                  {(!subCategoriesMap[productForm.category] || subCategoriesMap[productForm.category].length === 0) && (
                    <option value="">General</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Stock Quantity</label>
                <input
                  required
                  type="number"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Price / M.R.P. (₹)</label>
                <input
                  required
                  type="number"
                  value={productForm.price}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Offer Price (₹) (Optional)</label>
                <input
                  type="number"
                  placeholder="Discounted selling price"
                  value={productForm.offerPrice}
                  onChange={(e) => handleOfferPriceChange(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100 font-bold text-emerald-600 dark:text-emerald-400"
                />
              </div>
            </div>

          {productForm.category === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Custom Category Name</label>
              <input 
                required
                type="text" 
                placeholder="Type custom category name" 
                value={productForm.customCategory}
                onChange={(e) => setProductForm({ ...productForm, customCategory: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>
          )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Discount (%)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 10" 
                  value={productForm.discount}
                  onChange={(e) => handleDiscountChange(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100 font-bold text-blue-600 dark:text-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Rating (1.0 - 5.0)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="1" 
                  max="5"
                  placeholder="e.g. 4.8" 
                  value={productForm.rating}
                  onChange={(e) => setProductForm({ ...productForm, rating: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Warranty</label>
                <input 
                  type="text" 
                  placeholder="e.g. 1 Year Warranty" 
                  value={productForm.warranty}
                  onChange={(e) => setProductForm({ ...productForm, warranty: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Delivery Info</label>
                <input 
                  type="text" 
                  placeholder="e.g. Free delivery in 2 days" 
                  value={productForm.delivery}
                  onChange={(e) => setProductForm({ ...productForm, delivery: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Promotional Offers</label>
                <input 
                  type="text" 
                  placeholder="e.g. Flat ₹500 off with HDFC Card" 
                  value={productForm.offers}
                  onChange={(e) => setProductForm({ ...productForm, offers: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Related Products (Frequently Bought Together)</label>
              <select
                multiple
                value={productForm.relatedProducts || []}
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                  setProductForm({ ...productForm, relatedProducts: selectedOptions });
                }}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
                style={{ minHeight: '100px' }}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} - {p.model}</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Hold Ctrl (Windows) or Command (Mac) to select multiple products.</p>
            </div>

            <div className="flex gap-6 py-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-350 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={productForm.isNew}
                  onChange={(e) => setProductForm({ ...productForm, isNew: e.target.checked })}
                  className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                />
                Mark as New Product
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-350 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={productForm.isBestSeller}
                  onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })}
                  className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                />
                Mark as Best Seller
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-350 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={productForm.isFlashDeal}
                  onChange={(e) => setProductForm({ ...productForm, isFlashDeal: e.target.checked })}
                  className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                />
                Mark as Flash Deal
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Description</label>
              <textarea
                rows={3}
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Product Image Upload</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-xl focus:outline-none focus:border-primary text-slate-800 dark:text-slate-100"
              />
              {isUploading && <span className="text-[10px] text-blue-500 mt-1 block">Uploading image to AWS S3...</span>}
              {productForm.imageUrl && (
                <div className="mt-2 relative inline-block">
                  <img src={productForm.imageUrl} alt="Preview" className="h-16 w-16 object-contain border border-slate-200 dark:border-slate-700 rounded-lg p-1" />
                </div>
              )}
            </div>

            {/* Dynamic Features Section */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/10">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Highlight Features (e.g. 2MP Full HD)</label>
                <button type="button" onClick={addDynamicFeature} className="text-xs text-primary font-bold flex items-center gap-1"><FiPlus /> Add Feature</button>
              </div>
              <div className="space-y-3">
                {productForm.dynamicFeatures.map((feat, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <input type="text" placeholder="Icon Name (e.g. camera)" value={feat.iconName} onChange={(e) => updateDynamicFeature(idx, 'iconName', e.target.value)} className="w-1/3 text-xs p-2 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-lg focus:border-primary text-slate-800 dark:text-slate-100" />
                    <input type="text" placeholder="Feature Label (e.g. 2MP Full HD)" value={feat.label} onChange={(e) => updateDynamicFeature(idx, 'label', e.target.value)} className="w-2/3 text-xs p-2 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-lg focus:border-primary text-slate-800 dark:text-slate-100" />
                    <button type="button" onClick={() => removeDynamicFeature(idx)} className="text-red-500 hover:text-red-700"><FiTrash2 size={16} /></button>
                  </div>
                ))}
                {productForm.dynamicFeatures.length === 0 && <p className="text-xs text-slate-400">No dynamic features added yet.</p>}
              </div>
            </div>
  
            {/* Dynamic Offers Section */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/10">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Bank & EMI Offers</label>
                <button type="button" onClick={addDynamicOffer} className="text-xs text-primary font-bold flex items-center gap-1"><FiPlus /> Add Offer</button>
              </div>
              <div className="space-y-3">
                {productForm.dynamicOffers.map((offer, idx) => (
                  <div key={idx} className="flex flex-col gap-2 relative border border-slate-100 dark:border-slate-800 p-3 rounded-xl bg-white dark:bg-slate-850">
                    <button type="button" onClick={() => removeDynamicOffer(idx)} className="absolute top-3 right-3 text-red-400 hover:text-red-600"><FiTrash2 size={14} /></button>
                    <input type="text" placeholder="Offer Title (e.g. Bank Offer)" value={offer.title} onChange={(e) => updateDynamicOffer(idx, 'title', e.target.value)} className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-lg focus:border-primary text-slate-800 dark:text-slate-100 pr-8" />
                    <input type="text" placeholder="Offer Subtitle (e.g. Flat 10% Discount)" value={offer.subtitle} onChange={(e) => updateDynamicOffer(idx, 'subtitle', e.target.value)} className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 bg-transparent dark:bg-slate-800/50 rounded-lg focus:border-primary text-slate-800 dark:text-slate-100" />
                  </div>
                ))}
                {productForm.dynamicOffers.length === 0 && <p className="text-xs text-slate-400">No dynamic offers added yet.</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">Upload Device Photo(s) (Supports multiple)</label>
              <div className="border border-dashed border-slate-200 dark:border-slate-800 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/10 transition-colors">
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors">
                    Choose Photos
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      className="hidden" 
                      onChange={handleMultipleFilesChange} 
                    />
                  </label>
                  <span className="text-xs text-slate-400">Supports PNG, JPG, or GIF formats</span>
                </div>
                
                {productForm.imageUrls && productForm.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mt-4">
                    {productForm.imageUrls.map((url, index) => (
                      <div key={index} className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden bg-white dark:bg-slate-800 flex-shrink-0 group">
                        <img src={url} alt="upload preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(url)}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove Image"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => { setEditModalOpen(false); setEditingProduct(null); }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
