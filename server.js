require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const config = require("./config/config");
const AIService = require("./services/aiService");

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
  .then(() => console.log("MongoDB Connected"))
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
app.use("/api/variants", require("./routes/variantRoutes"));
app.use("/api/nexus-events", require("./routes/nexusEventRoutes"));
 
// Production static files
if(process.env.NODE_ENV === "production"){
  app.use(express.static(path.join(__dirname, "../frontend/dist")))

  app.get("*", (req, res)=>{
    res.sendFile(path.join(__dirname,"../frontend", "dist", "index.html"))
  })
}

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("Environment:", process.env.NODE_ENV || "development");
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("\nShutting down gracefully...");
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown();
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown();
});
 