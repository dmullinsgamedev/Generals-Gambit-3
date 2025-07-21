// ============================================================================
// UI COMPONENTS AND SYSTEMS
// ============================================================================

import { generateCustomTroopMesh, determineTroopVariantFromPrompt } from '../../troopGenerator.js';
import { getGenerals, getFormations, getTroopTypes, getTroopVariants } from '../game/gameDataManager.js';
import { generateGeneralFromPrompt, generateFormationFromPrompt } from '../main.js';
import { gameState } from '../core/gameState.js';

// --- Formation Preview System ---
export function showFormationPreview(formation) {
  const promptContainer = document.getElementById('promptContainer');
  
  promptContainer.innerHTML = `
    <div class="prompt-content">
      <div class="prompt-header">
        <h2>Formation Preview</h2>
        <button class="close-btn" onclick="hideFormationPreview()">×</button>
      </div>
      
      <div class="prompt-body">
        <div class="formation-info">
          <h3>${formation.name}</h3>
          <p><strong>Attack:</strong> ${formation.bonus.atk.toFixed(1)}x</p>
          <p><strong>Defense:</strong> ${formation.bonus.def.toFixed(1)}x</p>
          <p><strong>Speed:</strong> ${formation.bonus.speed.toFixed(1)}x</p>
          <p><strong>Description:</strong> ${formation.desc}</p>
        </div>
        
        <div class="formation-3d-preview" id="formation3dPreview">
          <!-- 3D formation preview will be rendered here -->
        </div>
        
        <div class="prompt-buttons">
          <button class="back-btn" onclick="hideFormationPreview()">Back</button>
          <button class="confirm-btn" onclick="selectFormationFromPreview()">Select Formation</button>
        </div>
      </div>
    </div>
  `;
  
  // Store formation data for later use
  window.currentFormation = formation;
  
  // Render 3D formation preview using the robust main.js version
  if (window.createFormationPreview) {
    const previewContainer = document.getElementById('formation3dPreview');
    window.createFormationPreview(previewContainer, formation, '');
  }
}

// --- Prompt UI Restoration ---

// Show the prompt input for troop or formation
export function showPromptInput(type) {
  console.log('showPromptInput called with type:', type);
  const promptContainer = document.getElementById('promptContainer');
  console.log('promptContainer found:', !!promptContainer);
  promptContainer.style.display = 'block';
  let enemyText = '';
  if (type === 'general') {
    enemyText = gameState.enemy && gameState.enemy.name ? `(Enemy chose: ${gameState.enemy.name})` : '';
  } else if (type === 'formation') {
    enemyText = gameState.enemyFormation && gameState.enemyFormation.name ? `(Enemy formation: ${gameState.enemyFormation.name})` : '';
  }
  promptContainer.innerHTML = `
    <h2 style="font-size:2.2em;margin-bottom:0.3em;">DESCRIBE YOUR ${type === 'general' ? 'TROOPS' : 'FORMATION'}</h2>
    <div id="enemyChoice" style="font-size:1.1em;margin-bottom:1em;"><b>${enemyText}</b></div>
    <input id="promptInput" class="prompt-input" placeholder="e.g.," autocomplete="off" style="width:100%;font-family:'Luckiest Guy',cursive,Arial,sans-serif;font-size:1.3em;padding:1em;box-sizing:border-box;" />
    <div class="prompt-buttons" style="margin:1em 0;">
      <button class="menu-btn" id="randomBtn">RANDOM</button>
      <button class="menu-btn" id="generateBtn">GENERATE ${type === 'general' ? 'TROOPS' : 'FORMATION'}</button>
    </div>
    <div id="previewContainer" style="display:none;margin-top:20px;text-align:center;">
      <h4>Preview</h4>
      <div id="preview3D" style="width:300px;height:200px;margin:0 auto;border:1px solid #ccc;background:#f0f0f0;"></div>
      <div id="previewInfo" style="margin-top:10px;"></div>
    </div>
  `;
  const input = document.getElementById('promptInput');
  input.focus();
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      generateFromPrompt(type, true);
    }
  });
  document.getElementById('generateBtn').onclick = () => generateFromPrompt(type, true);
  document.getElementById('randomBtn').onclick = () => window.generateRandom(type);
}
window.showPromptInput = showPromptInput;

