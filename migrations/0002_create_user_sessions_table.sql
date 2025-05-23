-- Create user sessions table
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "session_token" text NOT NULL UNIQUE,
  "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  "expires_at" timestamp with time zone NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_sessions_user_id" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "IDX_sessions_session_token" ON "sessions" ("session_token");
CREATE INDEX IF NOT EXISTS "IDX_sessions_expires_at" ON "sessions" ("expires_at"); 