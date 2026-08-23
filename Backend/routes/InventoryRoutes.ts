import { Router, Request, Response } from 'express';
import Inventory from '../models/Inventory.js';
import { authenticateToken } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';

const router = Router();

// GET: Fetch all inventory items for the logged-in user
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    // FIXED: Cast req to 'any' to access the custom user object attached by our middleware
    const firebaseUid = (req as any).user?.uid;

    if (!firebaseUid) {
      res.status(400).json({ error: 'User ID missing' });
      return;
    }

    // Find all items belonging to this user, sorted by newest first
    const items = await Inventory.find({ firebaseUid }).sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: items });
  } catch (error: any) {
    console.error('❌ Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST: Save user-verified inventory item
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const firebaseUid = (req as any).user?.uid;
    const { itemName, category, description, stockCount, unitPrice } = req.body;

    if (!itemName || !category) {
      res.status(400).json({ error: 'Item name and category are required.' });
      return;
    }

    const newItem = new Inventory({
      firebaseUid,
      itemName,
      category,
      description: description || '',
      stockCount: Number(stockCount) || 1,
      unitPrice: Number(unitPrice) || 0,
    });

    const savedItem = await newItem.save();
    console.log(`✅ User verified and saved: ${savedItem.itemName}`);

    res.status(201).json({ success: true, data: savedItem });
  } catch (error) {
    console.error('❌ Inventory Save Error:', error);
    res.status(500).json({ error: 'Failed to save inventory item.' });
  }
});

// POST: Save multiple verified inventory items
router.post('/bulk', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const firebaseUid = (req as any).user?.uid;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'No items provided for saving.' });
      return;
    }

    // Process each item using an UPSERT (Update if exists, Insert if new)
    const bulkPromises = items.map(async (item: any) => {
      return await Inventory.findOneAndUpdate(
        { firebaseUid, itemName: item.itemName } as any, // Match exactly by name
        {
          $inc: { stockCount: Number(item.stockCount) || 1 }, // Add the incoming stock to existing stock
          // Only set these fields if the item is brand new
          $setOnInsert: {
            category: item.category || 'Uncategorized',
            description: item.description || '',
            unitPrice: Number(item.unitPrice) || 0,
          }
        },
        { new: true, upsert: true } // Upsert is the magic bullet here
      );
    });

    const savedItems = await Promise.all(bulkPromises);
    res.status(201).json({ success: true, count: savedItems.length, data: savedItems });
  } catch (error) {
    console.error('❌ Bulk Inventory Save Error:', error);
    res.status(500).json({ error: 'Failed to save bulk inventory items.' });
  }
});

router.post('/deduct', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const firebaseUid = (req as any).user?.uid;
    
    // Catch the 'items' array sent exactly by your frontend executeDeductStock function
    const { items } = req.body; 
    
    if (!items || !Array.isArray(items)) {
      res.status(400).json({ error: "Invalid data format. Expected an array of items." });
      return;
    }

    // Loop through every item the AI scanner detected
    for (const scannedItem of items) {
      // Your frontend sends { itemName, stockCount }
      const { itemName, stockCount } = scannedItem; 
      const deductQuantity = Math.abs(Number(stockCount));

      // Fetch the real item from the database
      const item = await Inventory.findOne({ firebaseUid, itemName: itemName } as any);
      
      // Only deduct and log if the item exists and has enough stock
      if (item && item.stockCount >= deductQuantity) {
        
        // 1. Deduct the inventory
        item.stockCount -= deductQuantity;
        await item.save();

        // 2. Log the transaction for the Velocity Math!
        await Transaction.create({
          firebaseUid,
          itemId: item._id,
          itemName: item.itemName,
          quantitySold: deductQuantity,
          salePrice: item.unitPrice, 
          date: new Date()
        });
      }
    }

    res.status(200).json({ success: true, message: "Stock deducted and transactions logged!" });
  } catch (error) {
    console.error("Outbound Batch Error:", error);
    res.status(500).json({ error: "Failed to process outbound scan." });
  }
});

// PATCH: Quickly adjust stock count up or down by ID (Manual +/- buttons)
router.patch('/:id/stock', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const firebaseUid = (req as any).user?.uid;
    const { change } = req.body; // Expects 1 or -1

    const updatedItem = await Inventory.findOneAndUpdate(
      { _id: req.params.id, firebaseUid } as any,
      { $inc: { stockCount: Number(change) } },
      { new: true } 
    );

    if (!updatedItem) {
      res.status(404).json({ error: 'Item not found or unauthorized.' });
      return;
    }

    res.status(200).json({ success: true, data: updatedItem });
  } catch (error) {
    console.error('❌ Stock Update Error:', error);
    res.status(500).json({ error: 'Failed to update stock.' });
  }
});

// PUT: Update an entire inventory item (from the Edit Modal)
router.put('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const firebaseUid = (req as any).user?.uid;
    const { itemName, description, category, stockCount, unitPrice } = req.body;

    const updatedItem = await Inventory.findOneAndUpdate(
      { _id: req.params.id, firebaseUid } as any,
      { 
        $set: { 
          itemName, 
          description, 
          category, 
          stockCount: Number(stockCount), 
          unitPrice: Number(unitPrice) 
        } 
      },
      { new: true } 
    );

    if (!updatedItem) {
      res.status(404).json({ error: 'Item not found.' });
      return;
    }

    res.status(200).json({ success: true, data: updatedItem });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item.' });
  }
});

export default router;