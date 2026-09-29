import mongoose, { Schema, Document } from 'mongoose';

export interface IChatGroup extends Document {
  name: string;
  adminId: string;
  members: string[]; // array of user/technician IDs
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatGroupSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    adminId: { type: String, required: true },
    members: [{ type: String, required: true }],
    avatar: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IChatGroup>('ChatGroup', ChatGroupSchema);
