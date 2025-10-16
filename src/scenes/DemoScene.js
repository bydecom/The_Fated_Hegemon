// Demo Scene với cơ chế điều khiển RTS
import { ECSWorld } from '../ecs/world.js';
import { MovementSystem } from '../ecs/systems/MovementSystem.js';
import { RenderSystem } from '../ecs/systems/RenderSystem.js';
import { BehaviorSystem } from '../ecs/systems/BehaviorSystem.js';
import { AISystem } from '../ecs/systems/AISystem.js';
import { CollisionSystem } from '../ecs/systems/CollisionSystem.js';
import { EntityFactory } from '../ecs/EntityFactory.js';
import { CombatSystem } from '../ecs/systems/CombatSystem.js';
import { CombatResponseSystem } from '../ecs/systems/CombatResponseSystem.js';
import { FogOfWarManager } from '../managers/FogOfWarManager.js';
import { GridManager } from '../managers/GridManager.js';
import { PathfindingManager } from '../managers/PathfindingManager.js';
import { ResourceManager } from '../managers/ResourceManager.js';
import { SteeringSystem } from '../ecs/systems/SteeringSystem.js';
import { HarvestSystem } from '../ecs/systems/HarvestSystem.js';
import { AnimationManager } from '../managers/AnimationManager.js';
import { AnimationSystem } from '../ecs/systems/AnimationSystem.js';
import { SpriteSheetManager } from '../managers/SpriteSheetManager.js';

