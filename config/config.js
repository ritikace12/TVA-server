require('dotenv').config();

// Debug environment variables
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
  MONGO_URI: process.env.MONGO_URI ? 'Set' : 'Not set',
  PORT: process.env.PORT,
  PWD: process.env.PWD
});

// Validate required environment variables
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!mongoUri) {
  console.error('Error: Neither MONGODB_URI nor MONGO_URI environment variable is set');
  console.error('Current working directory:', process.cwd());
  console.error('Environment:', process.env);
  process.exit(1);
}

const config = {
  mongoUri: mongoUri,
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