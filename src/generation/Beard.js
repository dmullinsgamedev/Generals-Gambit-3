import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';

// Generate a rigid, blocky, stylized beard (no skinning)
export function generateBlockyBeard(manBones) {
  const numSpikes = 10;
  const arc = Math.PI * .6;
  const jawRadius = 0.12;
  const width = 0.32;
  const baseHeight = 0.04;
  const spikeMin = 0.02;
  const spikeMax = 0.12;
  const color = 0xb97a56;

  // Use mannequin proportions for smart placement
  const headRadius = 0.11; // from PROPS.head.r
  const neckHeight = 0.06; // from PROPS.neck.h
  // Place beard right under the chin, close to face
  const beardY = 0.05; // move up relative to head
  const beardZ = headRadius * 0.62; // slightly closer to face

  const group = new THREE.Group();
  for (let i = 0; i < numSpikes; i++) {
    const u = (i + 0.5) / numSpikes;
    const theta = Math.PI/2 - arc/2 + u * arc;
    const x = Math.cos(theta) * jawRadius;
    const z = Math.sin(theta) * jawRadius + 0.08;
    const spikeLen = spikeMin + Math.random() * (spikeMax - spikeMin);
    // Create a triangular prism (blocky spike)
    const shape = new THREE.Shape();
    shape.moveTo(-0.018, 0);
    shape.lineTo(0.018, 0);
    shape.lineTo(0, -spikeLen);
    shape.lineTo(-0.018, 0);
    const extrudeSettings = { depth: 0.025, bevelEnabled: false };
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.15, roughness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, -baseHeight, z);
    mesh.rotation.y = -theta;
    group.add(mesh);
  }
  // Remove manual group.position.set; positioning is handled by ClothingManager
  manBones.head.add(group);
  return { mesh: group, bones: {} };
} 