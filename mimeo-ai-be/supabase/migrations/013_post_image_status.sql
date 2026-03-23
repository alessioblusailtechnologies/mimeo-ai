-- Add image generation status to posts
ALTER TABLE public.mimeo_posts
  ADD COLUMN image_status TEXT DEFAULT NULL
  CHECK (image_status IN ('generating', 'completed', 'failed'));
