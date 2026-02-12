/* ============================================
   SMOOTH SCROLL UTILITY
   ============================================ */

function scrollToSection(selector) {
    const section = document.querySelector(selector);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

/* ============================================
   THREE.JS SCENE SETUP
   ============================================ */

let scene, camera, renderer, truck, road;
let isTabVisible = true;
let animationFrameId;

function initThreeJS() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 500, 1000);

    // Camera
    const canvas = document.getElementById('heroCanvas');
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(0, 15, 30);
    camera.lookAt(0, 5, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 30);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);

    // Sky gradient (simple)
    const skyGeometry = new THREE.SphereGeometry(400, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x87ceeb,
        side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);

    // Road
    createRoad();

    // Truck
    createTruck();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Handle tab visibility
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Start animation loop
    animate();
}

function createRoad() {
    // Road plane with lane markings
    const roadGeometry = new THREE.PlaneGeometry(40, 200);
    const roadMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.1
    });

    road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    road.userData.initialZ = road.position.z;
    scene.add(road);

    // Lane markings (simple lines)
    const lineGeometry = new THREE.BufferGeometry();
    const linePoints = [];

    for (let i = -100; i <= 100; i += 5) {
        linePoints.push(new THREE.Vector3(-15, 0.01, i));
        linePoints.push(new THREE.Vector3(15, 0.01, i));
    }

    lineGeometry.setFromPoints(linePoints);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 });
    const lines = new THREE.Line(lineGeometry, lineMaterial);
    road.add(lines);
}

function createTruck() {
    truck = new THREE.Group();
    truck.position.z = 0;

    // Truck body
    const bodyGeometry = new THREE.BoxGeometry(8, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: 0xff6b35,
        roughness: 0.5,
        metalness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 5;
    body.castShadow = true;
    body.receiveShadow = true;
    truck.add(body);

    // Cabin (front)
    const cabinGeometry = new THREE.BoxGeometry(8, 6, 6);
    const cabinMaterial = new THREE.MeshStandardMaterial({
        color: 0xcc4422,
        roughness: 0.4,
        metalness: 0.4
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 4, 9);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    truck.add(cabin);

    // Windshield (glass)
    const windshieldGeometry = new THREE.BoxGeometry(7, 3, 1);
    const windshieldMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        metalness: 0.8,
        roughness: 0.1,
        transparent: true,
        opacity: 0.6
    });
    const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
    windshield.position.set(0, 5.5, 11.5);
    truck.add(windshield);

    // Wheels
    createWheels(truck);

    // Trailer attachment point indicator
    const trailerHitchGeometry = new THREE.BoxGeometry(2, 1, 1);
    const trailerHitchMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const trailerHitch = new THREE.Mesh(trailerHitchGeometry, trailerHitchMaterial);
    trailerHitch.position.set(0, 2, -9);
    truck.add(trailerHitch);

    scene.add(truck);
}

function createWheels(parentTruck) {
    const wheelRadius = 2;
    const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 3, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x222222,
        metalness: 0.6,
        roughness: 0.7
    });

    // Wheel positions: [x, y, z]
    const wheelPositions = [
        [-5, 2, 4],   // Front left
        [5, 2, 4],    // Front right
        [-5, 2, -2],  // Rear left 1
        [5, 2, -2],   // Rear right 1
        [-5, 2, -6],  // Rear left 2
        [5, 2, -6],   // Rear right 2
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos[0], pos[1], pos[2]);
        wheel.castShadow = true;
        wheel.receiveShadow = true;
        wheel.userData.rotationSpeed = 0;
        parentTruck.add(wheel);
    });
}

/* ============================================
   ANIMATION LOOP
   ============================================ */

let time = 0;
const truckSpeed = 0.3;

function animate() {
    animationFrameId = requestAnimationFrame(animate);

    if (!isTabVisible) return;

    time += 0.016; // ~60fps

    // Move truck forward
    truck.position.z -= truckSpeed;

    // Rotate wheels based on movement
    rotateWheels();

    // Create looping effect for the road
    if (truck.position.z < -100) {
        truck.position.z = 100;
    }

    // Slight camera follow for cinematic feel
    camera.position.x = Math.sin(time * 0.3) * 5;
    camera.lookAt(truck.position.x, truck.position.y + 5, truck.position.z + 20);

    renderer.render(scene, camera);
}

function rotateWheels() {
    truck.children.forEach((child) => {
        if (child.geometry && child.geometry.type === 'CylinderGeometry') {
            child.rotation.x += truckSpeed * 0.1;
        }
    });
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;

    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function onVisibilityChange() {
    isTabVisible = !document.hidden;
}

/* ============================================
   FORM HANDLING & VALIDATION
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Three.js
    initThreeJS();

    // Back to Top Link
    const backToTopLink = document.getElementById('backToTop');

    if (backToTopLink) {
        // Show/hide link based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopLink.classList.add('show');
            } else {
                backToTopLink.classList.remove('show');
            }
        });
    }

    // Form submission
    const contactForm = document.getElementById('contactForm');
    const successMessage = document.getElementById('successMessage');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validate form
            const name = document.getElementById('name').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const email = document.getElementById('email').value.trim();
            const message = document.getElementById('message').value.trim();

            // Simple validation
            if (!name || !phone || !email || !message) {
                alert('Please fill out all fields.');
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }

            // Validate phone format (basic)
            const phoneRegex = /^[0-9\-+() ]{10,}$/;
            if (!phoneRegex.test(phone)) {
                alert('Please enter a valid phone number.');
                return;
            }

            // Show success message
            successMessage.classList.remove('d-none');
            contactForm.reset();

            // Hide success message after 5 seconds
            setTimeout(() => {
                successMessage.classList.add('d-none');
            }, 5000);
        });
    }

    // Smooth active link highlighting
    const navLinks = document.querySelectorAll('#navbar .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
});
