const express = require("express");
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  createOrder,
  getUserOrders,
  getAllOrders,
  deleteOrder,
  getOrderById
} = require("../controllers/orderController");
const { protect, admin } = require("../middlewares/authMiddleware");

// Helper function to generate safe key for rate limiting
const generateRateLimitKey = (req) => {
  if (req.user?.email) {
    return `user:${req.user.email}`;
  }
  // For IP-based limiting, let express-rate-limit handle it properly
  return undefined;
};

// Rate limiting middleware with proper IPv6 handling
const orderCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each user to 5 order creation requests per windowMs
  message: {
    success: false,
    msg: 'Too many order creation attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: generateRateLimitKey,
  // Additional options for better control
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      msg: 'Too many order creation attempts from this account/IP, please try again later.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      limit: req.rateLimit.limit,
      remaining: req.rateLimit.remaining
    });
  }
});

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each user to 100 requests per minute
  message: {
    success: false,
    msg: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      msg: 'Rate limit exceeded, please slow down your requests.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Input validation middleware
const validateOrderInput = (req, res, next) => {
  const { items, totalAmount, address, userEmail, clientReferenceId } = req.body;
  
  // Basic validation
  if (!items || !totalAmount || !address || !userEmail || !clientReferenceId) {
    return res.status(400).json({
      success: false,
      msg: 'Missing required fields'
    });
  }
  
  // Sanitize inputs
  if (typeof address === 'string') {
    req.body.address = address.trim();
  }
  if (typeof userEmail === 'string') {
    req.body.userEmail = userEmail.toLowerCase().trim();
  }
  if (typeof clientReferenceId === 'string') {
    req.body.clientReferenceId = clientReferenceId.trim();
  }
  
  next();
};

// Validate order ID parameter
const validateOrderId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      msg: 'Invalid order ID format'
    });
  }
  
  next();
};

// Apply general rate limiting to all routes
router.use(generalLimiter);

// Order creation routes
router.post("/", 
  protect, 
  orderCreationLimiter, 
  validateOrderInput, 
  createOrder
);

// Get user's orders with query parameters
router.get("/user", 
  protect, 
  getUserOrders
);

// Get single order by ID
router.get("/:id", 
  protect, 
  validateOrderId, 
  getOrderById
);

// Admin routes
router.get("/", 
  protect, 
  admin, 
  getAllOrders
);

// Delete order
router.delete("/:id", 
  protect, 
  admin, 
  validateOrderId, 
  deleteOrder
);

// Error handling middleware for this router
router.use((error, req, res, next) => {
  console.error('Order routes error:', error);
  
  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      msg: 'Request body too large'
    });
  }
  
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      msg: 'Invalid JSON format'
    });
  }
  
  res.status(500).json({
    success: false,
    msg: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

module.exports = router;