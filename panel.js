const SUPABASE_URL = 'https://oaytrikyhxqlmrmtvkls.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9heXRyaWt5aHhxbG1ybXR2a2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzY4NzMsImV4cCI6MjA5NzkxMjg3M30.E7s3EmxS6yWWkFCMJ_5nmRGH5EbRLqf8YBNBK5xV2ps';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let appointments = [];
let services = [];
let blocked = [];
let currentCalendarDate = new Date();
let selectedFilterDate = new Date().toISOString().split('T')[0];

// === CUSTOM MODALS ===
let confirmCallback = null;
window.showConfirm = function (title, message, callback) {
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerText = message;
    document.getElementById('custom-confirm-modal').classList.add('active');
    confirmCallback = callback;
}
window.closeConfirmModal = function () {
    document.getElementById('custom-confirm-modal').classList.remove('active');
    confirmCallback = null;
}
document.getElementById('confirm-yes-btn').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeConfirmModal();
});

window.showAlert = function (title, message) {
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;
    document.getElementById('custom-alert-modal').classList.add('active');
}
window.closeAlertModal = function () {
    document.getElementById('custom-alert-modal').classList.remove('active');
}

// === AUTH ===
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    const emailEl = document.getElementById('user-email');
    if (emailEl) emailEl.innerText = session.user.email;
}

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

    // Real-time subscription for Appointments
    supabaseClient.channel('custom-all-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, payload => {
            loadDashboardData();
        })
        .subscribe();

    document.getElementById('service-form').addEventListener('submit', handleServiceSubmit);
    document.getElementById('availability-form').addEventListener('submit', handleAvailabilitySubmit);

    // Calendar controls
    document.getElementById('cal-prev').addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById('cal-next').addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            showConfirm('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?', async () => {
                await supabaseClient.auth.signOut();
            });
        });
    }

    // Search listener
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const activeTab = document.querySelector('.tabs .tab-btn.active').innerText;
            renderDashboardAppointments(activeTab, e.target.value.toLowerCase());
        });
    }

    // Tab switching in Dashboard
    const tabs = document.querySelectorAll('.tabs .tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            const searchTerm = document.querySelector('.search-box input').value.toLowerCase();
            renderDashboardAppointments(e.target.innerText, searchTerm);
        });
    });

    // "Ver todas" logic for stat cards
    document.querySelectorAll('.stat-info a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('.appointments-section').scrollIntoView({behavior: 'smooth'});
            const title = e.target.parentElement.querySelector('h3').innerText;
            tabs.forEach(t => t.classList.remove('active'));
            let targetTab = 'Todas';
            if (title === 'Pendientes') targetTab = 'Pendientes';
            else if (title === 'Confirmadas') targetTab = 'Confirmadas';
            else if (title === 'Canceladas') targetTab = 'Canceladas';
            
            tabs.forEach(t => { if (t.innerText === targetTab) t.classList.add('active'); });
            const searchTerm = document.querySelector('.search-box input').value.toLowerCase();
            renderDashboardAppointments(targetTab, searchTerm);
        });
    });

    // "Ver todas las citas" button
    const viewAllBtn = document.querySelector('.view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabs[0].classList.add('active');
            const searchTerm = document.querySelector('.search-box input').value.toLowerCase();
            renderDashboardAppointments('Todas', searchTerm);
        });
    }

    // "Ver toda la actividad" link
    const viewAllActivity = document.querySelector('.view-all-link');
    if (viewAllActivity) {
        viewAllActivity.addEventListener('click', (e) => {
            e.preventDefault();
            const list = document.getElementById('activity-list');
            if (list.classList.contains('expanded')) {
                list.classList.remove('expanded');
                viewAllActivity.innerText = 'Ver toda la actividad';
                renderRecentActivity();
            } else {
                list.classList.add('expanded');
                viewAllActivity.innerText = 'Cerrar';
                renderRecentActivity(100);
            }
        });
    }
});