function generateFromPrompt(promptType, showPreviewOnly) {
  const prompt = document.getElementById('promptInput').value.trim();
  if (!prompt) {
    alert('Please enter a description!');
    return;
  }
  
  // Use the game logger if available, otherwise fall back to console
  const log = window.gameLogger ? window.gameLogger.addLog.bind(window.gameLogger) : console.log;
  log('INFO', ['Generating from prompt:', promptType, prompt]);
  
  let result;
  if (promptType === 'general') {
    result = window.generateGeneralFromPrompt(prompt);
    log('INFO', ['Generated general:', result]);
    if (gameState.player && gameState.player.troops && gameState.player.troops !== result.troops) {
      log('WARN', ['Attempted to overwrite player troop type during general generation. Old:', gameState.player.troops, 'New:', result.troops]);
    }
    gameState.setPlayer(result);
    // Generate enemy if not already generated
    if (!gameState.enemy) {
      const generals = getGenerals();
      const enemyGeneral = generals[Math.floor(Math.random() * generals.length)];
      gameState.setEnemy(enemyGeneral);
      log('INFO', ['Generated enemy:', enemyGeneral]);
    }
    window.showTroopPreviewCombined(result, prompt);
  } else {
    // Only update the formation, not the player troop type or color
    result = window.generateFormationFromPrompt(prompt);
    log('INFO', ['Generated formation:', result]);
    // Safeguard: do not overwrite player troop type or color
    if (gameState.player && result.troops && gameState.player.troops !== result.troops) {
      log('WARN', ['Attempted to overwrite player troop type during formation generation. Ignored. Old:', gameState.player.troops, 'Attempted:', result.troops]);
      // Remove any accidental troop type from result
      delete result.troops;
    }
    gameState.setPlayerFormation(result);
    window.currentFormation = result; // Store for battle
    window.showPreview(promptType, result, prompt);
  }
}
window.generateFromPrompt = generateFromPrompt;

window.showPreview = function(promptType, result, prompt) {
  const previewContainer = document.getElementById('previewContainer');
  const preview3D = document.getElementById('preview3D');
  const previewInfo = document.getElementById('previewInfo');
  
  previewContainer.style.display = 'block';
  
  if (promptType === 'formation') {
    previewInfo.innerHTML = `
      <h4>${result.name}</h4>
      <p><strong>Attack:</strong> ${result.bonus.atk.toFixed(1)}x</p>
      <p><strong>Defense:</strong> ${result.bonus.def.toFixed(1)}x</p>
      <p><strong>Speed:</strong> ${result.bonus.speed.toFixed(1)}x</p>
      <p><strong>Description:</strong> ${result.desc}</p>
      <button class="menu-btn" id="continueToBattleBtn">Continue to Battle</button>
    `;
    
    // Create formation preview
    if (window.createFormationPreview) {
      window.createFormationPreview(preview3D, result, prompt);
    }
    
    setTimeout(() => {
      const btn = document.getElementById('continueToBattleBtn');
      if (btn) {
        btn.onclick = () => {
          btn.disabled = true;
          window.startBattleFromPrompt();
        };
      }
    }, 0);
  }
};

