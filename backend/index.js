const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const userRoutes = require("./routes/userRoutes");
const menuRoutes = require("./routes/menuRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const orderRoutes = require("./routes/orderRoutes");
const stripeRoutes = require("./routes/stripe");
const notificationRoutes = require("./routes/notificationRoutes");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://eatery-cafe-rms.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Map to store userId to socketId mappings
const userSocketMap = new Map();

io.on("connection", (socket) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`Socket connected: ${socket.id}`);
  }

  socket.on("register", (userId) => {
    userSocketMap.set(userId, socket.id);
    if (process.env.NODE_ENV !== "production") {
      console.log(`User ${userId} registered with socket ${socket.id}`);
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, socketId] of userSocketMap.entries()) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        if (process.env.NODE_ENV !== "production") {
          console.log(`User ${userId} disconnected`);
        }
        break;
      }
    }
  });
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "https://eatery-cafe-rms.vercel.app",
    credentials: true,
  })
);

// Make io and userSocketMap accessible to controllers
app.set("io", io);
app.set("userSocketMap", userSocketMap);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB database is connected successfully."))
  .catch((err) => console.error(err));

app.use("/api/auth", userRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Eatery Cafe server is running on port ${PORT}`);
});