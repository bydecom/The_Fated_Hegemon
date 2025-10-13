// Demo Scene với cơ chế điều khiển RTS
import { ECSWorld } from '../ecs/world.js';
import { MovementSystem } from '../ecs/systems/MovementSystem.js';
import { RenderSystem } from '../ecs/systems/RenderSystem.js';
import { BehaviorSystem } from '../ecs/systems/BehaviorSystem.js';
import { AISystem } from '../ecs/systems/AISystem.js';
import { EntityFactory } from '../ecs/EntityFactory.js';

// --- Components (lưu ý đường dẫn đã được sửa) ---
import { Position } from '../ecs/components/Position.js';
import { Selectable } from '../ecs/components/Selectable.js';
import { Selected } from '../ecs/components/Selected.js';
import { PlayerUnit } from '../ecs/components/PlayerUnit.js';
import { MoveTarget } from '../ecs/components/MoveTarget.js';
import { Behavior } from '../ecs/components/Behavior.js';

// --- Constants ---
const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 3200;
const EDGE_MARGIN = 50;
const CAMERA_SCROLL_SPEED = 800;

export class DemoScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DemoScene' });
    }

    create() {
        console.log('RTS Demo Scene Initialized');

        // --- World & Camera Setup ---
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        
        // --- ECS World ---
        this.ecsWorld = new ECSWorld(this); 
        
        this.renderSystem = new RenderSystem(this);
        this.ecsWorld.addSystem(new MovementSystem());
        this.ecsWorld.addSystem(this.renderSystem);
        this.ecsWorld.addSystem(new BehaviorSystem());
        this.ecsWorld.addSystem(new AISystem());
        
        this.entityFactory = new EntityFactory(this.ecsWorld);
        
        // --- Create Units ---
        this.createPlayerUnits();
        this.createEnemyUnits();
        
        // --- Fog of War ---
        this.fog = this.add.renderTexture(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.fog.fill(0x000000); // Lấp đầy bằng màu đen
        this.fog.setDepth(100); // Đảm bảo sương mù luôn ở trên cùng
        
        const fogBrushGraphics = this.make.graphics();
        fogBrushGraphics.fillStyle(0xffffff);
        fogBrushGraphics.fillCircle(256, 256, 256);
        fogBrushGraphics.generateTexture('fogBrush', 512, 512);
        fogBrushGraphics.destroy();

        // --- UI, Input & Selection ---
        this.setupCameraControls();
        this.setupRTSControls();
        this.setupUI();

        this.cameras.main.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
    }

    createPlayerUnits() {
        console.log('Creating player units...');
        // SỬA LỖI: Gọi hàm mới createPlayerSoldier
        this.entityFactory.createPlayerSoldier(WORLD_WIDTH / 2 - 50, WORLD_HEIGHT / 2);
        this.entityFactory.createPlayerSoldier(WORLD_WIDTH / 2 + 50, WORLD_HEIGHT / 2);
    }

    createEnemyUnits() {
        console.log('Creating 50 enemy units...');
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, WORLD_WIDTH);
            const y = Phaser.Math.Between(0, WORLD_HEIGHT);
            // SỬA LỖI: Gọi hàm mới createEnemySoldier
            this.entityFactory.createEnemySoldier(x, y);
        }
    }
    
    setupCameraControls() {
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const newZoom = this.cameras.main.zoom - deltaY * 0.001;
            this.cameras.main.zoomTo(Phaser.Math.Clamp(newZoom, 0.5, 2), 100);
        });
    }

    setupRTSControls() {
        this.selectedEntities = new Set();
        this.selectionBox = new Phaser.Geom.Rectangle(0, 0, 0, 0);
        let startX = 0;
        let startY = 0;

        this.input.on('pointerdown', (pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

            if (pointer.leftButtonDown()) {
                startX = worldPoint.x;
                startY = worldPoint.y;
                this.selectionBox.setPosition(startX, startY);
                
                let unitClickedOn = false;
                // Kiểm tra xem có click trúng lính không
                for (const [entityId, components] of this.ecsWorld.entities) {
                    if (components.has('selectable') && components.has('position')) {
                         const pos = components.get('position');
                         const appearance = components.get('appearance');
                         const size = appearance ? appearance.size : 10;
                         const entityBounds = new Phaser.Geom.Rectangle(pos.x - size, pos.y - size, size * 2, size * 2);
                         if (Phaser.Geom.Rectangle.ContainsPoint(entityBounds, worldPoint)) {
                             unitClickedOn = true;
                             break;
                         }
                    }
                }

                // Nếu không click trúng lính nào, bỏ chọn tất cả
                if (!unitClickedOn) {
                    this.selectedEntities.forEach(entityId => {
                        this.ecsWorld.removeComponent(entityId, 'selected');
                    });
                    this.selectedEntities.clear();
                }
            }
            
            if (pointer.rightButtonDown()) {
                this.selectedEntities.forEach(entityId => {
                    const entity = this.ecsWorld.entities.get(entityId);
                    if (entity) {
                         this.ecsWorld.addComponent(entityId, 'moveTarget', new MoveTarget(worldPoint.x, worldPoint.y));
                         entity.get('behavior').setBehavior('moveToTarget');
                    }
                });
            }
        });

        this.input.on('pointermove', (pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            if (pointer.leftButtonDown()) {
                this.selectionBox.width = worldPoint.x - startX;
                this.selectionBox.height = worldPoint.y - startY;
                this.renderSystem.setSelectionBox(this.selectionBox);
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (pointer.leftButtonReleased()) {
                this.renderSystem.clearSelectionBox();
                
                const selectionRect = Phaser.Geom.Rectangle.Clone(this.selectionBox);
                if (selectionRect.width < 0) {
                    selectionRect.x += selectionRect.width;
                    selectionRect.width *= -1;
                }
                if (selectionRect.height < 0) {
                    selectionRect.y += selectionRect.height;
                    selectionRect.height *= -1;
                }
                
                const isSingleClick = selectionRect.width < 10 && selectionRect.height < 10;
                
                // Bỏ chọn tất cả trước khi chọn mới
                this.selectedEntities.forEach(entityId => {
                    this.ecsWorld.removeComponent(entityId, 'selected');
                });
                this.selectedEntities.clear();
                
                for (const [entityId, components] of this.ecsWorld.entities) {
                     if (components.has('selectable') && components.has('position')) {
                        const pos = components.get('position');
                        const appearance = components.get('appearance');
                        const size = appearance ? appearance.size : 10;
                        const entityBounds = new Phaser.Geom.Rectangle(pos.x - size, pos.y - size, size * 2, size * 2);

                        if (isSingleClick && Phaser.Geom.Rectangle.ContainsPoint(entityBounds, new Phaser.Geom.Point(selectionRect.x, selectionRect.y))) {
                            this.ecsWorld.addComponent(entityId, 'selected', new Selected());
                            this.selectedEntities.add(entityId);
                            return; 
                        }
                        
                        if (!isSingleClick && Phaser.Geom.Intersects.RectangleToRectangle(selectionRect, entityBounds)) {
                            this.ecsWorld.addComponent(entityId, 'selected', new Selected());
                            this.selectedEntities.add(entityId);
                        }
                    }
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
        const pointer = this.input.activePointer;
        const { width, height } = this.scale;
        const scrollSpeed = CAMERA_SCROLL_SPEED / this.cameras.main.zoom;
        const deltaInSeconds = delta / 1000;

        if (pointer.x < EDGE_MARGIN) this.cameras.main.scrollX -= scrollSpeed * deltaInSeconds;
        else if (pointer.x > width - EDGE_MARGIN) this.cameras.main.scrollX += scrollSpeed * deltaInSeconds;

        if (pointer.y < EDGE_MARGIN) this.cameras.main.scrollY -= scrollSpeed * deltaInSeconds;
        else if (pointer.y > height - EDGE_MARGIN) this.cameras.main.scrollY += scrollSpeed * deltaInSeconds;
    }

    update(time, delta) {
        this.handleEdgeScroll(delta);
        this.ecsWorld.update(delta);
        
        this.fog.fill(0x000000, 0.995); 
        for (const [entityId, components] of this.ecsWorld.entities) {
            if (components.has('playerUnit') && components.has('position')) {
                const pos = components.get('position');
                this.fog.erase('fogBrush', pos.x - 256, pos.y - 256);
            }
        }

        this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)} Entities: ${this.ecsWorld.entities.size}`);
    }
}