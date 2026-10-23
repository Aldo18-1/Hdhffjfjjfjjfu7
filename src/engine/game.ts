import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BlockType, PlayerStats, RaycastHit, ToolType } from '../types/game';
import { VoxelWorld, WORLD_SIZE_X, WORLD_SIZE_Z } from './world';
import { PlayerPhysics } from './physics';
import { PlayerHand } from './hand';
import { ParticleSystem } from './particles';
import { MobManager } from './mobs';
import { sound } from './audio';

export type GameStateMode = 'title' | 'playing' | 'paused' | 'inventory';

export class GameEngine {
  // Three.js core
  public renderer: THREE.WebGLRenderer | null = null;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  private container: HTMLElement;

  // Subsystems
  public world: VoxelWorld;
  public physics: PlayerPhysics;
  public hand: PlayerHand;
  public particles: ParticleSystem;
  public mobManager: MobManager;

  // Camera look & controls
  private pitch = 0;
  private yaw = 0;
  public isLocked = false;
  private walkTime = 0;

  // Day/Night & Lighting
  public timeOfDay = 6000; // 0 to 24000 (6000 = noon, 18000 = midnight)
  public timeSpeed = 15; // Speed multiplier
  private sunLight: THREE.DirectionalLight;
  private moonLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private starsGroup: THREE.Points;
  private sunMesh: THREE.Mesh;
  private moonMesh: THREE.Mesh;

  // Targeted block outline
  private highlightBox: THREE.LineSegments;
  public currentRaycastHit: RaycastHit | null = null;

  // State
  public state: GameStateMode = 'title';
  public creativeMode = true; // Default to creative for immediate fun
  public activeSlot = 0; // 0 to 8
  public hotbarItems: { blockType?: BlockType; toolType?: ToolType; name: string }[] = [
    { blockType: BlockType.GRASS, name: 'Césped' },
    { blockType: BlockType.WOOD_PLANKS, name: 'Tablas' },
    { blockType: BlockType.COBBLESTONE, name: 'Adoquín' },
    { blockType: BlockType.BRICK, name: 'Ladrillos' },
    { blockType: BlockType.GLASS, name: 'Cristal' },
    { blockType: BlockType.TNT, name: 'TNT' },
    { toolType: 'pickaxe', name: 'Pico Diamante' },
    { toolType: 'sword', name: 'Espada Diamante' },
    { blockType: BlockType.GLOWSTONE, name: 'Luz' },
  ];

  // Held keys
  private keys: Record<string, boolean> = {};
  private animationFrameId: number | null = null;
  private lastTime = 0;

