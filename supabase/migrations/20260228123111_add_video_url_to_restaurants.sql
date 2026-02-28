ALTER TABLE public.restaurants ADD COLUMN video_url text;

-- Seed 'Barbarestan' with a video background
UPDATE public.restaurants 
SET video_url = 'https://videos.pexels.com/video-files/3205315/3205315-hd_1920_1080_25fps.mp4' 
WHERE slug = 'barbarestan';
