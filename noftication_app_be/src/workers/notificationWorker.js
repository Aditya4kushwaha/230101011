const { Worker } = require("bullmq");

const connection = require("../config/redis");

const pool = require("../config/db");

const { sendEmail } = require("../services/emailService");

const worker = new Worker(

  "notificationQueue",

  async (job) => {

    const {
      studentID,
      email,
      title,
      message,
      io,
    } = job.data;


    // 1. SAVE TO DATABASE

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
        "Placement",
      ]
    );


    // 2. REAL TIME APP NOTIFICATION

    io.to(studentID).emit(
      "new-notification",
      result.rows[0]
    );


    // 3. SEND EMAIL

    await sendEmail(
      email,
      title,
      message
    );

  },

  {
    connection,

    concurrency: 100,
  }

);


worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});


worker.on("failed", (job, err) => {
  console.log(`Job failed: ${err.message}`);
});