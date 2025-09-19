const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/menuController");

const { protect, admin } = require("../middlewares/authMiddleware");

router.get("/", getMenuItems);
router.post("/", protect, admin, upload.single("image"), createMenuItem);
router.put("/:id", protect, admin, upload.single("image"), updateMenuItem);
router.delete("/:id", protect, admin, deleteMenuItem);

module.exports = router;