window.generateRandom = function(promptType) {
  if (promptType === 'general') {
    const troopTypes = ['melee', 'ranged', 'magic'];
    const troopType = troopTypes[Math.floor(Math.random() * troopTypes.length)];
    const variants = getTroopVariants()[troopType];
    const variant = variants[Math.floor(Math.random() * variants.length)];
    const randomDescriptions = [
      `${variant.name.toLowerCase()} ${troopType} warriors`,
      `Elite ${variant.name.toLowerCase()} troops`,
      `Heavy ${variant.name.toLowerCase()} soldiers`,
      `Light ${variant.name.toLowerCase()} fighters`,
      `Royal ${variant.name.toLowerCase()} guards`,
      `Stealthy ${variant.name.toLowerCase()} units`,
      `Aggressive ${variant.name.toLowerCase()} warriors`,
      `Defensive ${variant.name.toLowerCase()} troops`
    ];
    const randomDesc = randomDescriptions[Math.floor(Math.random() * randomDescriptions.length)];
    document.getElementById('promptInput').value = randomDesc;
  } else {
    const formations = ['phalanx', 'wedge', 'line', 'square', 'skirmish', 'column', 'echelon', 'hammer and anvil', 'crescent', 'circle', 'arrowhead', 'shield wall', 'pincer', 'turtle', 'spearhead', 'scatter', 'box', 'encirclement'];
    const formation = formations[Math.floor(Math.random() * formations.length)];
    const randomFormations = [
      `Ancient ${formation} formation`,
      `Aggressive ${formation} tactic`,
      `Defensive ${formation} strategy`,
      `Fast ${formation} movement`,
      `Heavy ${formation} defense`,
      `Mobile ${formation} approach`,
      `Tactical ${formation} deployment`
    ];
    const randomForm = randomFormations[Math.floor(Math.random() * randomFormations.length)];
    document.getElementById('promptInput').value = randomForm;
  }
};

window.showTroopPreviewCombined = function(result, prompt) {
  const previewContainer = document.getElementById('previewContainer');
  const preview3D = document.getElementById('preview3D');
  const previewInfo = document.getElementById('previewInfo');
  previewContainer.style.display = 'block';
  previewInfo.innerHTML = `<button class="menu-btn" id="continueToFormationBtn">Continue to Formation</button>`;
  if (window.createTroopPreview) window.createTroopPreview(preview3D, result, prompt);
  setTimeout(() => {
    const btn = document.getElementById('continueToFormationBtn');
    if (btn) {
      btn.onclick = () => {
        btn.disabled = true;
        window.continueToFormation();
      };
    }
  }, 0);
};

window.continueToFormation = function() {
  // Hide the prompt container
  const promptContainer = document.getElementById('promptContainer');
  promptContainer.style.display = 'none';
  // Clear the preview container
  const preview3D = document.getElementById('preview3D');
  if (preview3D) {
    preview3D.innerHTML = '';
  }
  // Generate enemy formation and show formation selection
  if (window.enemyChooseFormation) {
    window.enemyChooseFormation();
  }
};

window.goBackToTroops = function() {
  window.showPromptInput('general');
};

window.startBattleFromPrompt = function() {
  // Hide the prompt container
  const promptContainer = document.getElementById('promptContainer');
  if (promptContainer) {
    promptContainer.style.display = 'none';
  }
  // Clear the preview container
  const preview3D = document.getElementById('preview3D');
  if (preview3D) {
    preview3D.innerHTML = '';
  }

  // Always set the player's formation to the currently previewed formation before battle
  if (window.currentFormation) {
    gameState.setPlayerFormation(window.currentFormation);
    // Also set in simpleStateManager for compatibility with main.js battle logic
    if (window.simpleStateManager) {
      window.simpleStateManager.setPlayerFormation(window.currentFormation);
    }
  }

  // Generate enemy if not already generated
  if (!gameState.enemy) {
    const generals = getGenerals();
    const enemyGeneral = generals[Math.floor(Math.random() * generals.length)];
    gameState.setEnemy(enemyGeneral);
    // Also set in simpleStateManager for compatibility with main.js battle logic
    if (window.simpleStateManager) {
      window.simpleStateManager.setEnemy(enemyGeneral);
    }
    console.log('Generated enemy general:', enemyGeneral);
  }

  // Generate enemy formation
  const enemyFormation = getFormations()[Math.floor(Math.random() * getFormations().length)];
  gameState.setEnemyFormation(enemyFormation);
  // Also set in simpleStateManager for compatibility
  if (window.simpleStateManager) {
    window.simpleStateManager.setEnemyFormation(enemyFormation);
  }

  // Start battle
  if (window.startBattle) {
    window.startBattle();
  }
};

// --- Formation Selection Functions ---
window.selectFormationFromPreview = function() {
  const formation = window.currentFormation;
  if (formation) {
    // Call the main game's formation selection function
    if (window.selectFormation) {
      window.selectFormation(formation);
    }
  }
};

