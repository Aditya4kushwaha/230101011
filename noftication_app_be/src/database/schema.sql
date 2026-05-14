CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE notifications (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    studentID UUID NOT NULL,

    title VARCHAR(255) NOT NULL,

    message TEXT NOT NULL,

    notificationType VARCHAR(50),

    isRead BOOLEAN DEFAULT FALSE,

    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- SINGLE COLUMN INDEXES

CREATE INDEX idx_notifications_student_id
ON notifications(studentID);

CREATE INDEX idx_notifications_is_read
ON notifications(isRead);

CREATE INDEX idx_notifications_created_at
ON notifications(createdAt DESC);



-- COMPOSITE INDEX

CREATE INDEX idx_notifications_student_read_created
ON notifications(studentID, isRead, createdAt DESC);