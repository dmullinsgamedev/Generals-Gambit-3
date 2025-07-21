// ============================================================================
// GENERAL'S GAMBIT - MAIN GAME LOGIC (SIMPLIFIED)
// ============================================================================

// Import all managers
import { gameDataManager } from './game/gameDataManager.js';
import { generateCustomTroopMesh, determineTroopVariantFromPrompt, generateCustomGeneralMesh } from '../troopGenerator.js';
import { simpleLogger } from './core/logger.js';
import { simpleStateManager } from './game/stateManager.js';
import { formationManager, positionTroopsInFormation, generateFormationFromPrompt, generateRandomEnemyFormation } from './game/formationManager.js';
import { sceneManager, changeScene, getCurrentScene, showRoundMessage } from './game/sceneManager.js';
import { effectManager } from './game/effectManager.js';
import { configManager } from './game/configManager.js';
import { terrainManager, getTerrainHeightAt } from './game/terrainManager.js';
import { battleLogicManager } from './game/battleLogicManager.js';
import { gameInitManager, setupDebugControls, getGameLogs, runSystemTests } from './game/gameInitManager.js';
import { gameState } from './core/gameState.js';

// Import UI components
import './ui/uiComponents.js';

// ============================================================================
// GLOBAL VARIABLES
// ============================================================================

let scene, camera, renderer, controls;
let playerTroops = [];
let enemyTroops = [];
let playerGeneral = null;
let enemyGeneral = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

gameDataManager.initialize();
gameInitManager.initialize();
sceneManager.initialize();
battleLogicManager.initialize();

window.getGameLogs = getGameLogs;
window.formationManager = formationManager;

// ============================================================================
// GAME SETUP
// ============================================================================

function initializeUI() {
  simpleLogger.addLog('INFO', ['Initializing UI...']);
  setupDebugControls();
  gameInitManager.setupWindowResize();
  simpleLogger.addLog('INFO', ['UI initialized']);
}

function initializeThreeJS() {
  simpleLogger.addLog('INFO', ['Initializing THREE.js...']);
  const canvas = document.getElementById('gameCanvas');
  const threeJS = gameInitManager.initializeThreeJS(canvas);
  scene = threeJS.scene;
  camera = threeJS.camera;
  renderer = threeJS.renderer;
  controls = threeJS.controls;
  effectManager.initialize(scene);
  window.gameRenderer = { 
    canvas: canvas, 
    ctx: canvas.getContext('webgl') || canvas.getContext('2d') 
  };
  gameInitManager.startRenderLoop();
  simpleLogger.addLog('INFO', ['THREE.js initialized']);
}

// ============================================================================
// GAME FLOW
// ============================================================================

function startGame() {
  simpleLogger.addLog('INFO', ['Starting game...']);
  initializeUI();
  initializeThreeJS();
  showTroopSelection();
  setTimeout(() => {
    runSystemTests();
  }, 1000);
  simpleLogger.addLog('INFO', ['Game started successfully']);
}

function showTroopSelection() {
  simpleLogger.addLog('INFO', ['Showing troop/general selection...']);
  if (window.showPromptInput) {
    window.showPromptInput('general');
  }
}

function onTroopSelectionComplete() {
  changeScene('formation');
}

function onFormationSelectionComplete() {
  changeScene('battle');
}

function showFormationSelection() {
  simpleLogger.addLog('INFO', ['Showing formation selection...']);
  changeScene('formation');
  simpleLogger.addLog('INFO', ['Formation scene change requested']);
}

function selectFormation(formation) {
  simpleLogger.addLog('INFO', ['Formation selected:', formation.name]);
  simpleStateManager.setPlayerFormation(formation);
  generateEnemy();
  startBattle();
}

function generateEnemy() {
  simpleLogger.addLog('INFO', ['Generating enemy...']);
  const enemyFormation = generateRandomEnemyFormation();
  simpleStateManager.setEnemyFormation(enemyFormation);
  const enemyGeneralData = gameDataManager.getRandomGeneral();
  simpleStateManager.setEnemy(enemyGeneralData);
  simpleLogger.addLog('INFO', ['Enemy generated:', enemyGeneralData.name]);
}

