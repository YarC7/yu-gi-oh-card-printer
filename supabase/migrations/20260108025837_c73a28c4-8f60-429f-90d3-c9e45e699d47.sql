-- Create storage bucket for custom card images
INSERT INTO storage.buckets (id, name, public)
VALUES ('custom-cards', 'custom-cards', true);

-- Storage policy: Anyone can view custom card images
CREATE POLICY "Custom card images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'custom-cards');

-- Storage policy: Authenticated users can upload their own images
CREATE POLICY "Users can upload custom card images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'custom-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy: Users can update their own images
CREATE POLICY "Users can update their own custom card images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'custom-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policy: Users can delete their own images
CREATE POLICY "Users can delete their own custom card images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'custom-cards' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create custom_cards table
CREATE TABLE public.custom_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Effect Monster',
  frame_type TEXT NOT NULL DEFAULT 'effect',
  description TEXT,
  attribute TEXT,
  race TEXT,
  level INTEGER,
  atk INTEGER,
  def INTEGER,
  link_val INTEGER,
  scale INTEGER,
  archetype TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_cards ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view all custom cards (for search)
CREATE POLICY "Anyone can view custom cards"
ON public.custom_cards
FOR SELECT
USING (true);

-- Users can create their own custom cards
CREATE POLICY "Users can create their own custom cards"
ON public.custom_cards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own custom cards
CREATE POLICY "Users can update their own custom cards"
ON public.custom_cards
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own custom cards
CREATE POLICY "Users can delete their own custom cards"
ON public.custom_cards
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_custom_cards_updated_at
BEFORE UPDATE ON public.custom_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();