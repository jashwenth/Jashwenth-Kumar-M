import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { authenticate } from './backend/middleware/authMiddleware.ts';
import authRoutes from './backend/routes/authRoutes.ts';
import fixitRoutes from './backend/routes/fixitRoutes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.resolve(__dirname, 'public/uploads')));

// Authentication middleware (extracts token and sets req.user)
app.use(authenticate);

// Mount Fixit and Auth APIs
app.use('/api/auth', authRoutes);
app.use('/api/fixit', fixitRoutes);

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

// POST /api/ai/analyze
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { description, imageBase64, imageMimeType, location, floor } = req.body;

    if (!genAI || !apiKey) {
      return res.status(200).json({ error: 'NO_KEY', useFallback: true });
    }

    const systemPrompt = `You are CampusPulse AI, an automated campus infrastructure triage engine for Wales University.
Analyze the incident report and return strictly a JSON object with:
{
  "category": string,       // Exactly one of: "Electrical", "Plumbing", "WiFi", "Cleanliness", "Infrastructure", "Facilities", "Safety", "Other"
  "subcategory": string,    // Specific issue type (e.g. "Water Leakage", "Broken Window", "AC Failure", "Light Flickering", "Drainage Blockage")
  "severity": string,       // Exactly one of: "Low", "Medium", "High", "Critical"
  "summary": string,        // 1 concise, factual sentence describing the issue (max 100 chars)
  "department": string,     // Maintenance department (e.g. "Plumbing Maintenance", "Electrical Maintenance", "IT Support", "Housekeeping", "Civil Maintenance", "Campus Security", "Facilities Management")
  "suggested_sla_hours": number, // Exactly one of: 1, 4, 8, 24, 48
  "keywords": string[]      // 3-5 keywords for duplicate detection
}
Return ONLY valid JSON. No markdown backticks, no explanations.`;

    const userPrompt = `INCIDENT REPORT:
Description: ${description || 'No description provided'}
Location: ${location || 'Campus'}${floor ? `, ${floor}` : ''}
Please analyze and categorize this campus issue.`;

    const parts: any[] = [{ text: systemPrompt }, { text: userPrompt }];

    if (imageBase64 && imageMimeType) {
      parts.push({
        inlineData: {
          mimeType: imageMimeType,
          data: imageBase64,
        },
      });
    }

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: parts,
    });

    const responseText = response.text?.trim() || '';
    const cleanJson = responseText
      .replace(/^```json?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanJson);
    return res.status(200).json(parsed);
  } catch (err: any) {
    console.error('API /api/ai/analyze error:', err?.message || err);
    return res.status(200).json({ error: err?.message, useFallback: true });
  }
});

// POST /api/ai/chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history, contextData } = req.body;

    if (!genAI || !apiKey) {
      return res.status(200).json({ error: 'NO_KEY', useFallback: true });
    }

    const systemPrompt = `You are CampusPulse Assistant, an intelligent campus operations copilot for Wales University.
Current Live Operations Status:
- Total Open Incidents: ${contextData?.openIncidents ?? 7}
- High/Critical Priority: ${contextData?.highPriority ?? 4}
- Fixed Today: ${contextData?.fixedToday ?? 6}
- Active Hotspot: ${contextData?.hotspot ?? 'Block B (Plumbing Infrastructure)'}

Be concise, friendly, and practical (under 3 sentences). Guide students on how to report issues, check SLA status, and locate facilities.`;

    const conversation = (history || [])
      .map((h: any) => `${h.role === 'user' ? 'Student' : 'Assistant'}: ${h.content}`)
      .join('\n');

    const prompt = `${systemPrompt}

${conversation ? `Conversation:\n${conversation}\n` : ''}
Student: ${message}
CampusPulse Assistant:`;

    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.status(200).json({ text: response.text?.trim() });
  } catch (err: any) {
    console.error('API /api/ai/chat error:', err?.message || err);
    return res.status(200).json({ error: err?.message, useFallback: true });
  }
});

// Dev server with Vite middleware or static dist
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`CampusPulse server listening on http://0.0.0.0:${port}`);
  });
}

start();
