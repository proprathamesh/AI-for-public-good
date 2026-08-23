import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

router.post('/match', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessCategory, region, inventoryValue } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      res.status(500).json({ error: 'Gemini API key missing' });
      return;
    }

    // const genAI = new GoogleGenerativeAI(apiKey);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });

    // 2. Open-ended prompt instructing it to search
    const prompt = `
      You are an expert Indian MSME financial advisor. 
      I have a user with the following business profile:
      - Business Category: ${businessCategory || 'Retail/Manufacturing'}
      - Region/State: ${region || 'India'}
      - Estimated Inventory Value: ₹${inventoryValue || 0}

      Based on your internal knowledge of Indian government schemes, grants, and subsidies, identify TWO highly relevant schemes for this specific business profile:
      1. One highly relevant STATE-SPECIFIC scheme for the state of "${region}".
      2. One highly relevant CENTRAL (Federal) scheme applicable nationwide.
      
      Return ONLY a valid JSON object (no markdown, no backticks) exactly matching this structure:
      {
        "stateScheme": {
          "schemeName": "Official name of the state scheme",
          "relevance": "2-sentence explanation of why they qualify and the exact benefit",
          "eligibility": "A concise, 1-2 sentence summary of the strict requirements to qualify (e.g., minimum turnover, years active, gender criteria).",
          "actionStep": "Short 4-5 word actionable next step",
          "link": "DO NOT guess the direct URL. Create a Google Search URL formatted exactly like this: https://www.google.com/search?q=Official+website+apply+for+[Exact+Scheme+Name]"
        },
        "centralScheme": {
          "schemeName": "Official name of the central scheme",
          "relevance": "2-sentence explanation of why they qualify and the exact benefit",
          "eligibility": "A concise, 1-2 sentence summary of the strict requirements to qualify (e.g., minimum turnover, years active, gender criteria).",
          "actionStep": "Short 4-5 word actionable next step",
          "link": "DO NOT guess the direct URL. Create a Google Search URL formatted exactly like this: https://www.google.com/search?q=Official+website+apply+for+[Exact+Scheme+Name]"
        }
      }
    `;

    const result = await model.generateContent(prompt);
    let textResponse = result.response.text();
    textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const aiData = JSON.parse(textResponse);
    res.status(200).json({ success: true, data: aiData });

  } catch (error) {
    console.error('❌ Scheme Matching Error:', error);
    res.status(500).json({ error: 'Failed to match schemes.' });
  }
});

export default router;