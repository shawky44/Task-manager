import express from "express";
import cors from "cors";
// import path from "path";
import mongoose from "mongoose";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
const app = express();
import cookieParser from "cookie-parser";
app.use(cookieParser());

//middleware to handle CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "DELETE", "POST", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

//middleware
app.use(express.json());

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/reports", reportRoutes);

//Start Server
const PORT = process.env.PORT || 5000;
const mongoURL = process.env.MONGO_URL;

mongoose
  .connect(mongoURL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is runnig on port ${process.env.PORT}`);
    });
    console.log("the database is connected");
  })
  .catch((err) => console.log(err));

//   "email":"vhjbknb@gmail.com",
//   "password":"Shawkymo@2004"
