-- ============================================================
-- 007: Add example_posts to Tone of Voice
-- ============================================================

ALTER TABLE public.mimeo_tone_of_voice
  ADD COLUMN example_posts TEXT[] NOT NULL DEFAULT '{}';
