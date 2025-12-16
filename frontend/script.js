// script.js - Enhanced Version with Fullscreen Preview and Advanced Zoom
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const continueBtn = document.getElementById('continue-btn');
    const memoriesBtn = document.getElementById('memories-btn');
    const backBtn = document.getElementById('back-btn');
    const birthdaySection = document.getElementById('birthday-poster');
    const messageSection = document.getElementById('message-section');
    const memoriesSection = document.getElementById('memories-section');
    const slider = document.getElementById('slider');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const currentSlideEl = document.getElementById('current-slide');
    const totalSlidesEl = document.getElementById('total-slides');
    const confettiContainer = document.querySelector('.confetti-container');
    const scrollInstruction = document.querySelector('.scroll-instruction');
    
    // State variables
    let currentSection = 'birthday';
    let currentSlide = 1;
    let totalSlides = 7;
    let isZoomed = false;
    let isFullscreen = false;
    let zoomScale = 1;
    let zoomTransform = { x: 0, y: 0 };
    let lastTapTime = 0;
    let fullscreenContainer;
    
    // Initialize the page
    function init() {
        createConfetti();
        updateScrollInstruction();
        loadMemoryImages();
        setupZoomHandlers();
        createFullscreenModal();
    }
    
    // Create confetti effect
    function createConfetti() {
        const colors = ['#ff6b81', '#2ed573', '#1e90ff', '#ffa502', '#6a1b4d', '#ff4757'];
        
        for (let i = 0; i < 150; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 10 + 5 + 'px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.position = 'absolute';
            confetti.style.top = Math.random() * 100 + 'vh';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.borderRadius = '50%';
            confetti.style.opacity = Math.random() * 0.7 + 0.3;
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.animation = `fall ${Math.random() * 5 + 3}s linear infinite`;
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fall {
                    0% { transform: translateY(-100vh) rotate(0deg); }
                    100% { transform: translateY(100vh) rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
            
            confettiContainer.appendChild(confetti);
        }
    }
    
    // Update scroll instruction
    function updateScrollInstruction() {
        if (scrollInstruction) {
            scrollInstruction.innerHTML = '<p><i class="fas fa-hand"></i> Scroll at your own pace to read the message</p>';
        }
    }
    
    // Load memory images
    function loadMemoryImages() {
        totalSlides = 7;
        totalSlidesEl.textContent = totalSlides;
        
        slider.innerHTML = '';
        
        // Create thumbnail images
        for (let i = 1; i <= totalSlides; i++) {
            const slideContainer = document.createElement('div');
            slideContainer.className = 'slide-container';
            
            const img = document.createElement('img');
            img.src = `image${i}.jpeg`;
            img.alt = `Memory ${i}`;
            img.id = `slide-${i}`;
            img.className = 'memory-image';
            img.dataset.index = i;
            
            // Add click for fullscreen preview
            img.addEventListener('click', (e) => {
                openFullscreen(i, e.target.src);
            });
            
            // Add double-tap for zoom
            img.addEventListener('touchend', handleDoubleTap);
            
            // Add error handling
            img.onerror = function() {
                this.src = 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80';
                this.alt = 'Placeholder image for memory';
            };
            
            slideContainer.appendChild(img);
            slider.appendChild(slideContainer);
        }
        
        // Set first slide as active
        document.querySelectorAll('.slide-container')[0].classList.add('active');
    }
    
    // Handle double tap for zoom on mobile
    function handleDoubleTap(e) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        
        if (tapLength < 300 && tapLength > 0) {
            e.preventDefault();
            toggleImageZoom(e.target);
        }
        lastTapTime = currentTime;
    }
    
    // Setup zoom handlers
    function setupZoomHandlers() {
        // Create zoom controls for slider
        const sliderContainer = document.querySelector('.slider-container');
        const zoomControls = document.createElement('div');
        zoomControls.className = 'zoom-controls';
        zoomControls.innerHTML = `
            <button class="zoom-btn zoom-in-btn" title="Zoom In">
                <i class="fas fa-search-plus"></i>
            </button>
            <button class="zoom-btn reset-zoom-btn" title="Reset Zoom">
                <i class="fas fa-undo"></i>
            </button>
            <button class="zoom-btn zoom-out-btn" title="Zoom Out">
                <i class="fas fa-search-minus"></i>
            </button>
            <button class="zoom-btn fullscreen-btn" title="Fullscreen">
                <i class="fas fa-expand"></i>
            </button>
        `;
        
        sliderContainer.appendChild(zoomControls);
        
        // Add event listeners for zoom controls
        const zoomInBtn = zoomControls.querySelector('.zoom-in-btn');
        const zoomOutBtn = zoomControls.querySelector('.zoom-out-btn');
        const resetZoomBtn = zoomControls.querySelector('.reset-zoom-btn');
        const fullscreenBtn = zoomControls.querySelector('.fullscreen-btn');
        
        zoomInBtn.addEventListener('click', () => zoomImage(1.2));
        zoomOutBtn.addEventListener('click', () => zoomImage(0.8));
        resetZoomBtn.addEventListener('click', resetZoom);
        fullscreenBtn.addEventListener('click', () => {
            const activeImg = document.querySelector('.slide-container.active .memory-image');
            if (activeImg) {
                openFullscreen(currentSlide, activeImg.src);
            }
        });
        
        // Setup pinch zoom for slider
        setupPinchZoom(slider);
    }
    
    // Setup pinch zoom for container
    function setupPinchZoom(container) {
        let initialDistance = 0;
        let initialScale = 1;
        
        container.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2 && isZoomed) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                initialDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                initialScale = zoomScale;
            }
        }, { passive: true });
        
        container.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && e.target.classList.contains('memory-image')) {
                e.preventDefault();
                const activeImage = document.querySelector('.slide-container.active .memory-image');
                if (!activeImage) return;
                
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentDistance = Math.hypot(
                    touch2.clientX - touch1.clientX,
                    touch2.clientY - touch1.clientY
                );
                
                if (initialDistance === 0) {
                    initialDistance = currentDistance;
                    initialScale = zoomScale;
                }
                
                const scale = initialScale * (currentDistance / initialDistance);
                zoomScale = Math.max(1, Math.min(scale, 5));
                
                // Enable zoom mode if not already
                if (!isZoomed && zoomScale > 1.1) {
                    isZoomed = true;
                    activeImage.style.cursor = 'move';
                    activeImage.parentElement.style.overflow = 'auto';
                }
                
                applyZoom(activeImage);
            }
        }, { passive: false });
        
        container.addEventListener('touchend', () => {
            initialDistance = 0;
        });
    }
    
    // Toggle zoom on image click
    function toggleImageZoom(imageElement) {
        const container = imageElement.closest('.slide-container');
        
        if (isZoomed) {
            resetZoom();
            container.style.overflow = 'hidden';
        } else {
            isZoomed = true;
            zoomScale = 2;
            zoomTransform = { x: 0, y: 0 };
            imageElement.style.cursor = 'move';
            container.style.overflow = 'auto';
            applyZoom(imageElement);
            
            // Add wheel event for panning
            imageElement.addEventListener('wheel', handleWheelZoom, { passive: false });
        }
    }
    
    // Apply zoom transformation
    function applyZoom(imageElement) {
        imageElement.style.transform = `scale(${zoomScale}) translate(${zoomTransform.x}px, ${zoomTransform.y}px)`;
        imageElement.style.transition = 'transform 0.15s ease-out';
    }
    
    // Handle wheel zoom and pan
    function handleWheelZoom(e) {
        if (!isZoomed) return;
        
        e.preventDefault();
        
        if (e.ctrlKey) {
            // Zoom with Ctrl + Wheel
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            zoomScale = Math.max(1, Math.min(zoomScale * zoomFactor, 5));
        } else {
            // Pan image
            zoomTransform.x -= e.deltaX * 0.5;
            zoomTransform.y -= e.deltaY * 0.5;
        }
        
        applyZoom(e.target);
    }
    
    // Zoom image by factor
    function zoomImage(factor) {
        const activeImage = document.querySelector('.slide-container.active .memory-image');
        if (!activeImage) return;
        
        if (!isZoomed && factor > 1) {
            isZoomed = true;
            activeImage.style.cursor = 'move';
            activeImage.parentElement.style.overflow = 'auto';
        }
        
        zoomScale = Math.max(1, Math.min(zoomScale * factor, 5));
        
        // Reset zoom if zoomed out completely
        if (zoomScale <= 1.1 && factor < 1) {
            resetZoom();
            return;
        }
        
        applyZoom(activeImage);
    }
    
    // Reset zoom
    function resetZoom() {
        isZoomed = false;
        zoomScale = 1;
        zoomTransform = { x: 0, y: 0 };
        
        const activeImage = document.querySelector('.slide-container.active .memory-image');
        if (activeImage) {
            activeImage.style.transform = 'scale(1) translate(0, 0)';
            activeImage.style.cursor = 'zoom-in';
            activeImage.style.transition = 'transform 0.2s ease';
            activeImage.parentElement.style.overflow = 'hidden';
            activeImage.removeEventListener('wheel', handleWheelZoom);
        }
    }
    
    // Create fullscreen modal
    function createFullscreenModal() {
        fullscreenContainer = document.createElement('div');
        fullscreenContainer.className = 'fullscreen-modal';
        fullscreenContainer.innerHTML = `
            <div class="fullscreen-content">
                <div class="fullscreen-header">
                    <button class="close-fullscreen-btn">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="zoom-fullscreen-btn">
                        <i class="fas fa-search-plus"></i>
                    </button>
                    <button class="reset-fullscreen-btn">
                        <i class="fas fa-undo"></i>
                    </button>
                    <span class="slide-counter"></span>
                </div>
                <div class="fullscreen-image-container">
                    <img class="fullscreen-image" src="" alt="Fullscreen View">
                </div>
                <div class="fullscreen-controls">
                    <button class="prev-fullscreen-btn">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="next-fullscreen-btn">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(fullscreenContainer);
        
        // Setup fullscreen event listeners
        const closeBtn = fullscreenContainer.querySelector('.close-fullscreen-btn');
        const zoomBtn = fullscreenContainer.querySelector('.zoom-fullscreen-btn');
        const resetBtn = fullscreenContainer.querySelector('.reset-fullscreen-btn');
        const prevBtnFull = fullscreenContainer.querySelector('.prev-fullscreen-btn');
        const nextBtnFull = fullscreenContainer.querySelector('.next-fullscreen-btn');
        const imageContainer = fullscreenContainer.querySelector('.fullscreen-image-container');
        const fullscreenImage = fullscreenContainer.querySelector('.fullscreen-image');
        
        closeBtn.addEventListener('click', closeFullscreen);
        zoomBtn.addEventListener('click', () => zoomFullscreenImage(1.3));
        resetBtn.addEventListener('click', resetFullscreenZoom);
        prevBtnFull.addEventListener('click', () => navigateFullscreen(-1));
        nextBtnFull.addEventListener('click', () => navigateFullscreen(1));
        
        // Setup pinch zoom for fullscreen
        setupPinchZoom(imageContainer);
        
        // Double tap for fullscreen zoom
        fullscreenImage.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTapTime;
            
            if (tapLength < 300 && tapLength > 0) {
                e.preventDefault();
                toggleFullscreenZoom();
            }
            lastTapTime = currentTime;
        });
        
        // Click to exit zoom in fullscreen
        imageContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('fullscreen-image')) {
                if (fullscreenImage.style.transform && fullscreenImage.style.transform !== 'scale(1)') {
                    resetFullscreenZoom();
                }
            }
        });
    }
    
    // Open fullscreen mode
    function openFullscreen(slideNumber, imageSrc) {
        isFullscreen = true;
        currentSlide = slideNumber;
        updateSlide();
        
        const fullscreenImage = fullscreenContainer.querySelector('.fullscreen-image');
        const slideCounter = fullscreenContainer.querySelector('.slide-counter');
        
        fullscreenImage.src = imageSrc;
        slideCounter.textContent = `${slideNumber} / ${totalSlides}`;
        
        fullscreenContainer.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Reset zoom for fullscreen
        resetFullscreenZoom();
    }
    
    // Close fullscreen mode
    function closeFullscreen() {
        isFullscreen = false;
        fullscreenContainer.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Zoom fullscreen image
    function zoomFullscreenImage(factor) {
        const fullscreenImage = fullscreenContainer.querySelector('.fullscreen-image');
        let currentScale = parseFloat(fullscreenImage.style.transform.replace('scale(', '').replace(')', '')) || 1;
        currentScale = Math.max(1, Math.min(currentScale * factor, 5));
        fullscreenImage.style.transform = `scale(${currentScale})`;
        fullscreenImage.style.transition = 'transform 0.2s ease';
        fullscreenImage.style.cursor = currentScale > 1 ? 'move' : 'zoom-in';
    }
    
    // Toggle fullscreen zoom
    function toggleFullscreenZoom() {
        const fullscreenImage = fullscreenContainer.querySelector('.fullscreen-image');
        let currentScale = parseFloat(fullscreenImage.style.transform.replace('scale(', '').replace(')', '')) || 1;
        
        if (currentScale > 1) {
            resetFullscreenZoom();
        } else {
            zoomFullscreenImage(2);
        }
    }
    
    // Reset fullscreen zoom
    function resetFullscreenZoom() {
        const fullscreenImage = fullscreenContainer.querySelector('.fullscreen-image');
        fullscreenImage.style.transform = 'scale(1)';
        fullscreenImage.style.cursor = 'zoom-in';
        fullscreenImage.style.transition = 'transform 0.2s ease';
    }
    
    // Navigate in fullscreen mode
    function navigateFullscreen(direction) {
        let newSlide = currentSlide + direction;
        if (newSlide < 1) newSlide = totalSlides;
        if (newSlide > totalSlides) newSlide = 1;
        
        const newImage = document.getElementById(`slide-${newSlide}`);
        if (newImage) {
            openFullscreen(newSlide, newImage.src);
        }
    }
    
    // Navigate to next slide in slider
    function nextSlide() {
        if (isZoomed) resetZoom();
        currentSlide = currentSlide >= totalSlides ? 1 : currentSlide + 1;
        updateSlide();
    }
    
    // Navigate to previous slide in slider
    function prevSlide() {
        if (isZoomed) resetZoom();
        currentSlide = currentSlide <= 1 ? totalSlides : currentSlide - 1;
        updateSlide();
    }
    
    // Update slide display
    function updateSlide() {
        // Remove active class from all slides
        document.querySelectorAll('.slide-container').forEach(container => {
            container.classList.remove('active');
        });
        
        // Add active class to current slide
        const currentContainer = document.querySelector(`.slide-container:nth-child(${currentSlide})`);
        if (currentContainer) {
            currentContainer.classList.add('active');
        }
        currentSlideEl.textContent = currentSlide;
        
        // Reset zoom when changing slides
        if (isZoomed) {
            resetZoom();
        }
    }
    
    // Switch between sections
    function switchSection(section) {
        // Hide all sections
        birthdaySection.classList.remove('active');
        messageSection.classList.remove('active');
        memoriesSection.classList.remove('active');
        
        // Show selected section
        if (section === 'birthday') {
            birthdaySection.classList.add('active');
            currentSection = 'birthday';
        } else if (section === 'message') {
            messageSection.classList.add('active');
            currentSection = 'message';
        } else if (section === 'memories') {
            memoriesSection.classList.add('active');
            currentSection = 'memories';
        }
        
        // Reset zoom when switching sections
        if (isZoomed) {
            resetZoom();
        }
    }
    
    // Event Listeners for slider
    continueBtn.addEventListener('click', () => switchSection('message'));
    memoriesBtn.addEventListener('click', () => switchSection('memories'));
    backBtn.addEventListener('click', () => switchSection('message'));
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (isFullscreen) {
            if (e.key === 'Escape') {
                closeFullscreen();
            } else if (e.key === 'ArrowLeft') {
                navigateFullscreen(-1);
            } else if (e.key === 'ArrowRight') {
                navigateFullscreen(1);
            } else if (e.key === '+' || e.key === '=') {
                zoomFullscreenImage(1.2);
            } else if (e.key === '-') {
                zoomFullscreenImage(0.8);
            }
        } else if (currentSection === 'memories') {
            if (e.key === 'ArrowLeft') {
                prevSlide();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
            } else if (e.key === 'Escape' && isZoomed) {
                resetZoom();
            } else if (e.key === 'Enter') {
                const activeImg = document.querySelector('.slide-container.active .memory-image');
                if (activeImg) {
                    openFullscreen(currentSlide, activeImg.src);
                }
            } else if (e.key === 'f' || e.key === 'F') {
                const activeImg = document.querySelector('.slide-container.active .memory-image');
                if (activeImg) {
                    openFullscreen(currentSlide, activeImg.src);
                }
            }
        }
    });
    
    // Initialize the page
    init();
});