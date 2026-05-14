const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getNotifications,
  getSingleNotification,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

router.get("/", authMiddleware, getNotifications);

router.get("/:id", authMiddleware, getSingleNotification);

router.post("/", authMiddleware, createNotification);

router.patch("/:id/read", authMiddleware, markAsRead);

router.patch("/read-all", authMiddleware, markAllAsRead);

router.delete("/:id", authMiddleware, deleteNotification);

module.exports = router;

