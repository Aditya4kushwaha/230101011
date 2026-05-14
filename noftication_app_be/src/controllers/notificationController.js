const pool = require("../config/db");



// GET ALL NOTIFICATIONS

exports.getNotifications = async (req, res) => {

  try {

    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `
      SELECT id,
             studentID,
             title,
             message,
             notificationType,
             isRead,
             createdAt
      FROM notifications
      WHERE studentID = $1
      ORDER BY createdAt DESC
      LIMIT $2 OFFSET $3
      `,
      [req.user.id, limit, offset]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
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
      SELECT id,
             studentID,
             title,
             message,
             notificationType,
             isRead,
             createdAt
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

    const {
      studentID,
      title,
      message,
      notificationType
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO notifications
      (
        studentID,
        title,
        message,
        notificationType
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        studentID,
        title,
        message,
        notificationType
      ]
    );

    const io = req.app.get("io");

    io.to(studentID).emit(
      "new-notification",
      result.rows[0]
    );

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



// GET UNREAD NOTIFICATIONS (OPTIMIZED)

exports.getUnreadNotifications = async (req, res) => {

  try {

    const studentId = req.user.id;

    const limit = 20;

    const result = await pool.query(
      `
      SELECT id,
             studentID,
             title,
             message,
             createdAt
      FROM notifications
      WHERE studentID = $1
      AND isRead = false
      ORDER BY createdAt DESC
      LIMIT $2
      `,
      [studentId, limit]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};



// MARK SINGLE NOTIFICATION AS READ

exports.markAsRead = async (req, res) => {

  try {

    const { id } = req.params;

    await pool.query(
      `
      UPDATE notifications
      SET isRead = TRUE
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



// MARK ALL NOTIFICATIONS AS READ

exports.markAllAsRead = async (req, res) => {

  try {

    await pool.query(
      `
      UPDATE notifications
      SET isRead = TRUE
      WHERE studentID = $1
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



// GET STUDENTS WHO RECEIVED PLACEMENT NOTIFICATIONS

exports.getPlacementStudents = async (req, res) => {

  try {

    const result = await pool.query(
      `
      SELECT DISTINCT studentID
      FROM notifications
      WHERE notificationType = 'Placement'
      AND createdAt >= NOW() - INTERVAL '7 days'
      `
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};