import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderType extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderTypeSchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model<IOrderType>('OrderType', OrderTypeSchema);
