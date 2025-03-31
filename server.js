require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const config = require("./config/config");
const AIService = require("./services/aiService");
const variantRoutes = require('./routes/variantRoutes');
const nexusEventRoutes = require('./routes/nexusEventRoutes');
const chatRoutes = require('./routes/chatRoutes');

const app = express();
app.use(express.json());

// CORS configuration
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Backend is live 🚀");
});

// MongoDB connection
mongoose.connect(config.mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({
        error: "Invalid message format",
        details: "Message must be a non-empty string"
      });
    }

    console.log("Received message:", message);

    const response = await AIService.generateResponse(message, history);
    res.json({ response });
  } catch (error) {
    console.error("Chat endpoint error:", error);
    res.status(500).json({
      error: "Failed to generate response",
      details: error.message
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Routes
app.use('/api/variants', variantRoutes);
app.use('/api/nexus-events', nexusEventRoutes);
app.use('/api', chatRoutes);

// Production static files
if(process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname, "../frontend/dist")))

  app.get("*", (req, res)=>{
    res.sendFile(path.join(__dirname,"../frontend", "dist", "index.html"))
  })
}

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing HTTP server and MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("\nSIGINT received. Closing HTTP server and MongoDB connection...");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});
 