function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const contentAreas = document.querySelectorAll('.content-area');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const titles = {
        'dashboard-section': { title: 'Bienvenido, Administrador', sub: 'Aquí tienes un resumen de las citas.' },
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

// === DASHBOARD & CALENDAR ===
async function loadDashboardData() {
    const today = new Date().toISOString().split('T')[0];

    const { data: allAppts } = await supabaseClient
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })
        .order('time', { ascending: true });

    if (allAppts) appointments = allAppts;

    const todaysAppts = appointments.filter(a => a.date === today);
    const pending = todaysAppts.filter(a => a.status === 'Pendiente').length;
    const confirmed = todaysAppts.filter(a => a.status === 'Confirmada').length;
    const cancelled = todaysAppts.filter(a => a.status === 'Cancelada').length;

    document.getElementById('stat-today').innerText = todaysAppts.length;
    document.getElementById('stat-pending').innerText = pending;
    document.getElementById('stat-confirmed').innerText = confirmed;
    document.getElementById('stat-cancelled').innerText = cancelled;

    renderCalendar();

    // Keep the active tab when reloading real-time data
    const activeTab = document.querySelector('.tabs .tab-btn.active').innerText;
    const searchTerm = document.querySelector('.search-box input').value.toLowerCase();
    renderDashboardAppointments(activeTab, searchTerm);

    renderUpcomingAppointments();
    renderRecentActivity();
}

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    document.getElementById('cal-month-year').innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const startDay = firstDay === 0 ? 6 : firstDay - 1; // Mon = 0

    let html = '';
    for (let i = 0; i < startDay; i++) {
        html += '<div class="cal-day empty"></div>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const hasAppt = appointments.some(a => a.date === dateStr);
        const isActive = dateStr === selectedFilterDate;

        let classes = 'cal-day';
        if (hasAppt) classes += ' has-appointment';
        if (isActive) classes += ' active';

        html += `<div class="${classes}" onclick="selectDate('${dateStr}')">${d}</div>`;
    }
    document.getElementById('cal-days').innerHTML = html;
}

