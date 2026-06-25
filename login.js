const SUPABASE_URL = 'https://oaytrikyhxqlmrmtvkls.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9heXRyaWt5aHhxbG1ybXR2a2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzY4NzMsImV4cCI6MjA5NzkxMjg3M30.E7s3EmxS6yWWkFCMJ_5nmRGH5EbRLqf8YBNBK5xV2ps';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let isLoginMode = true;

document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    const toggleLink = document.getElementById('toggle-link');
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const submitBtn = document.getElementById('submit-btn');
    const toggleText = document.getElementById('toggle-text');
    const errorMsg = document.getElementById('error-msg');

    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            window.location.href = 'panel.html';
        }
    });

    toggleLink.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        errorMsg.style.display = 'none';
        
        if(isLoginMode) {
            formTitle.innerText = 'Iniciar Sesión';
            formSubtitle.innerText = 'Accede al panel de administración.';
            submitBtn.innerText = 'Ingresar';
            toggleText.innerText = '¿No tienes cuenta?';
            toggleLink.innerText = 'Regístrate como admin';
        } else {
            formTitle.innerText = 'Crear Cuenta';
            formSubtitle.innerText = 'Registra un nuevo administrador.';
            submitBtn.innerText = 'Registrar y Entrar';
            toggleText.innerText = '¿Ya tienes cuenta?';
            toggleLink.innerText = 'Iniciar Sesión';
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.innerText = 'Cargando...';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        let result;
        if(isLoginMode) {
            result = await supabase.auth.signInWithPassword({ email, password });
        } else {
            result = await supabase.auth.signUp({ email, password });
        }

        const { data, error } = result;

        if(error) {
            errorMsg.innerText = error.message === 'Invalid login credentials' ? 'Credenciales inválidas' : error.message;
            errorMsg.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.innerText = isLoginMode ? 'Ingresar' : 'Registrar y Entrar';
        } else {
            // Success
            window.location.href = 'panel.html';
        }
    });
});
