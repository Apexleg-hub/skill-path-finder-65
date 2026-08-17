CREATE TABLE public.course_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  course TEXT NOT NULL,
  experience_level TEXT,
  learning_format TEXT,
  occupation TEXT,
  message TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new'
);

GRANT INSERT ON public.course_applications TO anon;
GRANT INSERT ON public.course_applications TO authenticated;
GRANT ALL ON public.course_applications TO service_role;

ALTER TABLE public.course_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a course application"
  ON public.course_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE INDEX idx_course_applications_created_at ON public.course_applications (created_at DESC);
CREATE INDEX idx_course_applications_course ON public.course_applications (course);
CREATE INDEX idx_course_applications_email ON public.course_applications (email);
