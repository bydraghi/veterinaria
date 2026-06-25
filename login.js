const SUPABASE_URL = 'https://oaytrikyhxqlmrmtvkls.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9heXRyaWt5aHhxbG1ybXR2a2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzY4NzMsImV4cCI6MjA5NzkxMjg3M30.E7s3EmxS6yWWkFCMJ_5nmRGH5EbRLqf8YBNBK5xV2ps';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    const submitBtn = document.getElementById('submit-btn');
    const errorMsg = document.getElementById('error-msg');

    // Check if already logged in
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            window.location.href = 'panel.html';
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.innerText = 'Cargando...';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if(error) {
            errorMsg.innerText = error.message === 'Invalid login credentials' ? 'Credenciales inválidas' : error.message;
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.innerText = 'Ingresar';
        } else {
            // Success
            window.location.href = 'panel.html';
        }
    });
});
