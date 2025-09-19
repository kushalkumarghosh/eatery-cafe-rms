const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"]
    },
    email: { 
      type: String, 
      required: [true, "Email is required"], 
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email"
      ]
    },
    password: { 
      type: String, 
      required: [true, "Password is required"], 
      minlength: [10, "Password must be at least 10 characters long"]
    },
    phone: { 
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^[0-9+\-\s()]+$/.test(v);
        },
        message: "Phone number contains invalid characters"
      }
    },
    address: { 
      type: String,
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"]
    },
    role: { 
      type: String, 
      enum: {
        values: ["user", "admin"],
        message: "Role must be either user or admin"
      }, 
      default: "user" 
    },
    
    // Password reset fields
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    
    // Account status
    isActive: {
      type: Boolean,
      default: true
    },
    
    // Login tracking (optional - for security)
    lastLogin: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date,

    // Added for single-session support
    activeToken: String  // Stores the current active JWT token
  },
  { 
    timestamps: true,
    // Add version key for optimistic locking (__v field)
    versionKey: '__v'
  }
);

// Compound index for better performance and uniqueness
userSchema.index({ email: 1, isActive: 1 });

// Pre-save middleware for password hashing
userSchema.pre("save", async function (next) {
  // Only hash password if it's modified
  if (this.isModified("password")) {
    try {
      this.password = await bcrypt.hash(this.password, 12); // Increased rounds for security
    } catch (error) {
      return next(error);
    }
  }
  
  // Update lastLogin on save if it's a login operation
  if (this.isModified("lastLogin")) {
    this.loginAttempts = 0; // Reset login attempts on successful login
    this.lockUntil = undefined;
  }
  
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire time (10 minutes)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock and it's expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // 30 minutes
  }
  
  return this.updateOne(updates);
};

// Static method to find active users
userSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

// Handle duplicate key errors more gracefully
userSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const customError = new Error(`${field} already exists`);
    customError.name = 'DuplicateError';
    next(customError);
  } else {
    next(error);
  }
});

// Ensure indexes are created
userSchema.post('init', function() {
  this.constructor.createIndexes();
});

module.exports = mongoose.model("User", userSchema);