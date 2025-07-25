import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { makeFace, randomEmotion } from './faceUtils.js';

function makeHead(y, color, size=0.15) {
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(size, 12, 12),
    new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.7 })
  );
  head.position.y = y;
  return head;
}
function makeTorso(y, color, rTop=0.16, rBot=0.18, h=0.32, seg=6) {
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBot, h, seg),
    new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.7 })
  );
  torso.position.y = y;
  return torso;
}
function makeArm(x, y, z, color, upper=true, rotZ=0) {
  const geo = upper ? new THREE.CylinderGeometry(0.04, 0.04, 0.24, 5) : new THREE.CylinderGeometry(0.035, 0.035, 0.18, 5);
  const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.7 });
  const arm = new THREE.Mesh(geo, mat);
  arm.position.set(x, y, z);
  arm.rotation.z = rotZ;
  return arm;
}
function makeLeg(x, y, color) {
  const leg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.24, 5),
    new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.4 })
  );
  leg.position.set(x, y, 0);
  return leg;
}
function makeHand(x, y, color) {
  const hand = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.09, 0.09),
    new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.8 })
  );
  hand.position.set(x, y, 0);
  return hand;
}
function makeFoot(x, y, color) {
  const foot = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.07, 0.13),
    new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.8 })
  );
  foot.position.set(x, y, 0.04);
  return foot;
}

export function generateGoblinChiefMesh() {
  const green = 0x228B22, brown = 0x8B5A2B, gold = 0xFFD700, red = 0xB22222;
  const group = new THREE.Group();
  
  // Torso (OSRS style - wider)
  group.add(makeTorso(0.81, brown, 0.16, 0.18, 0.32, 6));
  
  // Head (OSRS style - larger)
  group.add(makeHead(1.18, green, 0.15));
  // Expressive face
  makeFace(group, 0, 1.18, 0.13, {
    emotion: randomEmotion('mischievous'),
    browColor: brown,
    scale: 1.1
  });
  
  // Pointed ears (bigger)
  for (let i = -1; i <= 1; i += 2) {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.03, 0.12, 6),
      new THREE.MeshStandardMaterial({ color: green, metalness: 0.1, roughness: 0.7 })
    );
    ear.position.set(0.11 * i, 1.24, 0);
    ear.rotation.z = i * Math.PI / 5;
    group.add(ear);
  }
  
  // Headdress (chunkier)
  const headdress = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.19, 0.07, 8),
    new THREE.MeshStandardMaterial({ color: gold, metalness: 0.7, roughness: 0.3 })
  );
  headdress.position.y = 1.21;
  group.add(headdress);
  
  // Arms (OSRS style - thicker)
  for (let i = -1; i <= 1; i += 2) {
    group.add(makeArm(0.19 * i, 1.01, 0, green, true, i * Math.PI / 8));
    group.add(makeArm(0.25 * i, 0.78, 0, green, false, i * Math.PI / 10));
    group.add(makeHand(0.31 * i, 0.65, green));
  }
  
  // Spear (oversized)
  const spear = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6),
    new THREE.MeshStandardMaterial({ color: brown, metalness: 0.2, roughness: 0.7 })
  );
  shaft.position.y = 0.4;
  spear.add(shaft);
  const spearhead = new THREE.Mesh(
    new THREE.ConeGeometry(0.03, 0.13, 6),
    new THREE.MeshStandardMaterial({ color: gold, metalness: 0.7, roughness: 0.3 })
  );
  spearhead.position.y = 0.86;
  spear.add(spearhead);
  spear.position.set(0.41, 0.65, 0.07);
  spear.rotation.z = Math.PI / 6;
  group.add(spear);
  
  // Belt
  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.185, 0.185, 0.04, 6),
    new THREE.MeshStandardMaterial({ color: gold, metalness: 0.7, roughness: 0.3 })
  );
  belt.position.y = 0.65;
  group.add(belt);
  
  // Legs (OSRS style - thicker)
  for (let i = -1; i <= 1; i += 2) {
    group.add(makeLeg(0.11 * i, 0.23, green));
    group.add(makeFoot(0.11 * i, 0.01, brown));
  }
  
  group.position.y = 0.0;
  return group;
} 