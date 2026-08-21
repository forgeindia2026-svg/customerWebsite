import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  category: string; // e.g. 'ip', 'bullet', 'dvr', 'vdp', 'cctv', 'accessories'
  brand: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  rating: number;
  reviewsCount: number;
  image: string;
  images?: string[];
  specs: string[];
  stock: number;
  description?: string;
  warranty?: string;
  delivery?: string;
  isNew?: boolean;
  isFlashDeal?: boolean;
  isBestSeller?: boolean;
  subCategory?: string;
  modelName?: string;
  discount?: number;
  promotionalOffer?: string;
  features?: { iconName: string; label: string }[];
  offers?: { title: string; subtitle: string }[];
  relatedProducts?: mongoose.Types.ObjectId[] | IProduct[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    badge: { type: String },
    rating: { type: Number, default: 4.5 },
    reviewsCount: { type: Number, default: 0 },
    image: { type: String, required: true },
    images: [{ type: String }],
    specs: [{ type: String }],
    stock: { type: Number, default: 50 },
    description: { type: String },
    warranty: { type: String },
    delivery: { type: String },
    isNew: { type: Boolean, default: false },
    isFlashDeal: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    subCategory: { type: String },
    modelName: { type: String },
    discount: { type: Number },
    promotionalOffer: { type: String },
    features: [
      {
        iconName: { type: String },
        label: { type: String },
      },
    ],
    offers: [
      {
        title: { type: String },
        subtitle: { type: String },
      },
    ],
    relatedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
