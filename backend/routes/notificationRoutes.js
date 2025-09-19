const express = require("express");
const router = express.Router();
const { createNotification } = require("../controllers/notificationController");
const { protect, admin } = require("../middlewares/authMiddleware");

router.use(protect);
router.post("/", admin, createNotification);

module.exports = router;