// --- Formation Preview ---
window.createFormationPreview = function(container, formation, prompt) {
  // Clear previous content
  container.innerHTML = '';
  
  // Add some basic styling to the container
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  
  // Add overlay label for formation name
  const label = document.createElement('div');
  label.textContent = (formation.name || 'Formation').toUpperCase();
  label.style.position = 'absolute';
  label.style.top = '8px';
  label.style.left = '50%';
  label.style.transform = 'translateX(-50%)';
  label.style.color = '#fff';
  label.style.fontWeight = 'bold';
  label.style.fontSize = '1.1em';
  label.style.textShadow = '0 0 4px #000, 0 0 2px #000';
  label.style.pointerEvents = 'none';
  container.appendChild(label);

  // Simple 3D formation preview
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  
  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 2.5, 0.01); // Top-down, closer to formation
  camera.lookAt(0, 0, 0);
  
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  
  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);
  
  // Add ground plane (will be resized after formation bounds are calculated)
  const groundGeo = new THREE.PlaneGeometry(3, 3);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x222222, side: THREE.DoubleSide });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  scene.add(ground);
  
  // Use the same FormationManager as the battle system for consistent positioning
  const troopCount = 12; // Show 12 troops in preview
  let positions = [];
  
  // Create dummy troop objects for preview positioning
  const dummyTroops = [];
  for (let i = 0; i < troopCount; i++) {
    dummyTroops.push({
      position: { set: (x, y, z) => positions.push([x, y, z]) }
    });
  }
  
  // Use the FormationManager to position troops consistently with battle
  if (window.formationManager) {
    window.formationManager.positionTroopsInFormationPreview(dummyTroops, formation);
  } else {
    // Fallback to basic positioning if FormationManager not available
    const formationName = (formation.name || '').toLowerCase();
    if (formationName.includes('line')) {
      for (let i = 0; i < troopCount; i++) {
        positions.push([(i - troopCount/2) * 0.25, 0, 0]);
      }
    } else if (formationName.includes('wedge') || formationName.includes('arrow')) {
      let troopIndex = 0;
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col <= row; col++) {
          if (troopIndex < troopCount) {
            positions.push([(col - row/2) * 0.3, 0, row * 0.3]);
            troopIndex++;
          }
        }
      }
    } else if (formationName.includes('square') || formationName.includes('box')) {
      const side = Math.ceil(Math.sqrt(troopCount));
      for (let row = 0; row < side; row++) {
        for (let col = 0; col < side; col++) {
          if (positions.length < troopCount) {
            positions.push([(col - side/2) * 0.25, 0, (row - side/2) * 0.25]);
          }
        }
      }
    } else if (formationName.includes('circle')) {
      for (let i = 0; i < troopCount; i++) {
        const angle = (i / troopCount) * Math.PI * 2;
        const radius = 1.0;
        positions.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
      }
    } else if (formationName.includes('skirmish')) {
      // Skirmish: scattered, loose group
      for (let i = 0; i < troopCount; i++) {
        positions.push([
          (Math.random() - 0.5) * 2,
          0,
          (Math.random() - 0.5) * 1.2
        ]);
      }
    } else {
      // Default: scattered
      for (let i = 0; i < troopCount; i++) {
        positions.push([
          (Math.random() - 0.5) * 2,
          0,
          (Math.random() - 0.5) * 2
        ]);
      }
    }
  }
  
  // Calculate bounds of the formation to fit it within the preview
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  positions.forEach(pos => {
    minX = Math.min(minX, pos[0]);
    maxX = Math.max(maxX, pos[0]);
    minZ = Math.min(minZ, pos[2]);
    maxZ = Math.max(maxZ, pos[2]);
  });
  
  // Handle edge case where formation is empty or invalid
  if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minZ) || !isFinite(maxZ)) {
    minX = -0.5; maxX = 0.5; minZ = -0.5; maxZ = 0.5;
  }
  
  // Add padding for troop radius
  const troopRadius = 0.08;
  minX -= troopRadius;
  maxX += troopRadius;
  minZ -= troopRadius;
  maxZ += troopRadius;
  
  // Calculate formation size and center
  const formationWidth = maxX - minX;
  const formationDepth = maxZ - minZ;
  const formationSize = Math.max(formationWidth, formationDepth);
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;
  
  // Calculate scale to fit formation within preview bounds
  const previewBounds = 1.2; // Keep formation within this bounds
  const scale = Math.min(1, previewBounds / Math.max(formationSize, 0.1));
  
  // Ensure minimum scale for very small formations
  const finalScale = Math.max(0.3, scale);
  
  // Scale and center the positions
  positions = positions.map(pos => [
    (pos[0] - centerX) * finalScale,
    pos[1],
    (pos[2] - centerZ) * finalScale
  ]);
  
  // Resize ground plane to fit the formation
  const groundSize = Math.max(2.5, formationSize * finalScale * 1.5);
  ground.geometry.dispose();
  ground.geometry = new THREE.PlaneGeometry(groundSize, groundSize);
  // Create troops at calculated positions
  positions.forEach((pos, i) => {
    const geometry = new THREE.SphereGeometry(0.08, 12, 12);
    const material = new THREE.MeshLambertMaterial({ color: 0x1da1f2 });
    const troop = new THREE.Mesh(geometry, material);
    
    // Ensure troop position is within bounds (extra safety check)
    const maxPos = 1.5;
    const clampedX = Math.max(-maxPos, Math.min(maxPos, pos[0]));
    const clampedZ = Math.max(-maxPos, Math.min(maxPos, pos[2]));
    
    troop.position.set(clampedX, pos[1] + 0.08, clampedZ);
    troop.castShadow = true;
    scene.add(troop);
  });
  
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
};

