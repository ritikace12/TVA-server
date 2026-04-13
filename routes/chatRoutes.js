const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const config = require('../config/config');
const Variant = require('../models/Variant');
const NexusEvent = require('../models/NexusEvent');

// 🔥 Init SDK
const ai = new GoogleGenAI({
  apiKey: config.googleApiKey
});

// ✅ Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 🧠 DB Context Fetcher
async function getDatabaseContext(message) {
  const context = {
    variants: [],
    nexusEvents: []
  };

  try {
    const msg = message.toLowerCase();

    if (msg.includes('variant')) {
      context.variants = await Variant.find({});
    }

    if (msg.includes('nexus') || msg.includes('event')) {
      context.nexusEvents = await NexusEvent.find({});
    }

    if (msg.includes('who is') || msg.includes('tell me about')) {
      const searchTerm = msg.replace(/who is|tell me about/g, '').trim();
      context.variants = await Variant.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ]
      });
    }

    return context;
  } catch (error) {
    console.error('DB context error:', error);
    return context;
  }
}

// 🚀 Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    // 🧠 Fetch DB context
    const context = await getDatabaseContext(message);

    // 🧠 System Prompt
    let systemPrompt = `
You are Miss Minutes, the TVA guide.

- Cheerful, slightly creepy, informative
- You explain timelines, variants, and nexus events
- Use TVA-style language

Use database context when available.
`;

    // 📦 Inject DB context
    if (context.variants.length > 0) {
      systemPrompt += "\n\nVariants:\n";
      context.variants.forEach(v => {
        systemPrompt += `- ${v.name}: ${v.description}\n`;
      });
    }

    if (context.nexusEvents.length > 0) {
      systemPrompt += "\n\nNexus Events:\n";
      context.nexusEvents.forEach(e => {
        systemPrompt += `- ${e.title}: ${e.description}\n`;
      });
    }

    // 🧠 History formatting
    const historyText = history
      .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n");

    let aiResponse;

    try {
      // ✅ Stable model (FIXED)
      aiResponse = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `${systemPrompt}\n\nConversation:\n${historyText}\n\nUser: ${message}\nMiss Minutes:`,
        config: {
          temperature: 0.7
        }
      });

    } catch (error) {
      console.error("Primary AI error:", error.message);

      // 🔁 Handle rate limit gracefully
      if (error.message.includes("429")) {
        return res.json({
          response: "⏳ Miss Minutes is busy pruning timelines right now. Try again in a moment!"
        });
      }

      // 🔁 Fallback attempt (retry once)
      try {
        aiResponse = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: `User: ${message}\nAssistant:`,
        });
      } catch (fallbackError) {
        console.error("Fallback failed:", fallbackError.message);

        return res.status(500).json({
          error: "AI failed completely",
          details: fallbackError.message
        });
      }
    }

    // 🧠 Safe text extraction
    const text =
      aiResponse?.text ||
      aiResponse?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "⚠️ Miss Minutes is confused. Try again.";

    res.json({ response: text });

  } catch (error) {
    console.error("🔥 Chat error:", error);

    res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
});

module.exports = router;