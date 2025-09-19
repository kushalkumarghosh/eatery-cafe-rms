const Notification = require("../models/Notification");

const createNotification = async (req, res) => {
  try {
    const { userId, type, title, message, data = {}, priority = 'medium' } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ 
        msg: "UserId, type, title, and message are required" 
      });
    }

    const notification = await Notification.createNotification({
      user: userId,
      type,
      title,
      message,
      data,
      priority
    });

    // Emit notification via Socket.IO
    const io = req.app.get('io');
    const userSocketMap = req.app.get('userSocketMap');
    const socketId = userSocketMap.get(userId.toString());

    if (socketId) {
      io.to(socketId).emit('new_notification', notification);
    }

    res.status(201).json({
      msg: "Notification created successfully",
      notification
    });
  } catch (err) {
    console.error('Create notification error:', err);
    res.status(500).json({ msg: "Error creating notification" });
  }
};

module.exports = { createNotification };