// --- Troop Preview ---
window.createTroopPreview = function(container, result, prompt) {
  // Clear previous content
  container.innerHTML = '';

  // Use the advanced troop generator for preview
  const troopData = generateCustomTroopMesh(prompt || (result && result.name) || '', true, result && result.color);
  const troopMesh = troopData.mesh || troopData;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  
  const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // Add enhanced lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);
  
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
  fillLight.position.set(-5, 5, -5);
  scene.add(fillLight);

  // Ground plane removed for cleaner troop preview
  
  // Add a subtle background gradient effect
  const bgGeometry = new THREE.SphereGeometry(10, 16, 16);
  const bgMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x1a1a1a, 
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.3
  });
  const background = new THREE.Mesh(bgGeometry, bgMaterial);
  scene.add(background);

  // Add the generated troop mesh
  scene.add(troopMesh);
  
  // Ensure troop is centered at origin for better preview
  troopMesh.position.set(0, 0, 0);

  // Calculate optimal camera position and troop scale
  const box = new THREE.Box3().setFromObject(troopMesh);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  
  // Handle edge cases where troop might be very small or large
  const effectiveMaxDim = Math.max(maxDim, 0.1);
  
  // Scale troop to fill more of the preview area
  const targetSize = 2.0; // Target size in world units
  const scale = Math.min(3.0, Math.max(0.5, targetSize / effectiveMaxDim)); // Clamp scale between 0.5 and 3.0
  troopMesh.scale.setScalar(scale);
  
  // Recalculate bounds after scaling
  box.setFromObject(troopMesh);
  const center = box.getCenter(new THREE.Vector3());
  
  // Position camera to frame the troop nicely
  const distance = Math.max(3.0, maxDim * scale * 2.0); // Ensure minimum distance
  camera.position.set(distance * 0.4, distance * 0.6, distance);
  camera.lookAt(center);
  
  // Store initial camera position for animation
  const initialCameraX = camera.position.x;
  
  // Add some camera movement for dynamic preview
  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.01;
    
    // Gentle rotation
    troopMesh.rotation.y += 0.005;
    
    // Subtle camera movement
    const cameraOffset = Math.sin(time * 0.5) * 0.3;
    camera.position.x = initialCameraX + cameraOffset;
    camera.lookAt(center);
    
    renderer.render(scene, camera);
  }
  animate();
};

// --- Enemy Formation Selection ---
window.enemyChooseFormation = function() {
  const enemyFormation = getFormations()[Math.floor(Math.random() * getFormations().length)];
  gameState.setEnemyFormation(enemyFormation);
  
  // Show formation selection for player
  window.showPromptInput('formation');
};

export function hideFormationPreview() {
  const promptContainer = document.getElementById('promptContainer');
  promptContainer.style.display = 'none';
} 