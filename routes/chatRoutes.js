const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');
const config = require('../config/config');
const Variant = require('../models/Variant');
const NexusEvent = require('../models/NexusEvent');

// 🔥 Init new SDK
const ai = new GoogleGenAI({
  apiKey: config.googleApiKey
});

// ✅ Health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 🧠 DB Context Fetcher (unchanged)
async function getDatabaseContext(message) {
  const context = {
    variants: [],
    nexusEvents: []
  };

  try {
    if (message.toLowerCase().includes('variant')) {
      context.variants = await Variant.find({});
    }

    if (message.toLowerCase().includes('nexus') || message.toLowerCase().includes('event')) {
      context.nexusEvents = await NexusEvent.find({});
    }

    if (message.toLowerCase().includes('who is') || message.toLowerCase().includes('tell me about')) {
      const searchTerm = message.toLowerCase().replace(/who is|tell me about/g, '').trim();
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

// 🚀 Chat endpoint (UPDATED)
router.post('/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    // 🧠 Fetch DB context
    const context = await getDatabaseContext(message);

    // 🔥 Build SYSTEM PROMPT (Miss Minutes personality)
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

    // 🧠 Build conversation history manually
    const historyText = history
      .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n");

    let aiResponse;

    try {
      // 🔥 Primary model
      aiResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${systemPrompt}\n\nConversation:\n${historyText}\n\nUser: ${message}\nMiss Minutes:`,
        config: {
          temperature: config.aiConfig.temperature || 0.7
        }
      });
    } catch (err) {
      console.log("⚠️ Falling back model...");

      // 🔁 Fallback
      aiResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `${systemPrompt}\n\nConversation:\n${historyText}\n\nUser: ${message}\nMiss Minutes:`
      });
    }

    const text = aiResponse.text || "No response from AI";

    res.json({ response: text });

  } catch (error) {
    console.error("🔥 Chat error:", error);
    res.status(500).json({
      error: "AI failed",
      details: error.message
    });
  }
});

module.exports = router;