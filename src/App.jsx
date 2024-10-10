import React, { useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

function App() {
  useEffect(() => {
    // Configurazione della scena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // Sfondo scuro

    // Configurazione della camera
    const camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0.5, 2.5, 2);
    camera.rotation.set(0.1659382034508193, 0, -0.06876302928973241);

    // Configurazione del renderer
    let pixelRatio = 0.3; // Pixel ratio iniziale
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      precision: 'low',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(pixelRatio);
    renderer.shadowMap.enabled = true; // Abilita le ombre
    document.body.appendChild(renderer.domElement);

    // Creiamo una luce soffusa che seguirà il mouse
    const mouseLight = new THREE.PointLight(0xffffff, 0.5, 100); // Luce soffusa con intensità bassa
    mouseLight.castShadow = false;
    scene.add(mouseLight);

    // Funzione per aggiornare il pixel ratio e la posizione della luce in base al movimento del mouse
    const updateMouseLightAndPixelRatio = (event) => {
      const mouseX = event.clientX; // Posizione del mouse lungo l'asse X
      const mouseY = event.clientY; // Posizione del mouse lungo l'asse Y
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Calcola il pixel ratio in base alla posizione del mouse tra 0.3 e 1
      pixelRatio = 0.3 + ((mouseX / windowWidth) * (1 - 0.3));
      
      // Limita il pixel ratio tra 0.3 e 1
      pixelRatio = Math.max(0.3, Math.min(1, pixelRatio));

      // Aggiorna il pixel ratio nel renderer
      renderer.setPixelRatio(pixelRatio);

      // Aggiorna la posizione della luce soffusa
      const normalizedX = (mouseX / windowWidth) * 2 - 1; // Normalizzazione tra -1 e 1
      const normalizedY = -(mouseY / windowHeight) * 2 + 1; // Inverti per l'asse Y
      mouseLight.position.set(normalizedX * 5, normalizedY * 5, 5); // Posizione della luce soffusa
      
      renderer.render(scene, camera); // Renderizza la scena con il nuovo pixel ratio e la nuova luce
    };

    // Aggiunge un event listener per rilevare il movimento del mouse
    window.addEventListener('mousemove', updateMouseLightAndPixelRatio);

    // Luce ambientale bianca più forte
    const ambientLight = new THREE.AmbientLight(0xffffff, 10.0); // Luce ambientale più forte
    scene.add(ambientLight);

    // Prima luce rossa (orbita lateralmente attorno alla statua)
    const orbitingLight1 = new THREE.PointLight(0xFFC0CB, 1000, 500); // Aumentata la potenza della luce
    orbitingLight1.position.set(10, 10, 10); // Posizione iniziale
    orbitingLight1.castShadow = true; // Permette la proiezione delle ombre se necessario
    scene.add(orbitingLight1);

    // Seconda luce rossa (orbita verticalmente sotto la statua)
    const orbitingLight2 = new THREE.PointLight(0xFF0000, 1000, 500); // Luce rossa potente
    orbitingLight2.position.set(-10, -10, 10); // Posizione iniziale sotto la statua
    orbitingLight2.castShadow = true; // Permette la proiezione delle ombre
    scene.add(orbitingLight2);

    let angle1 = 0; // Variabile per controllare l'angolo di rotazione della prima luce
    let angle2 = 45; // Variabile per controllare l'angolo di rotazione della seconda luce

    // Variabile per il modello da animare
    let model = null;

    // Caricamento della texture del marmo
    const textureLoader = new THREE.TextureLoader();
    const marbleTexture = textureLoader.load('/assets/mm.jpg', () => {
      renderer.render(scene, camera); // Render iniziale
    });

    // Configurazione e utilizzo del DRACOLoader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('../node_modules/three/examples/jsm/libs/draco/gltf/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    // Caricamento del modello 3D con DRACO
    loader.load(
      '/assets/compri.glb',
      function (gltf) {
        model = gltf.scene; // Salviamo il modello per l'animazione
        model.traverse(function (child) {
          if (child.isMesh) {
            // Disabilita le ombre
            child.castShadow = false;
            child.receiveShadow = true;

            // Applica il materiale ottimizzato
            child.material = new THREE.MeshPhysicalMaterial({
              map: marbleTexture,
              metalness: 0.5,
              roughness: 0.3,
              reflectivity: 0.5,
            });

            child.material.map.encoding = THREE.sRGBEncoding;
            child.material.needsUpdate = true;
          }
        });

        // Scala e posizione della statua
        model.scale.set(0.05, 0.05, 0.05);
        model.position.set(-0.5, -0.2, -0.5); // Modifica questi valori per centrare meglio il modello

        scene.add(model);
        console.log('Modello caricato con successo:', gltf);
      },
      undefined,
      function (error) {
        console.error('Errore nel caricamento del modello:', error);
      }
    );

    // Funzione di animazione
    function animate() {
      requestAnimationFrame(animate);

      // Rotazione della prima luce attorno alla statua (su un piano orizzontale)
      angle1 += 0.015; // Aumentata leggermente la velocità
      const radius1 = 10; // Raggio dell'orbita
      orbitingLight1.position.x = radius1 * Math.cos(angle1);
      orbitingLight1.position.z = radius1 * Math.sin(angle1);
      orbitingLight1.position.y = 5 + 2 * Math.sin(angle1 * 0.5); // Piccola variazione in altezza

      // Rotazione della seconda luce sotto la statua (su un piano verticale)
      angle2 += 0.02; // Aumentata la velocità della seconda luce
      const radius2 = 7; // Raggio dell'orbita della seconda luce
      orbitingLight2.position.x = radius2 * Math.sin(angle2); // Movimento orizzontale
      orbitingLight2.position.y = -5 + 5 * Math.sin(angle2); // Movimento verticale sotto la statua
      orbitingLight2.position.z = radius2 * Math.cos(angle2);

      // Se il modello è stato caricato, ruotiamo su se stesso
      if (model) {
        model.rotation.y += 0.001; // Rotazione lenta e fluida sull'asse Y
      }

      renderer.render(scene, camera);
    }

    animate(); // Inizia animazione

    // Pulizia alla disinstallazione del componente
    return () => {
      window.removeEventListener('mousemove', updateMouseLightAndPixelRatio); // Rimuovi il listener del mouse
      document.body.removeChild(renderer.domElement);
    };
  }, []);

  return null;
}

export default App;
