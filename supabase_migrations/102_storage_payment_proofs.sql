-- Storage Bucket for Payment Proofs

-- Enable storage extension if not enabled (usually enabled by default)

-- Create bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('payment_proofs', 'payment_proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Policies
CREATE POLICY "Public Access Payment Proofs" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'payment_proofs');

CREATE POLICY "Upload Payment Proofs" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'payment_proofs');

CREATE POLICY "Update Payment Proofs" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'payment_proofs');
