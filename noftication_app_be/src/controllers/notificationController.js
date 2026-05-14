const pool = require("../config/db");

const redisClient = require("../config/redis");



// GET ALL NOTIFICATIONS WITH REDIS CACHE

exports.getNotifications = async (req, res) => {

  try {

    const studentId = req.user.id;

    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const cacheKey = `notifications:${studentId}:page:${page}`;

    
    // CHECK REDIS CACHE

    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {

      return res.status(200).json({
        success: true,
        source: "redis-cache",
        data: JSON.parse(cachedData),
      });

    }


    // FETCH FROM POSTGRESQL

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
      [studentId, limit, offset]
    );


    // STORE IN REDIS CACHE FOR 60 SECONDS

    await redisClient.setEx(
      cacheKey,
      60,
      JSON.stringify(result.rows)
    );


    res.status(200).json({
      success: true,
      source: "postgresql",
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


    // INSERT NOTIFICATION

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


    // CLEAR REDIS CACHE

    const cacheKey = `notifications:${studentID}:page:1`;

    await redisClient.del(cacheKey);


    // REAL TIME SOCKET EVENT

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

    const cacheKey = `unread:${studentId}`;


    // CHECK CACHE

    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {

      return res.status(200).json({
        success: true,
        source: "redis-cache",
        data: JSON.parse(cachedData),
      });

    }


    // DATABASE QUERY

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
      LIMIT 20
      `,
      [studentId]
    );


    // STORE CACHE

    await redisClient.setEx(
      cacheKey,
      60,
      JSON.stringify(result.rows)
    );


    res.status(200).json({
      success: true,
      source: "postgresql",
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


    // UPDATE DATABASE

    await pool.query(
      `
      UPDATE notifications
      SET isRead = TRUE
      WHERE id = $1
      `,
      [id]
    );


    // CLEAR CACHE

    const studentId = req.user.id;

    await redisClient.del(`unread:${studentId}`);

    await redisClient.del(`notifications:${studentId}:page:1`);


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

    const studentId = req.user.id;


    // UPDATE DATABASE

    await pool.query(
      `
      UPDATE notifications
      SET isRead = TRUE
      WHERE studentID = $1
      `,
      [studentId]
    );


    // CLEAR CACHE

    await redisClient.del(`unread:${studentId}`);

    await redisClient.del(`notifications:${studentId}:page:1`);


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

    const studentId = req.user.id;


    // DELETE FROM DATABASE

    await pool.query(
      `
      DELETE FROM notifications
      WHERE id = $1
      `,
      [id]
    );


    // CLEAR CACHE

    await redisClient.del(`notifications:${studentId}:page:1`);

    await redisClient.del(`unread:${studentId}`);


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



// GET STUDENTS WITH PLACEMENT NOTIFICATIONS

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