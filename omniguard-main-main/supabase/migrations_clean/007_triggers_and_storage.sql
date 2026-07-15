-- OmniGuard Full Rebuild — Migration 007: Triggers + Storage Bucket

CREATE OR REPLACE FUNCTION handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO user_profiles (id, email, first_name, last_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'first_name', ''), COALESCE(NEW.raw_user_meta_data->>'last_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

INSERT INTO storage.buckets (id, name, public) VALUES ('scan-artifacts', 'scan-artifacts', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "select_scan_artifacts_storage" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'scan-artifacts');
CREATE POLICY "insert_scan_artifacts_storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'scan-artifacts');
CREATE POLICY "update_scan_artifacts_storage" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'scan-artifacts');
CREATE POLICY "delete_scan_artifacts_storage" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'scan-artifacts');
