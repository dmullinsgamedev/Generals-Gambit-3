import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
import { generateBlockyBeard } from './Beard.js';

/**
 * ClothingManager - Handles clothing positioning, attachment, and animation
 * Uses character anatomy to position clothing properly without hardcoded values
 */
// Data-driven mapping for body part visibility per clothing type
const CLOTHING_HIDE_MAP = {
  robe: [
    'abdomen', 'pelvis',
    'upperLegs.left', 'upperLegs.right',
    'lowerLegs.left', 'lowerLegs.right'
  ],
  cloak: [
    'torso', 'abdomen', 'pelvis',
    'upperLegs.left', 'upperLegs.right',
  ]

  // Add more clothing types as needed
};

export class ClothingManager {
  constructor(character) {
    this.character = character;
    this.clothing = new Map(); // type -> { mesh, bones, attachmentPoint }
    this.clothingBones = new Map(); // clothing bone references for animation
  }

  /**
   * Add clothing to the character using anatomy-aware positioning
   */
  addClothing(type, clothingData) {
    if (this.clothing.has(type)) {
      this.removeClothing(type);
    }

    const clothing = this.createClothing(type, clothingData);
    const position = this.calculateClothingPosition(type, clothing);
    const attachmentPoint = this.getAttachmentPoint(type);
    
    // Position and attach the clothing
    if (type === 'robe') {
      // For robe skinned mesh, position the chest bone (now at center like zubon)
      clothing.bones.chest.position.y = position.y;
    } else if (type === 'zubon') {
      // For zubon skinned mesh, position the waist bone
      clothing.bones.waist.position.y = position.y;
    } else {
      // For regular meshes (hat, staff), position the mesh directly
      clothing.mesh.position.copy(position);
    }
    
    attachmentPoint.add(clothing.mesh);
    
    // Store for management
    this.clothing.set(type, {
      mesh: clothing.mesh,
      bones: clothing.bones,
      attachmentPoint: attachmentPoint,
      type: type
    });

    // Store bones for animation
    Object.values(clothing.bones).forEach(bone => {
      this.clothingBones.set(bone, { type, bone });
    });

    // Auto-hide body parts that would be covered by this clothing
    this.autoHideBodyParts(type);

    return clothing;
  }

  /**
   * Remove clothing from the character
   */
  removeClothing(type) {
    const clothing = this.clothing.get(type);
    if (clothing) {
      clothing.attachmentPoint.remove(clothing.mesh);
      
      // Remove bones from animation tracking
      Object.values(clothing.bones).forEach(bone => {
        this.clothingBones.delete(bone);
      });
      
      this.clothing.delete(type);
      
      // Auto-show body parts that were hidden by this clothing
      this.autoShowBodyParts(type);
    }
  }

  /**
   * Calculate clothing position based on character anatomy
   */
  calculateClothingPosition(type, clothing) {
    const characterBones = this.character.bones;
    const headRadius = 0.11; // Common head radius for headwear
    
    switch (type) {
      case 'robe':
        // Position robe to start at the torso and cover down to feet
        const torsoOffset = characterBones.torso.position.y;
        // Position robe to start at torso level
        return new THREE.Vector3(0, torsoOffset, 0);
        
      case 'zubon':
        // Position zubon to start at the waist/abdomen
        const waistOffset = characterBones.abdomen.position.y;
        return new THREE.Vector3(0, waistOffset - 0.05, 0);
        
      case 'hat':
        // Position hat on top of head
        return new THREE.Vector3(0, headRadius + 0.02 - 0.1, 0);
        
      case 'crown':
        // Position crown on top of head
        return new THREE.Vector3(0, headRadius + 0.02 - 0.1, 0);
        
      case 'halo':
        // Position halo floating above head
        return new THREE.Vector3(0, headRadius + 0.15, 0);
        
      case 'helmet':
        // Position helmet on head
        return new THREE.Vector3(0, headRadius + 0.02 - 0.1, 0);
        
      case 'headband':
        // Position headband on head
        return new THREE.Vector3(0, headRadius + 0.02 - 0.1, 0);
        
      case 'samuraiHat':
        // Position samuraiHat just above head
        return new THREE.Vector3(0, headRadius + 0.04, 0);
        
      case 'staff':
        // Position staff in hand
        return new THREE.Vector3(0, -0.18, 0.04);
        
      case 'cloak':
        // Position cloak to start at the torso and drape down
        const torsoOffsetCloak = characterBones.torso.position.y;
        return new THREE.Vector3(0, torsoOffsetCloak, 0);
        
      case 'cape':
        // Position cape to start at the torso and drape down
        const torsoOffsetCape = characterBones.torso.position.y;
        return new THREE.Vector3(0, torsoOffsetCape + 0.04, -0.04);
        
      case 'beard':
        // Move beard up, just below the head
        return new THREE.Vector3(0, 0.21, -.10);
        
      default:
        return new THREE.Vector3(0, 0, 0);
    }
  }

