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
  specs: string[];
  stock: number;
  description?: string;
  isFlashDeal?: boolean;
  isBestSeller?: boolean;
  features?: { iconName: string; label: string }[];
  offers?: { title: string; subtitle: string }[];
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
    specs: [{ type: String }],
    stock: { type: Number, default: 50 },
    description: { type: String },
    isFlashDeal: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
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
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
