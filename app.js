// Configuración de la escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// Configuración de la cámara
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  1,
  10000
);
camera.position.set(0, 0, 1000);

// Configuración del renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Luces
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(100, 100, 100);
scene.add(directionalLight);

// Controles de cámara (OrbitControls)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.zoomSpeed = 1.2;
controls.panSpeed = 0.8;

// Escalado de coordenadas
const scale = 50000;
const lonRef = -101.1744;
const latRef = 22.2393;

// Conversión de coordenadas geográficas a coordenadas 3D
function convertGeoToXY(lon, lat) {
  return {
    x: (lon - lonRef) * scale,
    y: (lat - latRef) * scale,
  };
}

// Función para cargar archivos GeoJSON externos
function loadGeoJSON(filePath) {
  fetch(filePath)
    .then((response) => response.json())
    .then((data) => {
      console.log("Cargando datos desde:", filePath);
      addGeoJSONToScene(data);
    })
    .catch((error) => console.error("Error al cargar GeoJSON:", error));
}

// Función para agregar datos GeoJSON a la escena
function addGeoJSONToScene(geojson) {
  geojson.features.forEach((feature) => {
    if (!feature.geometry || !feature.geometry.type) return;

    const type = feature.geometry.type;
    const coords = feature.geometry.coordinates;
    let object;

    if (type === "Point") {
      const pointXY = convertGeoToXY(coords[0], coords[1]);
      const geometry = new THREE.SphereGeometry(10, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      object = new THREE.Mesh(geometry, material);
      object.position.set(pointXY.x, pointXY.y, 0);
    } else if (type === "LineString") {
      const points = coords.map((coord) => {
        const pt = convertGeoToXY(coord[0], coord[1]);
        return new THREE.Vector3(pt.x, pt.y, 0);
      });
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
      object = new THREE.Line(geometry, material);
    } else if (type === "Polygon") {
      const ring = coords[0];
      const shape = new THREE.Shape();
      const firstPt = convertGeoToXY(ring[0][0], ring[0][1]);
      shape.moveTo(firstPt.x, firstPt.y);
      for (let i = 1; i < ring.length; i++) {
        const pt = convertGeoToXY(ring[i][0], ring[i][1]);
        shape.lineTo(pt.x, pt.y);
      }
      const extrudeSettings = { depth: 50, bevelEnabled: false };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide,
      });
      object = new THREE.Mesh(geometry, material);
    }

    if (object) {
      object.userData.type = type;
      scene.add(object);
    }
  });

  toggleVisibility();
}

// Función para gestionar la visibilidad de los objetos
function toggleVisibility() {
  scene.children.forEach((object) => {
    if (object.userData.type === "Point") {
      object.visible = document.getElementById("showPoints").checked;
    } else if (object.userData.type === "LineString") {
      object.visible = document.getElementById("showLines").checked;
    } else if (object.userData.type === "Polygon") {
      object.visible = document.getElementById("showPolygons").checked;
    }
  });
}

// Eventos para manejar la visibilidad
document
  .getElementById("showPoints")
  .addEventListener("change", toggleVisibility);
document
  .getElementById("showLines")
  .addEventListener("change", toggleVisibility);
document
  .getElementById("showPolygons")
  .addEventListener("change", toggleVisibility);

// Cargar los archivos GeoJSON
loadGeoJSON("data/sample_points.geojson");
loadGeoJSON("data/sample_features.geojson");

// Bucle de animación
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// Ajuste de la ventana en caso de redimensionamiento
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