  /**
   * Get the appropriate attachment point for clothing type
   */
  getAttachmentPoint(type) {
    const characterBones = this.character.bones;
    
    switch (type) {
      case 'robe':
        return characterBones.torso;
      case 'zubon':
        return characterBones.abdomen;
      case 'hat':
        return characterBones.head;
      case 'crown':
        return characterBones.head;
      case 'halo':
        return characterBones.head;
      case 'helmet':
        return characterBones.head;
      case 'headband':
        return characterBones.head;
      case 'samuraiHat':
        return characterBones.head;
      case 'staff':
        return characterBones.hands.right;
      case 'cloak':
        return characterBones.torso;
      case 'cape':
        return characterBones.torso;
      default:
        return characterBones.torso;
    }
  }

  /**
   * Get world position of a bone
   */
  getBoneWorldPosition(bone) {
    const worldPosition = new THREE.Vector3();
    bone.getWorldPosition(worldPosition);
    return worldPosition;
  }

  /**
   * Create clothing mesh and bones based on type
   */
  createClothing(type, data) {
    switch (type) {
      case 'robe':
        return this.createRobe(data);
      case 'zubon':
        return this.createZubon(data);
      case 'hat':
        return this.createHat(data);
      case 'crown':
        return this.createCrown(data);
      case 'halo':
        return this.createHalo(data);
      case 'helmet':
        return this.createHelmet(data);
      case 'headband':
        return this.createHeadband(data);
      case 'staff':
        return this.createStaff(data);
      case 'samuraiHat':
        return this.createSamuraiHat(data);
      case 'cloak':
        return this.createCloak(data);
      case 'cape':
        return this.createCape(data);
      case 'beard':
        return generateBlockyBeard(this.character.bones);
      default:
        throw new Error('Unknown clothing type: ' + type);
    }
  }

  /**
   * Create a robe with proper skinned mesh setup
   */
  createRobe(data = {}) {
    const height = data.height || 0.55;
    const radiusTop = data.radiusTop || 0.14;
    const radiusWaist = data.radiusWaist || 0.11;
    const radiusBottom = data.radiusBottom || 0.25; // increased to prevent leg clipping
    const color = data.color || 0x7c3aed;

    // Create geometry with waist tapering
    const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 20, 12, true);
    
