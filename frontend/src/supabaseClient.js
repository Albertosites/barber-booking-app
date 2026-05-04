import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://eshosmtjhnvtpnnjgseu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzaG9zbXRqaG52dHBubmpnc2V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MzYwNzgsImV4cCI6MjA5MzQxMjA3OH0.-r2PjpaqMqbOhoABx5CvnecFUDTiQpfuqCvQ2WiFW7Y";

export const supabase = createClient(supabaseUrl, supabaseKey);