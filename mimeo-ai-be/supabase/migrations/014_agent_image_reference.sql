-- Add reference image URL for style inspiration
ALTER TABLE public.mimeo_agents
  ADD COLUMN image_reference_url TEXT;

-- Storage bucket for agent reference images
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-references', 'agent-references', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "agent_ref_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'agent-references');

-- Public read
CREATE POLICY "agent_ref_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'agent-references');

-- Owner delete
CREATE POLICY "agent_ref_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'agent-references' AND auth.uid()::text = (storage.foldername(name))[1]);
