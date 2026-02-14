require("dotenv").config();

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const userRoutes = require("./routes/user.routes");
const noteRoutes = require("./routes/note.routes");
const aiRoutes = require("./routes/ai.routes");

// Startup validation
if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not defined. AI Summarizer will not work.");
}

mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("DB Connected");
});

const app = express();

// 1. Global Rate Limiting (Prevent Brute Force / API Abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use(limiter);

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "img-src": ["'self'", "data:", "*"],
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "frame-ancestors": ["'self'", "https://note-flow-nu-one.vercel.app", "http://localhost:5173"],
      },
    },
    frameguard: false,
  })
);
app.use(express.json());

app.use(
  cors({
    origin: "*", // Allow all origins for production
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Routes
app.get("/", (req, res) => {
  res.json({ message: "NoteFlow Backend is running!" });
});

app.use("/", userRoutes);
app.use("/", noteRoutes);
app.use("/api/ai", aiRoutes);




const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
