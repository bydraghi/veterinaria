const SUPABASE_URL = 'https://oaytrikyhxqlmrmtvkls.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9heXRyaWt5aHhxbG1ybXR2a2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzY4NzMsImV4cCI6MjA5NzkxMjg3M30.E7s3EmxS6yWWkFCMJ_5nmRGH5EbRLqf8YBNBK5xV2ps';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let appointments = [];
let services = [];
let blocked = [];

async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    const emailEl = document.getElementById('user-email');
    if(emailEl) emailEl.innerText = session.user.email;
}

// Escuchar cambios de sesión (ej. si cierran sesión en otra pestaña)
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
        window.location.href = 'login.html';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initNavigation();
    loadDashboardData();
    loadServices();
    loadAvailability();
    
    document.getElementById('service-form').addEventListener('submit', handleServiceSubmit);
    document.getElementById('availability-form').addEventListener('submit', handleAvailabilitySubmit);
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
        });
    }
    
    // Tab switching in Dashboard
    const tabs = document.querySelectorAll('.tabs .tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            renderDashboardAppointments(e.target.innerText);
        });
    });
});

function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const contentAreas = document.querySelectorAll('.content-area');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');
    
    const titles = {
        'dashboard-section': { title: 'Bienvenido, Administrador', sub: 'Aquí tienes un resumen de las citas de hoy.' },
        'services-section': { title: 'Gestión de Servicios', sub: 'Administra los servicios que se muestran en la página principal.' },
        'availability-section': { title: 'Disponibilidad', sub: 'Bloquea fechas y horarios para no recibir citas.' }
    };

    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            navBtns.forEach(b => b.classList.remove('active'));
            contentAreas.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const target = btn.getAttribute('data-target');
            document.getElementById(target).classList.add('active');
            
            pageTitle.innerText = titles[target].title;
            pageSubtitle.innerText = titles[target].sub;
        });
    });
}

// === DASHBOARD ===
async function loadDashboardData() {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: allAppts } = await supabaseClient
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });
        
    if(allAppts) appointments = allAppts;
    
    const todaysAppts = appointments.filter(a => a.date === today);
    const pending = todaysAppts.filter(a => a.status === 'Pendiente').length;
    const confirmed = todaysAppts.filter(a => a.status === 'Confirmada').length;
    const cancelled = todaysAppts.filter(a => a.status === 'Cancelada').length;
    
    document.getElementById('stat-today').innerText = todaysAppts.length;
    document.getElementById('stat-pending').innerText = pending;
    document.getElementById('stat-confirmed').innerText = confirmed;
    document.getElementById('stat-cancelled').innerText = cancelled;
    
    renderDashboardAppointments('Todas');
    renderUpcomingAppointments();
}

function renderDashboardAppointments(filterStatus) {
    const today = new Date().toISOString().split('T')[0];
    let filtered = appointments.filter(a => a.date === today);
    
    if(filterStatus !== 'Todas') {
        // e.g. "Pendientes" -> "Pendiente"
        const statusMap = { 'Pendientes': 'Pendiente', 'Confirmadas': 'Confirmada', 'Canceladas': 'Cancelada' };
        filtered = filtered.filter(a => a.status === statusMap[filterStatus]);
    }
    
    const container = document.getElementById('dashboard-appointments-list');
    container.innerHTML = '';
    
    if(filtered.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); grid-column: span 2;">No hay citas para mostrar.</p>';
        return;
    }
    
    filtered.forEach(a => {
        const statusClass = a.status === 'Pendiente' ? 'pending' : (a.status === 'Confirmada' ? 'confirmed' : 'cancelled');
        // Format time (assuming HH:mm:ss) to AM/PM
        const timeParts = a.time.split(':');
        let hours = parseInt(timeParts[0]);
        const mins = timeParts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const timeStr = `${hours.toString().padStart(2, '0')}:${mins} ${ampm}`;
        
        container.innerHTML += `
            <div class="appointment-card">
                <div class="appointment-header">
                    <span style="color:var(--text-dark); display:flex; align-items:center; gap:6px;"><i class="ph ph-clock"></i> ${timeStr}</span>
                    <span class="badge ${statusClass}">${a.status}</span>
                </div>
                <div class="appointment-details">
                    <div class="detail-item"><i class="ph ph-user"></i> ${a.name}</div>
                    <div class="detail-item"><i class="ph ph-phone"></i> ${a.phone}</div>
                    <div class="detail-item"><i class="ph ph-paw-print"></i> ${a.service}</div>
                </div>
                <div class="appointment-actions">
                    <button class="btn btn-confirm" onclick="updateStatus('${a.id}', 'Confirmada')" ${a.status !== 'Pendiente' ? 'disabled style="opacity:0.5"' : ''}>
                        <i class="ph ph-check"></i> Confirmar
                    </button>
                    <button class="btn btn-cancel" onclick="updateStatus('${a.id}', 'Cancelada')" ${a.status === 'Cancelada' ? 'disabled style="opacity:0.5"' : ''}>
                        <i class="ph ph-x"></i> Cancelar
                    </button>
                    <button class="btn btn-details" onclick="alert('Mensaje: ${a.message || 'Sin mensaje adicional'}')">
                        <i class="ph ph-eye"></i> Detalles
                    </button>
                </div>
            </div>
        `;
    });
}

