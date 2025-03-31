const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/config');
const Variant = require('../models/Variant');
const NexusEvent = require('../models/NexusEvent');

// Initialize Google AI
const genAI = new GoogleGenerativeAI(config.googleApiKey);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Helper function to get relevant database context
async function getDatabaseContext(message) {
  const context = {
    variants: [],
    nexusEvents: []
  };

  try {
    // Check if the message is about variants
    if (message.toLowerCase().includes('variant')) {
      context.variants = await Variant.find({});
    }

    // Check if the message is about nexus events
    if (message.toLowerCase().includes('nexus') || message.toLowerCase().includes('event')) {
      context.nexusEvents = await NexusEvent.find({});
    }

    // Check for specific person queries
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
    console.error('Error fetching database context:', error);
    return context;
  }
}

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    // Get relevant database context
    const context = await getDatabaseContext(message);
    
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: config.aiConfig.model });
    
    // Prepare the chat history with context
    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role,
        parts: msg.content,
      })),
      generationConfig: {
        temperature: config.aiConfig.temperature,
        topK: config.aiConfig.topK,
        topP: config.aiConfig.topP,
        maxOutputTokens: config.aiConfig.maxOutputTokens,
      },
    });

    // Create context-aware prompt
    let contextPrompt = "You are Miss Minutes, the TVA guide. Use the following database context to inform your response:\n\n";
    
    if (context.variants.length > 0) {
      contextPrompt += "Active Variants:\n";
      context.variants.forEach(variant => {
        contextPrompt += `- ${variant.name}: ${variant.description}\n`;
      });
    }
    
    if (context.nexusEvents.length > 0) {
      contextPrompt += "\nNexus Events:\n";
      context.nexusEvents.forEach(event => {
        contextPrompt += `- ${event.title}: ${event.description}\n`;
      });
    }

    // Send message with context and get response
    const result = await chat.sendMessage(`${contextPrompt}\n\nUser question: ${message}`);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 