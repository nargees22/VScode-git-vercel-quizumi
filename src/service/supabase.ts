import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://zmgkcehyovznddcvdxbl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZ2tjZWh5b3Z6bmRkY3ZkeGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4Mzc1NjEsImV4cCI6MjA4MDQxMzU2MX0.tQQ-SFXgjn3dhAakWZK4wr-SKvY2repA-Npe4IvRNYI";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
