import { Router, Request, Response } from 'express';
import Product from '../models/Product';
import { processBase64Image } from '../utils/imageProcessor';
import { uploadBase64ToS3 } from '../utils/s3Uploader';

const router = Router();

// GET all products (with optional category filter)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search, brand } = req.query;
    let query: any = {};

    if (category && typeof category === 'string' && !['all', 'all categories', 'all products', ''].includes(category.trim().toLowerCase())) {
      const cleanCat = category.trim().toLowerCase();
      if (cleanCat.includes('cctv') || cleanCat.includes('camera') || cleanCat.includes('ip') || cleanCat.includes('bullet') || cleanCat.includes('dome') || cleanCat.includes('wifi') || cleanCat.includes('ptz')) {
        query.category = { $regex: 'cctv|ip|bullet|wifi|dome|ptz|camera', $options: 'i' };
      } else {
        query.category = { $regex: cleanCat, $options: 'i' };
      }
    }

    if (brand && typeof brand === 'string' && !['all', 'all brands', ''].includes(brand.trim().toLowerCase())) {
      query.brand = { $regex: brand.trim(), $options: 'i' };
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const terms = search.trim().split(/\s+/).filter(t => t.length > 0);
      const orClauses = terms.map(term => ({
        $or: [
          { title: { $regex: term, $options: 'i' } },
          { name: { $regex: term, $options: 'i' } },
          { category: { $regex: term, $options: 'i' } },
          { brand: { $regex: term, $options: 'i' } },
          { description: { $regex: term, $options: 'i' } },
          { specs: { $regex: term, $options: 'i' } }
        ]
      }));
      query.$or = orClauses.flatMap(c => c.$or);
    }

    const rawProducts = await Product.find(query).sort({ createdAt: -1 });
    
    // Normalize products so Admin Web, Customer App & Customer Web all get name, title, image, and imageUrl!
    const products = rawProducts.map(p => {
      const obj: any = p.toObject();
      const nameVal = obj.name || obj.title || 'CCTV Product';
      const imgVal = obj.imageUrl || obj.image || '';
      return {
        ...obj,
        id: obj._id.toString(),
        name: nameVal,
        title: nameVal,
        image: imgVal,
        imageUrl: imgVal
      };
    });

    res.json({ success: true, count: products.length, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const obj: any = product.toObject();
    const nameVal = obj.name || obj.title || 'CCTV Product';
    const imgVal = obj.imageUrl || obj.image || '';
    res.json({
      success: true,
      data: {
        ...obj,
        id: obj._id.toString(),
        name: nameVal,
        title: nameVal,
        image: imgVal,
        imageUrl: imgVal
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new product
router.post('/', async (req: Request, res: Response) => {
  try {
    const titleVal = req.body.title || req.body.name || 'New CCTV Product';
    let imageVal = req.body.imageUrl || req.body.image || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9';

    if (imageVal.startsWith('data:image')) {
      imageVal = await uploadBase64ToS3(imageVal);
    }

    req.body.title = titleVal;
    req.body.name = titleVal;
    req.body.image = imageVal;
    req.body.imageUrl = imageVal;
    
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    const obj = savedProduct.toObject();
    
    res.status(201).json({
      success: true,
      data: {
        ...obj,
        id: obj._id.toString(),
        name: titleVal,
        title: titleVal,
        image: imageVal,
        imageUrl: imageVal
      }
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT update product
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (req.body.image) {
      req.body.image = await processBase64Image(req.body.image);
    }
    if (req.body.imageUrls && Array.isArray(req.body.imageUrls)) {
      req.body.imageUrls = await Promise.all(req.body.imageUrls.map((url: string) => processBase64Image(url)));
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: updatedProduct });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE product
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
