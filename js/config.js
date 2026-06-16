const SUPABASE_URL = "https://ajrjphpdvfibxaljnuxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqcmpwaHBkdmZpYnhhbGpudXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1MzYzODUsImV4cCI6MjA5NzExMjM4NX0.WpcOtE4Dm_xjZT7ZXHXGFsRrAaFOpi2L-sZqhFjBTrg";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const API = "https://api.autotrolej.hr/api/v1/voznired";
const WS_URL = "wss://api.autotrolej.hr/api/Hub/location";
