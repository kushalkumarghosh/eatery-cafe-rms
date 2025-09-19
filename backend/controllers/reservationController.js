const Reservation = require("../models/Reservation");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

const createReservation = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { name, email, phone, guests, date, time, message } = req.body;

    // Input validation
    if (!name || !email || !phone || !guests || !date || !time) {
      return res.status(400).json({
        msg: "All fields except message are required",
      });
    }

    if (typeof guests !== "number" || guests <= 0 || guests > 20) {
      return res.status(400).json({
        msg: "Guests must be between 1 and 20",
      });
    }

    // Validate date format and future date
    const reservationDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(reservationDate.getTime())) {
      return res.status(400).json({ msg: "Invalid date format" });
    }

    if (reservationDate < today) {
      return res.status(400).json({
        msg: "Reservation date cannot be in the past",
      });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return res.status(400).json({ msg: "Invalid time format. Use HH:MM" });
    }

    // Use transaction for atomic operation
    const result = await session.withTransaction(async () => {
      // Check availability within transaction
      const availability = await Reservation.checkAvailability(
        date,
        time,
        guests
      );

      if (!availability.available) {
        throw new Error(
          `No ${availability.requiredTableSize} tables available for ${guests} guests at ${time} on ${date}. ${availability.availableSlots}/${availability.totalSlots} slots remaining.`
        );
      }

      // Check for user's existing reservation on same date 
      if (req.user?.id) {
        const existingUserReservation = await Reservation.findOne({
          user: req.user.id,
          date: reservationDate,
          status: { $in: ["pending", "confirmed"] },
        }).session(session);

        if (existingUserReservation) {
          throw new Error("You already have a reservation on this date");
        }
      }

      // Create reservation with pending status initially
      const newReservation = new Reservation({
        user: req.user?.id || null,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        guests,
        date: reservationDate,
        time,
        message: message?.trim() || "",
        status: "pending",
      });

      const savedReservation = await newReservation.save({ session });

      // Generate confirmation code
      const confirmationCode = savedReservation.generateConfirmationCode();

      // Create notification for user about reservation creation
      if (savedReservation.user) {
        const notification = new Notification({
          user: savedReservation.user,
          type: "reservation_created",
          title: "Reservation Submitted",
          message: "Thanks for the reservation, your reservation is pending approval",
          data: {
            reservationId: savedReservation._id,
            confirmationCode: savedReservation.confirmationCode,
            status: "pending",
          },
        });
        await notification.save({ session });

        // Send real-time notification
        const io = req.app.get("io");
        const userSocketMap = req.app.get("userSocketMap");
        const userSocketId = userSocketMap.get(
          savedReservation.user.toString()
        );

        if (userSocketId) {
          io.to(userSocketId).emit("new_notification", {
            ...notification.toObject(),
            timeAgo: "just now",
          });
        }
      }

      return {
        reservation: savedReservation,
        confirmationCode,
        tableInfo: {
          tableSize: savedReservation.tableSize,
          availableSlots: availability.availableSlots - 1,
          totalSlots: availability.totalSlots,
        },
      };
    });

    res.status(201).json({
      msg: "Reservation submitted successfully and is pending approval",
      reservation: result.reservation,
      confirmationCode: result.confirmationCode,
      tableInfo: result.tableInfo,
    });
  } catch (err) {
    console.error("Reservation creation error:", err);

    if (
      err.message.includes("No ") &&
      err.message.includes("tables available")
    ) {
      return res.status(409).json({ msg: err.message });
    }

    if (err.message.includes("already have a reservation")) {
      return res.status(409).json({ msg: err.message });
    }

    if (err.message.includes("Reservations are only available")) {
      return res.status(400).json({ msg: err.message });
    }

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({ msg: messages.join(". ") });
    }

    if (err.code === 11000) {
      return res.status(409).json({
        msg: "A conflict occurred while creating your reservation. Please try again.",
      });
    }

    res
      .status(500)
      .json({ msg: "Server error occurred while creating reservation" });
  } finally {
    await session.endSession();
  }
};

