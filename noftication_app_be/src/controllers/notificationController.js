const pool = require("../config/db");


// GET ALL NOTIFICATIONS
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `
      SELECT *
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
      `,
      [req.user.id, limit, offset]
    );

    res.status(200).json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET SINGLE NOTIFICATION
exports.getSingleNotification = async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM notifications
      WHERE id = $1
      `,
      [id]
    );

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// CREATE NOTIFICATION
exports.createNotification = async (req, res) => {
  try {

    const { userId, title, message, type } = req.body;

    const result = await pool.query(
      `
      INSERT INTO notifications
      (user_id, title, message, type)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [userId, title, message, type]
    );

    const io = req.app.get("io");

    io.to(userId).emit("new-notification", result.rows[0]);

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: result.rows[0],
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// MARK AS READ
exports.markAsRead = async (req, res) => {
  try {

    const { id } = req.params;

    await pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
      `,
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// MARK ALL AS READ
exports.markAllAsRead = async (req, res) => {
  try {

    await pool.query(
      `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1
      `,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// DELETE NOTIFICATION
exports.deleteNotification = async (req, res) => {
  try {

    const { id } = req.params;

    await pool.query(
      `
      DELETE FROM notifications
      WHERE id = $1
      `,
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};