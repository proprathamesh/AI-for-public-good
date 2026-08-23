import { Router, Request, Response } from 'express';
import Inventory from '../models/Inventory.js';
import { authenticateToken } from '../middleware/auth.js';

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

export default router;