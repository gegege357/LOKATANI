import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://brfuwgkkvsnbpmssfbwx.supabase.co";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZnV3Z2trdnNuYnBtc3NmYnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzM2NjEsImV4cCI6MjA5MDI0OTY2MX0.6yJMN6ccyuqUVuYXAa-ee0G7AdxR7DzeckqhvUXUMoQ";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEmail() {
  console.log("Invoking edge function 'send-email'...");
  let result = await supabase.functions.invoke("send-email", {
    body: {
      to: "saugifarandi@gmail.com",
      subject: "Test via node",
      html: "<h1>Testing LOKATANI</h1>",
      type: "system_alert",
      severity: "info",
    },
  });

  if (result.error) {
    console.log("send-email error:");
    console.log(result.error);
    const context = await result.error.context?.json?.().catch(() => result.error.context?.text?.());
    console.log("Error body:", context);
  } else {
    console.log("Success:", result.data);
  }
}

testEmail();
