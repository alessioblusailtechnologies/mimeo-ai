-- Add share_token to posts for public sharing
ALTER TABLE public.mimeo_posts
  ADD COLUMN share_token UUID UNIQUE DEFAULT NULL;

CREATE INDEX idx_posts_share_token ON public.mimeo_posts (share_token) WHERE share_token IS NOT NULL;

-- Allow public read access via share_token (bypasses user_id RLS)
CREATE POLICY "Anyone can read shared posts"
  ON public.mimeo_posts FOR SELECT
  USING (share_token IS NOT NULL);

-- Allow public read of images for shared posts
CREATE POLICY "Anyone can read images of shared posts"
  ON public.mimeo_post_images FOR SELECT
  USING (
    post_id IN (SELECT id FROM public.mimeo_posts WHERE share_token IS NOT NULL)
  );
