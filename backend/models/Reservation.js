const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      index: true
    },
    name: { 
      type: String, 
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address']
    },
    phone: { 
      type: String, 
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator: function(v) {
          return /^[+]?[\d\s\-\(\)]{10,15}$/.test(v.replace(/\s/g, ''));
        },
        message: 'Please provide a valid phone number'
      }
    },
    guests: { 
      type: Number, 
      required: [true, 'Number of guests is required'],
      min: [1, 'At least 1 guest is required'],
      max: [20, 'Maximum 20 guests allowed'],
      validate: {
        validator: function(v) {
          return Number.isInteger(v);
        },
        message: 'Number of guests must be a whole number'
      }
    },
    date: { 
      type: Date, 
      required: [true, 'Reservation date is required'],
      index: true
    },
    time: { 
      type: String, 
      required: [true, 'Reservation time is required'],
      validate: {
        validator: function(v) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Time must be in HH:MM format'
      }
    },
    message: { 
      type: String, 
      default: "",
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters']
    },
    status: { 
      type: String, 
      enum: {
        values: ["pending", "confirmed", "cancelled", "completed"],
        message: '{VALUE} is not a valid reservation status'
      },
      default: "confirmed",
      index: true
    },
    tableSize: {
      type: String,
      enum: {
        values: ["small", "medium", "large", "vip"],
        message: '{VALUE} is not a valid table size'
      },
      default: function() {
        if (this.guests <= 2) return "small";
        if (this.guests <= 4) return "medium"; 
        if (this.guests <= 8) return "large";
        return "vip";
      }
    },
    tableSlot: { 
      type: String,
      index: true
    },
    validatedTime: { 
      type: Boolean, 
      default: false 
    },
    confirmationCode: {
      type: String,
      unique: true,
      sparse: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    // Additional fields for better management
    specialRequests: {
      type: String,
      trim: true,
      maxlength: [300, 'Special requests cannot exceed 300 characters']
    },
    partyType: {
      type: String,
      enum: ['birthday', 'anniversary', 'business', 'casual', 'other'],
      default: 'casual'
    },
    // Tracking fields
    source: {
      type: String,
      enum: ['website', 'phone', 'walk-in', 'app'],
      default: 'website'
    },
    statusHistory: [{
      status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      updatedBy: {
        type: String,
        required: true
      },
      notes: String
    }]
  },
  { 
    timestamps: true,
    versionKey: '__v' // Enable optimistic concurrency control
  }
);

// Compound indexes for better performance
reservationSchema.index({ 
  date: 1, 
  time: 1, 
  tableSize: 1,
  status: 1 
}, { 
  name: 'reservation_conflict_prevention',
  partialFilterExpression: { 
    status: { $in: ['pending', 'confirmed'] } 
  }
});

// Additional indexes
reservationSchema.index({ user: 1, date: 1 });
reservationSchema.index({ date: 1, status: 1 });
reservationSchema.index({ email: 1, date: 1, status: 1 });
reservationSchema.index({ status: 1, createdAt: -1 });

