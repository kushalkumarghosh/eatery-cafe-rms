const express = require("express");
const router = express.Router();

const {
  createReservation,
  checkAvailability,
  getAllReservations,
  updateReservationStatus,
  deleteReservation,
  getUserReservations,
} = require("../controllers/reservationController");
const { protect, admin } = require("../middlewares/authMiddleware");

// Rate limiting middleware for reservation creation
const rateLimit = require('express-rate-limit');

// Rate limiter for reservation creation (max 3 attempts per 5 minutes)
const createReservationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Max 3 reservation attempts per 5 minutes per IP
  message: {
    msg: 'Too many reservation attempts. Please wait 5 minutes before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for admins if needed
  skip: (req) => {
    return req.user && req.user.role === 'admin';
  }
});

// Rate limiter for availability checks (more lenient)
const availabilityCheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Max 20 availability checks per minute per IP
  message: {
    msg: 'Too many availability checks. Please wait a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes (with rate limiting)
router.get("/availability", availabilityCheckLimiter, checkAvailability);

// Protected routes for users
router.post("/", protect, createReservationLimiter, createReservation);
router.get("/my-reservations", protect, getUserReservations);

// Admin routes
router.get("/", protect, admin, getAllReservations);
router.put("/:id/status", protect, admin, updateReservationStatus);
router.delete("/:id", protect, admin, deleteReservation);

module.exports = router;