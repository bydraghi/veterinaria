document.addEventListener('DOMContentLoaded', () => {
    // 1. Navbar Scroll Effect
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Offset for navbar
                const offset = navbar.offsetHeight;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. Parallax Effect for Hero Background
    const parallaxPaws = document.getElementById('parallax-paws');
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        if (parallaxPaws && scrolled < window.innerHeight) {
            parallaxPaws.style.transform = `translateY(${scrolled * 0.3}px)`;
        }
    });

    // 4. Scroll Animations (Intersection Observer)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // If it's a counter, trigger it
                if (entry.target.classList.contains('nosotros-content')) {
                    triggerCounters();
                }

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-up, .fade-in, .slide-in-left, .slide-in-right');
    animatedElements.forEach(el => observer.observe(el));

    // 5. Counters Animation
    let countersTriggered = false;
    const counters = document.querySelectorAll('.counter');

    function triggerCounters() {
        if (countersTriggered) return;
        countersTriggered = true;

        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const duration = 2000; // ms
            const increment = target / (duration / 16); // 60fps

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

    // 6. Services Interaction
    const servicesData = {
        consulta: {
            title: "Consulta general",
            desc: "Revisiones completas para evaluar la salud general de tu mascota, detectar cualquier problema a tiempo y brindarle la mejor calidad de vida.",
            list: [
                "Evaluación física completa",
                "Diagnóstico preventivo",
                "Recomendaciones personalizadas",
                "Plan de vacunación"
            ],
            img: "/src/consulta.png"
        },
        vacunacion: {
            title: "Vacunación",
            desc: "Protege a tu mejor amigo contra enfermedades comunes y peligrosas. Contamos con los esquemas de vacunación más seguros y efectivos.",
            list: [
                "Esquema para cachorros",
                "Refuerzos anuales",
                "Vacuna antirrábica",
                "Certificado de vacunación"
            ],
            img: "/src/vacuna.png"
        },
        cirugia: {
            title: "Cirugía",
            desc: "Quirófano equipado con tecnología de punta y anestesia segura para procedimientos quirúrgicos de rutina o especialidad.",
            list: [
                "Esterilización y castración",
                "Cirugía de tejidos blandos",
                "Monitoreo anestésico continuo",
                "Cuidados postoperatorios"
            ],
            img: "/src/cirugia.png"
        },
        estetica: {
            title: "Estética canina y felina",
            desc: "Baño, corte de pelo y limpieza general para que tu mascota luzca increíble y mantenga una piel y pelaje saludables.",
            list: [
                "Baño medicado o cosmético",
                "Corte de pelo por raza",
                "Corte de uñas",
                "Limpieza de oídos"
            ],
            img: "/src/estetica.png"
        },
        desparasitacion: {
            title: "Desparasitación",
            desc: "Tratamientos preventivos y curativos contra parásitos internos y externos para proteger a tu mascota y a tu familia.",
            list: [
                "Desparasitación interna",
                "Control de pulgas y garrapatas",
                "Exámenes coproparasitoscópicos",
                "Asesoría preventiva"
            ],
            img: "/src/despara.png"
        },
        emergencias: {
            title: "Emergencias",
            desc: "Atención médica inmediata para casos críticos. Nuestro equipo está preparado para salvar vidas las 24 horas del día.",
            list: [
                "Atención inmediata 24/7",
                "Estabilización del paciente",
                "Hospitalización",
                "Terapia intensiva"
            ],
            img: "/src/emergencia.png"
        }
    };

    const serviceBtns = document.querySelectorAll('.service-btn');
    const detailTitle = document.getElementById('detail-title');
    const detailDesc = document.getElementById('detail-desc');
    const detailList = document.getElementById('detail-list');
    const serviceImg = document.getElementById('service-img');
    const serviceDetailsContainer = document.getElementById('service-details');

    serviceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            serviceBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked
            btn.classList.add('active');

            const id = btn.getAttribute('data-id');
            const data = servicesData[id];

            // Fade out
            serviceDetailsContainer.style.opacity = 0;
            serviceImg.style.opacity = 0;

            setTimeout(() => {
                // Update content
                detailTitle.innerText = data.title;
                detailDesc.innerText = data.desc;

                detailList.innerHTML = '';
                data.list.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `<i class="ph ph-check"></i> ${item}`;
                    detailList.appendChild(li);
                });

                serviceImg.src = data.img;

                // Fade in
                serviceDetailsContainer.style.opacity = 1;
                serviceImg.style.opacity = 1;
            }, 400); // 400ms transition
        });
    });

    // 7. Testimonials Carousel
    const track = document.getElementById('testimonials-track');
    const prevBtn = document.querySelector('.prev-arrow');
    const nextBtn = document.querySelector('.next-arrow');
    const dotsContainer = document.getElementById('carousel-dots');

    let currentIndex = 0;
    let maxIndex = 0;

    function initCarousel() {
        const cardsToShow = window.innerWidth > 768 ? 3 : 1;
        const totalCards = track.children.length;
        maxIndex = totalCards - cardsToShow;
        if (maxIndex < 0) maxIndex = 0;

        // Generate dots
        dotsContainer.innerHTML = '';
        for (let i = 0; i <= maxIndex; i++) {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (i === currentIndex) dot.classList.add('active');
            dot.addEventListener('click', () => {
                currentIndex = i;
                updateCarousel();
                resetAutoPlay();
            });
            dotsContainer.appendChild(dot);
        }

        if (currentIndex > maxIndex) currentIndex = maxIndex;
        updateCarousel();
    }

    function updateCarousel() {
        if (currentIndex < 0) currentIndex = maxIndex;
        if (currentIndex > maxIndex) currentIndex = 0;

        const cardWidth = track.children[0].offsetWidth;
        const gap = parseInt(window.getComputedStyle(track).gap) || 24;
        const amountToMove = currentIndex * (cardWidth + gap);

        // Remove transform if it was set previously
        track.style.transform = 'none';
        
        // Use scrollLeft to scroll the container instead of translating it
        track.scrollTo({
            left: amountToMove,
            behavior: 'smooth'
        });

        const dots = dotsContainer.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    nextBtn.addEventListener('click', () => {
        currentIndex++;
        updateCarousel();
        resetAutoPlay();
    });

    prevBtn.addEventListener('click', () => {
        currentIndex--;
        updateCarousel();
        resetAutoPlay();
    });

    let autoPlayInterval;
    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => {
            currentIndex++;
            updateCarousel();
        }, 5000);
    }

    // Initialize on load
    initCarousel();
    resetAutoPlay();

    // Handle resize for carousel
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            initCarousel();
        }, 250);
    });

    // 8. Contact Form Validation
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnIcon = submitBtn.querySelector('.btn-icon');
    const loader = submitBtn.querySelector('.loader');
    const successMsg = document.getElementById('success-msg');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        let isValid = true;

        // Validate fields
        const fields = contactForm.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            if (!field.checkValidity()) {
                isValid = false;
                field.parentElement.classList.add('invalid');
                field.classList.add('error');
            } else {
                field.parentElement.classList.remove('invalid');
                field.classList.remove('error');
            }
        });

        // Specific validations
        const email = document.getElementById('correo');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            isValid = false;
            email.parentElement.classList.add('invalid');
            email.classList.add('error');
        }

        if (isValid) {
            // Show loading state
            btnText.style.display = 'none';
            btnIcon.style.display = 'none';
            loader.style.display = 'block';
            submitBtn.disabled = true;

            // Simulate API call
            setTimeout(() => {
                loader.style.display = 'none';
                btnText.style.display = 'inline-block';
                btnIcon.style.display = 'inline-block';
                btnText.innerText = 'Mensaje enviado';

                submitBtn.classList.remove('btn-primary');
                submitBtn.style.backgroundColor = '#16a34a';
                submitBtn.style.color = '#fff';

                successMsg.style.display = 'block';

                contactForm.reset();

                // Reset button after 3 seconds
                setTimeout(() => {
                    submitBtn.disabled = false;
                    btnText.innerText = 'Enviar mensaje';
                    submitBtn.classList.add('btn-primary');
                    submitBtn.style.backgroundColor = '';
                    successMsg.style.display = 'none';
                }, 3000);
            }, 1500);
        }
    });

    // Input interaction for form
    const formInputs = contactForm.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.checkValidity()) {
                input.parentElement.classList.remove('invalid');
                input.classList.remove('error');
            }
        });
    });

    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    mobileBtn.addEventListener('click', () => {
        // Toggle mobile menu logic (simplified)
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
