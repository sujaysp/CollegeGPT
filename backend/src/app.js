const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const chatRoutes = require("./routes/chat.routes");
const conversationRoutes = require("./routes/conversation.routes");
const documentRoutes = require("./routes/document.routes");
const healthRoutes = require("./routes/health.routes");

const app = express();

/*
 * CORS
 *
 * Allows the Next.js frontend running on
 * localhost:3000 to communicate with
 * the Express backend running on localhost:5000.
 */
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

/*
 * Parse incoming JSON request bodies.
 */
app.use(express.json());

/*
 * Basic request logging.
 */
app.use((req, res, next) => {
  console.log(
    `${req.method} ${req.originalUrl}`
  );

  next();
});

/*
 * API Routes
 */
app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/chat",
  chatRoutes
);

app.use(
  "/api/documents",
  documentRoutes
);

app.use(
  "/api/conversations",
  conversationRoutes
);

app.use(
  "/api/health",
  healthRoutes
);

/*
 * Root API response.
 */
app.get("/", (req, res) => {
  res.status(200).json({
    message: "CollegeGPT backend is running",
  });
});

/*
 * Handle unknown API routes.
 */
app.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
  });
});

/*
 * Global error handler.
 */
app.use(
  (error, req, res, next) => {
    console.error(
      "Unhandled server error:",
      error.message
    );

    res.status(500).json({
      message:
        "Something went wrong on the server",
    });
  }
);

module.exports = app;