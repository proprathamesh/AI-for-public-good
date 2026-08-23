import mongoose from 'mongoose';

export interface IInventory extends mongoose.Document {
  firebaseUid: string;
  itemName: string;
  category: string;
  description?: string;
  stockCount: number;
  unitPrice: number; // Added unit price field
  createdAt: Date;
}

const InventorySchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, index: true },
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  stockCount: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 }, // Defaults to 0 if not provided
  createdAt: { type: Date, default: Date.now }
});

export default (mongoose.models.Inventory as mongoose.Model<IInventory>) || mongoose.model<IInventory>('Inventory', InventorySchema);