const checkAvailability = async (req, res) => {
  try {
    const { date, time, guests } = req.query;

    if (!date || !time || !guests) {
      return res.status(400).json({
        msg: "Date, time, and guests parameters are required",
      });
    }

    const guestsNum = parseInt(guests);
    if (isNaN(guestsNum) || guestsNum <= 0) {
      return res.status(400).json({ msg: "Invalid number of guests" });
    }

    const availability = await Reservation.checkAvailability(
      date,
      time,
      guestsNum
    );

    res.json({
      available: availability.available,
      availableSlots: availability.availableSlots,
      totalSlots: availability.totalSlots,
      requiredTableSize: availability.requiredTableSize,
      date,
      time,
      guests: guestsNum,
    });
  } catch (err) {
    console.error("Availability check error:", err);
    res.status(500).json({ msg: "Error checking availability" });
  }
};

const getAllReservations = async (req, res) => {
  try {
    const { date, status, page = 1, limit = 50 } = req.query;

    const filter = {};
    if (date) {
      const queryDate = new Date(date);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: queryDate, $lt: nextDay };
    }
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reservations = await Reservation.find(filter)
      .populate("user", "name email")
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Reservation.countDocuments(filter);

    res.json({
      reservations,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
      },
    });
  } catch (err) {
    console.error("Get reservations error:", err);
    res.status(500).json({ msg: "Error fetching reservations" });
  }
};

const updateReservationStatus = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { status } = req.body;
    const allowedStatuses = ["pending", "confirmed", "cancelled", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        msg: `Status must be one of: ${allowedStatuses.join(", ")}`,
      });
    }

    const result = await session.withTransaction(async () => {
      const reservation = await Reservation.findById(req.params.id).session(
        session
      );
      if (!reservation) {
        throw new Error("Reservation not found");
      }

      const oldStatus = reservation.status;
      reservation.status = status;
      await reservation.save({ session });

      // Create notification for user about status change
      if (reservation.user && oldStatus !== status && status !== 'pending') {
        const statusMessages = {
          confirmed: `Great news! Your reservation for ${
            reservation.guests
          } guests on ${reservation.date.toDateString()} at ${
            reservation.time
          } has been confirmed.`,
          cancelled: `Your reservation for ${
            reservation.guests
          } guests on ${reservation.date.toDateString()} at ${
            reservation.time
          } has been cancelled.`,
          completed: `Thank you! Your reservation for ${reservation.guests} guests has been marked as completed.`,
        };

        const notification = new Notification({
          user: reservation.user,
          type: "reservation_status_updated",
          title: `Reservation ${
            status.charAt(0).toUpperCase() + status.slice(1)
          }`,
          message: statusMessages[status],
          data: {
            reservationId: reservation._id,
            confirmationCode: reservation.confirmationCode,
            status: status,
            oldStatus: oldStatus,
          },
          priority: status === "cancelled" ? "high" : "medium",
        });
        await notification.save({ session });

        // Send real-time notification
        const io = req.app.get("io");
        const userSocketMap = req.app.get("userSocketMap");
        const userSocketId = userSocketMap.get(reservation.user.toString());

        if (userSocketId) {
          io.to(userSocketId).emit("new_notification", {
            ...notification.toObject(),
            timeAgo: "just now",
          });
        }
      }

      return reservation;
    });

    res.json({
      msg: `Reservation ${status} successfully`,
      reservation: result,
    });
  } catch (err) {
    console.error("Update reservation error:", err);
    if (err.message === "Reservation not found") {
      return res.status(404).json({ msg: err.message });
    }
    res.status(500).json({ msg: "Error updating reservation" });
  } finally {
    await session.endSession();
  }
};

const deleteReservation = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      const reservation = await Reservation.findById(req.params.id).session(
        session
      );

      if (!reservation) {
        throw new Error("Reservation not found");
      }

      // Allow deletion of all reservations regardless of status
      await reservation.deleteOne({ session });
      return reservation;
    });

    res.json({ msg: "Reservation deleted successfully" });
  } catch (err) {
    console.error("Delete reservation error:", err);
    if (err.message === "Reservation not found") {
      return res.status(404).json({ msg: err.message });
    }
    res.status(500).json({ msg: "Server error" });
  } finally {
    await session.endSession();
  }
};

// User's own reservations
const getUserReservations = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ msg: "Authentication required" });
    }

    const reservations = await Reservation.find({ user: req.user.id })
      .sort({ date: -1, time: -1 })
      .limit(20);

    res.json({ reservations });
  } catch (err) {
    console.error("Get user reservations error:", err);
    res.status(500).json({ msg: "Error fetching your reservations" });
  }
};

module.exports = {
  createReservation,
  checkAvailability,
  getAllReservations,
  updateReservationStatus,
  deleteReservation,
  getUserReservations,
};
