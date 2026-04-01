-- Add carousel configuration to agents
ALTER TABLE public.mimeo_agents
  ADD COLUMN carousel_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN carousel_prompt TEXT;

-- Post carousels table
CREATE TABLE public.mimeo_post_carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.mimeo_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  slides_count INTEGER NOT NULL DEFAULT 1,
  ai_model TEXT NOT NULL,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_carousels_post_id ON public.mimeo_post_carousels (post_id);

ALTER TABLE public.mimeo_post_carousels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own post carousels"
  ON public.mimeo_post_carousels FOR ALL
  USING (auth.uid() = user_id);

-- Allow public read of carousels for shared posts
CREATE POLICY "Anyone can read carousels of shared posts"
  ON public.mimeo_post_carousels FOR SELECT
  USING (
    post_id IN (SELECT id FROM public.mimeo_posts WHERE share_token IS NOT NULL)
  );

-- Add carousel_status to posts (like image_status)
ALTER TABLE public.mimeo_posts
  ADD COLUMN carousel_status TEXT CHECK (carousel_status IN ('generating', 'completed', 'failed'));

-- Storage bucket for carousel PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-carousels', 'post-carousels', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "carousel_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'post-carousels');

CREATE POLICY "carousel_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'post-carousels');

CREATE POLICY "carousel_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'post-carousels' AND auth.uid()::text = (storage.foldername(name))[1]);
