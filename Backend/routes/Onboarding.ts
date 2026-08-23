import { Router, Request, Response } from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// POST: /api/users/onboarding
router.post('/onboarding', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessCategory, region, language } = req.body;
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      res.status(400).json({ error: 'User ID is missing from token' });
      return;
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      { 
        businessCategory, 
        region, 
        preferredLanguage: language,
        onboardingComplete: true 
      },
      { new: true, upsert: true }
    );

    console.log(`✅ Profile saved for vendor: ${firebaseUid}`);
    res.status(200).json({ success: true, user: updatedUser });

  } catch (error: any) {
    console.error('❌ Error saving onboarding data:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// GET: Fetch User Profile for the Dashboard
router.get('/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const firebaseUid = req.user?.uid;

    if (!firebaseUid) {
      res.status(400).json({ error: 'User ID is missing from token' });
      return;
    }

    // Find the user in MongoDB
    const userProfile = await User.findOne({ firebaseUid });

    if (!userProfile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.status(200).json({ success: true, user: userProfile });

  } catch (error: any) {
    console.error('❌ Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to load profile data' });
  }
});

export default router;