require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDB = require("./config/database");

const authRoutes = require("./routes/auth.routes");
const conversationRoutes = require("./routes/conversation.routes");
const documentRoutes = require("./routes/document.routes");
const chatRoutes = require("./routes/chat.routes");

const app = express();

const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://collegegpt-ai.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("CORS blocked origin:", origin);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    message: "CollegeGPT backend is running",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CollegeGPT API is healthy",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/conversations", conversationRoutes);

app.use("/api/documents", documentRoutes);

app.use("/api/chat", chatRoutes);

app.use((req, res) => {
  console.log("404:", req.method, req.originalUrl);

  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      error: err.message,
    });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err.message === "Only PDF files are supported") {
    return res.status(400).json({
      success: false,
      message: "Only PDF files are supported",
    });
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : undefined,
  });
});

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `CollegeGPT backend running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error("Failed to start CollegeGPT backend:");
    console.error(error);
    process.exit(1);
  }
};

startServer();