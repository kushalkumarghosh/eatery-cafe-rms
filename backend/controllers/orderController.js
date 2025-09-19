const mongoose = require("mongoose");
const Order = require("../models/Order");

// In-memory lock mechanism for order processing
const orderLocks = new Map();

// Helper function to create a lock key
const createLockKey = (userEmail, items, clientReferenceId) => {
  // Use clientReferenceId as primary lock key for better uniqueness
  return `${userEmail}_${clientReferenceId}`;
};

// Helper function to wait for lock release
const waitForLock = (lockKey, timeout = 10000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkLock = () => {
      if (!orderLocks.has(lockKey)) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error("Lock timeout"));
      } else {
        setTimeout(checkLock, 100);
      }
    };

    checkLock();
  });
};

const createOrder = async (req, res) => {
  let session;
  const lockKey = createLockKey(
    req.body.userEmail,
    req.body.items,
    req.body.clientReferenceId
  );

  try {
    // Input validation first
    const {
      items,
      totalAmount,
      address,
      userEmail,
      clientReferenceId,
      requestId,
    } = req.body;

    // Enhanced validation
    if (
      !items ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !totalAmount ||
      totalAmount <= 0 ||
      !address ||
      typeof address !== "string" ||
      address.trim().length < 10 ||
      !userEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail) ||
      !clientReferenceId ||
      typeof clientReferenceId !== "string" ||
      !requestId
    ) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required and must be valid",
        details: {
          items:
            !items || !Array.isArray(items) || items.length === 0
              ? "Items must be a non-empty array"
              : undefined,
          totalAmount:
            !totalAmount || totalAmount <= 0
              ? "Total amount must be positive"
              : undefined,
          address:
            !address ||
            typeof address !== "string" ||
            address.trim().length < 10
              ? "Address must be at least 10 characters"
              : undefined,
          userEmail:
            !userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)
              ? "Valid email is required"
              : undefined,
          clientReferenceId: !clientReferenceId
            ? "Client reference ID is required"
            : undefined,
          requestId: !requestId ? "Request ID is required" : undefined,
        },
      });
    }

    // Validate items structure
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (
        !item.name ||
        typeof item.name !== "string" ||
        !item.quantity ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        !item.price ||
        typeof item.price !== "number" ||
        item.price <= 0
      ) {
        return res.status(400).json({
          success: false,
          msg: `Invalid item data at index ${i}`,
          details: {
            name:
              !item.name || typeof item.name !== "string"
                ? "Item name is required"
                : undefined,
            quantity:
              !item.quantity ||
              !Number.isInteger(item.quantity) ||
              item.quantity <= 0
                ? "Quantity must be a positive integer"
                : undefined,
            price:
              !item.price || typeof item.price !== "number" || item.price <= 0
                ? "Price must be a positive number"
                : undefined,
          },
        });
      }
    }

    // Validate calculated total
    const calculatedTotal = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const totalDifference = Math.abs(Number(totalAmount) - calculatedTotal);
    if (totalDifference > 0.01) {
      return res.status(400).json({
        success: false,
        msg: "Total amount mismatch",
        details: {
          calculated: calculatedTotal,
          provided: totalAmount,
          difference: totalDifference,
        },
      });
    }

    // Wait for any existing locks to release
    await waitForLock(lockKey);

    // Acquire lock
    orderLocks.set(lockKey, Date.now());

    // Start database session
    session = await mongoose.startSession();
    await session.startTransaction({
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority", j: true },
    });

    // Check for duplicate order
    const existingOrder = await Order.findOne({
      $or: [
        { clientReferenceId },
        {
          userEmail,
          "items.name": { $in: items.map((i) => i.name) },
          createdAt: { $gte: new Date(Date.now() - 30000) },
        },
      ],
    }).session(session);

    if (existingOrder) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        msg: "Duplicate order detected",
        order: existingOrder,
        type:
          existingOrder.clientReferenceId === clientReferenceId
            ? "exact_duplicate"
            : "similar_order",
      });
    }

    // Create order with sanitized data
    const orderData = {
      userEmail: userEmail.toLowerCase().trim(),
      items: items.map((item) => ({
        name: item.name.trim(),
        quantity: Math.floor(item.quantity),
        price: Number(parseFloat(item.price).toFixed(2)),
      })),
      totalAmount: Number(parseFloat(totalAmount).toFixed(2)),
      address: address.trim(),
      clientReferenceId: clientReferenceId.trim(),
    };

    const order = new Order(orderData);
    const savedOrder = await order.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      msg: "Order created successfully",
      order: savedOrder,
    });
  } catch (err) {
    console.error("Order creation error:", err);

    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        console.error("Session abort error:", abortErr);
      }
    }

    // Handle specific error types
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        msg: "Duplicate order detected",
        error: "DUPLICATE_ORDER",
      });
    }

    if (err.message === "Lock timeout") {
      return res.status(429).json({
        success: false,
        msg: "Server busy, please try again later",
        error: "LOCK_TIMEOUT",
      });
    }

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        msg: "Validation error",
        details: Object.keys(err.errors).reduce((acc, key) => {
          acc[key] = err.errors[key].message;
          return acc;
        }, {}),
        error: "VALIDATION_ERROR",
      });
    }

    res.status(500).json({
      success: false,
      msg: "Internal server error",
      error: "SERVER_ERROR",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (endErr) {
        console.error("Session end error:", endErr);
      }
    }

    // Release lock
    orderLocks.delete(lockKey);
  }
};

const getUserOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = { userEmail: req.user.email };

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [orders, total] = await Promise.all([
      Order.find(query).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total,
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Get user orders error:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to fetch orders",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userEmail,
      sortBy = "createdAt",
      sortOrder = "desc",
      startDate,
      endDate,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = {};
    if (userEmail) {
      query.userEmail = { $regex: userEmail, $options: "i" };
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [orders, total] = await Promise.all([
      Order.find(query).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      orders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total,
        limit: parseInt(limit),
      },
      filters: { userEmail, startDate, endDate },
    });
  } catch (err) {
    console.error("Get all orders error:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to fetch orders",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

const deleteOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        msg: "Order not found",
      });
    }

    await Order.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();

    res.json({
      success: true,
      msg: "Order deleted successfully",
      deletedOrder: {
        id: order._id,
        orderNumber: order.orderNumber,
        userEmail: order.userEmail,
      },
    });
  } catch (err) {
    console.error("Delete order error:", err);
    if (session) {
      await session.abortTransaction();
    }
    res.status(500).json({
      success: false,
      msg: "Failed to delete order",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found",
      });
    }

    // Check if user can access this order
    if (req.user.role !== "admin" && order.userEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        msg: "Access denied",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("Get order by ID error:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to fetch order",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Clean up old locks 
const lockCleanupInterval = setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [key, timestamp] of orderLocks.entries()) {
    if (now - timestamp > 60000) {
      // 1 minute timeout
      orderLocks.delete(key);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired locks`);
  }
}, 120000); // Clean every 2 minutes

// Graceful shutdown
process.on("SIGINT", () => {
  clearInterval(lockCleanupInterval);
  orderLocks.clear();
});

process.on("SIGTERM", () => {
  clearInterval(lockCleanupInterval);
  orderLocks.clear();
});

module.exports = {
  createOrder,
  getUserOrders,
  getAllOrders,
  deleteOrder,
  getOrderById,
};