// Components
import { Position } from '../ecs/components/Position.js';
import { Selectable } from '../ecs/components/Selectable.js';
import { Selected } from '../ecs/components/Selected.js';
import { PlayerUnit } from '../ecs/components/PlayerUnit.js';
import { MoveTarget } from '../ecs/components/MoveTarget.js';
import { Behavior } from '../ecs/components/Behavior.js';
import { AI } from '../ecs/components/AI.js';
import { DefencePosition } from '../ecs/components/DefencePosition.js';

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
        this.currentHarvestTargetId = null; // ⭐ ID mỏ tài nguyên đang thu hoạch
        
        // ⭐ NEW: Track active command from UI
        this.currentCommand = null; // 'attack', 'stop', 'defence', 'patrol'
        this.patrolStartPoint = null; // For patrol command
    }

    preload() {
        console.log('Loading assets...');
        
        // ⭐ Initialize SpriteSheetManager trước khi sử dụng
        this.spriteSheetManager = new SpriteSheetManager(this);
        
        // ⭐ Load animal sprite sheet
        this.spriteSheetManager.loadAnimalSpriteSheet();
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
        this.resourceManager = new ResourceManager(); // ⭐ NEW: Resource Manager
        this.animationManager = new AnimationManager(this); // ⭐ NEW: Animation Manager
        // ⭐ spriteSheetManager đã được khởi tạo trong preload()
        this.renderSystem = new RenderSystem(this, this.gridManager, this.fogManager);
        
        // ECS Systems (thứ tự: AI -> Behavior -> Steering -> Movement -> Collision -> Combat -> Render)
        const aiSystem = new AISystem();
        const behaviorSystem = new BehaviorSystem();
        behaviorSystem.ecsWorld = this.ecsWorld;
        const steeringSystem = new SteeringSystem(this);
        const combatSystem = new CombatSystem(this.ecsWorld);
        const combatResponseSystem = new CombatResponseSystem(this.ecsWorld);

        // ⭐ Kết nối CombatSystem với CombatResponseSystem
        combatSystem.combatResponseSystem = combatResponseSystem;

        this.ecsWorld.addSystem(aiSystem);
        this.ecsWorld.addSystem(behaviorSystem);
        this.ecsWorld.addSystem(steeringSystem);
        this.ecsWorld.addSystem(new MovementSystem());
        this.ecsWorld.addSystem(new CollisionSystem());
        this.ecsWorld.addSystem(combatSystem);
        this.ecsWorld.addSystem(combatResponseSystem); // ⭐ NEW: Combat response system
        this.ecsWorld.addSystem(new HarvestSystem(this, this.resourceManager)); // ⭐ NEW: Harvest system
        this.ecsWorld.addSystem(new AnimationSystem(this.animationManager)); // ⭐ NEW: Animation system
        this.ecsWorld.addSystem(this.renderSystem); // Render always runs last
        
        // ⭐ Kết nối RenderSystem với CombatSystem để hiển thị damage text
        combatSystem.renderSystem = this.renderSystem;
        
        // ⭐ NEW: Cập nhật AnimationManager để sử dụng sprite
        this.spriteSheetManager.updateAnimationManager(this.animationManager);
        
        this.entityFactory = new EntityFactory(this.ecsWorld);
        
        // Create Units & Buildings
        this.createPlayerUnits();
        this.createEnemyUnits();
        this.createEnemyBuildings();
        this.createResources(); // ⭐ TẠO TÀI NGUYÊN
        
        // Update pathfinding grid after creating all buildings
        this.pathfindingManager.updateGrid();
        this.pathfindingManager.debugGrid();
        this.gridManager.createDebugGraphics(this);

        // UI, Input & Selection
        this.setupCameraControls();
        this.setupRTSControls();
        this.setupUI();
        this.setupPauseControls();
        this.setupCommandHotkeys(); // ⭐ NEW: Hotkeys A, S, D, P

        this.cameras.main.centerOn(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
        
        // Launch UIScene and setup event listeners
        this.scene.launch('UIScene');
        this.uiScene = this.scene.get('UIScene');
        this.events.on('unitSubselected', this.handleUnitSubselection, this);
        this.events.on('focusOnUnit', this.handleFocusOnUnit, this);
        
        // ⭐ NEW: Listen for command activation from UI
        this.events.on('commandActivated', (commandKey) => {
            this.currentCommand = commandKey;
            console.log(`🎮 Command set: ${commandKey}`);
        }, this);
        
        // ⭐ Pass ResourceManager to UIScene
        this.uiScene.resourceManager = this.resourceManager;
        this.uiScene.updateResourceDisplay(this.resourceManager);
    }

    createPlayerUnits() {
        console.log('Creating player units...');
        
        // ⭐ TẠO NHÀ CHÍNH TRƯỚC
        this.entityFactory.createPlayerBase(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
        
        // Tạo lính xung quanh nhà chính
        this.entityFactory.createPlayerSoldier(WORLD_WIDTH / 2 - 50, WORLD_HEIGHT / 2);
        this.entityFactory.createPlayerSoldier(WORLD_WIDTH / 2 + 50, WORLD_HEIGHT / 2);
        
        // ⭐ TẠO ĐƠN VỊ THU HOẠCH
        this.entityFactory.createHarvesterUnit(WORLD_WIDTH / 2 - 100, WORLD_HEIGHT / 2);
        this.entityFactory.createHarvesterUnit(WORLD_WIDTH / 2 + 100, WORLD_HEIGHT / 2);
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

    // ⭐ TẠO TÀI NGUYÊN
    createResources() {
        console.log('Creating resources...');
        
        // Tạo cây (gỗ)
        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.Between(100, WORLD_WIDTH - 100);
            const y = Phaser.Math.Between(100, WORLD_HEIGHT - 100);
            this.entityFactory.createTree(x, y, Phaser.Math.Between(800, 1200));
        }
        
        // Tạo mỏ vàng
        for (let i = 0; i < 8; i++) {
            const x = Phaser.Math.Between(200, WORLD_WIDTH - 200);
            const y = Phaser.Math.Between(200, WORLD_HEIGHT - 200);
            this.entityFactory.createGoldMine(x, y, Phaser.Math.Between(400, 600));
        }
        
        // Tạo mỏ bạc
        for (let i = 0; i < 6; i++) {
            const x = Phaser.Math.Between(150, WORLD_WIDTH - 150);
            const y = Phaser.Math.Between(150, WORLD_HEIGHT - 150);
            this.entityFactory.createSilverMine(x, y, Phaser.Math.Between(250, 350));
        }
        
        // Tạo mỏ đá
        for (let i = 0; i < 10; i++) {
            const x = Phaser.Math.Between(180, WORLD_WIDTH - 180);
            const y = Phaser.Math.Between(180, WORLD_HEIGHT - 180);
            this.entityFactory.createStoneMine(x, y, Phaser.Math.Between(600, 1000));
        }
        
        // Tạo hồ nước
        for (let i = 0; i < 12; i++) {
            const x = Phaser.Math.Between(120, WORLD_WIDTH - 120);
            const y = Phaser.Math.Between(120, WORLD_HEIGHT - 120);
            this.entityFactory.createWaterSource(x, y, Phaser.Math.Between(300, 500));
        }
        
        // Tạo động vật
        for (let i = 0; i < 20; i++) {
            const x = Phaser.Math.Between(80, WORLD_WIDTH - 80);
            const y = Phaser.Math.Between(80, WORLD_HEIGHT - 80);
            this.entityFactory.createAnimal(x, y, Phaser.Math.Between(150, 250));
        }
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
    
    // ⭐ HÀM MỚI: Xác định loại target và thực hiện hành vi tương ứng
    executeRightClickBehavior(worldPoint) {
        const resourceId = this.findResourceNodeAtWorldPoint(worldPoint);
        const targetId = this.findUnitIdAtWorldPoint(worldPoint);
        
        // Xác định loại target
        let targetType = 'emptySpace';
        if (resourceId) {
            targetType = 'resourceNode';
        } else if (targetId) {
            const targetEntity = this.ecsWorld.entities.get(targetId);
            if (targetEntity) {
                const entityType = targetEntity.get('entityType');
                const isPlayerUnit = targetEntity.has('playerUnit');
                
                if (entityType.isBuilding()) {
                    targetType = isPlayerUnit ? 'playerBuilding' : 'enemyBuilding';
                } else if (entityType.isUnit()) {
                    targetType = isPlayerUnit ? 'playerUnit' : 'enemyUnit';
                } else if (entityType.isAnimal()) {
                    targetType = 'animal';
                }
            }
        }
        
        // Thực hiện hành vi cho từng đơn vị được chọn
        this.selectedEntities.forEach(entityId => {
            const entity = this.ecsWorld.entities.get(entityId);
            if (!entity) return;
            
            const clickBehavior = entity.get('clickBehavior');
            if (!clickBehavior) return;
            
            const behavior = clickBehavior.getBehaviorForTarget(targetType);
            console.log(`🎯 Unit ${entityId}: ${targetType} → ${behavior}`);
            
            // Thực hiện hành vi tương ứng
            switch (behavior) {
                case 'chase':
                    if (targetId) this.executeAttackCommand(targetId, worldPoint);
                    break;
                case 'attack':
                    if (targetId) this.executeAttackCommand(targetId, worldPoint);
                    break;
                case 'harvest':
                    if (resourceId) this.executeHarvestResourceCommand(resourceId, worldPoint);
                    else this.executeHarvestCommand(worldPoint);
                    break;
                case 'fix':
                    if (targetId) this.executeFixCommand(targetId, worldPoint);
                    break;
                case 'move':
                default:
                    this.executeMoveCommand(worldPoint);
                    break;
            }
        });
    }

    // ⭐ HÀM MỚI: Tìm ID Entity tại một điểm
    findUnitIdAtWorldPoint(worldPoint) {
        // ⭐ TÌM BUILDING TRƯỚC (vì building lớn, dễ click nhầm)
        let foundBuildingId = null;
        let foundUnitId = null;
        
        for (const [entityId, components] of this.ecsWorld.entities) {
            // Chỉ tìm các đơn vị CÓ THỂ LÀ MỤC TIÊU (Có Position, Health, và không phải PlayerUnit)
            if (!components.has('playerUnit') && components.has('position') && components.has('health') && components.has('entityType')) { 
                const pos = components.get('position');
                const appearance = components.get('appearance');
                const entityType = components.get('entityType');
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
                    if (entityType.isBuilding()) {
                        foundBuildingId = entityId;
                    } else if (entityType.isUnit() || entityType.isAnimal()) {
                        foundUnitId = entityId;
                    }
                }
            }
        }
        
        // ⭐ Ưu tiên trả về Building nếu tìm thấy
        return foundBuildingId || foundUnitId || null;
    }

    // ⭐ Tìm Resource Node tại vị trí click
    findResourceNodeAtWorldPoint(worldPoint) {
        for (const [entityId, components] of this.ecsWorld.entities) {
            // Tìm các entity có resourceNode và position (nhưng không có health vì đó là mỏ tài nguyên tĩnh)
            if (components.has('resourceNode') && components.has('position') && components.has('entityType')) {
                const entityType = components.get('entityType');
                if (entityType.isResource()) { // Chỉ tìm resource nodes tĩnh
                const pos = components.get('position');
                const appearance = components.get('appearance');
                const size = appearance ? appearance.size : 10;
                
                const halfSize = size;
                const entityBounds = new Phaser.Geom.Rectangle(
                    pos.x - halfSize, 
                    pos.y - halfSize, 
                    halfSize * 2, 
                    halfSize * 2
                );
                
                    if (Phaser.Geom.Rectangle.ContainsPoint(entityBounds, worldPoint)) {
                        const resourceNode = components.get('resourceNode');
                        if (resourceNode && resourceNode.hasResources()) {
                            console.log(`🎯 Found resource ${resourceNode.resourceType} at (${pos.x}, ${pos.y})`);
                            return entityId;
                        }
                    }
                }
            }
        }
        console.log(`❌ No resource found at (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`);
        return null;
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

        // P key chỉ pause khi không có units selected (tránh conflict với Patrol)
        this.input.keyboard.on('keydown-P', () => {
            if (this.selectedEntities.size === 0) {
                handlePause();
            }
        });
        this.input.keyboard.on('keydown-ESC', handlePause);
    }
    
    // ⭐ NEW: Setup command hotkeys
    setupCommandHotkeys() {
        // A - Attack
        this.input.keyboard.on('keydown-A', () => {
            if (this.selectedEntities.size > 0) {
                this.activateCommand('attack');
            }
        });
        
        // S - Stop
        this.input.keyboard.on('keydown-S', () => {
            if (this.selectedEntities.size > 0) {
                this.activateCommand('stop');
            }
        });
        
        // D - Defence
        this.input.keyboard.on('keydown-D', () => {
            if (this.selectedEntities.size > 0) {
                this.activateCommand('defence');
            }
        });
        
        // P - Patrol (chỉ khi có units selected)
        this.input.keyboard.on('keydown-P', () => {
            if (this.selectedEntities.size > 0) {
                this.activateCommand('patrol');
            }
        });
        
        // H - Harvest (chỉ khi có harvester units selected)
        this.input.keyboard.on('keydown-H', () => {
            if (this.selectedEntities.size > 0) {
                this.activateCommand('harvest');
            }
        });
    }
    
    // ⭐ Helper: Activate command từ hotkey
    activateCommand(commandKey) {
        const commandData = {
            'attack': { cursor: 'crosshair' },
            'stop': { cursor: 'default' },
            'defence': { cursor: 'help' },
            'patrol': { cursor: 'pointer' },
            'harvest': { cursor: 'grab' }
        };
        
        const command = commandData[commandKey];
        if (!command) return;
        
        // Set command
        this.currentCommand = commandKey;
        this.input.setDefaultCursor(command.cursor);
        
        // Notify UI to highlight button
        this.events.emit('commandActivated', commandKey);
        
        // For Stop command, execute immediately (không cần click)
        if (commandKey === 'stop') {
            this.executeStopCommand();
            this.currentCommand = null;
            this.input.setDefaultCursor('default');
            if (this.uiScene) {
                this.uiScene.resetCommand();
            }
        }
        
        console.log(`⌨️ Hotkey: ${commandKey.toUpperCase()} activated`);
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
        
        // ⭐ Update unit count
        this.updateUnitCount();
        
        this.events.emit('update');
    }
    
    // ⭐ Count player units and update ResourceManager
    updateUnitCount() {
        let playerUnitCount = 0;
        
        for (const [entityId, components] of this.ecsWorld.entities) {
            if (components.has('playerUnit') && components.has('health')) {
                playerUnitCount++;
            }
        }
        
        this.resourceManager.setUnitCount(playerUnitCount);
        
        // Update UI every frame
        if (this.uiScene && this.uiScene.updateResourceDisplay) {
            this.uiScene.updateResourceDisplay(this.resourceManager);
        }
    }

    handlePointerDown(pointer) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

        // ⭐ Handle left mouse button
        if (pointer.leftButtonDown()) {
            // ⭐ Nếu đang có command active → CANCEL command
            if (this.currentCommand) {
                console.log(`❌ Command cancelled: ${this.currentCommand}`);
                this.currentCommand = null;
                this.patrolStartPoint = null; // Reset patrol start
                this.input.setDefaultCursor('default');
                
                if (this.uiScene) {
                    this.uiScene.resetCommand();
                }
                return; // Không làm gì thêm
            }
            
            // ⭐ Nếu KHÔNG có command → Enable dragging như bình thường
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
            
            // Bỏ target khi click trái
            this.currentAttackTargetId = null;
            this.renderSystem.setCurrentAttackTarget(null);
        }
        
        // ⭐ Handle right mouse button
        if (pointer.rightButtonDown() && this.selectedEntities.size > 0) {
            // Nếu có command active → EXECUTE command
            if (this.currentCommand) {
                this.handleCommandExecution(worldPoint);
            } else {
                // ⭐ NEW: Sử dụng ClickBehavior system
                this.executeRightClickBehavior(worldPoint);
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
        const clickPoint = new Phaser.Geom.Point(selectionRect.x, selectionRect.y);
        
        // Clear and reselect entities
        this.selectedEntities.forEach(entityId => {
            this.ecsWorld.removeComponent(entityId, 'selected');
        });
        this.selectedEntities.clear();
        
        // ⭐ Bỏ highlight tài nguyên khi click vào vùng trống
        this.currentHarvestTargetId = null;
        this.renderSystem.setCurrentHarvestTarget(null);

        // ⭐ RTS Logic: Collect entities trong vùng selection
        const allEntitiesInBox = [];
        const playerUnitsInBox = [];
        const resourcesInBox = [];
        
        for (const [entityId, components] of this.ecsWorld.entities) {
            const pos = components.get('position');
            if (!pos) continue;
            
            const appearance = components.get('appearance');
            const size = appearance ? appearance.size : 10;
            const entityBounds = new Phaser.Geom.Rectangle(pos.x - size, pos.y - size, size * 2, size * 2);
            
            const isInBox = isSingleClick 
                ? Phaser.Geom.Rectangle.ContainsPoint(entityBounds, clickPoint)
                : Phaser.Geom.Intersects.RectangleToRectangle(selectionRect, entityBounds);
            
            if (isInBox) {
                allEntitiesInBox.push({ entityId, components });
                
                if (components.has('playerUnit') && components.has('selectable') && components.has('entityType')) {
                    const entityType = components.get('entityType');
                    if (entityType.isUnit()) {
                        // ⭐ Chỉ select player units, KHÔNG select buildings
                        playerUnitsInBox.push({ entityId, components });
                    }
                } else if (components.has('resourceNode')) {
                    resourcesInBox.push({ entityId, components });
                }
            }
        }
        
        // ⭐ LOGIC RTS:
        // 1. Nếu có playerUnits → chỉ select playerUnits (bỏ qua enemy, resource)
        // 2. Nếu KHÔNG có playerUnits nhưng có 1 entity duy nhất → select entity đó (resource/enemy)
        // 3. Nếu có nhiều entities không phải playerUnits → không select gì
        
        if (playerUnitsInBox.length > 0) {
            // ⭐ Ưu tiên select lính của player
            playerUnitsInBox.forEach(({ entityId, components }) => {
                this.ecsWorld.addComponent(entityId, 'selected', new Selected());
                this.selectedEntities.add(entityId);
            });
        } else if (allEntitiesInBox.length === 1) {
            // ⭐ Chỉ có 1 entity → select entity đó (có thể là resource)
            const { entityId, components } = allEntitiesInBox[0];
            
            if (components.has('resourceNode')) {
                // ⭐ Click vào tài nguyên → highlight nó
                this.currentHarvestTargetId = entityId;
                this.renderSystem.setCurrentHarvestTarget(entityId);
                console.log(`📦 Selected resource: ${entityId}`);
            } else if (components.has('selectable')) {
                // Select entity thường
                this.ecsWorld.addComponent(entityId, 'selected', new Selected());
                this.selectedEntities.add(entityId);
            }
        }
        // Nếu có nhiều entities không phải playerUnits → không select gì (bỏ qua)

        this.emitSelectionData();
    }

    // ============================================
    // ⭐ COMMAND EXECUTION METHODS
    // ============================================
    
    handleCommandExecution(worldPoint) {
        console.log(`🎮 Executing command: ${this.currentCommand}`);
        
        switch (this.currentCommand) {
            case 'attack':
                const targetId = this.findUnitIdAtWorldPoint(worldPoint);
                if (targetId) {
                    // Click vào enemy → Attack target
                    this.executeAttackCommand(targetId, worldPoint);
                } else {
                    // Click vào vùng trống → Attack-Move (di chuyển + auto-attack enemies trên đường)
                    this.executeAttackMoveCommand(worldPoint);
                }
                break;
                
            case 'stop':
                this.executeStopCommand();
                break;
                
            case 'defence':
                this.executeDefenceCommand(worldPoint);
                break;
                
            case 'patrol':
                this.executePatrolCommand(worldPoint);
                break;
                
            case 'harvest':
                const resourceId = this.findResourceNodeAtWorldPoint(worldPoint);
                if (resourceId) {
                    // Click vào mỏ tài nguyên cụ thể → Thu hoạch mỏ đó
                    this.executeHarvestResourceCommand(resourceId, worldPoint);
                } else {
                    // Click vào vùng trống → Tìm tài nguyên gần nhất
                    this.executeHarvestCommand(worldPoint);
                }
                break;
        }
        
        // Reset command và cursor
        this.currentCommand = null;
        if (this.uiScene) {
            this.uiScene.resetCommand();
        }
    }
    
    // ⭐ A - Attack Command
    executeAttackCommand(targetId, worldPoint) {
        console.log(`⚔️ Attack command: ${this.selectedEntities.size} units → Target ${targetId}`);
        
        this.currentAttackTargetId = targetId;
        this.renderSystem.setCurrentAttackTarget(targetId);
        
        this.selectedEntities.forEach(entityId => {
            const entity = this.ecsWorld.entities.get(entityId);
            if (!entity) return;
            
            const ai = entity.get('ai');
            const behavior = entity.get('behavior');
            
            if (ai && behavior) {
                ai.setTargetId(targetId);
                behavior.setBehavior('chase', { manualAttack: true });
                
                // Clear other command components
                this.ecsWorld.removeComponent(entityId, 'moveTarget');
                this.ecsWorld.removeComponent(entityId, 'defencePosition');
            }
        });
    }
    
    // ⭐ A - Attack-Move Command (to empty space)
    executeAttackMoveCommand(worldPoint) {
        console.log(`⚔️🚶 Attack-Move command: ${this.selectedEntities.size} units → (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`);
        
        // ⭐ TÌM Ô TRỐNG GẦN NHẤT
        const clickedGridPos = this.gridManager.worldToGrid(worldPoint.x, worldPoint.y);
        const nearestWalkable = this.gridManager.findNearestWalkableTile(clickedGridPos.x, clickedGridPos.y);
        const endGridPos = new Phaser.Math.Vector2(nearestWalkable.x, nearestWalkable.y);
        this.selectedEntities.forEach(entityId => {
            const entity = this.ecsWorld.entities.get(entityId);
            if (!entity) return;
            
            const ai = entity.get('ai');
            const behavior = entity.get('behavior');
            const pos = entity.get('position');
            
            if (ai && behavior && pos) {
                // Clear any previous target
                ai.clearTarget();
                
                // Set pathfinding to destination
                const startGridPos = this.gridManager.worldToGrid(pos.x, pos.y);
                this.pathfindingManager.findPath(startGridPos, endGridPos, (path) => {
                    if (path) {
                        ai.setPath(path);
                        // Set followPath behavior with manualAttack flag (auto-attack enemies on the way)
                        behavior.setBehavior('followPath', { manualAttack: true });
                    }
                });
                
                // Clear other command components
                this.ecsWorld.removeComponent(entityId, 'moveTarget');
                this.ecsWorld.removeComponent(entityId, 'defencePosition');
                
                console.log(`  Unit ${entityId}: ATTACK-MOVING to (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`);
            }
        });
    }
    
    // ⭐ S - Stop Command
    executeStopCommand() {
        console.log(`🛑 Stop command: ${this.selectedEntities.size} units`);
        
        this.selectedEntities.forEach(entityId => {
            const entity = this.ecsWorld.entities.get(entityId);
            if (!entity) return;
            
            const ai = entity.get('ai');
            const behavior = entity.get('behavior');
            const position = entity.get('position');
            
            if (ai && behavior && position) {
                // Stop movement
                const velocity = entity.get('velocity');
                if (velocity) {
                    velocity.x = 0;
                    velocity.y = 0;
                }
                
                // Clear targets
                ai.clearTarget();
                
                // Set to "aggressive stance" - sẽ tự động phản công
                behavior.setBehavior('idle'); // AISystem sẽ tự động tìm enemies gần
                
                // Clear other components
                this.ecsWorld.removeComponent(entityId, 'moveTarget');
                this.ecsWorld.removeComponent(entityId, 'defencePosition');
                
                console.log(`  Unit ${entityId}: STOPPED at (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`);
            }
        });
    }
    
    // ⭐ D - Defence Command
    executeDefenceCommand(worldPoint) {
        console.log(`🛡️ Defence command: ${this.selectedEntities.size} units at (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`);
        
        // ⭐ TÌM Ô TRỐNG GẦN NHẤT
        const clickedGridPos = this.gridManager.worldToGrid(worldPoint.x, worldPoint.y);
        const nearestWalkable = this.gridManager.findNearestWalkableTile(clickedGridPos.x, clickedGridPos.y);
        const safeWorldPos = this.gridManager.gridToWorldCenter(nearestWalkable.x, nearestWalkable.y);
        
        this.selectedEntities.forEach(entityId => {
            const entity = this.ecsWorld.entities.get(entityId);
            if (!entity) return;
            
            const position = entity.get('position');
            const behavior = entity.get('behavior');
            const ai = entity.get('ai');
            
            if (position && behavior) {
                // Set defence position (sử dụng vị trí an toàn)
                const defenceX = safeWorldPos.x;
                const defenceY = safeWorldPos.y;
                
                const defencePosition = new DefencePosition(defenceX, defenceY, 100);
                this.ecsWorld.addComponent(entityId, 'defencePosition', defencePosition);
                
                // Set behavior to defence
                behavior.setBehavior('defence');
                
                // Clear other components
                if (ai) ai.clearTarget();
                this.ecsWorld.removeComponent(entityId, 'moveTarget');
                
                console.log(`  Unit ${entityId}: DEFENDING at (${defenceX.toFixed(0)}, ${defenceY.toFixed(0)})`);
            }
        });
    }
    
    // ⭐ P - Patrol Command
    executePatrolCommand(worldPoint) {
        console.log(`🚶 Patrol command: ${this.selectedEntities.size} units from current position to (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`);
        
        // ⭐ TÌM Ô TRỐNG GẦN NHẤT
        const clickedGridPos = this.gridManager.worldToGrid(worldPoint.x, worldPoint.y);
        const nearestWalkable = this.gridManager.findNearestWalkableTile(clickedGridPos.x, clickedGridPos.y);
        const safeWorldPos = this.gridManager.gridToWorldCenter(nearestWalkable.x, nearestWalkable.y);
        
        this.selectedEntities.forEach(entityId => {
            const entity = this.ecsWorld.entities.get(entityId);
            if (!entity) return;
            
            const position = entity.get('position');
            const behavior = entity.get('behavior');
            const ai = entity.get('ai');
            
            if (position && behavior) {
                // Patrol start point = current position, end point = safe position
                const patrolPoints = [
                    { x: position.x, y: position.y },
                    { x: safeWorldPos.x, y: safeWorldPos.y }
                ];
                
                behavior.setBehavior('patrol', { 
                    patrolPoints,
                    currentTarget: 1 // Start by moving to point B (index 1)
                });
                
                console.log(`  Unit ${entityId}: PATROLLING from (${position.x.toFixed(0)}, ${position.y.toFixed(0)}) to (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`);
                
                // Clear other components
                if (ai) ai.clearTarget();
                this.ecsWorld.removeComponent(entityId, 'moveTarget');
                this.ecsWorld.removeComponent(entityId, 'defencePosition');
            }
        });
    }
    
    // ⭐ H - Harvest Command (từ hotkey)
    executeHarvestCommand(worldPoint) {
        console.log(`🌾 Harvest command: ${this.selectedEntities.size} units to harvest near (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`);
        
        this.selectedEntities.forEach(entityId => {
            const entity = this.ecsWorld.entities.get(entityId);
            if (!entity) return;
            
            const harvester = entity.get('harvester');
            if (!harvester) {
                console.log(`  Unit ${entityId}: Not a harvester unit, skipping`);
                return;
            }
            
            const behavior = entity.get('behavior');
            if (behavior) {
                // Set harvest behavior - unit sẽ tự động tìm tài nguyên gần nhất
                behavior.setBehavior('harvest');
                
                console.log(`  Unit ${entityId}: HARVESTING resources near (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`);
                
                // Clear other components
                const ai = entity.get('ai');
                if (ai) ai.clearTarget();
                this.ecsWorld.removeComponent(entityId, 'moveTarget');
                this.ecsWorld.removeComponent(entityId, 'defencePosition');
            }
        });
    }

    // ⭐ HÀM MỚI: Fix command (sửa chữa building)
    executeFixCommand(targetId, worldPoint) {
        console.log(`🔧 Fix command: ${this.selectedEntities.size} units → Fix building ${targetId}`);
        
        this.selectedEntities.forEach(entityId => {
            const entity = this.ecsWorld.entities.get(entityId);
            const behavior = entity.get('behavior');
            const ai = entity.get('ai');
            const position = entity.get('position');
            
            // TODO: Implement fix behavior
            console.log(`  Unit ${entityId}: FIXING building ${targetId}`);
            // Tạm thời di chuyển đến building
            this.executeMoveCommand(worldPoint);
        });
    }

    // ⭐ Harvest Resource Command (từ click chuột phải vào mỏ tài nguyên)
    executeHarvestResourceCommand(resourceId, worldPoint) {
        console.log(`🌾 Harvest resource command: ${this.selectedEntities.size} units → Resource ${resourceId}`);
        
        // ⭐ Highlight mỏ tài nguyên
        this.currentHarvestTargetId = resourceId;
        this.renderSystem.setCurrentHarvestTarget(resourceId);
        
        this.selectedEntities.forEach(entityId => {
            const entity = this.ecsWorld.entities.get(entityId);
            if (!entity) return;
            
            const harvester = entity.get('harvester');
            if (!harvester) {
                console.log(`  Unit ${entityId}: Not a harvester unit, skipping`);
                return;
            }
            
            const behavior = entity.get('behavior');
            const position = entity.get('position');
            const appearance = entity.get('appearance');
            if (!behavior || !position) return;
            
            // Lấy vị trí của mỏ tài nguyên
            const resourceEntity = this.ecsWorld.entities.get(resourceId);
            if (!resourceEntity) return;
            
            const resourcePos = resourceEntity.get('position');
            const resourceAppearance = resourceEntity.get('appearance');
            if (!resourcePos) return;
            
            // ⭐ Set target resource ID trước khi di chuyển
            harvester.targetResourceId = resourceId;
            
            // Di chuyển đến mỏ tài nguyên và thu hoạch
            const dx = resourcePos.x - position.x;
            const dy = resourcePos.y - position.y;
            const centerDistance = Math.sqrt(dx * dx + dy * dy);
            
            // ⭐ Tính khoảng cách từ MÉP (edge-to-edge)
            const harvesterSize = appearance ? appearance.size : 10;
            const resourceSize = resourceAppearance ? resourceAppearance.size : 10;
            const edgeDistance = centerDistance - harvesterSize - resourceSize;
            
            console.log(`  Unit ${entityId}: Distance - center=${centerDistance.toFixed(0)}, edge=${edgeDistance.toFixed(0)}, range=${harvester.harvestRange}`);
            
            if (edgeDistance <= harvester.harvestRange) {
                // Đã đủ gần, bắt đầu thu hoạch ngay
                harvester.startHarvesting(resourceId);
                behavior.setBehavior('harvest');
                console.log(`  Unit ${entityId}: START HARVESTING resource ${resourceId}`);
            } else {
                // Di chuyển đến gần mỏ tài nguyên
                const ai = entity.get('ai');
                if (ai) {
                    const startGridPos = this.gridManager.worldToGrid(position.x, position.y);
                    const endGridPos = this.gridManager.worldToGrid(resourcePos.x, resourcePos.y);
                    
                    this.pathfindingManager.findPath(startGridPos, endGridPos, (path) => {
                        if (path) {
                            ai.setPath(path);
                            behavior.setBehavior('followPath', { targetResourceId: resourceId }); // Ghi nhớ mỏ tài nguyên trong behavior
                            console.log(`  Unit ${entityId}: MOVING to resource ${resourceId}`);
                        }
                    });
                }
            }
            
            // Clear other components
            const ai = entity.get('ai');
            if (ai) ai.clearTarget();
            this.ecsWorld.removeComponent(entityId, 'moveTarget');
            this.ecsWorld.removeComponent(entityId, 'defencePosition');
        });
    }
    
    // ⭐ Helper: Move Command (default right-click)
    executeMoveCommand(worldPoint) {
        this.currentAttackTargetId = null;
        this.renderSystem.setCurrentAttackTarget(null);
        this.currentHarvestTargetId = null;
        this.renderSystem.setCurrentHarvestTarget(null);
        
        // ⭐ TÌM Ô TRỐNG GẦN NHẤT để tránh click vào building
        const clickedGridPos = this.gridManager.worldToGrid(worldPoint.x, worldPoint.y);
        const nearestWalkable = this.gridManager.findNearestWalkableTile(clickedGridPos.x, clickedGridPos.y);
        const endGridPos = new Phaser.Math.Vector2(nearestWalkable.x, nearestWalkable.y);
        
        // Log để debug
        if (nearestWalkable.x !== clickedGridPos.x || nearestWalkable.y !== clickedGridPos.y) {
            console.log(`🚫 Click vào ô bị chiếm (${clickedGridPos.x}, ${clickedGridPos.y}), chuyển sang ô trống (${nearestWalkable.x}, ${nearestWalkable.y})`);
        }
        
        this.selectedEntities.forEach(entityId => {
            const entity = this.ecsWorld.entities.get(entityId);
            if (!entity) return;
            
            const ai = entity.get('ai');
            if (ai) ai.clearTarget();
            
            const pos = entity.get('position');
            const startGridPos = this.gridManager.worldToGrid(pos.x, pos.y);
            this.pathfindingManager.findPath(startGridPos, endGridPos, (path) => {
                if (path) {
                    ai.setPath(path);
                    entity.get('behavior').setBehavior('followPath');
                }
            });
            
            // Clear defence position
            this.ecsWorld.removeComponent(entityId, 'defencePosition');
        });
    }

    shutdown() {
        console.log("DemoScene shutting down. Cleaning up all listeners...");
        this.input.off('wheel', this.handleWheel, this);
        this.input.off('pointerdown', this.handlePointerDown, this);
        this.input.off('pointermove', this.handlePointerMove, this);
        this.input.off('pointerup', this.handlePointerUp, this);
    }
}