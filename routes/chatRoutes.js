const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/config');

// Initialize Google AI
const genAI = new GoogleGenerativeAI(config.googleApiKey);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    // Initialize the model
    const model = genAI.getGenerativeModel({ model: config.aiConfig.model });
    
    // Prepare the chat history
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

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ response: text });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router; 