// Pre-save validation and processing
reservationSchema.pre('save', async function(next) {
  try {
    // Convert date string to Date object if needed
    if (typeof this.date === 'string') {
      this.date = new Date(this.date);
    }
    
    // Validate reservation date (not in the past)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (this.date < today) {
      throw new Error('Reservation date cannot be in the past');
    }
    
    // Validate future date limit (3 months)
    const maxFutureDate = new Date();
    maxFutureDate.setMonth(maxFutureDate.getMonth() + 3);
    if (this.date > maxFutureDate) {
      throw new Error('Reservations can only be made up to 3 months in advance');
    }
    
    // Validate business hours (10 AM to 9:30 PM)
    const [hours, minutes] = this.time.split(':').map(Number);
    if (hours < 10 || hours > 21 || (hours === 21 && minutes > 30)) {
      throw new Error('Reservations are only available between 10:00 AM and 9:30 PM');
    }
    
    // Validate time intervals (30-minute slots)
    if (minutes !== 0 && minutes !== 30) {
      throw new Error('Reservations are only available at 30-minute intervals');
    }
    
    // Set table size based on guests if not already set
    if (!this.tableSize) {
      if (this.guests <= 2) this.tableSize = "small";
      else if (this.guests <= 4) this.tableSize = "medium";
      else if (this.guests <= 8) this.tableSize = "large";
      else this.tableSize = "vip";
    }
    
    // Set table slot identifier
    const dateStr = this.date.toISOString().split('T')[0];
    this.tableSlot = `${dateStr}_${this.time}_${this.tableSize}`;
    this.validatedTime = true;
    
    // Generate confirmation code if new reservation
    if (this.isNew && !this.confirmationCode) {
      let confirmationCode;
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 10) {
        const date = this.date.toISOString().split('T')[0].replace(/-/g, '');
        const time = this.time.replace(':', '');
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        confirmationCode = `RES${date}${time}${randomNum}`;
        
        // Check if confirmation code already exists
        const existingReservation = await this.constructor.findOne({ 
          confirmationCode: confirmationCode 
        }).select('_id').lean();
        
        if (!existingReservation) {
          isUnique = true;
          this.confirmationCode = confirmationCode;
        }
        attempts++;
      }
      
      if (!isUnique) {
        throw new Error('Failed to generate unique confirmation code');
      }
    }
    
    // Update status history for new reservations
    if (this.isNew) {
      this.statusHistory = [{
        status: this.status,
        timestamp: new Date(),
        updatedBy: this.email || 'system',
        notes: 'Reservation created'
      }];
    }
    
    // Add to status history if status changed
    if (this.isModified('status') && !this.isNew) {
      this.statusHistory.push({
        status: this.status,
        timestamp: new Date(),
        updatedBy: this.email || 'system',
        notes: `Status updated to ${this.status}`
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-update middleware
reservationSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Static method to check availability with session support
reservationSchema.statics.checkAvailability = async function(date, time, guests, session = null) {
  // Determine table size needed
  let requiredTableSize;
  if (guests <= 2) requiredTableSize = "small";
  else if (guests <= 4) requiredTableSize = "medium";
  else if (guests <= 8) requiredTableSize = "large";
  else requiredTableSize = "vip";
  
  // Define table capacity limits
  const tableCapacity = {
    small: 5,   // 5 small tables (2 guests each)
    medium: 4,  // 4 medium tables (4 guests each)
    large: 3,   // 3 large tables (8 guests each)
    vip: 2      // 2 VIP tables (20 guests each)
  };
  
  // Build query
  const query = {
    date: new Date(date),
    time: time,
    tableSize: requiredTableSize,
    status: { $in: ['pending', 'confirmed'] }
  };
  
  // Count existing reservations for this slot
  let existingReservations;
  if (session) {
    existingReservations = await this.countDocuments(query).session(session);
  } else {
    existingReservations = await this.countDocuments(query);
  }
  
  const availableSlots = tableCapacity[requiredTableSize] - existingReservations;
  
  return {
    available: availableSlots > 0,
    availableSlots: Math.max(0, availableSlots),
    totalSlots: tableCapacity[requiredTableSize],
    requiredTableSize,
    existingReservations
  };
};

// Static method to get availability for multiple time slots
reservationSchema.statics.getAvailabilityForDay = async function(date, guests) {
  const timeSlots = [
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
  ];
  
  const availability = await Promise.all(
    timeSlots.map(async (time) => {
      const result = await this.checkAvailability(date, time, guests);
      return {
        time,
        ...result
      };
    })
  );
  
  return availability;
};

// Static method to find reservations by date range
reservationSchema.statics.findByDateRange = function(startDate, endDate, status = null) {
  const query = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query).sort({ date: 1, time: 1 });
};

// Static method for reservation statistics
reservationSchema.statics.getReservationStats = async function(startDate, endDate) {
  const matchStage = {};
  
  if (startDate && endDate) {
    matchStage.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalGuests: { $sum: '$guests' },
        avgGuests: { $avg: '$guests' }
      }
    }
  ]);
  
  const tableStats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$tableSize',
        count: { $sum: 1 },
        totalGuests: { $sum: '$guests' }
      }
    }
  ]);
  
  const totalReservations = await this.countDocuments(matchStage);
  
  return {
    statusBreakdown: stats,
    tableBreakdown: tableStats,
    totalReservations
  };
};

// Instance method to generate confirmation code (fallback)
reservationSchema.methods.generateConfirmationCode = function() {
  if (this.confirmationCode) {
    return this.confirmationCode;
  }
  
  const date = this.date.toISOString().split('T')[0].replace(/-/g, '');
  const time = this.time.replace(':', '');
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RES${date}${time}${randomNum}`;
};

// Instance method to update status with history
reservationSchema.methods.updateStatus = function(newStatus, updatedBy, notes = '') {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy: updatedBy,
    notes: notes
  });
  return this.save();
};

// Instance method to check if reservation can be cancelled
reservationSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const reservationDateTime = new Date(this.date);
  const [hours, minutes] = this.time.split(':').map(Number);
  reservationDateTime.setHours(hours, minutes, 0, 0);
  
  // Allow cancellation if reservation is at least 2 hours away
  const twoHoursBeforeReservation = new Date(reservationDateTime.getTime() - (2 * 60 * 60 * 1000));
  
  return now < twoHoursBeforeReservation && 
         ['pending', 'confirmed'].includes(this.status);
};

// Virtual for time until reservation
reservationSchema.virtual('timeUntilReservation').get(function() {
  const now = new Date();
  const reservationDateTime = new Date(this.date);
  const [hours, minutes] = this.time.split(':').map(Number);
  reservationDateTime.setHours(hours, minutes, 0, 0);
  
  return reservationDateTime.getTime() - now.getTime();
});

// Virtual for formatted date
reservationSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for formatted time
reservationSchema.virtual('formattedTime').get(function() {
  const [hours, minutes] = this.time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
});

// Virtual for guest capacity status
reservationSchema.virtual('capacityStatus').get(function() {
  if (this.guests <= 2) return 'small-party';
  if (this.guests <= 4) return 'medium-party';
  if (this.guests <= 8) return 'large-party';
  return 'very-large-party';
});

// Ensure virtual fields are included in JSON
reservationSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

reservationSchema.set('toObject', { virtuals: true });

// Error handling for unique constraint violations
reservationSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    if (error.message.includes('confirmationCode')) {
      next(new Error('Confirmation code already exists'));
    } else {
      next(new Error('Duplicate reservation detected'));
    }
  } else {
    next(error);
  }
});

// Post-save middleware for logging
reservationSchema.post('save', function(doc) {
  if (this.isNew) {
    console.log(`New reservation created: ${doc.confirmationCode} for ${doc.name} (${doc.email})`);
  }
});

module.exports = mongoose.model("Reservation", reservationSchema);