// --- Configuración de la escena, cámara y renderizador ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// Cámara con perspectiva adecuada
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  10000
);
camera.position.set(0, 0, 1000);

// Renderizador y ajustes
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Luces
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(100, 100, 100);
scene.add(directionalLight);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Suaviza el movimiento
controls.dampingFactor = 0.05;
controls.rotateSpeed = 1.0;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;

// --- Escala y referencia de coordenadas ---
const scale = 50000;
const lonRef = -101.1744;
const latRef = 22.2393;

// Función para convertir coordenadas geográficas a coordenadas 3D
function convertGeoToXY(lon, lat) {
  return {
    x: (lon - lonRef) * scale,
    y: (lat - latRef) * scale,
  };
}

// Función para agregar datos GeoJSON a la escena
function addGeoJSONToScene(geojson) {
  geojson.features.forEach((feature) => {
    if (!feature.geometry || !feature.geometry.type) {
      console.error("Error: La feature no tiene geometría definida.", feature);
      return;
    }

    const type = feature.geometry.type;
    const coords = feature.geometry.coordinates;

    if (type === "Point") {
      const pointXY = convertGeoToXY(coords[0], coords[1]);
      const geometry = new THREE.SphereGeometry(15, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(pointXY.x, pointXY.y, 0);
      scene.add(sphere);
    } else if (type === "LineString") {
      const points = coords.map((coord) => {
        const pt = convertGeoToXY(coord[0], coord[1]);
        return new THREE.Vector3(pt.x, pt.y, 0);
      });
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: 2,
      });
      const line = new THREE.Line(geometry, material);
      scene.add(line);
    } else if (type === "Polygon") {
      const ring = coords[0];
      const shape = new THREE.Shape();
      const firstPt = convertGeoToXY(ring[0][0], ring[0][1]);
      shape.moveTo(firstPt.x, firstPt.y);
      for (let i = 1; i < ring.length; i++) {
        const pt = convertGeoToXY(ring[i][0], ring[i][1]);
        shape.lineTo(pt.x, pt.y);
      }
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide,
        opacity: 0.5,
        transparent: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
    }
  });
}

// Función para cargar archivos GeoJSON externos
function loadGeoJSON(filePath) {
  fetch(filePath)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al cargar " + filePath);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Datos cargados de " + filePath, data);
      addGeoJSONToScene(data);
    })
    .catch((error) => console.error("Error:", error));
}

// Llamadas para cargar archivos GeoJSON externos
loadGeoJSON("data/sample_points.geojson");
loadGeoJSON("data/sample_features.geojson");

// --- Loop de Animación ---
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// --- Ajuste de la ventana en caso de redimensionamiento ---
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
