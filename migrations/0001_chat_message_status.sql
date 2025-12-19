-- Migration: Add WhatsApp-style message status tracking
-- Generated: 2025-11-09
-- Note: This project uses drizzle-kit push mode, but this file documents the changes for git history

-- Create message status enum
CREATE TYPE IF NOT EXISTS message_status AS ENUM ('sent', 'delivered', 'read');

-- Add status column with default
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS status message_status DEFAULT 'sent' NOT NULL;

-- Add delivered_at timestamp
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS delivered_at timestamp;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS chat_messages_sender_status_idx ON chat_messages(sender_id, status);
CREATE INDEX IF NOT EXISTS chat_messages_delivered_at_idx ON chat_messages(delivered_at);

-- Backfill existing messages
UPDATE chat_messages 
SET status = CASE WHEN is_read = true THEN 'read'::message_status ELSE 'sent'::message_status END
WHERE status IS NULL OR status = 'sent'::message_status;
