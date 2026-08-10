import { Router, Request, Response } from 'express';
import Product from '../models/Product';
import { processBase64Image } from '../utils/imageProcessor';

const router = Router();

// GET all products (with optional category filter)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    let query: any = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.title = { $regex: search as string, $options: 'i' };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
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
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create new product
router.post('/', async (req: Request, res: Response) => {
  try {
    if (req.body.image) {
      req.body.image = await processBase64Image(req.body.image);
    }
    if (req.body.imageUrls && Array.isArray(req.body.imageUrls)) {
      req.body.imageUrls = await Promise.all(req.body.imageUrls.map((url: string) => processBase64Image(url)));
    }
    
    const newProduct = new Product(req.body);
    const savedProduct = await newProduct.save();
    res.status(201).json({ success: true, data: savedProduct });
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
