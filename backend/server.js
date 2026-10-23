import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to CollabSphere Backend!");
});

app.use("/api/auth", authRoutes);
app.use("/api", projectRoutes);
app.use("/api/projects", noteRoutes);
app.use("/api/projects", fileRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

app.use((error, req, res, next) => {
  console.error("Unhandled error:", error?.message || error);

  res.status(error?.status || 500).json({
    success: false,
    message: error?.message || "Something went wrong"
  });
});

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
