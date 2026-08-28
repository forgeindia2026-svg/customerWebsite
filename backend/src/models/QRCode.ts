import mongoose, { Schema, Document } from 'mongoose';

export interface IQRCode extends Document {
  title: string;
  image: string;
  category: string;
  createdAt: Date;
}

const QRCodeSchema: Schema = new Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, default: 'Payment' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IQRCode>('QRCode', QRCodeSchema);
