INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'well-photos',
    'well-photos',
    false,
    2097152,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for well-photos
CREATE POLICY "Owner can upload well photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'well-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Owner can read well photos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'well-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

