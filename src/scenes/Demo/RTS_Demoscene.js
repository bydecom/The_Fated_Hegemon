// Demo Scene với nhiều entity có hành vi khác nhau
import { ECSWorld } from '../../ecs/world.js';
import { MovementSystem } from '../../ecs/systems/MovementSystem.js';
import { RenderSystem } from '../../ecs/systems/RenderSystem.js';
import { BehaviorSystem } from '../../ecs/systems/BehaviorSystem.js';
import { AISystem } from '../../ecs/systems/AISystem.js';
import { EntityFactory } from '../../ecs/EntityFactory.js';
import { Position } from '../../ecs/components/Position.js';
import { Velocity } from '../../ecs/components/Velocity.js';
import { Health } from '../../ecs/components/Health.js';
import { Behavior } from '../../ecs/components/Behavior.js';
import { Appearance } from '../../ecs/components/Appearance.js';
import { AI } from '../../ecs/components/AI.js';

// --- Constants ---
const GRID_SIZE = 64;
const WORLD_WIDTH = GRID_SIZE * 50; // Map size 50x50 grid cells
const WORLD_HEIGHT = GRID_SIZE * 50;
const EDGE_MARGIN = 50; // Vùng rìa màn hình để kích hoạt cuộn camera, tính bằng pixel
const CAMERA_SCROLL_SPEED = 800; // Tốc độ cuộn camera, pixel trên giây
const ACTIVATION_BUFFER = 500; // Vùng đệm xung quanh camera để giữ cho AI hoạt động

