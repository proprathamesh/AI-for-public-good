import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import Inventory from '../models/Inventory.js';

const router = Router();

// 1. GET: Calculate 30-Day Velocity for all items
router.get('/velocity', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const firebaseUid = (req as any).user?.uid;
    
    // Get the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // MongoDB Aggregation: Group by item name and sum the quantities sold in the last 30 days
    const velocityData = await Transaction.aggregate([
      { 
        $match: { 
          firebaseUid, 
          date: { $gte: thirtyDaysAgo } 
        } 
      },
      { 
        $group: { 
          _id: "$itemName", 
          totalSold: { $sum: "$quantitySold" } 
        } 
      }
    ]);

    // Format the response into an easy object { "Brass Lamp": 15, "LED Strip": 45 }
    const formattedData: Record<string, number> = {};
    velocityData.forEach(item => {
      formattedData[item._id] = item.totalSold;
    });

    res.status(200).json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate velocity.' });
  }
});

// 2. GET: Secret route to generate 30 days of Dummy Data!
// Call this once from Postman or your browser to fill the database
router.get('/seed-dummy-data', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const firebaseUid = (req as any).user?.uid;
    
    // 1. Fetch the user's actual live inventory
    const userInventory = await Inventory.find({ firebaseUid } as any);

    // If they have no inventory, we can't seed data!
    if (userInventory.length === 0) {
      res.status(400).json({ error: 'Your inventory is empty. Please add items using the scanner first!' });
      return;
    }

    const transactions = [];

    // 2. Loop backwards for 30 days
    for (let i = 0; i < 30; i++) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - i);

      // Create 1 to 3 random sales for each day
      const salesToday = Math.floor(Math.random() * 3) + 1; 
      
      for(let j = 0; j < salesToday; j++) {
        // Pick a random item from the user's ACTUAL inventory array
        const randomItem = userInventory[Math.floor(Math.random() * userInventory.length)];
        if (!randomItem) continue;
        
        transactions.push({
          firebaseUid,
          itemId: randomItem._id, // The actual MongoDB ID
          itemName: randomItem.itemName, // The actual name
          quantitySold: Math.floor(Math.random() * 5) + 1, // Sold between 1 and 5 items
          salePrice: randomItem.unitPrice, // Matches their actual set price!
          date: pastDate
        });
      }
    }

    // 3. Insert all into the database
    await Transaction.insertMany(transactions);
    
    res.status(200).json({ success: true, message: `Successfully seeded ${transactions.length} transactions mapped to your real inventory!` });
  } catch (error) {
    console.error("Seeding Error:", error);
    res.status(500).json({ error: 'Failed to seed data.' });
  }
});

export default router;