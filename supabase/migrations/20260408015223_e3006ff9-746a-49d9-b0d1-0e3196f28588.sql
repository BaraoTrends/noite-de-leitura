
CREATE TABLE public.ai_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  generation_type TEXT NOT NULL DEFAULT 'novel',
  model TEXT NOT NULL,
  prompt_params JSONB DEFAULT '{}',
  result_data JSONB DEFAULT '{}',
  novel_id UUID REFERENCES public.novels(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'success',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all generations"
  ON public.ai_generations FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own generations"
  ON public.ai_generations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert generations"
  ON public.ai_generations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
