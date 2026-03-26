
-- Create trigger on auth.users to auto-create profiles
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users into profiles
INSERT INTO public.profiles (user_id, full_name, email)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', ''), email
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
