const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userEmail: { 
    type: String, 
    required: [true, 'User email is required'],
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    index: true 
  },
  items: {
    type: [{
      name: { 
        type: String, 
        required: [true, 'Item name is required'],
        trim: true,
        minlength: [1, 'Item name cannot be empty'],
        maxlength: [100, 'Item name cannot exceed 100 characters']
      },
      quantity: { 
        type: Number, 
        required: [true, 'Item quantity is required'],
        min: [1, 'Quantity must be at least 1'],
        validate: {
          validator: function(v) {
            return Number.isInteger(v) && v > 0;
          },
          message: 'Quantity must be a positive integer'
        }
      },
      price: { 
        type: Number, 
        required: [true, 'Item price is required'],
        min: [0, 'Price cannot be negative'],
        validate: {
          validator: function(v) {
            return v >= 0 && Number.isFinite(v);
          },
          message: 'Price must be a valid non-negative number'
        }
      }
    }],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'At least one item is required'
    }
  },
  totalAmount: { 
    type: Number, 
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'],
    validate: {
      validator: function(v) {
        return v >= 0 && Number.isFinite(v);
      },
      message: 'Total amount must be a valid non-negative number'
    }
  },
  address: { 
    type: String, 
    required: [true, 'Delivery address is required'],
    trim: true,
    minlength: [10, 'Address must be at least 10 characters long'],
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  clientReferenceId: { 
    type: String, 
    required: [true, 'Client reference ID is required'], 
    unique: true,
    index: true, // Add index for better performance
    trim: true,
    minlength: [1, 'Client reference ID cannot be empty']
  },
  orderNumber: {
    type: String,
    uppercase: true
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'paid', 'failed', 'refunded'],
      message: '{VALUE} is not a valid payment status'
    },
    default: 'pending'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  versionKey: '__v' // Enable optimistic locking
});

// Compound indexes for better query performance
orderSchema.index({ userEmail: 1, createdAt: -1 });
orderSchema.index({ clientReferenceId: 1, userEmail: 1 });
orderSchema.index({ createdAt: -1 }); // For general sorting
orderSchema.index({ paymentStatus: 1 });
// Add non-unique index for orderNumber for faster lookups
orderSchema.index({ orderNumber: 1 }, { sparse: true });

// Pre-save middleware to generate order number and validate
orderSchema.pre('save', async function(next) {
  try {
    // Generate unique order number for new orders
    if (this.isNew && !this.orderNumber) {
      let orderNumber;
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 10) {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).slice(2, 8).toUpperCase();
        orderNumber = `ORD-${dateStr}-${randomStr}`;
        
        // Check if order number already exists
        const existingOrder = await this.constructor.findOne({ 
          orderNumber: orderNumber 
        }).select('_id').lean();
        
        if (!existingOrder) {
          isUnique = true;
          this.orderNumber = orderNumber;
        }
        attempts++;
      }
      
      if (!isUnique) {
        throw new Error('Failed to generate unique order number after 10 attempts');
      }
    }
    
    // Validate total amount matches items total
    const calculatedTotal = this.items.reduce((total, item) => 
      total + (item.price * item.quantity), 0
    );
    
    // Allow small floating point differences 
    const roundedCalculated = Math.round(calculatedTotal * 100) / 100;
    const roundedProvided = Math.round(this.totalAmount * 100) / 100;
    
    if (Math.abs(roundedProvided - roundedCalculated) > 0.01) {
      throw new Error(`Total amount mismatch: calculated ${roundedCalculated}, provided ${roundedProvided}`);
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-update middleware
orderSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Post-save middleware for logging
orderSchema.post('save', function(doc) {
  if (this.isNew) {
    console.log(`New order created: ${doc.orderNumber} for ${doc.userEmail}`);
  }
});

// Instance method to calculate total
orderSchema.methods.calculateTotal = function() {
  return this.items.reduce((total, item) => 
    Math.round((total + (item.price * item.quantity)) * 100) / 100, 0
  );
};

// Static method to find orders by user email
orderSchema.statics.findByUser = function(userEmail) {
  return this.find({ userEmail }).sort({ createdAt: -1 });
};

// Static method to find orders within date range
orderSchema.statics.findByDateRange = function(startDate, endDate) {
  const query = {};
  if (startDate) query.createdAt = { $gte: new Date(startDate) };
  if (endDate) {
    if (query.createdAt) {
      query.createdAt.$lte = new Date(endDate);
    } else {
      query.createdAt = { $lte: new Date(endDate) };
    }
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Static method for analytics
orderSchema.statics.getOrderStats = async function() {
  const totalOrders = await this.countDocuments();
  const totalRevenue = await this.aggregate([
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  
  return {
    totalOrders,
    totalRevenue: totalRevenue[0]?.total || 0
  };
};

// Virtual for order age in milliseconds
orderSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Virtual for order age in human readable format
orderSchema.virtual('ageFormatted').get(function() {
  const ageMs = this.age;
  const minutes = Math.floor(ageMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
});

// Ensure virtual fields are included in JSON
orderSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Remove sensitive fields if needed
    delete ret.__v;
    return ret;
  }
});

orderSchema.set('toObject', { virtuals: true });

// Error handling for unique constraint violations
orderSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    if (error.message.includes('clientReferenceId')) {
      next(new Error('Order with this reference ID already exists'));
    } else if (error.message.includes('orderNumber')) {
      next(new Error('Order number already exists'));
    } else {
      next(new Error('Duplicate order detected'));
    }
  } else {
    next(error);
  }
});

module.exports = mongoose.model("Order", orderSchema);