    // Taper waist
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < height/2 - height/3 && y > -height/2 + height/3) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const r = Math.sqrt(x*x + z*z);
        const scale = radiusWaist / r;
        pos.setX(i, x * scale);
        pos.setZ(i, z * scale);
      }
    }
    pos.needsUpdate = true;

    // Create bones for skinned mesh
    const bones = [];
    const chest = new THREE.Bone();
    chest.position.y = .25; // Position to start robe at neck/shoulders level
    bones.push(chest);
    
    const abdomen = new THREE.Bone();
    abdomen.position.y = -height / 3; // Position at lower third of robe
    bones.push(abdomen);
    
    const leftLeg = new THREE.Bone();
    leftLeg.position.set(-0.12, -height / 2, 0); // moved further left to account for thigh width
    bones.push(leftLeg);
    
    const rightLeg = new THREE.Bone();
    rightLeg.position.set(0.12, -height / 2, 0); // moved further right to account for thigh width
    bones.push(rightLeg);
    
    chest.add(abdomen);
    abdomen.add(leftLeg);
    abdomen.add(rightLeg);

    // Set up skinning weights
    this.setupRobeSkinning(geo, height);

    // Create skinned mesh
    const mat = new THREE.MeshStandardMaterial({ 
      color: color, 
      metalness: 0.3, 
      roughness: 0.7, 
      side: THREE.DoubleSide, 
      skinning: true 
    });
    
    const mesh = new THREE.SkinnedMesh(geo, mat);
    const skeleton = new THREE.Skeleton(bones);
    mesh.add(chest);
    mesh.bind(skeleton);

    // Attach robe bones to character bones
    this.character.bones.torso.add(chest);
    this.character.bones.abdomen.add(abdomen);
    this.character.bones.upperLegs.left.add(leftLeg);
    this.character.bones.upperLegs.right.add(rightLeg);

    return { 
      mesh, 
      bones: { chest, abdomen, leftLeg, rightLeg },
      height: height
    };
  }

  /**
   * Create zubon (pants) with proper skinned mesh setup
   */
  createZubon(data = {}) {
    const height = data.height || 0.35;
    const radiusTop = data.radiusTop || 0.12;
    const radiusWaist = data.radiusWaist || 0.10;
    const radiusBottom = data.radiusBottom || 0.08;
    const color = data.color || 0x2d3748;

    // Create geometry with waist tapering
    const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 20, 12, true);
    
    // Taper waist
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < height/2 - height/3 && y > -height/2 + height/3) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const r = Math.sqrt(x*x + z*z);
        const scale = radiusWaist / r;
        pos.setX(i, x * scale);
        pos.setZ(i, z * scale);
      }
    }
    pos.needsUpdate = true;

    // Create bones for skinned mesh
    const bones = [];
    const waist = new THREE.Bone();
    waist.position.y = .3;
    bones.push(waist);
    
    const leftLeg = new THREE.Bone();
    leftLeg.position.set(-0.12, -height/2, 0); // moved further left to account for thigh width
    bones.push(leftLeg);
    
    const rightLeg = new THREE.Bone();
    rightLeg.position.set(0.12, -height/2, 0); // moved further right to account for thigh width
    bones.push(rightLeg);
    
    waist.add(leftLeg);
    waist.add(rightLeg);

    // Set up skinning weights
    this.setupZubonSkinning(geo, height);

    // Create skinned mesh
    const mat = new THREE.MeshStandardMaterial({ 
      color: color, 
      metalness: 0.1, 
      roughness: 0.8, 
      side: THREE.DoubleSide, 
      skinning: true 
    });
    
    const mesh = new THREE.SkinnedMesh(geo, mat);
    const skeleton = new THREE.Skeleton(bones);
    mesh.add(waist);
    mesh.bind(skeleton);
    
    // Position the mesh so it extends upward from the waist bone to cover the legs
    mesh.position.y = height / 2;

    // Attach zubon bones to character bones
    this.character.bones.abdomen.add(waist);
    this.character.bones.upperLegs.left.add(leftLeg);
    this.character.bones.upperLegs.right.add(rightLeg);

    return { 
      mesh, 
      bones: { waist, leftLeg, rightLeg },
      height: height
    };
  }

  /**
   * Set up skinning weights for robe - improved to reduce clipping
   */
  setupRobeSkinning(geo, height) {
    const skinIndices = [];
    const skinWeights = [];
    
    for (let i = 0; i < geo.attributes.position.count; i++) {
      const y = geo.attributes.position.getY(i);
      const x = geo.attributes.position.getX(i);
      const z = geo.attributes.position.getZ(i);
      
      // Calculate distance from center to determine leg influence
      const distanceFromCenter = Math.sqrt(x*x + z*z);
      
      // Top section: mostly chest with some abdomen blend
      if (y > height/2 - 0.12) {
        skinIndices.push(0, 1, 0, 0);
        skinWeights.push(0.8, 0.2, 0, 0);
      } 
      // Upper mid: chest/abdomen blend
      else if (y > height/6) {
        skinIndices.push(0, 1, 0, 0);
        skinWeights.push(0.6, 0.4, 0, 0);
      } 
      // Waist area: mostly abdomen
      else if (y > -height/6) {
        skinIndices.push(1, 0, 0, 0);
        skinWeights.push(0.9, 0.1, 0, 0);
      } 
      // Lower mid: abdomen/legs blend with better leg separation (thigh area)
      else if (y > -height/2 + 0.15) {
        if (x < -0.08) { // Left leg area - wider threshold for thighs
          skinIndices.push(2, 1, 0, 0);
          skinWeights.push(0.85, 0.15, 0, 0);
        } else if (x > 0.08) { // Right leg area - wider threshold for thighs
          skinIndices.push(3, 1, 0, 0);
          skinWeights.push(0.85, 0.15, 0, 0);
        } else { // Center area - wider center zone
          skinIndices.push(1, 0, 0, 0);
          skinWeights.push(0.8, 0.2, 0, 0);
        }
      } 
      // Bottom: mostly legs with better separation
      else {
        if (x < -0.06) { // Left leg - wider threshold
          skinIndices.push(2, 1, 0, 0);
          skinWeights.push(0.95, 0.05, 0, 0);
        } else if (x > 0.06) { // Right leg - wider threshold
          skinIndices.push(3, 1, 0, 0);
          skinWeights.push(0.95, 0.05, 0, 0);
        } else { // Center between legs - wider center zone
          skinIndices.push(1, 0, 0, 0);
          skinWeights.push(0.7, 0.3, 0, 0);
        }
      }
    }
    
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  }

  /**
   * Set up skinning weights for zubon - improved to reduce clipping
   */
  setupZubonSkinning(geo, height) {
    const skinIndices = [];
    const skinWeights = [];
    
    for (let i = 0; i < geo.attributes.position.count; i++) {
      const y = geo.attributes.position.getY(i);
      const x = geo.attributes.position.getX(i);
      const z = geo.attributes.position.getZ(i);
      
      // Calculate distance from center to determine leg influence
      const distanceFromCenter = Math.sqrt(x*x + z*z);
      
      // Top section: mostly waist
      if (y > height/2 - 0.08) {
        skinIndices.push(0, 0, 0, 0);
        skinWeights.push(0.9, 0.1, 0, 0);
      } 
      // Upper mid: waist/legs blend
      else if (y > height/6) {
        if (x < -0.03) { // Left leg area
          skinIndices.push(1, 0, 0, 0);
          skinWeights.push(0.6, 0.4, 0, 0);
        } else if (x > 0.03) { // Right leg area
          skinIndices.push(2, 0, 0, 0);
          skinWeights.push(0.6, 0.4, 0, 0);
        } else { // Center area
          skinIndices.push(0, 0, 0, 0);
          skinWeights.push(0.8, 0.2, 0, 0);
        }
      } 
      // Lower mid: more leg influence
      else if (y > -height/6) {
        if (x < -0.02) { // Left leg area
          skinIndices.push(1, 0, 0, 0);
          skinWeights.push(0.8, 0.2, 0, 0);
        } else if (x > 0.02) { // Right leg area
          skinIndices.push(2, 0, 0, 0);
          skinWeights.push(0.8, 0.2, 0, 0);
        } else { // Center area
          skinIndices.push(0, 0, 0, 0);
          skinWeights.push(0.5, 0.5, 0, 0);
        }
      } 
      // Bottom: mostly legs with better separation
      else {
        if (x < -0.01) { // Left leg
          skinIndices.push(1, 0, 0, 0);
          skinWeights.push(0.95, 0.05, 0, 0);
        } else if (x > 0.01) { // Right leg
          skinIndices.push(2, 0, 0, 0);
          skinWeights.push(0.95, 0.05, 0, 0);
        } else { // Center between legs
          skinIndices.push(0, 0, 0, 0);
          skinWeights.push(0.4, 0.6, 0, 0);
        }
      }
    }
    
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  }

  /**
   * Create a hat
   */
  createHat(data = {}) {
    const group = new THREE.Group();
    const color = data.color || 0x7c3aed;
    const brimColor = data.brimColor || 0xFFD700;

    const hatMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.28, 16),
      new THREE.MeshStandardMaterial({ color: color, metalness: 0.3, roughness: 0.7 })
    );
    hatMesh.position.y = 0.19;
    group.add(hatMesh);

    const brimMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 0.022, 18),
      new THREE.MeshStandardMaterial({ color: brimColor, metalness: 0.7, roughness: 0.3 })
    );
    brimMesh.position.y = 0.07;
    group.add(brimMesh);

    group.hatMesh = hatMesh; // for animation
    return { mesh: group, bones: {}, height: 0.28 };
  }

  /**
   * Create a royal crown with jewels
   */
  createCrown(data = {}) {
    const group = new THREE.Group();
    const crownColor = data.crownColor || 0xFFD700; // Gold
    const jewelColors = data.jewelColors || [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff]; // Red, Green, Blue, Yellow, Purple

    // Main crown mesh (similar to hat structure)
    const crownMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: crownColor, metalness: 0.8, roughness: 0.2 })
    );
    crownMesh.position.y = 0.07; // Lower position like hat brim to rest on head
    group.add(crownMesh);

    // Crown spikes/points
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const x = Math.cos(angle) * 0.12;
      const z = Math.sin(angle) * 0.12;
      
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.02, 0.12, 8),
        new THREE.MeshStandardMaterial({ color: crownColor, metalness: 0.8, roughness: 0.2 })
      );
      spike.position.set(x, 0.13, z); // Adjusted to match new crown position
      group.add(spike);

      // Add jewel to each spike
      const jewel = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.015),
        new THREE.MeshStandardMaterial({ 
          color: jewelColors[i % jewelColors.length], 
          roughness: 0.1, 
          metalness: 0.9,
          emissive: jewelColors[i % jewelColors.length],
          emissiveIntensity: 0.3
        })
      );
      jewel.position.set(x, 0.19, z); // Adjusted to match new crown position
      group.add(jewel);
    }

    // Additional decorative jewels around the band
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = Math.cos(angle) * 0.12;
      const z = Math.sin(angle) * 0.12;
      
      const jewel = new THREE.Mesh(
        new THREE.SphereGeometry(0.008, 8, 8),
        new THREE.MeshStandardMaterial({ 
          color: jewelColors[i % jewelColors.length], 
          roughness: 0.1, 
          metalness: 0.9,
          emissive: jewelColors[i % jewelColors.length],
          emissiveIntensity: 0.2
        })
      );
      jewel.position.set(x, 0.11, z); // Adjusted to match new crown position
      group.add(jewel);
    }

    group.crownMesh = crownMesh; // for animation (following hat pattern)
    return { mesh: group, bones: {}, height: 0.27 };
  }

  /**
   * Create a glowing halo
   */
  createHalo(data = {}) {
    const group = new THREE.Group();
    const haloColor = data.haloColor || 0xffff00; // Bright yellow/gold
    const glowIntensity = data.glowIntensity || 0.8;

    // Main halo ring
    const haloMesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.02, 8, 16),
      new THREE.MeshStandardMaterial({ 
        color: haloColor, 
        metalness: 0.9, 
        roughness: 0.1,
        emissive: haloColor,
        emissiveIntensity: glowIntensity
      })
    );
    haloMesh.position.y = -.05; // Float above head
    haloMesh.rotation.x = Math.PI / 2; // Rotate to be horizontal
    group.add(haloMesh);

    // Inner glow ring
    const innerGlow = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.01, 8, 16),
      new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        metalness: 0.9, 
        roughness: 0.1,
        emissive: 0xffffff,
        emissiveIntensity: glowIntensity * 0.7,
        transparent: true,
        opacity: 0.6
      })
    );
    innerGlow.position.y = -.05;
    innerGlow.rotation.x = Math.PI / 2;
    group.add(innerGlow);

    // Outer glow ring
    const outerGlow = new THREE.Mesh(
      new THREE.TorusGeometry(0.17, 0.01, 8, 16),
      new THREE.MeshStandardMaterial({ 
        color: haloColor, 
        metalness: 0.9, 
        roughness: 0.1,
        emissive: haloColor,
        emissiveIntensity: glowIntensity * 0.5,
        transparent: true,
        opacity: 0.4
      })
    );
    outerGlow.position.y = -.05;
    outerGlow.rotation.x = Math.PI / 2;
    group.add(outerGlow);

    group.haloMesh = haloMesh; // for animation (following hat pattern)
    return { mesh: group, bones: {}, height: 0.25 };
  }

  /**
   * Create a Corinthian/Spartan helmet
   */
  createHelmet(data = {}) {
    const group = new THREE.Group();
    const helmetColor = data.helmetColor || 0xcccccc; // Silver-grey
    const crestColor = data.crestColor || 0xff0000; // Bright red

    // Main helmet bowl (Corinthian style - full head coverage)
    const helmetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: helmetColor, metalness: 0.9, roughness: 0.1 })
    );
    helmetMesh.position.y = 0.01; // Moved down to sit on head properly
    group.add(helmetMesh);

    // Nose/mouth guard (vertical piece)
    const noseGuard = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.08, 0.06),
      new THREE.MeshStandardMaterial({ color: helmetColor, metalness: 0.9, roughness: 0.1 })
    );
    noseGuard.position.set(0, 0.01, 0.13); // Adjusted to match helmet position
    group.add(noseGuard);

    // Cheek guards (left and right)
    const leftCheek = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.06, 0.04),
      new THREE.MeshStandardMaterial({ color: helmetColor, metalness: 0.9, roughness: 0.1 })
    );
    leftCheek.position.set(-0.12, 0.01, 0.08); // Adjusted to match helmet position
    leftCheek.rotation.y = Math.PI / 8;
    group.add(leftCheek);

    const rightCheek = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.06, 0.04),
      new THREE.MeshStandardMaterial({ color: helmetColor, metalness: 0.9, roughness: 0.1 })
    );
    rightCheek.position.set(0.12, 0.01, 0.08); // Adjusted to match helmet position
    rightCheek.rotation.y = -Math.PI / 8;
    group.add(rightCheek);

    // Crest base
    const crestBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.02, 0.08),
      new THREE.MeshStandardMaterial({ color: helmetColor, metalness: 0.9, roughness: 0.1 })
    );
    crestBase.position.set(0, 0.07, 0); // Adjusted to match helmet position
    group.add(crestBase);

    // Segmented, curved red crest (blocky mohawk)
    const crestSegments = 10;
    const crestLength = 0.18;
    const crestRadius = 0.08; // how much it curves
    const crestHeight = 0.09;
    const crestWidth = 0.02;
    const arcRadius = 0.13; // height of the rainbow arc
    const yBase = 0.01;     // base height (top of helmet)
    const zBase = 0;        // center of helmet
    for (let i = 0; i < crestSegments; i++) {
      const t = i / (crestSegments - 1);
      const theta = -Math.PI / 2 + t * Math.PI; // from front to back
      const x = 0;
      const y = yBase + Math.sin(theta) * arcRadius;
      const z = zBase + Math.cos(theta) * arcRadius;
      const segment = new THREE.Mesh(
        new THREE.BoxGeometry(crestWidth, crestHeight, 0.08),
        new THREE.MeshStandardMaterial({ color: crestColor, metalness: 0.1, roughness: 0.8 })
      );
      segment.position.set(x, y, z);
      segment.rotation.x = theta;
      group.add(segment);
    }

    group.helmetMesh = helmetMesh; // for animation (following hat pattern)
    return { mesh: group, bones: {}, height: 0.25 };
  }

  /**
   * Create a headband
   */
  createHeadband(data = {}) {
    const group = new THREE.Group();
    const headbandColor = data.headbandColor || 0x8B4513; // Brown

    // Main headband (many thin, wide boxes in a full circle)
    const bandSegments = 24;
    const bandArc = Math.PI * 2; // Full circle
    const bandRadius = 0.135; // Slightly larger than head radius
    const bandY = 0.03; // Lower on the forehead
    const bandZOffset = 0; // Centered on head
    const bandWidth = (bandRadius * bandArc) / bandSegments;
    const bandHeight = 0.035;
    const bandDepth = 0.012;
    const bandColor = headbandColor;
    const bandStart = 0;
    let bandMeshes = [];
    for (let i = 0; i < bandSegments; i++) {
      const angle = bandStart + (i + 0.5) * (bandArc / bandSegments);
      const x = Math.sin(angle) * bandRadius;
      const z = Math.cos(angle) * (bandRadius * 0.7) + bandZOffset;
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(bandWidth, bandHeight, bandDepth),
        new THREE.MeshStandardMaterial({ color: bandColor, metalness: 0.1, roughness: 0.8 })
      );
      band.position.set(x, bandY, z);
      band.rotation.y = angle;
      group.add(band);
      bandMeshes.push(band);
    }

    // Ties (wider, longer, hang down and cross, attached to back of band)
    const tieWidth = 0.045, tieLength = 0.16, tieDepth = 0.012;
    const tieXOffset = 0.01; // bring tops closer together for ^ shape
    const tieY = bandY - 0.09;
    const tieZ = -bandRadius + bandZOffset - 0.01; // Use full radius, small extra offset
    // Left tie
    const leftTie = new THREE.Mesh(
      new THREE.BoxGeometry(tieWidth, tieLength, tieDepth),
      new THREE.MeshStandardMaterial({ color: bandColor, metalness: 0.1, roughness: 0.8 })
    );
    leftTie.position.set(-tieXOffset, tieY, tieZ);
    leftTie.rotation.set(Math.PI / 7, Math.PI / 10, Math.PI / 6); // more outward
    group.add(leftTie);
    // Right tie
    const rightTie = new THREE.Mesh(
      new THREE.BoxGeometry(tieWidth, tieLength, tieDepth),
      new THREE.MeshStandardMaterial({ color: bandColor, metalness: 0.1, roughness: 0.8 })
    );
    rightTie.position.set(tieXOffset, tieY, tieZ);
    rightTie.rotation.set(Math.PI / 7, -Math.PI / 10, -Math.PI / 6); // more outward
    group.add(rightTie);

    // Optional gem/decoration in front (unchanged)
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.008),
      new THREE.MeshStandardMaterial({ 
        color: 0xff0000, 
        roughness: 0.1, 
        metalness: 0.9,
        emissive: 0xff0000,
        emissiveIntensity: 0.2
      })
    );
    gem.position.set(0, bandY, bandRadius * 0.55 + bandZOffset + 0.012);
    group.add(gem);

    group.headbandMesh = bandMeshes[Math.floor(bandMeshes.length / 2)]; // for animation (center segment)
    return { mesh: group, bones: {}, height: bandY };
  }

  /**
   * Create a staff
   */
  createStaff(data = {}) {
    const color = data.color || 0x8B5A2B;
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.55, 10),
      new THREE.MeshStandardMaterial({ color: color, metalness: 0.2, roughness: 0.7 })
    );
    mesh.position.set(0, -0.18, 0.04);
    mesh.rotation.set(-Math.PI / 8, Math.PI / 12, Math.PI / 20);
    return { mesh, bones: {}, height: 0.55 };
  }

  /**
   * Create a samurai conical hat (rice hat)
   */
  createSamuraiHat(data = {}) {
    const group = new THREE.Group();
    const hatColor = data.hatColor || 0x222222; // Dark color
    const radius = data.radius || 0.2; // Slightly larger than head
    const height = data.height || 0.175;
    const segments = 32;

    // Main conical hat
    const hatMesh = new THREE.Mesh(
      new THREE.ConeGeometry(radius, height, segments, 1, true),
      new THREE.MeshStandardMaterial({ color: hatColor, metalness: 0.3, roughness: 0.7 })
    );
    hatMesh.position.y = -0.02; // Sits just above the head
    group.add(hatMesh);

    group.samuraiHatMesh = hatMesh;
    return { mesh: group, bones: {}, height: height };
  }

  /**
   * Create a cloak with proper skinned mesh setup
   */
  createCloak(data = {}) {
    const height = data.height || 0.75;
    const radiusTop = data.radiusTop || 0.17; // looser fit
    const radiusWaist = data.radiusWaist || 0.11;
    const radiusBottom = data.radiusBottom || 0.11;
    const color = data.color || 0x22223b;

    // Geometry and waist taper (same as robe)
    const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 20, 12, true);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      if (y < height/2 - height/3 && y > -height/2 + height/3) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        const r = Math.sqrt(x*x + z*z);
        const scale = radiusWaist / r;
        pos.setX(i, x * scale);
        pos.setZ(i, z * scale);
      }
    }
    pos.needsUpdate = true;

    // Bones: chest (shoulders), abdomen (mid), leftLeg, rightLeg (same as robe)
    const bones = [];
    const chest = new THREE.Bone();
    chest.position.y = .25;
    bones.push(chest);
    const abdomen = new THREE.Bone();
    abdomen.position.y = -height / 3;
    bones.push(abdomen);
    const leftLeg = new THREE.Bone();
    leftLeg.position.set(-0.12, -height / 2, 0);
    bones.push(leftLeg);
    const rightLeg = new THREE.Bone();
    rightLeg.position.set(0.12, -height / 2, 0);
    bones.push(rightLeg);
    chest.add(abdomen);
    abdomen.add(leftLeg);
    abdomen.add(rightLeg);

    // Skinning: use setupRobeSkinning
    this.setupRobeSkinning(geo, height);

    // Material
    const mat = new THREE.MeshStandardMaterial({ color: color, metalness: 0.3, roughness: 0.7, side: THREE.DoubleSide, skinning: true });
    const mesh = new THREE.SkinnedMesh(geo, mat);
    const skeleton = new THREE.Skeleton(bones);
    mesh.add(chest);
    mesh.bind(skeleton);

    // Attach bones: chest to torso, abdomen to abdomen, legs to upper legs
    if (this.character && this.character.bones) {
      if (this.character.bones.torso) this.character.bones.torso.add(chest);
      if (this.character.bones.abdomen) this.character.bones.abdomen.add(abdomen);
      if (this.character.bones.upperLegs && this.character.bones.upperLegs.left) this.character.bones.upperLegs.left.add(leftLeg);
      if (this.character.bones.upperLegs && this.character.bones.upperLegs.right) this.character.bones.upperLegs.right.add(rightLeg);
    }

    return { mesh, bones: { chest, abdomen, leftLeg, rightLeg } };
  }

  // Custom skinning for cloak: only neck/back bones, no leg influence
  setupCloakSkinning(geo, height) {
    const skinIndices = [];
    const skinWeights = [];
    for (let i = 0; i < geo.attributes.position.count; i++) {
      const y = geo.attributes.position.getY(i);
      // Top: mostly neck
      if (y > height/4) {
        skinIndices.push(0, 1, 0, 0); // neck, back
        skinWeights.push(0.95, 0.05, 0, 0);
      } else if (y > 0) {
        skinIndices.push(0, 1, 0, 0);
        skinWeights.push(0.7, 0.3, 0, 0);
      } else if (y > -height/4) {
        skinIndices.push(1, 0, 0, 0); // mostly back
        skinWeights.push(0.7, 0.3, 0, 0);
      } else {
        skinIndices.push(1, 0, 0, 0); // all back at the bottom
        skinWeights.push(1, 0, 0, 0);
      }
    }
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  }

  // Cape: flat, slightly curved rectangular drape with rounded top, no hood
  createCape(data = {}) {
    const width = data.width || 0.36;
    const height = data.height || 0.55;
    const color = data.color || 0xffd700; // bright gold/yellow by default
    const trimColor = data.trimColor || 0xffffff;
    const segmentsY = 16;
    const segmentsX = 8;

    // Plane geometry for the cape
    const geo = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    // Curve the top and bottom, and add a slight outward curve at the bottom
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const x = pos.getX(i);
      // Curve the top edge (rounded)
      if (y > height/2 - 0.04) {
        const curve = Math.sqrt(Math.max(0, 1 - (x/(width/2))**2));
        pos.setY(i, y + 0.04 * (curve - 1));
      }
      // Outward curve at the bottom (vertical drape)
      if (y < -height/2 + 0.04) {
        pos.setZ(i, -0.04 - 0.10 * (1 + y / (height/2))); // bottom further back
      } else {
        // Gradually curve from top to bottom
        pos.setZ(i, -0.04 - 0.08 * ((y + height/2) / height));
      }
      // Gentle horizontal U curve
      pos.setX(i, x * (1 + 0.08 * (1 - Math.abs(y) / (height/2))));
    }
    pos.needsUpdate = true;

    // Shift all vertices so the top edge is at y=0 (origin)
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, pos.getY(i) - height / 2);
    }
    // Apply a strong outward (negative Z) curve for billowing effect
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i); // y=0 at top, y=-height at bottom
      // Billow: quadratic curve, bottom is farthest out
      const t = -y / height; // 0 at top, 1 at bottom
      pos.setZ(i, -0.04 - 0.35 * (t * t));
    }
    pos.needsUpdate = true;

    // Material (simple color for now)
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.7, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0; // top of cape at neck
    mesh.position.z = -0.15; // further back to avoid clipping
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.x = 0; // hang vertically down the back

    // Optionally, add trim or emblem in the future

    // Attach to neck/shoulders if available, otherwise torso
    if (this.character && this.character.bones) {
      if (this.character.bones.neck) {
        this.character.bones.neck.add(mesh);
      } else if (this.character.bones.torso) {
        this.character.bones.torso.add(mesh);
      }
    }

    // Collar/fold removed

    return { mesh, bones: {}, width, height };
  }

  /**
   * Animate clothing through bone manipulation (not direct mesh positioning)
   */
  animateClothing(animationType, time) {
    this.clothing.forEach((clothing, type) => {
      switch (type) {
        case 'robe':
          this.animateRobe(clothing, animationType, time);
          break;
        case 'hat':
          this.animateHat(clothing, animationType, time);
          break;
        case 'crown':
          this.animateCrown(clothing, animationType, time);
          break;
        case 'halo':
          this.animateHalo(clothing, animationType, time);
          break;
        case 'helmet':
          this.animateHelmet(clothing, animationType, time);
          break;
        case 'headband':
          this.animateHeadband(clothing, animationType, time);
          break;
        case 'cloak':
          this.animateCloak(clothing, animationType, time);
          break;
      }
    });
  }

  /**
   * Animate robe through bone rotation (not mesh position)
   */
  animateRobe(clothing, animationType, time) {
    if (animationType === 'walk') {
      // Animate the chest bone for sway
      clothing.bones.chest.rotation.z = 0.10 * Math.sin(time);
    } else {
      // Reset to idle
      clothing.bones.chest.rotation.z = 0;
    }
  }

  /**
   * Animate hat through bone rotation
   */
  animateHat(clothing, animationType, time) {
    if (animationType === 'walk' && clothing.mesh.hatMesh) {
      clothing.mesh.hatMesh.rotation.z = 0.03 * Math.sin(time - 0.2);
    } else if (clothing.mesh.hatMesh) {
      clothing.mesh.hatMesh.rotation.z = 0;
    }
  }

  /**
   * Animate crown through subtle movement
   */
  animateCrown(clothing, animationType, time) {
    if (animationType === 'walk' && clothing.mesh.crownMesh) {
      // Subtle crown movement during walk (following hat pattern)
      clothing.mesh.crownMesh.rotation.z = 0.03 * Math.sin(time - 0.2);
    } else if (clothing.mesh.crownMesh) {
      clothing.mesh.crownMesh.rotation.z = 0;
    }
  }

  /**
   * Animate halo with gentle floating movement
   */
  animateHalo(clothing, animationType, time) {
    if (clothing.mesh.haloMesh) {
      // Gentle floating animation
      clothing.mesh.haloMesh.position.y = 0.25 + 0.02 * Math.sin(time * 0.5);
      clothing.mesh.haloMesh.rotation.y = time * 0.3; // Slow rotation
      
      // Also animate the glow rings
      if (clothing.mesh.children[1]) { // inner glow
        clothing.mesh.children[1].position.y = 0.25 + 0.02 * Math.sin(time * 0.5);
        clothing.mesh.children[1].rotation.y = time * 0.3;
      }
      if (clothing.mesh.children[2]) { // outer glow
        clothing.mesh.children[2].position.y = 0.25 + 0.02 * Math.sin(time * 0.5);
        clothing.mesh.children[2].rotation.y = time * 0.3;
      }
    }
  }

  /**
   * Animate helmet with subtle movement
   */
  animateHelmet(clothing, animationType, time) {
    if (animationType === 'walk' && clothing.mesh.helmetMesh) {
      // Subtle helmet movement during walk (following hat pattern)
      clothing.mesh.helmetMesh.rotation.z = 0.02 * Math.sin(time - 0.2);
    } else if (clothing.mesh.helmetMesh) {
      clothing.mesh.helmetMesh.rotation.z = 0;
    }
  }

  /**
   * Animate headband with subtle movement
   */
  animateHeadband(clothing, animationType, time) {
    if (animationType === 'walk' && clothing.mesh.headbandMesh) {
      // Subtle headband movement during walk (following hat pattern)
      clothing.mesh.headbandMesh.rotation.z = 0.03 * Math.sin(time - 0.2);
    } else if (clothing.mesh.headbandMesh) {
      clothing.mesh.headbandMesh.rotation.z = 0;
    }
  }

  // Animate cloak: gentle sway using neck and back bones
  animateCloak(clothing, animationType, time) {
    if (animationType === 'walk') {
      // Gentle side sway and slight back flutter
      if (clothing.bones.neck) clothing.bones.neck.rotation.z = 0.08 * Math.sin(time);
      if (clothing.bones.back) clothing.bones.back.rotation.z = 0.12 * Math.sin(time + 0.5);
      if (clothing.bones.leftEdge) clothing.bones.leftEdge.rotation.x = 0.07 * Math.sin(time + 0.8);
      if (clothing.bones.rightEdge) clothing.bones.rightEdge.rotation.x = -0.07 * Math.sin(time + 0.8);
    } else {
      if (clothing.bones.neck) clothing.bones.neck.rotation.z = 0;
      if (clothing.bones.back) clothing.bones.back.rotation.z = 0;
      if (clothing.bones.leftEdge) clothing.bones.leftEdge.rotation.x = 0;
      if (clothing.bones.rightEdge) clothing.bones.rightEdge.rotation.x = 0;
    }
  }

  /**
   * Get all clothing of a specific type
   */
  getClothing(type) {
    return this.clothing.get(type);
  }

  /**
   * Check if clothing is equipped
   */
  hasClothing(type) {
    return this.clothing.has(type);
  }

  /**
   * Auto-hide body parts that would be covered by clothing
   */
  autoHideBodyParts(type) {
    const characterBones = this.character.bones;
    const parts = CLOTHING_HIDE_MAP[type];
    if (!parts) return;
    for (const partPath of parts) {
      const part = partPath.split('.').reduce((obj, key) => obj && obj[key], characterBones);
      if (part && part.children[0]) part.children[0].visible = false;
    }
  }

  /**
   * Auto-show body parts that were hidden by clothing
   */
  autoShowBodyParts(type) {
    const characterBones = this.character.bones;
    const parts = CLOTHING_HIDE_MAP[type];
    if (!parts) return;
    for (const partPath of parts) {
      const part = partPath.split('.').reduce((obj, key) => obj && obj[key], characterBones);
      if (part && part.children[0]) part.children[0].visible = true;
    }
  }
} 