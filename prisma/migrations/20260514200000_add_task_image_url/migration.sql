-- Add optional image storage path to Task
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
