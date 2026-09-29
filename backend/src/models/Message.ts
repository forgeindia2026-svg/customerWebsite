import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName?: string;
  roomId: string; // sorted "senderId_recipientId" or "groupId"
  text?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'document' | 'audio';
  isGroupMessage: boolean;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, default: 'TECHNICIAN' },
    recipientId: { type: String, required: true },
    recipientName: { type: String, required: false },
    roomId: { type: String, required: true, index: true },
    text: { type: String, required: false }, // Made optional so a message can be just an attachment
    attachmentUrl: { type: String, required: false },
    attachmentType: { type: String, enum: ['image', 'document', 'audio'], required: false },
    isGroupMessage: { type: Boolean, default: false },
    readBy: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>('Message', MessageSchema);
