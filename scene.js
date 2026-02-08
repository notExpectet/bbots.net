import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const container = document.getElementById('model-container');
const loadingIndicator = document.getElementById('loading-indicator');

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

// Camera setup (Z=2.0 for default zoom, as requested)
const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(0, 0, 2.0);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// REMOVED: renderer.outputColorSpace = THREE.SRGBColorSpace; (Reverting to default as it worked before)
container.appendChild(renderer.domElement);

// Lights (Restoring setup from when it worked: Step 156)
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Load Model
const loader = new GLTFLoader();
const modelUrl = 'https://raw.githubusercontent.com/notExpectet/bodensee_bots_public/main/30.1.2026.glb';

let modelMesh = null;
let baseRotationY = Math.PI / 2;
let mouseX = 0;
let mouseY = 0;
let isHovering = false;

// Mouse Tracking
function updateMouse(x, y) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    mouseX = (x - cx) / cx;
    mouseY = (y - cy) / cy;
}

document.addEventListener('mousemove', e => updateMouse(e.clientX, e.clientY));
document.addEventListener('touchmove', e => {
    if (e.touches.length > 0) updateMouse(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

container.addEventListener('mouseenter', () => isHovering = true);
container.addEventListener('mouseleave', () => isHovering = false);

loader.load(modelUrl, (gltf) => {
    const model = gltf.scene;
    modelMesh = model;

    // Center Model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);

    // Initial Orientation
    model.rotation.y = baseRotationY;

    // Slight Offset
    model.position.y += 0.05;

    // NO MATERIAL OVERRIDES HERE - Texture should load naturally

    scene.add(model);
    loadingIndicator.style.display = 'none';

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        // Parallax & Interactive Logic
        const intensity = isHovering ? 0.8 : 0.3;

        const targetRotY = baseRotationY + (mouseX * intensity);
        const targetRotX = (mouseY * intensity * 0.5);

        // Interpolation
        model.rotation.y += (targetRotY - model.rotation.y) * 0.05;
        model.rotation.x += (targetRotX - model.rotation.x) * 0.05;

        // Scale Logic
        const targetScale = isHovering ? 1.15 : 1.0;
        const currentScale = model.scale.x;
        const newScale = currentScale + (targetScale - currentScale) * 0.1;
        model.scale.set(newScale, newScale, newScale);

        renderer.render(scene, camera);
    }
    animate();

}, undefined, (error) => {
    console.error(error);
    loadingIndicator.textContent = 'Error loading model';
    loadingIndicator.style.color = 'red';
});

// Handle Resize
window.addEventListener('resize', () => {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});

// Initial resize
window.dispatchEvent(new Event('resize'));