function startBattle() {
  simpleLogger.addLog('INFO', ['Starting battle...']);
  if (!simpleStateManager.getPlayerFormation()) {
    simpleLogger.addLog('ERROR', ['Player formation is not set! Cannot start battle.']);
    alert('Please select a formation before starting the battle.');
    return;
  }
  if (!simpleStateManager.getEnemyFormation()) {
    simpleLogger.addLog('ERROR', ['Enemy formation is not set! Cannot start battle.']);
    alert('Enemy formation is not set.');
    return;
  }
  simpleLogger.addLog('INFO', ['Player formation:', simpleStateManager.getPlayerFormation()]);
  simpleLogger.addLog('INFO', ['Enemy formation:', simpleStateManager.getEnemyFormation()]);
  initializeTroops();
  simpleLogger.addLog('DEBUG', ['playerTroops ref before battle:', playerTroops]);
  simpleLogger.addLog('DEBUG', ['enemyTroops ref before battle:', enemyTroops]);
  simpleLogger.addLog('DEBUG', ['Calling battleLogicManager.startBattle...']);
  battleLogicManager.startBattle(playerTroops, enemyTroops, playerGeneral, enemyGeneral);
  simpleLogger.addLog('DEBUG', ['battleLogicManager.startBattle called. battleActive:', battleLogicManager.battleActive]);
  simpleLogger.addLog('DEBUG', ['playerTroops ref after battle:', playerTroops]);
  simpleLogger.addLog('DEBUG', ['enemyTroops ref after battle:', enemyTroops]);
  battleLogicManager.onBattleEnd = (playerWon) => {
    endBattle(playerWon);
  };
  changeScene('battle');
  simpleLogger.addLog('INFO', [`Battle started with ${playerTroops.length} player troops and ${enemyTroops.length} enemy troops`]);
  simpleLogger.addLog('INFO', ['Battle logic manager active:', battleLogicManager.battleActive]);
}

// ============================================================================
// TROOP MANAGEMENT
// ============================================================================

function initializeTroops() {
  if (!scene) {
    console.error('Scene is not initialized!');
    simpleLogger.addLog('ERROR', ['Scene is not initialized!']);
    return;
  }
  simpleLogger.addLog('INFO', ['Initializing troops...']);
  clearTroops();
  const playerTroopCount = configManager.get('troops', 'playerTroopCount', 20);
  for (let i = 0; i < playerTroopCount; i++) {
    const troop = createTroop(true, simpleStateManager.getPlayerTroopType(), simpleStateManager.getPlayerColor());
    playerTroops.push(troop);
    scene.add(troop.mesh);
  }
  const enemyTroopCount = configManager.get('troops', 'enemyTroopCount', 20);
  for (let i = 0; i < enemyTroopCount; i++) {
    const troop = createTroop(false, simpleStateManager.getEnemyTroopType(), simpleStateManager.getEnemyColor());
    enemyTroops.push(troop);
    scene.add(troop.mesh);
  }
  createGenerals();
  positionTroopsInFormation(playerTroops, simpleStateManager.getPlayerFormation(), true);
  positionTroopsInFormation(enemyTroops, simpleStateManager.getEnemyFormation(), false);
  simpleLogger.addLog('INFO', [`Initialized ${playerTroopCount} player troops and ${enemyTroopCount} enemy troops`]);
}

function clearTroops() {
  [...playerTroops, ...enemyTroops].forEach(troop => {
    if (troop.mesh && troop.mesh.parent) {
      troop.mesh.parent.remove(troop.mesh);
    }
  });
  playerTroops.length = 0;
  enemyTroops.length = 0;
  clearGenerals();
  simpleLogger.addLog('DEBUG', ['Troops cleared']);
}

function clearGenerals() {
  if (playerGeneral && playerGeneral.mesh && playerGeneral.mesh.parent) {
    playerGeneral.mesh.parent.remove(playerGeneral.mesh);
  }
  if (enemyGeneral && enemyGeneral.mesh && enemyGeneral.mesh.parent) {
    enemyGeneral.mesh.parent.remove(enemyGeneral.mesh);
  }
  playerGeneral = null;
  enemyGeneral = null;
  simpleLogger.addLog('DEBUG', ['Generals cleared']);
}

function createGenerals() {
  simpleLogger.addLog('INFO', ['Creating generals...']);
  const playerGeneralData = simpleStateManager.getPlayerGeneral();
  playerGeneral = createGeneral(true, playerGeneralData);
  scene.add(playerGeneral.mesh);
  simpleLogger.addLog('DEBUG', ['Player general created:', playerGeneral]);
  const enemyGeneralData = simpleStateManager.getEnemyGeneral();
  enemyGeneral = createGeneral(false, enemyGeneralData);
  scene.add(enemyGeneral.mesh);
  simpleLogger.addLog('DEBUG', ['Enemy general created:', enemyGeneral]);
  simpleLogger.addLog('INFO', ['Generals created']);
}

