# TVA Backend with Miss Minutes AI Assistant

This is the backend server for the Time Variance Authority website, featuring the Miss Minutes AI assistant.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
GOOGLE_API_KEY=your_google_api_key_here
PORT=3000
```

3. Get a Google API Key:
- Go to the [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key
- Copy the key and paste it in your `.env` file

4. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will run on http://localhost:3000 by default.

## API Endpoints

- `POST /api/chat`: Chat endpoint for Miss Minutes AI assistant
- `GET /api/health`: Health check endpoint

## Features

- Miss Minutes AI assistant with southern accent and TVA knowledge
- Conversation history management
- Error handling and connection status
- CORS enabled for frontend communication 