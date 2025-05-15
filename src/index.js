import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pricelistRoutes from "./routes/pricelistRoutes.js";

dotenv.config();

const app = express();

// Basic middleware setup
app.use(express.json());

// Single CORS configuration
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Simple root route
app.get("/", (_, res) => {
  console.log("Root route hit");
  res.status(200).json({ message: "Server is running" });
});

// API routes
app.use("/api/pricelist", pricelistRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