function createGeneral(isPlayer, generalData) {
  simpleLogger.addLog('DEBUG', ['createGeneral called', isPlayer, generalData]);
  if (!generalData) {
    simpleLogger.addLog('ERROR', ['generalData is null! Creating default general']);
    generalData = {
      name: isPlayer ? 'Player General' : 'Enemy General',
      description: 'Default general',
      troopType: 'melee',
      variant: 'default',
      hp: 150
    };
  }
  const variant = generalData.variant || 'default';
  const troopType = generalData.troopType || 'infantry';
  const z = isPlayer ? -15 : 15;
  const prompt = generalData.name || generalData.description || 'general';
  const { mesh } = generateCustomGeneralMesh(prompt, isPlayer, isPlayer ? 0x1da1f2 : 0xff5e62);
  const terrainHeight = getTerrainHeightAt(0, z);
  mesh.position.set(0, terrainHeight + 0.5, z);
  mesh.castShadow = true;
  const generalHealth = configManager.get('troops', 'generalHealth', 150);
  const generalAttack = configManager.get('troops', 'generalAttack', 15);
  const generalRange = configManager.get('troops', 'generalRange', 3.0);
  const general = {
    hp: generalData.hp || generalHealth,
    maxHp: generalData.hp || generalHealth,
    atk: generalAttack,
    range: generalRange,
    rate: 3,
    cooldown: 0,
    isPlayer: isPlayer,
    mesh: mesh,
    position: { x: 0, y: terrainHeight + 0.5, z: z },
    type: 'general',
    variant: variant,
    description: generalData.description,
    troopType: troopType
  };
  simpleLogger.addLog('DEBUG', ['General object created:', general]);
  return general;
}

function createTroop(isPlayer, troopType, color) {
  const variant = determineTroopVariantFromPrompt(`${troopType} troops`, troopType);
  const z = isPlayer ? -10 : 10;
  const troopData = generateCustomTroopMesh(`${troopType} troops`, isPlayer, color);
  const mesh = troopData.mesh;
  const terrainHeight = getTerrainHeightAt(0, z);
  mesh.position.set(0, terrainHeight + 0.5, z);
  mesh.castShadow = true;
  const troop = {
    hp: 100,
    maxHp: 100,
    atk: 10,
    range: 1.5,
    rate: 2,
    cooldown: 0,
    isPlayer: isPlayer,
    mesh: mesh,
    position: { x: 0, y: terrainHeight + 0.5, z: z },
    type: troopType,
    variant: variant
  };
  return troop;
}

// ============================================================================
// BATTLE MANAGEMENT
// ============================================================================

function endBattle(playerWon) {
  simpleLogger.addLog('INFO', [`Battle ended. Player ${playerWon ? 'won' : 'lost'}`]);
  showRoundMessage(playerWon);
  setTimeout(() => {
    nextRound();
  }, 2000);
}

function nextRound() {
  simpleLogger.addLog('INFO', ['Starting next round...']);
  clearTroops();
  simpleStateManager.setPlayer(null);
  simpleStateManager.setPlayerFormation(null);
  simpleStateManager.setEnemy(null);
  simpleStateManager.setEnemyFormation(null);
  showTroopSelection();
}

// ============================================================================
// GAME LOOP
// ============================================================================

function gameLoop() {
  if (battleLogicManager.battleActive) {
    simpleLogger.addLog('DEBUG', ['Battle logic manager active, updating...']);
    battleLogicManager.updateBattle(0.016); // ~60 FPS
  } else {
    simpleLogger.addLog('DEBUG', ['Battle logic manager not active. battleActive:', battleLogicManager.battleActive]);
  }
  effectManager.update(0.016);
  requestAnimationFrame(gameLoop);
}

// ============================================================================
// STARTUP
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  simpleLogger.addLog('INFO', ['DOM loaded, starting game...']);
  gameDataManager.initialize();
  gameInitManager.initialize();
  initializeThreeJS();
  sceneManager.initialize();
  battleLogicManager.initialize();
  gameLoop();
});

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

function generateGeneralFromPrompt(prompt) {
  return generateCustomGeneralMesh(gameDataManager.generateGeneralFromPrompt(prompt));
}

window.selectFormation = selectFormation;
window.generateGeneralFromPrompt = generateGeneralFromPrompt;
window.generateFormationFromPrompt = generateFormationFromPrompt;
window.startBattle = startBattle;
window.effectManager = effectManager;
window.sceneManager = sceneManager;
window.gameRenderer = { canvas: null, ctx: null };
window.battleSystem = battleLogicManager;

export { selectFormation, generateFormationFromPrompt, generateGeneralFromPrompt };
