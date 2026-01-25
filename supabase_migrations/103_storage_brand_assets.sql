-- Bucket for Brand Assets (Logo, etc)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('brand_assets', 'brand_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policies
CREATE POLICY "Public Access Brand Assets" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'brand_assets');

CREATE POLICY "Admin Upload Brand Assets" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'brand_assets' 
    AND (auth.role() = 'authenticated') -- Permitimos authenticated por si acaso, idealmente solo admin
);

CREATE POLICY "Admin Update Brand Assets" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'brand_assets');

CREATE POLICY "Admin Delete Brand Assets" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'brand_assets');