export class DemoScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DemoScene' });
        // SỬA LỖI: Thêm một cờ để kiểm tra xem camera đã follow hay chưa
        this.cameraHasFollowed = false;
    }

    create() {
        console.log('DemoScene created with new features!');

        // --- 1. World & Camera Setup ---
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        
        // --- 2. Grid System ---
        this.add.grid(0, 0, WORLD_WIDTH * 2, WORLD_HEIGHT * 2, GRID_SIZE, GRID_SIZE, 0xffffff, 0.08).setOrigin(0,0);
        
        this.ghostBuilding = this.add.rectangle(0, 0, GRID_SIZE, GRID_SIZE, 0x00ff00, 0.3).setOrigin(0,0).setVisible(false);

        // --- 3. ECS World ---
        this.ecsWorld = new ECSWorld();
        
        this.renderSystem = new RenderSystem(this);
        this.ecsWorld.addSystem(new MovementSystem());
        this.ecsWorld.addSystem(this.renderSystem);
        this.ecsWorld.addSystem(new BehaviorSystem(this));
        this.ecsWorld.addSystem(new AISystem(this));
        
        this.entityFactory = new EntityFactory(this.ecsWorld);
        
        // --- 4. Create Entities ---
        const playerX = WORLD_WIDTH / 2;
        const playerY = WORLD_HEIGHT / 2;
        this.player = this.entityFactory.createChaserEntity(playerX, playerY);
        this.ecsWorld.addComponent(this.player, 'playerControlled', {});

        this.createEntities();
        
        // --- 5. Camera Follow & Controls ---
        // SỬA LỖI: Xóa dòng this.cameras.main.startFollow(...) ở đây
        this.cameras.main.setZoom(1);
        this.setupCameraControls();

        // --- 6. Fog of War ---
        this.fog = this.add.renderTexture(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.fog.fill(0x000000);
        this.fog.setDepth(100);
        this.fogBrush = this.make.graphics();
        this.fogBrush.fillStyle(0xffffff);
        this.fogBrush.fillCircle(256, 256, 256);
        this.fogBrush.generateTexture('fogBrush', 512, 512);
        this.fogBrush.destroy();

        // --- UI & Input ---
        this.setupInput();
        this.setupUI();
    }

    createEntities() {
        console.log('Creating 100 random entities...');
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, WORLD_WIDTH);
            const y = Phaser.Math.Between(0, WORLD_HEIGHT);
            this.entityFactory.createWandererEntity(x, y);
        }
    }

    setupCameraControls() {
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const newZoom = this.cameras.main.zoom - deltaY * 0.001;
            this.cameras.main.zoomTo(Phaser.Math.Clamp(newZoom, 0.5, 3), 100);
        });

        this.input.on('pointermove', (pointer) => {
             // SỬA LỖI: Thêm kiểm tra pointer.prevPosition để tránh lỗi ở frame đầu tiên
            if (pointer.rightButtonDown() && pointer.prevPosition) {
                this.cameras.main.stopFollow();
                this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x) / this.cameras.main.zoom;
                this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y) / this.cameras.main.zoom;
            }
        });
    }

    setupInput() {
        this.input.keyboard.on('keydown-B', () => {
            this.ghostBuilding.setVisible(!this.ghostBuilding.visible);
        });

        this.input.on('pointermove', (pointer) => {
            if (this.ghostBuilding.visible) {
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const gridX = Math.floor(worldPoint.x / GRID_SIZE);
                const gridY = Math.floor(worldPoint.y / GRID_SIZE);
                this.ghostBuilding.setPosition(gridX * GRID_SIZE, gridY * GRID_SIZE);
            }
        });

        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown() && this.ghostBuilding.visible) {
                this.entityFactory.createStaticEntity(this.ghostBuilding.x, this.ghostBuilding.y);
                this.ghostBuilding.setVisible(false);
            }
        });

        this.input.keyboard.on('keydown-F', () => {
            if (this.cameraHasFollowed) {
                const playerSprite = this.renderSystem.sprites.get(this.player);
                if (playerSprite) {
                    this.cameras.main.startFollow(playerSprite, true, 0.1, 0.1);
                }
            }
        });
    }
    
    setupUI() {
        this.fpsText = this.add.text(10, 10, '', {
            fontSize: '16px', fill: '#ffff00'
        }).setScrollFactor(0).setDepth(101);
    }
    
    handleEdgeScroll(delta) {
        if (this.ghostBuilding.visible) return;

        const pointer = this.input.activePointer;
        const { width, height } = this.scale;
        const scrollSpeed = CAMERA_SCROLL_SPEED / this.cameras.main.zoom;
        const deltaInSeconds = delta / 1000;
        let scrolled = false;

        if (pointer.x < EDGE_MARGIN) {
            this.cameras.main.scrollX -= scrollSpeed * deltaInSeconds;
            scrolled = true;
        } else if (pointer.x > width - EDGE_MARGIN) {
            this.cameras.main.scrollX += scrollSpeed * deltaInSeconds;
            scrolled = true;
        }

        if (pointer.y < EDGE_MARGIN) {
            this.cameras.main.scrollY -= scrollSpeed * deltaInSeconds;
            scrolled = true;
        } else if (pointer.y > height - EDGE_MARGIN) {
            this.cameras.main.scrollY += scrollSpeed * deltaInSeconds;
            scrolled = true;
        }

        if (scrolled) this.cameras.main.stopFollow();
    }

    update(time, delta) {
        this.handleEdgeScroll(delta);

        const cameraBounds = this.cameras.main.worldView;
        const activationBounds = new Phaser.Geom.Rectangle(
            cameraBounds.x - ACTIVATION_BUFFER,
            cameraBounds.y - ACTIVATION_BUFFER,
            cameraBounds.width + ACTIVATION_BUFFER * 2,
            cameraBounds.height + ACTIVATION_BUFFER * 2
        );

        const onScreenEntities = new Map();
        const activeEntities = new Map();

        for(const [id, components] of this.ecsWorld.entities.entries()){
            const pos = components.get('position');
            if (pos) {
                if (Phaser.Geom.Rectangle.Contains(activationBounds, pos.x, pos.y)) {
                    activeEntities.set(id, components);
                }
                if (Phaser.Geom.Rectangle.Contains(cameraBounds, pos.x, pos.y)) {
                    onScreenEntities.set(id, components);
                }
            }
        }
        
        this.ecsWorld.systems.find(s => s instanceof MovementSystem).update(delta, this.ecsWorld.entities);
        this.ecsWorld.systems.find(s => s instanceof BehaviorSystem).update(delta, activeEntities);
        this.ecsWorld.systems.find(s => s instanceof AISystem).update(delta, activeEntities);
        this.renderSystem.update(delta, onScreenEntities);
        
        // SỬA LỖI: Logic mới để trì hoãn camera follow
        if (!this.cameraHasFollowed) {
            // Thử lấy sprite của người chơi
            const playerSprite = this.renderSystem.sprites.get(this.player);
            // Nếu sprite đã tồn tại (tức là RenderSystem đã chạy ít nhất 1 lần)
            if (playerSprite) {
                // Thì mới bắt đầu follow
                this.cameras.main.startFollow(playerSprite, true, 0.1, 0.1);
                // Và đặt cờ để không chạy lại logic này nữa
                this.cameraHasFollowed = true;
            }
        }
        
        const playerPos = this.ecsWorld.entities.get(this.player)?.get('position');
        if (playerPos) {
            this.fog.erase('fogBrush', playerPos.x - 256, playerPos.y - 256);
        }

        this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)} Entities: ${onScreenEntities.size}/${this.ecsWorld.entities.size}`);
    }
}