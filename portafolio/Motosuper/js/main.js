console.log("MotoSuper Alicante JS Loaded");

document.addEventListener('DOMContentLoaded', () => {
    // 1. Navbar Scroll Effect
    const header = document.querySelector('header');
    const logoImgDesktop = document.querySelector('.logo-desktop');
    const logoImgMobile = document.querySelector('.logo-mobile');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
            // If we want to change logo on scroll (e.g. text to icon)
            // if(window.innerWidth > 992 && logoImgMobile) { ... }
        } else {
            header.classList.remove('scrolled');
        }
    });

    // 2. Mobile Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const dropdownTrigger = document.querySelector('.dropdown-trigger');
    const dropdownParent = document.querySelector('.nav-item-dropdown');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            header.classList.toggle('menu-open');
        });

        // Dropdown toggle for mobile
        if (dropdownTrigger && dropdownParent) {
            dropdownTrigger.addEventListener('click', (e) => {
                if (window.innerWidth <= 992) {
                    // We don't preventDefault so it still scrolls to #servicios
                    dropdownParent.classList.toggle('active');
                }
            });
        }

        // Close menu when clicking a link
        // Note: we exclude the dropdown trigger on mobile to keep the menu open for sub-links
        document.querySelectorAll('.nav-links a:not(.dropdown-trigger)').forEach(link => {
            link.addEventListener('click', () => {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Special case for mobile: clicking #servicios itself (the trigger)
        // We want it to scroll (default) but NOT close the whole mobile menu immediately
        // so the user can see the sub-options.
    }

    // 3. Geolocation Logic (Only runs if elements exist)
    const btnGeo = document.getElementById('btn-geolocation');
    const geoResult = document.getElementById('geo-result');
    const sedesList = document.getElementById('sedes-list');

    if (btnGeo && typeof navigator.geolocation !== 'undefined') {
        btnGeo.addEventListener('click', () => {
            btnGeo.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Localizando...';
            
            navigator.geolocation.getCurrentPosition(position => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                const sede1 = document.getElementById('sede-1');
                const sede2 = document.getElementById('sede-2');
                
                // Haversine Formula (simplified for short distances)
                const getDistance = (lat1, lon1, lat2, lon2) => {
                    const R = 6371; // Radius of the earth in km
                    const dLat = (lat2 - lat1) * Math.PI / 180;
                    const dLon = (lon2 - lon1) * Math.PI / 180;
                    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                        Math.sin(dLon/2) * Math.sin(dLon/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
                    return R * c; // Distance in km
                };

                const dist1 = getDistance(userLat, userLng, parseFloat(sede1.dataset.lat), parseFloat(sede1.dataset.lng));
                const dist2 = getDistance(userLat, userLng, parseFloat(sede2.dataset.lat), parseFloat(sede2.dataset.lng));

                if (dist1 <= dist2) {
                    geoResult.innerText = "La Sede 1 es la más cercana a ti (" + dist1.toFixed(1) + " km).";
                    sedesList.insertBefore(sede1, sede2);
                    sede1.style.borderColor = "var(--accent-blue)";
                    sede1.style.boxShadow = "0 0 20px var(--accent-blue-dim)";
                } else {
                    geoResult.innerText = "La Sede 2 es la más cercana a ti (" + dist2.toFixed(1) + " km).";
                    sedesList.insertBefore(sede2, sede1);
                    sede2.style.borderColor = "var(--accent-red)";
                    sede2.style.boxShadow = "0 0 20px var(--accent-red-dim)";
                }

                btnGeo.innerHTML = '<i class="fas fa-check"></i> Completado';
            }, error => {
                geoResult.innerText = "No se pudo obtener tu ubicación. Por favor, revisa tus permisos.";
                btnGeo.innerHTML = '<i class="fas fa-location-arrow"></i> Buscar de nuevo';
            });
        });
    }

    // 4. Unified Contact Actions (Preserved for structure, logic moved to direct hrefs)
    // All contact forms have been replaced by direct WhatsApp links in the HTML

    // 5. Scroll Animations (Intersection Observer)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Triggers when 15% of the element is visible
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target); // Optional: animate only once
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => {
        scrollObserver.observe(el);
    });

    // 6. Testimonials Carousel
    const track = document.querySelector('.carousel-track');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (track && prevBtn && nextBtn) {
        // Calculate the scroll amount (width of card + gap)
        const getScrollAmount = () => {
            const card = track.querySelector('.google-review-card');
            if (card) {
                // width + gap (30px defined in CSS)
                return card.offsetWidth + 30;
            }
            return 380; // fallback
        };

        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
        });

        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
        });
    }

    // 7. Stats Counter Animation
    const counters = document.querySelectorAll('.counter');
    let hasAnimated = false;

    const animateCounters = () => {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const increment = +counter.getAttribute('data-increment') || 1;
            const speed = +counter.getAttribute('data-speed') || 20;
            
            let current = 0;
            
            const updateCounter = () => {
                if (current < target) {
                    current += increment;
                    if (current > target) current = target;
                    
                    // Format number with dots (e.g., 1.459)
                    counter.innerText = current.toLocaleString('es-ES');
                    setTimeout(updateCounter, speed);
                } else {
                    counter.innerText = target.toLocaleString('es-ES');
                }
            };
            
            updateCounter();
        });
    };

    const statsSection = document.getElementById('estadisticas');
    if (statsSection && counters.length > 0) {
        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !hasAnimated) {
                hasAnimated = true;
                animateCounters();
            }
        }, { threshold: 0.5 });
        
        statsObserver.observe(statsSection);
    }

    // 4. Interactive Map Logic (Leaflet)
    const mapElement = document.getElementById('map');
    if (mapElement && typeof L !== 'undefined') {
        const locations = [
            { id: 0, name: "MotoSuper Sede 1", coords: [38.35631, -0.47716], address: "C/ Ingeniero Canales, 6" },
            { id: 1, name: "MotoSuper Sede 2", coords: [38.35386, -0.48698], address: "C/ Teniente Llorca, 3" }
        ];

        // Initialize map centered between the two points
        const map = L.map('map', {
            scrollWheelZoom: false
        }).setView([38.3551, -0.4821], 15);

        // Add Premium Tiles (Voyager)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        // Custom Icon
        const motoIcon = L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', 
            iconSize: [38, 38],
            iconAnchor: [19, 38],
            popupAnchor: [0, -38]
        });

        // Add Markers
        const markers = [];
        locations.forEach(loc => {
            const marker = L.marker(loc.coords, { icon: motoIcon }).addTo(map);
            marker.bindPopup(`<strong>${loc.name}</strong><br>${loc.address}`);
            markers.push(marker);
        });

        // Interaction between Cards and Map
        const locationCards = document.querySelectorAll('.location-card');
        locationCards.forEach(card => {
            card.addEventListener('click', () => {
                // Update active state
                locationCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                // Move map
                const lat = parseFloat(card.dataset.lat);
                const lng = parseFloat(card.dataset.lng);
                const index = parseInt(card.dataset.index);

                map.flyTo([lat, lng], 17, {
                    animate: true,
                    duration: 1.5
                });

                // Open popup
                markers[index].openPopup();
            });
        });
    }


    // 6. Hero Deco Ring Scroll Animation
    const ringContainer = document.querySelector('.hero-ring-container');
    if (ringContainer) {
        window.addEventListener('scroll', function() {
            const scrollPos = window.pageYOffset;
            // Rotate slightly faster or slower on scroll for parallax effect
            ringContainer.style.transform = `rotate(${scrollPos * 0.1}deg)`;
        });
    }

    // 7. History Ring Scroll Animation
    const historyRing = document.querySelector('.history-ring-container');
    if (historyRing) {
        window.addEventListener('scroll', function() {
            const scrollPos = window.pageYOffset;
            const historyPos = historyRing.offsetTop;
            // Only animate when near the section
            if (scrollPos > historyPos - window.innerHeight) {
                historyRing.style.transform = `translate(-50%, -50%) rotate(${scrollPos * 0.08}deg)`;
            }
        });
    }
    // 8. Floating CTA Visibility Logic
    const floatingCta = document.querySelector('.floating-cta-mobile');
    const heroSection = document.getElementById('inicio') || document.querySelector('.hero-wrapper') || document.querySelector('.page-hero');
    
    if (floatingCta && heroSection) {
        const checkVisibility = () => {
            const rect = heroSection.getBoundingClientRect();
            // Show when the bottom of the hero is scrolled past (less than 100px from top)
            if (rect.bottom < 100) {
                floatingCta.classList.add('visible');
            } else {
                floatingCta.classList.remove('visible');
            }
        };
        
        window.addEventListener('scroll', checkVisibility);
        checkVisibility(); // Initial check
    }

    // 9. Cookie Banner Logic
    const cookieAccepted = localStorage.getItem('cookies-accepted');
    if (!cookieAccepted) {
        const banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.id = 'cookie-banner';
        banner.innerHTML = `
            <div class="cookie-text">
                Utilizamos cookies propias y de terceros para mejorar tu experiencia. Al continuar navegando, aceptas nuestra <a href="politica-cookies.html">Política de Cookies</a>.
            </div>
            <div class="cookie-actions">
                <button class="btn-cookie" id="accept-cookies">Aceptar</button>
            </div>
        `;
        document.body.appendChild(banner);

        // Animation delay
        setTimeout(() => {
            banner.classList.add('show');
        }, 1000);

        const acceptBtn = document.getElementById('accept-cookies');
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookies-accepted', 'true');
            banner.classList.remove('show');
            setTimeout(() => {
                banner.remove();
            }, 600);
        });
    }
});