  // Callbacks for UI updates
  public onStatsUpdate?: (stats: PlayerStats) => void;
  public onStateChange?: (state: GameStateMode) => void;
  public onHotbarChange?: (slot: number) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 150);

    // Renderer
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = !isHeadless;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Studio Environment reflection
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Fog
    this.scene.fog = new THREE.FogExp2(0x84b2e8, 0.016);

    // World & physics
    this.world = new VoxelWorld();
    this.scene.add(this.world.group);

    const spawnPos = this.world.getSpawnPosition();
    this.physics = new PlayerPhysics(spawnPos);
    this.camera.position.set(spawnPos.x, spawnPos.y + this.physics.eyeHeight, spawnPos.z);

    // Hand & Tools
    this.hand = new PlayerHand();
    this.camera.add(this.hand.group);
    this.scene.add(this.camera);
    this.updateHandEquipment();

    // Particles
    this.particles = new ParticleSystem();
    this.scene.add(this.particles.group);

    // Mobs
    this.mobManager = new MobManager();
    this.mobManager.spawnInitialMobs(this.world);
    this.scene.add(this.mobManager.group);

    // Lighting & Celestial bodies
    this.hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0x3d3835, 0.6);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff5e6, 1.3);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 80;
    this.sunLight.shadow.camera.left = -32;
    this.sunLight.shadow.camera.right = 32;
    this.sunLight.shadow.camera.top = 32;
    this.sunLight.shadow.camera.bottom = -32;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    this.moonLight = new THREE.DirectionalLight(0x5a75a0, 0.3);
    this.scene.add(this.moonLight);

    // Sun & Moon procedural meshes
    const sunGeo = new THREE.BoxGeometry(4, 4, 1);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.scene.add(this.sunMesh);

    const moonGeo = new THREE.BoxGeometry(3.5, 3.5, 1);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xe0eaff });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.scene.add(this.moonMesh);

    // Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCoords: number[] = [];
    for (let i = 0; i < 400; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 2 - 1);
      const r = 90;
      starCoords.push(r * Math.sin(ph) * Math.cos(th), Math.abs(r * Math.cos(ph)) + 10, r * Math.sin(ph) * Math.sin(th));
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0 });
    this.starsGroup = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starsGroup);

    // Highlight wireframe box for block target
    const boxWireGeo = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    const edges = new THREE.EdgesGeometry(boxWireGeo);
    this.highlightBox = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 })
    );
    this.highlightBox.visible = false;
    this.scene.add(this.highlightBox);

    // Event listeners
    this.initEvents();

    // Pre-warm shaders
    this.renderer.compile(this.scene, this.camera);

    // Start peaceful ambient music
    sound.startPeacefulMusic();

    // Start loop
    this.lastTime = performance.now();
    this.animate();
  }

  private updateHandEquipment() {
    const item = this.hotbarItems[this.activeSlot];
    if (item) {
      this.hand.setEquipped(item.toolType || 'none', item.blockType || BlockType.AIR);
    }
  }

  public setActiveSlot(slot: number) {
    if (slot >= 0 && slot < 9) {
      this.activeSlot = slot;
      this.updateHandEquipment();
      sound.playClick();
      this.onHotbarChange?.(slot);
    }
  }

  public setSlotItem(slot: number, item: { blockType?: BlockType; toolType?: ToolType; name: string }) {
    if (slot >= 0 && slot < 9) {
      this.hotbarItems[slot] = item;
      if (this.activeSlot === slot) {
        this.updateHandEquipment();
      }
      this.onHotbarChange?.(this.activeSlot);
    }
  }

  private initEvents() {
    // Pointer Lock
    document.addEventListener('pointerlockchange', () => {
      this.isLocked = document.pointerLockElement === this.container;
      if (!this.isLocked && this.state === 'playing') {
        this.setState('paused');
      }
    });

    // Mouse Move (look)
    window.addEventListener('mousemove', (e) => {
      if (!this.isLocked || this.state !== 'playing') return;
      const sensitivity = 0.0022;
      this.yaw -= e.movementX * sensitivity;
      this.pitch -= e.movementY * sensitivity;
      this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));
    });

    // Mouse Down (break / place)
    window.addEventListener('mousedown', (e) => {
      if (this.state !== 'playing') return;
      if (!this.isLocked) {
        this.requestLock();
        return;
      }

      if (e.button === 0) {
        // Left Click -> Break Block
        this.breakTargetBlock();
      } else if (e.button === 2) {
        // Right Click -> Place Block
        this.placeActiveBlock();
      }
    });

    // Prevent context menu
    window.addEventListener('contextmenu', (e) => {
      if (this.isLocked) e.preventDefault();
    });

    // Mouse Wheel -> Cycle Hotbar
    window.addEventListener('wheel', (e) => {
      if (this.state !== 'playing') return;
      const dir = Math.sign(e.deltaY);
      let next = this.activeSlot + dir;
      if (next < 0) next = 8;
      if (next > 8) next = 0;
      this.setActiveSlot(next);
    });

    // Key Down
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      if (e.code === 'KeyE') {
        if (this.state === 'playing') {
          this.setState('inventory');
        } else if (this.state === 'inventory') {
          this.setState('playing');
        }
      } else if (e.code === 'Escape') {
        if (this.state === 'playing') {
          this.setState('paused');
        } else if (this.state === 'paused' || this.state === 'inventory') {
          this.setState('playing');
        }
      } else if (e.code === 'KeyF') {
        // Toggle flying mode
        if (this.creativeMode) {
          this.physics.isFlying = !this.physics.isFlying;
          this.physics.velocity.set(0, 0, 0);
          sound.playJump();
        }
      } else if (e.code.startsWith('Digit')) {
        const num = parseInt(e.code.replace('Digit', ''), 10);
        if (num >= 1 && num <= 9) {
          this.setActiveSlot(num - 1);
        }
      }
    });

    // Key Up
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Window Blur -> Clear Keys
    window.addEventListener('blur', () => {
      this.keys = {};
    });

    // Resize
    window.addEventListener('resize', () => {
      if (!this.renderer) return;
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  public requestLock() {
    this.container.requestPointerLock?.();
  }

  public unlock() {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }

  public setState(nextState: GameStateMode) {
    this.state = nextState;
    if (nextState === 'playing') {
      this.requestLock();
    } else {
      this.unlock();
    }
    this.onStateChange?.(nextState);
  }

  public breakTargetBlock() {
    this.hand.triggerSwing();

    if (!this.currentRaycastHit) return;
    const [bx, by, bz] = this.currentRaycastHit.blockPosition;
    const block = this.world.getBlock(bx, by, bz);
    if (block === BlockType.AIR || block === BlockType.BEDROCK) return;

    // Check TNT special handling
    if (block === BlockType.TNT) {
      this.explodeAt(bx, by, bz, 3.5);
      return;
    }

    // Normal break
    this.world.setBlock(bx, by, bz, BlockType.AIR);
    this.world.updateIfDirty();
    this.particles.spawnBlockBreakParticles(bx, by, bz, block, 16);

    const cat = block === BlockType.STONE || block === BlockType.COBBLESTONE ? 'stone' :
                block === BlockType.WOOD_PLANKS || block === BlockType.WOOD_LOG ? 'wood' :
                block === BlockType.GLASS ? 'glass' :
                block === BlockType.SAND ? 'sand' : 'grass';
    sound.playBlockBreak(cat);
  }

  public placeActiveBlock() {
    const item = this.hotbarItems[this.activeSlot];
    if (!item || !item.blockType) {
      this.hand.triggerSwing();
      return;
    }

    if (!this.currentRaycastHit) return;

    const [tx, ty, tz] = this.currentRaycastHit.targetPosition;

    // Boundary check
    if (tx < 0 || tx >= WORLD_SIZE_X || ty < 0 || ty >= 36 || tz < 0 || tz >= WORLD_SIZE_Z) {
      return;
    }

    // Check collision with player
    const halfW = this.physics.width / 2;
    const pMinX = this.physics.position.x - halfW;
    const pMaxX = this.physics.position.x + halfW;
    const pMinY = this.physics.position.y;
    const pMaxY = this.physics.position.y + this.physics.height;
    const pMinZ = this.physics.position.z - halfW;
    const pMaxZ = this.physics.position.z + halfW;

    if (
      tx + 1 > pMinX && tx < pMaxX &&
      ty + 1 > pMinY && ty < pMaxY &&
      tz + 1 > pMinZ && tz < pMaxZ
    ) {
      // Don't place block inside player
      return;
    }

    this.hand.triggerSwing();
    this.world.setBlock(tx, ty, tz, item.blockType);
    this.world.updateIfDirty();

    const cat = item.blockType === BlockType.STONE || item.blockType === BlockType.COBBLESTONE ? 'stone' :
                item.blockType === BlockType.WOOD_PLANKS || item.blockType === BlockType.WOOD_LOG ? 'wood' :
                item.blockType === BlockType.SAND ? 'sand' : 'grass';
    sound.playBlockPlace(cat);
  }

  public explodeAt(cx: number, cy: number, cz: number, radius = 3.5) {
    sound.playExplosion();
    this.particles.spawnExplosionParticles(cx, cy, cz);

    const rCeil = Math.ceil(radius);
    for (let x = cx - rCeil; x <= cx + rCeil; x++) {
      for (let y = cy - rCeil; y <= cy + rCeil; y++) {
        for (let z = cz - rCeil; z <= cz + rCeil; z++) {
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2);
          if (dist <= radius) {
            const b = this.world.getBlock(x, y, z);
            if (b !== BlockType.AIR && b !== BlockType.BEDROCK && b !== BlockType.OBSIDIAN) {
              this.world.setBlock(x, y, z, BlockType.AIR);
              if (Math.random() > 0.7) {
                this.particles.spawnBlockBreakParticles(x, y, z, b, 4);
              }
            }
          }
        }
      }
    }
    this.world.updateIfDirty();

    // Damage / knockback player if nearby
    const pDist = this.physics.position.distanceTo(new THREE.Vector3(cx, cy, cz));
    if (pDist < radius * 2.2) {
      const impulse = new THREE.Vector3().subVectors(this.physics.position, new THREE.Vector3(cx, cy, cz)).normalize();
      this.physics.velocity.addScaledVector(impulse, 14.0 / Math.max(1, pDist));
      if (!this.creativeMode) {
        this.physics.takeDamage(Math.floor((radius * 2.2 - pDist) * 3));
      }
    }
  }

  private updateDayNight(dt: number) {
    this.timeOfDay = (this.timeOfDay + dt * this.timeSpeed * 20) % 24000;

    // Angle of sun/moon (0 at sunrise, 6000 at noon, 12000 at sunset, 18000 at midnight)
    const angle = (this.timeOfDay / 24000) * Math.PI * 2 - Math.PI / 2;
    const sunDist = 70;
    const sunX = Math.cos(angle) * sunDist;
    const sunY = Math.sin(angle) * sunDist;

    // Position sun and moon opposite
    const playerPos = this.physics.position;
    this.sunLight.position.set(playerPos.x + sunX, playerPos.y + sunY, playerPos.z + 20);
    this.sunLight.target.position.copy(playerPos);
    this.sunMesh.position.set(playerPos.x + sunX * 0.9, playerPos.y + sunY * 0.9, playerPos.z + 18);
    this.sunMesh.lookAt(playerPos);

    this.moonLight.position.set(playerPos.x - sunX, playerPos.y - sunY, playerPos.z - 20);
    this.moonLight.target.position.copy(playerPos);
    this.moonMesh.position.set(playerPos.x - sunX * 0.9, playerPos.y - sunY * 0.9, playerPos.z - 18);
    this.moonMesh.lookAt(playerPos);

    // Calculate daylight factor (1 = noon, 0 = night)
    const daylight = Math.max(0, Math.min(1, (sunY + 10) / 40));

    // Sky and fog color lerp
    const daySky = new THREE.Color(0x78a7ff);
    const sunsetSky = new THREE.Color(0xd36a38);
    const nightSky = new THREE.Color(0x080c1e);

    const currentSky = new THREE.Color();
    if (daylight > 0.3) {
      currentSky.lerpColors(sunsetSky, daySky, (daylight - 0.3) / 0.7);
    } else {
      currentSky.lerpColors(nightSky, sunsetSky, daylight / 0.3);
    }

    this.scene.background = currentSky;
    if (this.scene.fog) {
      (this.scene.fog as THREE.FogExp2).color.copy(currentSky);
    }

    // Stars visibility
    const starOpacity = Math.max(0, 1.0 - daylight * 2.5);
    (this.starsGroup.material as THREE.PointsMaterial).opacity = starOpacity;
    this.starsGroup.position.copy(playerPos);

    // Adjust light intensities
    this.sunLight.intensity = Math.max(0.05, daylight * 1.4);
    this.moonLight.intensity = Math.max(0.05, (1.0 - daylight) * 0.45);
    this.hemiLight.intensity = 0.2 + daylight * 0.5;
  }

  // Animation Loop
  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (this.state === 'title') {
      // Cinematic 360 camera pan around the voxel world
      this.walkTime += dt * 0.25;
      const radius = 38;
      const camX = WORLD_SIZE_X / 2 + Math.cos(this.walkTime) * radius;
      const camZ = WORLD_SIZE_Z / 2 + Math.sin(this.walkTime) * radius;
      const camY = 22 + Math.sin(this.walkTime * 0.5) * 4;

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(WORLD_SIZE_X / 2, 12, WORLD_SIZE_Z / 2);

      this.updateDayNight(dt);
      this.particles.update(dt);
      this.mobManager.update(dt, this.world);
      this.renderer?.render(this.scene, this.camera);
      return;
    }

    // Playing or Paused
    if (this.state === 'playing') {
      // Input gathering
      let moveForward = 0;
      let moveRight = 0;
      if (this.keys['KeyW']) moveForward += 1;
      if (this.keys['KeyS']) moveForward -= 1;
      if (this.keys['KeyD']) moveRight += 1;
      if (this.keys['KeyA']) moveRight -= 1;

      const jump = !!this.keys['Space'];
      const crouch = !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'];
      this.physics.isSprinting = !!this.keys['ControlLeft'] || !!this.keys['KeyR'];

      // Physics update
      this.physics.update(
        dt,
        this.world,
        moveForward,
        moveRight,
        jump,
        crouch,
        this.yaw,
        this.creativeMode
      );

      // Camera position & rotation
      this.camera.position.set(
        this.physics.position.x,
        this.physics.position.y + this.physics.eyeHeight,
        this.physics.position.z
      );

      // Camera Euler (pitch + yaw)
      this.camera.rotation.set(0, 0, 0);
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;

      // Walking bobbing time
      const isWalking =
        this.physics.onGround &&
        (Math.abs(this.physics.velocity.x) > 0.5 || Math.abs(this.physics.velocity.z) > 0.5);
      if (isWalking) {
        this.walkTime += dt * (this.physics.isSprinting ? 12 : 8);
      } else {
        this.walkTime += dt * 2;
      }

      // Hand update
      this.hand.update(dt, isWalking, this.walkTime);

      // Raycast for target block
      const camDir = new THREE.Vector3();
      this.camera.getWorldDirection(camDir);
      const hit = this.world.raycast(this.camera.position, camDir, 5.5);

      if (hit) {
        this.currentRaycastHit = {
          blockPosition: hit.blockPos,
          normal: hit.normal,
          targetPosition: [
            hit.blockPos[0] + hit.normal[0],
            hit.blockPos[1] + hit.normal[1],
            hit.blockPos[2] + hit.normal[2],
          ],
          blockType: hit.blockType,
          distance: 0,
        };
        this.highlightBox.position.set(
          hit.blockPos[0] + 0.5,
          hit.blockPos[1] + 0.5,
          hit.blockPos[2] + 0.5
        );
        this.highlightBox.visible = true;
      } else {
        this.currentRaycastHit = null;
        this.highlightBox.visible = false;
      }

      // Day / Night cycle
      this.updateDayNight(dt);

      // Subsystem updates
      this.particles.update(dt);
      this.mobManager.update(dt, this.world);

      // Notify UI
      this.onStatsUpdate?.({
        health: this.physics.health,
        maxHealth: this.physics.maxHealth,
        hunger: this.physics.hunger,
        maxHunger: this.physics.maxHunger,
        oxygen: this.physics.oxygen,
        maxOxygen: this.physics.maxOxygen,
        mode: this.creativeMode ? 'creative' : 'survival',
        isFlying: this.physics.isFlying,
        score: 0,
        coords: {
          x: Math.floor(this.physics.position.x),
          y: Math.floor(this.physics.position.y),
          z: Math.floor(this.physics.position.z),
        },
        timeOfDay: Math.floor(this.timeOfDay),
      });
    }

    this.renderer?.render(this.scene, this.camera);
  };

  public teleport(x: number, y: number, z: number) {
    this.physics.position.set(x, y, z);
    this.physics.velocity.set(0, 0, 0);
  }

  public resetWorld(seed = Math.floor(Math.random() * 100000)) {
    this.scene.remove(this.world.group);
    this.world = new VoxelWorld(seed);
    this.scene.add(this.world.group);

    const spawnPos = this.world.getSpawnPosition();
    this.physics.position.copy(spawnPos);
    this.physics.velocity.set(0, 0, 0);

    this.scene.remove(this.mobManager.group);
    this.mobManager = new MobManager();
    this.mobManager.spawnInitialMobs(this.world);
    this.scene.add(this.mobManager.group);
  }

  public dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    sound.stopMusic();
    this.renderer?.dispose();
    if (this.container && this.renderer?.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
