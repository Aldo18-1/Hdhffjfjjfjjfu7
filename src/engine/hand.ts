import * as THREE from 'three';
import { BlockType, ToolType } from '../types/game';
import { textureAtlas } from './textures';

export class PlayerHand {
  public group: THREE.Group;
  private armGroup: THREE.Group;
  private toolHolder: THREE.Group;
  private blockHolder: THREE.Group;

  private isSwinging: boolean = false;
  private swingProgress: number = 0;
  private currentTool: ToolType = 'none';
  private currentBlock: BlockType = BlockType.AIR;

  // Materials
  private sleeveMat: THREE.MeshStandardMaterial;
  private skinMat: THREE.MeshStandardMaterial;
  private woodMat: THREE.MeshStandardMaterial;
  private diamondMat: THREE.MeshStandardMaterial;
  private ironMat: THREE.MeshStandardMaterial;
  private goldMat: THREE.MeshStandardMaterial;

  constructor() {
    this.group = new THREE.Group();
    this.armGroup = new THREE.Group();
    this.toolHolder = new THREE.Group();
    this.blockHolder = new THREE.Group();

    // Create stylized PBR materials
    this.sleeveMat = new THREE.MeshStandardMaterial({
      color: 0x00a8a8, // Steve cyan shirt
      roughness: 0.8,
    });
    this.skinMat = new THREE.MeshStandardMaterial({
      color: 0xba8c63, // Steve skin
      roughness: 0.7,
    });
    this.woodMat = new THREE.MeshStandardMaterial({
      color: 0x6e4823,
      roughness: 0.85,
    });
    this.diamondMat = new THREE.MeshStandardMaterial({
      color: 0x4dedf4,
      roughness: 0.25,
      metalness: 0.35,
    });
    this.ironMat = new THREE.MeshStandardMaterial({
      color: 0xd8d8d8,
      roughness: 0.35,
      metalness: 0.7,
    });
    this.goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.25,
      metalness: 0.8,
    });

    this.buildArm();
    this.armGroup.add(this.toolHolder);
    this.armGroup.add(this.blockHolder);
    this.group.add(this.armGroup);

    // Initial position in bottom-right corner of viewport
    this.group.position.set(0.35, -0.32, -0.55);
    this.group.rotation.set(0.1, -0.15, 0.05);
  }

  // Multi-part procedural character arm (sleeve, wrist, palm, thumb)
  private buildArm() {
    // 1. Sleeve
    const sleeveGeo = new THREE.BoxGeometry(0.14, 0.22, 0.14);
    const sleeve = new THREE.Mesh(sleeveGeo, this.sleeveMat);
    sleeve.position.set(0, -0.12, 0);
    this.armGroup.add(sleeve);

    // 2. Forearm / wrist
    const forearmGeo = new THREE.BoxGeometry(0.12, 0.24, 0.12);
    const forearm = new THREE.Mesh(forearmGeo, this.skinMat);
    forearm.position.set(0, 0.08, 0);
    this.armGroup.add(forearm);

    // 3. Palm / fist
    const palmGeo = new THREE.BoxGeometry(0.13, 0.12, 0.13);
    const palm = new THREE.Mesh(palmGeo, this.skinMat);
    palm.position.set(0, 0.22, 0);
    this.armGroup.add(palm);

    // 4. Thumb knuckle detail
    const thumbGeo = new THREE.BoxGeometry(0.05, 0.08, 0.06);
    const thumb = new THREE.Mesh(thumbGeo, this.skinMat);
    thumb.position.set(-0.06, 0.21, 0.03);
    this.armGroup.add(thumb);
  }

  public setEquipped(tool: ToolType, block: BlockType) {
    this.currentTool = tool;
    this.currentBlock = block;

    // Clear tool holder
    while (this.toolHolder.children.length > 0) {
      const c = this.toolHolder.children[0];
      this.toolHolder.remove(c);
    }

    // Clear block holder
    while (this.blockHolder.children.length > 0) {
      const c = this.blockHolder.children[0];
      this.blockHolder.remove(c);
    }

    if (tool !== 'none') {
      this.buildToolModel(tool);
    } else if (block !== BlockType.AIR) {
      this.buildBlockModel(block);
    }
  }

  // Composite 3-6 part procedural tools
  private buildToolModel(tool: ToolType) {
    const group = new THREE.Group();

    // 1. Handle (Oak stick)
    const handleGeo = new THREE.BoxGeometry(0.03, 0.45, 0.03);
    const handle = new THREE.Mesh(handleGeo, this.woodMat);
    handle.position.set(0, 0.22, 0);
    group.add(handle);

    if (tool === 'sword') {
      // Crossguard
      const guardGeo = new THREE.BoxGeometry(0.16, 0.03, 0.05);
      const guard = new THREE.Mesh(guardGeo, this.woodMat);
      guard.position.set(0, 0.38, 0);
      group.add(guard);

      // Diamond Blade
      const bladeGeo = new THREE.BoxGeometry(0.06, 0.42, 0.02);
      const blade = new THREE.Mesh(bladeGeo, this.diamondMat);
      blade.position.set(0, 0.6, 0);
      group.add(blade);

      // Blade Tip bevel
      const tipGeo = new THREE.BoxGeometry(0.04, 0.08, 0.02);
      const tip = new THREE.Mesh(tipGeo, this.diamondMat);
      tip.position.set(0, 0.83, 0);
      group.add(tip);
    } else if (tool === 'pickaxe') {
      // Pickaxe head collar
      const collarGeo = new THREE.BoxGeometry(0.05, 0.06, 0.05);
      const collar = new THREE.Mesh(collarGeo, this.woodMat);
      collar.position.set(0, 0.44, 0);
      group.add(collar);

      // Curved pickaxe top crossbar
      const headGeo = new THREE.BoxGeometry(0.32, 0.05, 0.04);
      const head = new THREE.Mesh(headGeo, this.diamondMat);
      head.position.set(0, 0.44, 0);
      group.add(head);

      // Left pick tip pointing down
      const tipLGeo = new THREE.BoxGeometry(0.04, 0.08, 0.035);
      const tipL = new THREE.Mesh(tipLGeo, this.diamondMat);
      tipL.position.set(-0.15, 0.4, 0);
      tipL.rotation.z = 0.25;
      group.add(tipL);

      // Right pick tip pointing down
      const tipRGeo = new THREE.BoxGeometry(0.04, 0.08, 0.035);
      const tipR = new THREE.Mesh(tipRGeo, this.diamondMat);
      tipR.position.set(0.15, 0.4, 0);
      tipR.rotation.z = -0.25;
      group.add(tipR);
    } else if (tool === 'axe') {
      // Axe blade head
      const axeHeadGeo = new THREE.BoxGeometry(0.14, 0.16, 0.04);
      const axeHead = new THREE.Mesh(axeHeadGeo, this.diamondMat);
      axeHead.position.set(0.07, 0.42, 0);
      group.add(axeHead);
    } else if (tool === 'shovel') {
      // Shovel spade
      const spadeGeo = new THREE.BoxGeometry(0.12, 0.16, 0.03);
      const spade = new THREE.Mesh(spadeGeo, this.diamondMat);
      spade.position.set(0, 0.5, 0);
      group.add(spade);
    }

    // Position relative to fist
    group.position.set(0, 0.15, 0.06);
    group.rotation.set(-0.4, 0.2, -0.2);
    this.toolHolder.add(group);
  }

  // Miniature held voxel block
  private buildBlockModel(block: BlockType) {
    const geo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    const mat = textureAtlas.getMaterial(block);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 0.28, 0.08);
    mesh.rotation.set(0.3, 0.5, 0);
    this.blockHolder.add(mesh);
  }

  public triggerSwing() {
    this.isSwinging = true;
    this.swingProgress = 0;
  }

  public update(dt: number, isWalking: boolean, walkTime: number) {
    // 1. Swing animation
    if (this.isSwinging) {
      this.swingProgress += dt * 6.5; // ~150ms swing
      if (this.swingProgress >= 1) {
        this.isSwinging = false;
        this.swingProgress = 0;
      }
    }

    // Calculate swing angle using smooth sinusoidal ease
    const swingSin = Math.sin(this.swingProgress * Math.PI);
    const swingPitch = swingSin * -0.9;
    const swingYaw = swingSin * 0.4;
    const swingRoll = swingSin * -0.3;

    // 2. Walking bobbing
    let bobX = 0;
    let bobY = 0;
    if (isWalking) {
      bobX = Math.sin(walkTime * 8) * 0.02;
      bobY = Math.abs(Math.cos(walkTime * 8)) * 0.025;
    } else {
      // Gentle breathing
      bobY = Math.sin(walkTime * 2) * 0.005;
    }

    // Apply combined transforms
    this.group.position.set(0.35 + bobX, -0.32 - bobY + swingSin * -0.05, -0.55);
    this.armGroup.rotation.set(0.1 + swingPitch, -0.15 + swingYaw, 0.05 + swingRoll);
  }
}