function renderUpcomingAppointments() {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = appointments.filter(a => a.date > today).slice(0, 5);
    const container = document.getElementById('upcoming-appointments-list');
    container.innerHTML = '';
    
    if(upcoming.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:14px;">No hay citas próximas.</p>';
        return;
    }
    
    upcoming.forEach(a => {
        const timeParts = a.time.split(':');
        let hours = parseInt(timeParts[0]);
        const mins = timeParts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        
        const dateObj = new Date(a.date);
        const dateStr = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        
        const statusClass = a.status === 'Pendiente' ? 'pending' : (a.status === 'Confirmada' ? 'confirmed' : 'cancelled');
        
        container.innerHTML += `
            <div style="border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-sm);">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px; color:var(--text-muted);">
                    <span><i class="ph ph-clock"></i> ${dateStr} • ${hours}:${mins} ${ampm}</span>
                    <span class="badge ${statusClass}" style="font-size:10px;">${a.status}</span>
                </div>
                <div style="font-weight:600; font-size:14px; margin-bottom:4px;">${a.name}</div>
                <div style="font-size:13px; color:var(--text-muted);">${a.service}</div>
            </div>
        `;
    });
}

async function updateStatus(id, newStatus) {
    await supabaseClient.from('appointments').update({ status: newStatus }).eq('id', id);
    await loadDashboardData();
}


// === SERVICES ===
async function loadServices() {
    const { data } = await supabaseClient.from('services').select('*').order('created_at');
    if(data) {
        services = data;
        const tbody = document.getElementById('services-table-body');
        tbody.innerHTML = '';
        services.forEach(s => {
            tbody.innerHTML += `
                <tr>
                    <td><i class="ph ${s.icon}" style="font-size:24px; color:var(--primary);"></i></td>
                    <td>${s.title}</td>
                    <td><div style="max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.description}</div></td>
                    <td><div style="max-width:150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.image_url}</div></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon edit" onclick="editService('${s.id}')"><i class="ph ph-pencil-simple"></i></button>
                            <button class="btn-icon delete" onclick="deleteService('${s.id}')"><i class="ph ph-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
}

function openServiceModal() {
    document.getElementById('service-form').reset();
    document.getElementById('service-id').value = '';
    document.getElementById('service-modal-title').innerText = 'Nuevo Servicio';
    document.getElementById('service-modal').classList.add('active');
}

function closeServiceModal() {
    document.getElementById('service-modal').classList.remove('active');
}

function editService(id) {
    const s = services.find(x => x.id === id);
    if(s) {
        document.getElementById('service-id').value = s.id;
        document.getElementById('service-title').value = s.title;
        document.getElementById('service-desc').value = s.description;
        document.getElementById('service-icon').value = s.icon;
        document.getElementById('service-image').value = s.image_url;
        document.getElementById('service-modal-title').innerText = 'Editar Servicio';
        document.getElementById('service-modal').classList.add('active');
    }
}

async function handleServiceSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('service-id').value;
    const title = document.getElementById('service-title').value;
    const description = document.getElementById('service-desc').value;
    const icon = document.getElementById('service-icon').value;
    const image_url = document.getElementById('service-image').value;
    
    if(id) {
        await supabaseClient.from('services').update({ title, description, icon, image_url }).eq('id', id);
    } else {
        await supabaseClient.from('services').insert([{ title, description, icon, image_url }]);
    }
    
    closeServiceModal();
    loadServices();
}

async function deleteService(id) {
    if(confirm('¿Estás seguro de eliminar este servicio?')) {
        await supabaseClient.from('services').delete().eq('id', id);
        loadServices();
    }
}

// === AVAILABILITY ===
async function loadAvailability() {
    const { data } = await supabaseClient.from('blocked_availability').select('*').order('date', { ascending: false });
    if(data) {
        blocked = data;
        const tbody = document.getElementById('availability-table-body');
        tbody.innerHTML = '';
        blocked.forEach(b => {
            const startStr = b.start_time ? b.start_time.substring(0,5) : 'Todo el día';
            const endStr = b.end_time ? b.end_time.substring(0,5) : 'Todo el día';
            tbody.innerHTML += `
                <tr>
                    <td>${b.date}</td>
                    <td>${startStr}</td>
                    <td>${endStr}</td>
                    <td>${b.reason || '-'}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon delete" onclick="deleteAvailability('${b.id}')"><i class="ph ph-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
}

function openAvailabilityModal() {
    document.getElementById('availability-form').reset();
    document.getElementById('avail-id').value = '';
    document.getElementById('availability-modal').classList.add('active');
}

function closeAvailabilityModal() {
    document.getElementById('availability-modal').classList.remove('active');
}

async function handleAvailabilitySubmit(e) {
    e.preventDefault();
    const date = document.getElementById('avail-date').value;
    let start_time = document.getElementById('avail-start').value;
    let end_time = document.getElementById('avail-end').value;
    const reason = document.getElementById('avail-reason').value;
    
    start_time = start_time ? `${start_time}:00` : null;
    end_time = end_time ? `${end_time}:00` : null;
    
    await supabaseClient.from('blocked_availability').insert([{ date, start_time, end_time, reason }]);
    
    closeAvailabilityModal();
    loadAvailability();
}

async function deleteAvailability(id) {
    if(confirm('¿Eliminar este bloqueo?')) {
        await supabaseClient.from('blocked_availability').delete().eq('id', id);
        loadAvailability();
    }
}
