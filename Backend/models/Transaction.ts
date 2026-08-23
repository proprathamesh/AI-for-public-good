import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true },
  itemName: { type: String, required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true }, // NEW: Links to the exact item
  quantitySold: { type: Number, required: true },
  salePrice: { type: Number, required: true },
  date: { type: Date, default: Date.now } // We will manipulate this for the dummy data
});

export default mongoose.model('Transaction', transactionSchema);