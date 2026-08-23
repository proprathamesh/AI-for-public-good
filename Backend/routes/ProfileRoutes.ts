import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import User from '../models/User';

const router = Router();

// GET: Fetch the current user's profile
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const firebaseUid = (req as any).user?.uid;
    // Firebase tokens often contain the email. We extract it if available.
    const email = (req as any).user?.email || 'user@example.com'; 

    // Find the user, or create a default profile if this is their first time opening the app
    let user = await User.findOne({ firebaseUid } as any);
    
    if (!user) {
      user = await User.create({ 
        firebaseUid, 
        email, 
        name: 'New Entrepreneur', 
        businessName: 'My Business', 
        region: 'India' 
      } as any); // <-- ADD 'as any' RIGHT HERE
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('❌ Fetch Profile Error:', error);
    res.status(500).json({ error: 'Failed to fetch profile data.' });
  }
});

// PUT: Update the user's profile
router.put('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const firebaseUid = (req as any).user?.uid;
    const { name, businessName, region } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid } as any,
      { $set: { name, businessName, region } },
      { new: true, upsert: true }
    );

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('❌ Update Profile Error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

export default router;