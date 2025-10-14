// Demo Scene với cơ chế điều khiển RTS
import { ECSWorld } from '../ecs/world.js';
import { MovementSystem } from '../ecs/systems/MovementSystem.js';
import { RenderSystem } from '../ecs/systems/RenderSystem.js';
import { BehaviorSystem } from '../ecs/systems/BehaviorSystem.js';
import { AISystem } from '../ecs/systems/AISystem.js';
import { CollisionSystem } from '../ecs/systems/CollisionSystem.js';
import { EntityFactory } from '../ecs/EntityFactory.js';
import { CombatSystem } from '../ecs/systems/CombatSystem.js';
import { FogOfWarManager } from '../managers/FogOfWarManager.js';
import { GridManager } from '../managers/GridManager.js';
import { PathfindingManager } from '../managers/PathfindingManager.js';
import { SteeringSystem } from '../ecs/systems/SteeringSystem.js';

// Components
import { Position } from '../ecs/components/Position.js';
import { Selectable } from '../ecs/components/Selectable.js';
import { Selected } from '../ecs/components/Selected.js';
import { PlayerUnit } from '../ecs/components/PlayerUnit.js';
import { MoveTarget } from '../ecs/components/MoveTarget.js';
import { Behavior } from '../ecs/components/Behavior.js';
import { AI } from '../ecs/components/AI.js';

// Constants
const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 3200;
const EDGE_MARGIN = 50;
const CAMERA_SCROLL_SPEED = 800;
const TILE_SIZE = 32;

