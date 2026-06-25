const SUPABASE_URL = 'https://oaytrikyhxqlmrmtvkls.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9heXRyaWt5aHhxbG1ybXR2a2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzY4NzMsImV4cCI6MjA5NzkxMjg3M30.E7s3EmxS6yWWkFCMJ_5nmRGH5EbRLqf8YBNBK5xV2ps';

async function main() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/appointments?select=*&limit=1`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        const data = await response.json();
        console.log(data);
    } catch (e) {
        console.error(e);
    }
}
main();
