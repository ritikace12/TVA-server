require('dotenv').config();

const config = {
  mongoUri: process.env.MONGODB_URI,
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  googleApiKey: process.env.GOOGLE_API_KEY,
  corsOrigins: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://localhost:5180'
  ],
  aiConfig: {
    model: "gemini-2.0-flash",
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
  }
};

module.exports = config; 