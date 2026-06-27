document.addEventListener('DOMContentLoaded', async () => {
    // Supabase Init
    const SUPABASE_URL = 'https://oaytrikyhxqlmrmtvkls.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9heXRyaWt5aHhxbG1ybXR2a2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzY4NzMsImV4cCI6MjA5NzkxMjg3M30.E7s3EmxS6yWWkFCMJ_5nmRGH5EbRLqf8YBNBK5xV2ps';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Common UI (Navbar, Scroll, Parallax, IntersectionObserver)
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const offset = navbar.offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
            if(window.innerWidth <= 768) {
                document.querySelector('.nav-links').style.display = 'none';
            }
        });
    });

    const parallaxPaws = document.getElementById('parallax-paws');
    window.addEventListener('scroll', () => {
        if (parallaxPaws && window.scrollY < window.innerHeight) {
            parallaxPaws.style.transform = `translateY(${window.scrollY * 0.3}px)`;
        }
    });

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                if (entry.target.classList.contains('nosotros-content')) triggerCounters();
                obs.unobserve(entry.target);
            }
        });
    }, { root: null, rootMargin: '0px', threshold: 0.15 });

    document.querySelectorAll('.fade-up, .fade-in, .slide-in-left, .slide-in-right').forEach(el => observer.observe(el));

    let countersTriggered = false;
    function triggerCounters() {
        if (countersTriggered) return;
        countersTriggered = true;
        document.querySelectorAll('.counter').forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const increment = target / (2000 / 16);
            let current = 0;
            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.innerText = Math.ceil(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.innerText = target;
                }
            };
            updateCounter();
        });
    }

    // Dynamic Services Loading
    let servicesData = {};
    async function loadServices() {
        const { data } = await supabase.from('services').select('*').order('created_at');
        if(data && data.length > 0) {
            const listContainer = document.querySelector('.services-list');
            const selectContainer = document.getElementById('servicio');
            
            listContainer.innerHTML = '';
            selectContainer.innerHTML = '<option value="" disabled selected>Selecciona un servicio</option>';
            
            data.forEach((s, index) => {
                // Populate data map
                servicesData[s.id] = {
                    title: s.title,
                    desc: s.description,
                    icon: s.icon,
                    img: s.image_url
                };
                
                // Add to list
                const btn = document.createElement('button');
                btn.className = `service-btn ${index === 0 ? 'active' : ''}`;
                btn.setAttribute('data-id', s.id);
                btn.innerHTML = `<i class="ph ${s.icon}"></i> ${s.title}`;
                listContainer.appendChild(btn);
                
                // Add to select
                const opt = document.createElement('option');
                opt.value = s.title;
                opt.innerText = s.title;
                selectContainer.appendChild(opt);
            });
            
            // Attach event listeners to new buttons
            attachServiceEvents();
            // Trigger first
            document.querySelector('.service-btn').click();
        }
    }

    function attachServiceEvents() {
        const serviceBtns = document.querySelectorAll('.service-btn');
        const detailTitle = document.getElementById('detail-title');
        const detailDesc = document.getElementById('detail-desc');
        const detailList = document.getElementById('detail-list');
        const serviceImg = document.getElementById('service-img');
        const serviceDetailsContainer = document.getElementById('service-details');

        serviceBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                serviceBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const id = btn.getAttribute('data-id');
                const data = servicesData[id];

                serviceDetailsContainer.style.opacity = 0;
                serviceImg.style.opacity = 0;

                setTimeout(() => {
                    detailTitle.innerText = data.title;
                    detailDesc.innerText = data.desc;
                    // We can just show a generic list or parse if description has bullets
                    detailList.innerHTML = `
                        <li><i class="ph ph-check"></i> Atención profesional</li>
                        <li><i class="ph ph-check"></i> Trato humanitario</li>
                        <li><i class="ph ph-check"></i> Equipos modernos</li>
                    `;
                    serviceImg.src = data.img;

                    serviceDetailsContainer.style.opacity = 1;
                    serviceImg.style.opacity = 1;
                }, 400);
            });
        });
    }
    
    // Load services immediately
    loadServices();

    supabase.channel('custom-services-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, payload => {
            loadServices();
        })
        .subscribe();

    // Testimonials Carousel
    const track = document.getElementById('testimonials-track');
    const dotsContainer = document.getElementById('carousel-dots');
    let currentIndex = 0, maxIndex = 0;

    function initCarousel() {
        const cardsToShow = window.innerWidth > 768 ? 3 : 1;
        maxIndex = track.children.length - cardsToShow;
        if (maxIndex < 0) maxIndex = 0;
        dotsContainer.innerHTML = '';
        for (let i = 0; i <= maxIndex; i++) {
            const dot = document.createElement('span');
            dot.className = `dot ${i === currentIndex ? 'active' : ''}`;
            dot.addEventListener('click', () => { currentIndex = i; updateCarousel(); resetAutoPlay(); });
            dotsContainer.appendChild(dot);
        }
        if (currentIndex > maxIndex) currentIndex = maxIndex;
        updateCarousel();
    }

    function updateCarousel() {
        if (currentIndex < 0) currentIndex = maxIndex;
        if (currentIndex > maxIndex) currentIndex = 0;
        const amountToMove = currentIndex * (track.children[0].offsetWidth + (parseInt(window.getComputedStyle(track).gap) || 24));
        track.scrollTo({ left: amountToMove, behavior: 'smooth' });
        dotsContainer.querySelectorAll('.dot').forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
    }

    document.querySelector('.next-arrow').addEventListener('click', () => { currentIndex++; updateCarousel(); resetAutoPlay(); });
    document.querySelector('.prev-arrow').addEventListener('click', () => { currentIndex--; updateCarousel(); resetAutoPlay(); });

    let autoPlayInterval;
    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => { currentIndex++; updateCarousel(); }, 5000);
    }
    initCarousel(); resetAutoPlay();
    window.addEventListener('resize', () => { setTimeout(initCarousel, 250); });

    // Contact Form & Availability Logic
    const fechaInput = document.getElementById('fecha');
    const horaSelect = document.getElementById('hora');
    
    // Set min date to today
    const today = new Date();
    // Use local time for setting min date
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    fechaInput.setAttribute('min', `${yyyy}-${mm}-${dd}`);

    fechaInput.addEventListener('change', async (e) => {
        const selectedDate = e.target.value;
        if(!selectedDate) {
            horaSelect.innerHTML = '<option value="" disabled selected>Selecciona una fecha primero</option>';
            horaSelect.disabled = true;
            return;
        }

        horaSelect.innerHTML = '<option value="" disabled selected>Cargando disponibilidad...</option>';
        horaSelect.disabled = true;

        // Fetch blocked availability and appointments for this date
        const { data: blocked } = await supabase.from('blocked_availability').select('*').eq('date', selectedDate);
        const { data: appts } = await supabase.from('appointments').select('*').eq('date', selectedDate);

        // Generate time slots (9:00 to 19:00, every 30 mins)
        const times = [];
        for(let h = 9; h <= 19; h++) {
            times.push(`${String(h).padStart(2,'0')}:00:00`);
            if(h !== 19) times.push(`${String(h).padStart(2,'0')}:30:00`);
        }

        let isWholeDayBlocked = false;
        let blockedIntervals = [];

        if(blocked) {
            blocked.forEach(b => {
                if(!b.start_time && !b.end_time) isWholeDayBlocked = true;
                else if(b.start_time && b.end_time) blockedIntervals.push({ start: b.start_time, end: b.end_time });
                else if(b.start_time) blockedIntervals.push({ start: b.start_time, end: '23:59:59' });
                else if(b.end_time) blockedIntervals.push({ start: '00:00:00', end: b.end_time });
            });
        }

        if(isWholeDayBlocked) {
            horaSelect.innerHTML = '<option value="" disabled selected>Día no disponible</option>';
            return;
        }

        const availableTimes = times.filter(t => {
            // Check if blocked by interval
            const isBlocked = blockedIntervals.some(interval => t >= interval.start && t < interval.end);
            if(isBlocked) return false;

            // Check if already booked
            const isBooked = appts && appts.some(a => a.time === t && a.status !== 'Cancelada');
            if(isBooked) return false;

            return true;
        });

        horaSelect.innerHTML = '<option value="" disabled selected>Selecciona una hora</option>';
        if(availableTimes.length === 0) {
            horaSelect.innerHTML = '<option value="" disabled selected>Sin horarios disponibles</option>';
        } else {
            availableTimes.forEach(t => {
                const parts = t.split(':');
                let hr = parseInt(parts[0]);
                const mn = parts[1];
                const ampm = hr >= 12 ? 'PM' : 'AM';
                hr = hr % 12 || 12;
                const displayTime = `${String(hr).padStart(2,'0')}:${mn} ${ampm}`;
                
                const opt = document.createElement('option');
                opt.value = t;
                opt.innerText = displayTime;
                horaSelect.appendChild(opt);
            });
            horaSelect.disabled = false;
        }
    });

    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loader = submitBtn.querySelector('.loader');
    const successMsg = document.getElementById('success-msg');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        let isValid = true;
        contactForm.querySelectorAll('input, select, textarea').forEach(field => {
            if (!field.checkValidity()) {
                isValid = false;
                field.parentElement.classList.add('invalid');
                field.classList.add('error');
            } else {
                field.parentElement.classList.remove('invalid');
                field.classList.remove('error');
            }
        });

        if (isValid) {
            btnText.style.display = 'none';
            loader.style.display = 'block';
            submitBtn.disabled = true;

            const formData = {
                name: document.getElementById('nombre').value,
                phone: document.getElementById('telefono').value,
                date: document.getElementById('fecha').value,
                time: document.getElementById('hora').value,
                service: document.getElementById('servicio').value,
                message: document.getElementById('mensaje').value,
                status: 'Pendiente'
            };

            const { error } = await supabase.from('appointments').insert([formData]);

            if (error) {
                console.error("Error al guardar la cita:", error);
                alert("Ocurrió un error. Por favor intenta de nuevo.");
                submitBtn.disabled = false;
                btnText.style.display = 'inline-block';
                loader.style.display = 'none';
                return;
            }

            loader.style.display = 'none';
            btnText.style.display = 'inline-block';
            btnText.innerText = 'Mensaje enviado';
            submitBtn.style.backgroundColor = '#16a34a';
            submitBtn.style.color = '#fff';
            successMsg.style.display = 'block';

            contactForm.reset();
            horaSelect.innerHTML = '<option value="" disabled selected>Selecciona una fecha primero</option>';
            horaSelect.disabled = true;

            setTimeout(() => {
                submitBtn.disabled = false;
                btnText.innerText = 'Enviar mensaje';
                submitBtn.style.backgroundColor = '';
                successMsg.style.display = 'none';
            }, 3000);
        }
    });

    contactForm.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', () => {
            if (input.checkValidity()) {
                input.parentElement.classList.remove('invalid');
                input.classList.remove('error');
            }
        });
    });

    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    mobileBtn.addEventListener('click', () => {
        if (navLinks.style.display === 'flex') {
            navLinks.style.display = 'none';
        } else {
            navLinks.style.display = 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.width = '100%';
            navLinks.style.backgroundColor = 'white';
            navLinks.style.padding = '1rem';
            navLinks.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
        }
    });
});
