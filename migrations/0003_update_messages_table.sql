-- Update messages table schema
ALTER TABLE messages
  DROP COLUMN sender_id,
  DROP COLUMN receiver_id,
  DROP COLUMN message,
  DROP COLUMN has_attachments,
  ADD COLUMN user_id UUID REFERENCES users(id) NOT NULL,
  ADD COLUMN content TEXT NOT NULL,
  ADD COLUMN from_client BOOLEAN NOT NULL DEFAULT false;

-- Rename columns to match new schema
ALTER TABLE messages
  RENAME COLUMN client_id TO client_id;
ALTER TABLE messages
  RENAME COLUMN is_read TO is_read;
ALTER TABLE messages
  RENAME COLUMN created_at TO created_at;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_messages_client_id ON messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at); 