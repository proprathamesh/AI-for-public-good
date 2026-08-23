import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Inventory from '../models/Inventory.js';

const router = Router();

router.post('/analyze-image', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64 } = req.body;
    const firebaseUid = (req as any).user?.uid;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY is undefined in process.env');
      res.status(500).json({ error: 'Server configuration error: Gemini API key missing' });
      return;
    }

    if (!imageBase64) {
      res.status(400).json({ error: 'No image data provided' });
      return;
    }

    if (!firebaseUid) {
      res.status(400).json({ error: 'User ID missing' });
      return;
    }

    // Initialize with the verified key
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const prompt = `
      You are an AI assistant for a retail and inventory business. 
      Analyze this image and return a JSON object with the following keys:
      - "itemName": A short, clear name for the product.
      - "category": The best inventory category (e.g., Lighting, Hardware, etc.).
      - "description": A brief 1-sentence description of the item's appearance.
      - "stockCount": If visible, guess how many items are in the picture, otherwise return 1.
      
      Return ONLY valid JSON. Do not include markdown blocks like \`\`\`json.
    `;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/png" // Change to "image/jpeg" if sending jpeg
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    let textResponse = result.response.text();
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const aiData = JSON.parse(textResponse);

    const newItem = new Inventory({
      firebaseUid,
      itemName: aiData.itemName || 'Unknown Item',
      category: aiData.category || 'Uncategorized',
      description: aiData.description || '',
      stockCount: aiData.stockCount || 1,
    });

    const savedItem = await newItem.save();
    console.log(`✅ AI successfully logged: ${savedItem.itemName}`);

    res.status(200).json({ success: true, data: savedItem });

  } catch (error: any) {
    console.error('❌ AI Analysis & Storage Error:', error);
    res.status(500).json({ error: 'Failed to analyze and save the image.' });
  }
});

export default router;