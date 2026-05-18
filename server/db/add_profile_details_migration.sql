-- Add new columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS semester INTEGER,
ADD COLUMN IF NOT EXISTS department TEXT;

-- Update handle_new_user trigger to include the new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role TEXT;
  assigned_student_id TEXT;
  assigned_status TEXT;
  assigned_name TEXT;
  assigned_semester INTEGER;
  assigned_department TEXT;
BEGIN
  -- Extract from metadata, default to student if missing
  assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'student');
  assigned_student_id := new.raw_user_meta_data->>'student_id';
  assigned_name := new.raw_user_meta_data->>'name';
  
  -- Handle semester which might be empty or null
  IF new.raw_user_meta_data->>'semester' IS NOT NULL AND new.raw_user_meta_data->>'semester' != '' THEN
    assigned_semester := (new.raw_user_meta_data->>'semester')::INTEGER;
  ELSE
    assigned_semester := NULL;
  END IF;
  
  assigned_department := new.raw_user_meta_data->>'department';
  
  -- Admins are approved manually later, or can be seeded as 'approved'. 
  -- We'll set everyone to 'pending' by default.
  assigned_status := 'pending';

  -- Ensure role is valid
  IF assigned_role NOT IN ('student', 'professor', 'admin') THEN
    assigned_role := 'student';
  END IF;

  INSERT INTO public.profiles (id, role, balance, student_id, status, name, semester, department)
  VALUES (new.id, assigned_role, 0, assigned_student_id, assigned_status, assigned_name, assigned_semester, assigned_department);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