window.selectDate = function (dateStr) {
    selectedFilterDate = dateStr;
    renderCalendar();

    // Reset to "Todas" tab on date change
    document.querySelectorAll('.tabs .tab-btn').forEach((btn, idx) => {
        if (idx === 0) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    const searchTerm = document.querySelector('.search-box input').value.toLowerCase();
    renderDashboardAppointments('Todas', searchTerm);
}

function renderDashboardAppointments(filterStatus, searchTerm = '') {
    let filtered = appointments.filter(a => a.date === selectedFilterDate);

    if (filterStatus !== 'Todas') {
        const statusMap = { 'Pendientes': 'Pendiente', 'Confirmadas': 'Confirmada', 'Canceladas': 'Cancelada' };
        filtered = filtered.filter(a => a.status === statusMap[filterStatus]);
    }

    if (searchTerm) {
        filtered = filtered.filter(a =>
            (a.name && a.name.toLowerCase().includes(searchTerm)) ||
            (a.phone && a.phone.toLowerCase().includes(searchTerm)) ||
            (a.service && a.service.toLowerCase().includes(searchTerm))
        );
    }

    const container = document.getElementById('dashboard-appointments-list');
    container.innerHTML = '';

    if (filtered.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); grid-column: span 2;">No hay citas para mostrar.</p>';
        return;
    }

    filtered.forEach(a => {
        const statusClass = a.status === 'Pendiente' ? 'pending' : (a.status === 'Confirmada' ? 'confirmed' : 'cancelled');
        const timeParts = a.time.split(':');
        let hours = parseInt(timeParts[0]);
        const mins = timeParts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const timeStr = `${hours.toString().padStart(2, '0')}:${mins} ${ampm}`;

        const safeMsg = encodeURIComponent(a.message || 'Sin mensaje adicional');

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
                    <button class="btn btn-confirm" onclick="confirmAction('${a.id}', 'Confirmada')" ${a.status !== 'Pendiente' ? 'disabled style="opacity:0.5"' : ''}>
                        <i class="ph ph-check"></i> Confirmar
                    </button>
                    <button class="btn btn-cancel" onclick="confirmAction('${a.id}', 'Cancelada')" ${a.status === 'Cancelada' ? 'disabled style="opacity:0.5"' : ''}>
                        <i class="ph ph-x"></i> Cancelar
                    </button>
                    <button class="btn btn-details" onclick="showDetails('${safeMsg}')">
                        <i class="ph ph-eye"></i> Detalles
                    </button>
                </div>
            </div>
        `;
    });
}

window.showDetails = function (encodedMsg) {
    showAlert('Detalles de la Cita', 'Mensaje/Motivo: ' + decodeURIComponent(encodedMsg));
}

window.confirmAction = function (id, newStatus) {
    const actionName = newStatus === 'Confirmada' ? 'confirmar' : 'cancelar';
    showConfirm(`Confirmar Acción`, `¿Estás seguro de que deseas ${actionName} esta cita?`, () => {
        updateStatus(id, newStatus);
    });
}

async function updateStatus(id, newStatus) {
    await supabaseClient.from('appointments').update({ status: newStatus }).eq('id', id);
    // Real-time will trigger loadDashboardData automatically, but we can do it manually too.
}

function renderUpcomingAppointments() {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTimeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:00`;
    
    const upcoming = appointments.filter(a => {
        if (a.status === 'Confirmada' || a.status === 'Cancelada') return false;
        if (a.date > currentDate) return true;
        if (a.date === currentDate && a.time >= currentTimeStr) return true;
        return false;
    }).slice(0, 5);
    const container = document.getElementById('upcoming-appointments-list');
    container.innerHTML = '';

    if (upcoming.length === 0) {
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

function renderRecentActivity(limit = 5) {
    const recent = [...appointments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, limit);
    const container = document.getElementById('activity-list');
    container.innerHTML = '';

    if (recent.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:14px;">No hay actividad reciente.</p>';
        return;
    }

    recent.forEach(a => {
        let title = 'Nueva cita agendada';
        let iconClass = 'new';
        let iconHtml = '<i class="ph ph-calendar-plus"></i>';

        if (a.status === 'Confirmada') {
            title = 'Cita confirmada';
            iconClass = 'confirmed';
            iconHtml = '<i class="ph ph-check-circle"></i>';
        } else if (a.status === 'Cancelada') {
            title = 'Cita cancelada';
            iconClass = 'cancelled';
            iconHtml = '<i class="ph ph-x-circle"></i>';
        }

        const timeAgo = getTimeAgo(a.created_at);

        container.innerHTML += `
            <div class="activity-item">
                <div class="activity-icon ${iconClass}">
                    ${iconHtml}
                </div>
                <div class="activity-content">
                    <h4>${title}</h4>
                    <p>${a.name} - ${a.service}</p>
                    <div class="activity-time">Hace ${timeAgo}</div>
                </div>
            </div>
        `;
    });
}

function getTimeAgo(dateStr) {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return `${Math.max(1, seconds)} segundos`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} horas`;
    return `${Math.floor(hours / 24)} días`;
}

// === SERVICES ===
async function loadServices() {
    const { data } = await supabaseClient.from('services').select('*').order('created_at');
    if (data) {
        services = data;
        const tbody = document.getElementById('services-table-body');
        tbody.innerHTML = '';
        services.forEach(s => {
            let imgDisplay = s.image_url;
            if (imgDisplay.startsWith('http')) {
                imgDisplay = `<a href="${s.image_url}" target="_blank" style="color:var(--primary); font-size:12px;">Ver Imagen</a>`;
            }
            tbody.innerHTML += `
                <tr>
                    <td><i class="ph ${s.icon}" style="font-size:24px; color:var(--primary);"></i></td>
                    <td>${s.title}</td>
                    <td><div style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.description}</div></td>
                    <td>${imgDisplay}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon edit" onclick="editService('${s.id}')"><i class="ph ph-pencil-simple"></i></button>
                            <button class="btn-icon delete" onclick="deleteServiceAction('${s.id}')"><i class="ph ph-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
}

window.openServiceModal = function () {
    document.getElementById('service-form').reset();
    document.getElementById('service-id').value = '';
    document.getElementById('service-modal-title').innerText = 'Nuevo Servicio';
    document.getElementById('service-image').required = true;
    document.getElementById('service-image-help').innerText = '';
    document.getElementById('service-modal').classList.add('active');
}

window.closeServiceModal = function () {
    document.getElementById('service-modal').classList.remove('active');
}

window.editService = function (id) {
    const s = services.find(x => x.id === id);
    if (s) {
        document.getElementById('service-id').value = s.id;
        document.getElementById('service-title').value = s.title;
        document.getElementById('service-desc').value = s.description;
        document.getElementById('service-icon').value = s.icon;
        document.getElementById('service-image').required = false;
        document.getElementById('service-image-help').innerText = 'Imagen actual configurada. Sube una nueva para reemplazarla.';
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
    const imageInput = document.getElementById('service-image');

    let image_url = '';

    if (imageInput.files.length > 0) {
        const file = imageInput.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

        // As specified in the implementation plan, upload to 'images' bucket
        const { error: uploadError, data } = await supabaseClient.storage.from('images').upload(fileName, file);

        if (uploadError) {
            showAlert('Error subiendo imagen', 'Verifica que hayas añadido las Políticas RLS (Security > Policies) al Bucket "images" para permitir INSERT. Detalle: ' + uploadError.message);
            return;
        }

        const { data: publicUrlData } = supabaseClient.storage.from('images').getPublicUrl(fileName);
        image_url = publicUrlData.publicUrl;
    } else {
        if (id) {
            const s = services.find(x => x.id === id);
            image_url = s.image_url;
        } else {
            showAlert('Error', 'Debes seleccionar una imagen para el nuevo servicio.');
            return;
        }
    }

    if (id) {
        await supabaseClient.from('services').update({ title, description, icon, image_url }).eq('id', id);
    } else {
        await supabaseClient.from('services').insert([{ title, description, icon, image_url }]);
    }

    closeServiceModal();
    loadServices();
    showAlert('Éxito', 'El servicio ha sido guardado correctamente.');
}

window.deleteServiceAction = function (id) {
    showConfirm('Eliminar Servicio', '¿Estás seguro de eliminar este servicio permanentemente?', async () => {
        await supabaseClient.from('services').delete().eq('id', id);
        loadServices();
    });
}

// === AVAILABILITY ===
async function loadAvailability() {
    const { data } = await supabaseClient.from('blocked_availability').select('*').order('date', { ascending: false });
    if (data) {
        blocked = data;
        const tbody = document.getElementById('availability-table-body');
        tbody.innerHTML = '';
        blocked.forEach(b => {
            const startStr = b.start_time ? b.start_time.substring(0, 5) : 'Todo el día';
            const endStr = b.end_time ? b.end_time.substring(0, 5) : 'Todo el día';
            tbody.innerHTML += `
                <tr>
                    <td>${b.date}</td>
                    <td>${startStr}</td>
                    <td>${endStr}</td>
                    <td>${b.reason || '-'}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-icon delete" onclick="deleteAvailabilityAction('${b.id}')"><i class="ph ph-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
}

window.openAvailabilityModal = function () {
    document.getElementById('availability-form').reset();
    document.getElementById('avail-id').value = '';
    document.getElementById('availability-modal').classList.add('active');
}

window.closeAvailabilityModal = function () {
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
    showAlert('Éxito', 'La disponibilidad ha sido bloqueada correctamente.');
}

window.deleteAvailabilityAction = function (id) {
    showConfirm('Eliminar Bloqueo', '¿Eliminar este bloqueo de disponibilidad?', async () => {
        await supabaseClient.from('blocked_availability').delete().eq('id', id);
        loadAvailability();
    });
}
