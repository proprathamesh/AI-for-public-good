import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

router.post('/analyze-image', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64 } = req.body;
    const firebaseUid = (req as any).user?.uid;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: 'Gemini API key missing' });
      return;
    }

    if (!imageBase64 || !firebaseUid) {
      res.status(400).json({ error: 'Missing required data' });
      return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    const prompt = `
      You are an AI inventory and pricing specialist operating in India.
      Analyze this image and identify ALL distinct product types visible.
      For each distinct item, estimate a realistic market standard selling price in INR (Indian Rupees) based on typical retail or wholesale rates.
      
      Return ONLY a valid JSON object matching this schema:
      {
        "items": [
          {
            "itemName": "Short product title",
            "category": "Lighting, Hardware, Furniture, Electronics, etc.",
            "description": "Brief 1-sentence visual description",
            "stockCount": <estimated_number_of_items_visible>,
            "unitPrice": <estimated_market_standard_price_in_INR_as_number>
          }
        ]
      }
      Do not include markdown tags like \`\`\`json.
    `;

    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: "image/png"
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    let textResponse = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedData = JSON.parse(textResponse);

    res.status(200).json({
      success: true,
      items: Array.isArray(parsedData.items) ? parsedData.items : [parsedData]
    });

  } catch (error: any) {
    console.error('❌ AI Multi-Item Analysis Error:', error);
    res.status(500).json({ error: 'Failed to analyze items in image.' });
  }
});

export default router;