export class DemoScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DemoScene' });
        
        // State management
        this.uiScene = null;
        this.selectedEntities = new Set();
        this.selectionBox = new Phaser.Geom.Rectangle(0, 0, 0, 0);
        this.isDragging = false;
        this.dragStartPoint = new Phaser.Geom.Point(0, 0);
        
        // ⭐ NEW: Theo dõi ID của đơn vị địch đang bị target để highlight
        this.currentAttackTargetId = null;
    }

    create() {
        console.log('RTS Demo Scene Initialized');

        // World & Camera Setup
        this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        
        // ECS World
        this.ecsWorld = new ECSWorld(this); 
        
        // Managers (must be created before systems that use them)
        this.gridManager = new GridManager(WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE);
        this.fogManager = new FogOfWarManager(this, WORLD_WIDTH, WORLD_HEIGHT, TILE_SIZE);
        this.pathfindingManager = new PathfindingManager(this.gridManager);
        this.renderSystem = new RenderSystem(this, this.gridManager, this.fogManager);
        
        // ECS Systems (thứ tự: AI -> Behavior -> Steering -> Movement -> Collision -> Combat -> Render)
        const aiSystem = new AISystem();
        const behaviorSystem = new BehaviorSystem();
        behaviorSystem.ecsWorld = this.ecsWorld;
        const steeringSystem = new SteeringSystem(this);
        const combatSystem = new CombatSystem(this.ecsWorld);

        this.ecsWorld.addSystem(aiSystem);
        this.ecsWorld.addSystem(behaviorSystem);
        this.ecsWorld.addSystem(steeringSystem);
        this.ecsWorld.addSystem(new MovementSystem());
        this.ecsWorld.addSystem(new CollisionSystem());
        this.ecsWorld.addSystem(combatSystem);
        this.ecsWorld.addSystem(this.renderSystem); // Render always runs last
        
        // ⭐ Kết nối RenderSystem với CombatSystem để hiển thị damage text
        combatSystem.renderSystem = this.renderSystem;
        
        this.entityFactory = new EntityFactory(this.ecsWorld);
        
        // Create Units & Buildings
        this.createPlayerUnits();
        this.createEnemyUnits();
        this.createEnemyBuildings();
        
        // Update pathfinding grid after creating all buildings
        this.pathfindingManager.updateGrid();
        this.pathfindingManager.debugGrid();
        this.gridManager.createDebugGraphics(this);

        // UI, Input & Selection
        this.setupCameraControls();
        this.setupRTSControls();
        this.setupUI();
        this.setupPauseControls();

        this.cameras.main.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
        
        // Launch UIScene and setup event listeners
        this.scene.launch('UIScene');
        this.uiScene = this.scene.get('UIScene');
        this.events.on('unitSubselected', this.handleUnitSubselection, this);
        this.events.on('focusOnUnit', this.handleFocusOnUnit, this);
    }

    createPlayerUnits() {
        console.log('Creating player units...');
        this.entityFactory.createPlayerSoldier(WORLD_WIDTH / 2 - 50, WORLD_HEIGHT / 2);
        this.entityFactory.createPlayerSoldier(WORLD_WIDTH / 2 + 50, WORLD_HEIGHT / 2);
    }

    createEnemyUnits() {
        console.log('Creating enemy units...');
        // Create 40 wandering enemy units
        for (let i = 0; i < 40; i++) {
            const x = Phaser.Math.Between(0, WORLD_WIDTH);
            const y = Phaser.Math.Between(0, WORLD_HEIGHT);
            this.entityFactory.createEnemySoldier(x, y);
        }

        // Create 10 chaser enemy units
        console.log('Creating 10 chaser units...');
        for (let i = 0; i < 10; i++) {
            const x = Phaser.Math.Between(0, WORLD_WIDTH);
            const y = Phaser.Math.Between(0, WORLD_HEIGHT);
            this.entityFactory.createChaserEnemy(x, y);
        }
    }

    createEnemyBuildings() {
        console.log('Creating enemy buildings...');
        this.entityFactory.createEnemyBuilding(10, 10);
        this.entityFactory.createEnemyBuilding(55, 45);
        this.entityFactory.createEnemyBuilding(20, 30);
    }
    
    
    setupCameraControls() {
        this.input.on('wheel', this.handleWheel, this);
    }

    handleWheel(pointer, gameObjects, deltaX, deltaY, deltaZ) {
        const currentZoom = this.cameras.main.zoom;
        
        // Allow zoom in (deltaY < 0) or return to original zoom
        if (deltaY < 0) {
            this.cameras.main.zoomTo(1.5, 100);
        } else if (deltaY > 0 && currentZoom > 1) {
            this.cameras.main.zoomTo(1, 100);
        }
    }

    setupRTSControls() {
        console.log("Registering RTS Controls listeners...");
        this.input.mouse.disableContextMenu();
        
        this.input.on('pointerdown', this.handlePointerDown, this);
        this.input.on('pointermove', this.handlePointerMove, this);
        this.input.on('pointerup', this.handlePointerUp, this);
    }
    
    // ⭐ HÀM MỚI: Tìm ID Entity tại một điểm
    findUnitIdAtWorldPoint(worldPoint) {
        // ⭐ TÌM BUILDING TRƯỚC (vì building lớn, dễ click nhầm)
        let foundBuildingId = null;
        let foundUnitId = null;
        
        for (const [entityId, components] of this.ecsWorld.entities) {
            // Chỉ tìm các đơn vị CÓ THỂ LÀ MỤC TIÊU (Có Position, Health, và không phải PlayerUnit)
            if (!components.has('playerUnit') && components.has('position') && components.has('health')) { 
                const pos = components.get('position');
                const appearance = components.get('appearance');
                const size = appearance ? appearance.size : 10;
                
                // Tạo bounds chính xác (hình chữ nhật/vuông)
                const halfSize = size;
                const entityBounds = new Phaser.Geom.Rectangle(
                    pos.x - halfSize, 
                    pos.y - halfSize, 
                    halfSize * 2, 
                    halfSize * 2
                );
                
                if (Phaser.Geom.Rectangle.ContainsPoint(entityBounds, worldPoint)) {
                    if (components.has('building')) {
                        foundBuildingId = entityId;
                    } else {
                        foundUnitId = entityId;
                    }
                }
            }
        }
        
        // ⭐ Ưu tiên trả về Building nếu tìm thấy
        return foundBuildingId || foundUnitId || null;
    }
    
    setupUI() {
        this.fpsText = this.add.text(10, 10, '', {
            fontSize: '16px', fill: '#ffff00'
        }).setScrollFactor(0).setDepth(101);
    }

    setupPauseControls() {
        const handlePause = () => {
            this.scene.pause();
            this.scene.launch('PauseScene');
        };

        this.input.keyboard.on('keydown-P', handlePause);
        this.input.keyboard.on('keydown-ESC', handlePause);
    }

    handleUnitSubselection(entityId) {
        // Clear all selections
        this.selectedEntities.forEach(id => {
            this.ecsWorld.removeComponent(id, 'selected');
        });
        this.selectedEntities.clear();

        // Select only the clicked unit
        this.selectedEntities.add(entityId);
        this.ecsWorld.addComponent(entityId, 'selected', new Selected());
        this.emitSelectionData();
    }
    
    emitSelectionData() {
        const selectedData = [];
        this.selectedEntities.forEach(entityId => {
            const components = this.ecsWorld.entities.get(entityId);
            if (components) {
                selectedData.push({
                    id: entityId,
                    appearance: components.get('appearance'),
                    health: components.get('health'),
                    inventory: components.get('inventory')
                });
            }
        });
        this.events.emit('selectionChanged', selectedData);
    }

    handleFocusOnUnit(entityId) {
        const entity = this.ecsWorld.entities.get(entityId);
        if (entity && entity.has('position')) {
            const pos = entity.get('position');
            this.cameras.main.pan(pos.x, pos.y, 500, 'Sine.easeInOut');
        }
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
        this.fogManager.update(this.ecsWorld.entities);

        this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)} Entities: ${this.ecsWorld.entities.size}`);
        this.events.emit('update');
    }

    handlePointerDown(pointer) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

        // Handle left mouse button
        if (pointer.leftButtonDown()) {
            this.isDragging = true;
            
            // Disable UI input during drag
            if (this.uiScene) {
                this.uiScene.input.enabled = false;
            }
            
            this.dragStartPoint.setTo(worldPoint.x, worldPoint.y);
            this.selectionBox.setPosition(worldPoint.x, worldPoint.y);
            this.selectionBox.setSize(0, 0);

            let unitClickedOn = false;
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

            // Clear selection if clicking on empty area
            if (!unitClickedOn) {
                this.selectedEntities.forEach(entityId => {
                    this.ecsWorld.removeComponent(entityId, 'selected');
                });
                this.selectedEntities.clear();
                this.emitSelectionData();
            }
            
            // ⭐ Bỏ target khi click trái
            this.currentAttackTargetId = null;
            this.renderSystem.setCurrentAttackTarget(null);
        }
        
        // Handle right mouse button (move/attack command)
        if (pointer.rightButtonDown()) {
            const targetId = this.findUnitIdAtWorldPoint(worldPoint);
            
            if (targetId && this.selectedEntities.size > 0) {
                // ⭐ LỆNH TẤN CÔNG (Attack-Move)
                
                // 1. Highlight mục tiêu
                this.currentAttackTargetId = targetId;
                this.renderSystem.setCurrentAttackTarget(targetId);
                
                // 2. Gán mục tiêu và chuyển sang hành vi CHASE cho các đơn vị đã chọn
                this.selectedEntities.forEach(entityId => {
                    const entity = this.ecsWorld.entities.get(entityId);
                    if (!entity) return;
                    
                    const ai = entity.get('ai');
                    const behavior = entity.get('behavior');
                    
                    if (ai && behavior) {
                        ai.setTargetId(targetId); // Set target ID trong Component AI
                        // ⭐ THÊM FLAG: manualAttack = true để bỏ qua giới hạn detectionRange
                        behavior.setBehavior('chase', { manualAttack: true }); 
                        
                        // Xóa MoveTarget nếu có
                        this.ecsWorld.removeComponent(entityId, 'moveTarget');
                    }
                });
                
            } else if (this.selectedEntities.size > 0) {
                // ⭐ LỆNH DI CHUYỂN (Move-to-Point)
                this.currentAttackTargetId = null; // Bỏ target cũ
                this.renderSystem.setCurrentAttackTarget(null);
                
                const endGridPos = this.gridManager.worldToGrid(worldPoint.x, worldPoint.y);
                this.selectedEntities.forEach(entityId => {
                    const entity = this.ecsWorld.entities.get(entityId);
                    if (!entity) return;
                    
                    const ai = entity.get('ai');
                    // Xóa target cũ nếu có
                    if (ai) ai.clearTarget();
                    
                    const pos = entity.get('position');
                    const startGridPos = this.gridManager.worldToGrid(pos.x, pos.y);
                    this.pathfindingManager.findPath(startGridPos, endGridPos, (path) => {
                        if (path) {
                            ai.setPath(path);
                            entity.get('behavior').setBehavior('followPath');
                        }
                    });
                });
            }
        }
    }

    handlePointerMove(pointer) {
        if (!this.isDragging) return;

        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.selectionBox.width = worldPoint.x - this.dragStartPoint.x;
        this.selectionBox.height = worldPoint.y - this.dragStartPoint.y;
        this.renderSystem.setSelectionBox(this.selectionBox);
    }

    handlePointerUp(pointer) {
        if (!this.isDragging || !pointer.leftButtonReleased()) {
             if (!this.isDragging) this.isDragging = false;
             return;
        }

        this.isDragging = false;
        
        // Re-enable UI input
        if (this.uiScene) {
            this.uiScene.input.enabled = true;
        }
        
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
        
        // Clear and reselect entities
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

                if (isSingleClick) {
                    if (Phaser.Geom.Rectangle.ContainsPoint(entityBounds, new Phaser.Geom.Point(selectionRect.x, selectionRect.y))) {
                        this.ecsWorld.addComponent(entityId, 'selected', new Selected());
                        this.selectedEntities.add(entityId);
                        break; 
                    }
                } else {
                    if (Phaser.Geom.Intersects.RectangleToRectangle(selectionRect, entityBounds)) {
                        this.ecsWorld.addComponent(entityId, 'selected', new Selected());
                        this.selectedEntities.add(entityId);
                    }
                }
            }
        }

        this.emitSelectionData();
    }

    shutdown() {
        console.log("DemoScene shutting down. Cleaning up all listeners...");
        this.input.off('wheel', this.handleWheel, this);
        this.input.off('pointerdown', this.handlePointerDown, this);
        this.input.off('pointermove', this.handlePointerMove, this);
        this.input.off('pointerup', this.handlePointerUp, this);
    }
}