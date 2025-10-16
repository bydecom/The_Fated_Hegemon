// Factory để tạo các entity với hành vi khác nhau
import { Position } from './components/Position.js';
import { Velocity } from './components/Velocity.js';
import { Health } from './components/Health.js';
import { Behavior } from './components/Behavior.js';
import { Appearance } from './components/Appearance.js';
import { AI } from './components/AI.js';
import { Selectable } from './components/Selectable.js';
import { PlayerUnit } from './components/PlayerUnit.js';
import { Building } from './components/Building.js';
import { CombatStats } from './components/CombatStats.js';
import { Faction } from './components/Faction.js'; // ⭐ NEW: Faction component
import { ResourceNode } from './components/ResourceNode.js'; // ⭐ NEW: Resource management
import { Harvester } from './components/Harvester.js';
import { ResourceStorage } from './components/ResourceStorage.js';
import { EntityType } from './components/EntityType.js'; // ⭐ NEW: Entity type classification
import { ClickBehavior, ClickBehaviorFactory } from './components/ClickBehavior.js'; // ⭐ NEW: Click behavior management
import { CombatResponse } from './components/CombatResponse.js'; // ⭐ NEW: Combat response management
import { Animation } from './components/Animation.js'; // ⭐ NEW: Animation component


export class EntityFactory {
    constructor(ecsWorld, factionManager = null) {
        this.ecsWorld = ecsWorld;
        this.factionManager = factionManager; // ⭐ Tham chiếu đến FactionManager
    }
    
    createPlayerSoldier(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        this.ecsWorld.addComponent(entityId, 'combatStats', new CombatStats(20, 50, 1000));
        this.ecsWorld.addComponent(entityId, 'appearance', new Appearance(0x00ff00, 12, 'circle')); // Green circle
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('idle', { speed: 150 })); // AI for pathfinding speed etc.
        this.ecsWorld.addComponent(entityId, 'selectable', new Selectable()); // Can be selected
        this.ecsWorld.addComponent(entityId, 'playerUnit', new PlayerUnit()); // Belongs to player
        this.ecsWorld.addComponent(entityId, 'entityType', new EntityType('unit')); // ⭐ NEW: Unit type
        this.ecsWorld.addComponent(entityId, 'clickBehavior', ClickBehaviorFactory.createSoldierBehavior()); // ⭐ NEW: Click behavior
        this.ecsWorld.addComponent(entityId, 'combatResponse', new CombatResponse({ chaseRange: 200, maxChaseDistance: 300 })); // ⭐ NEW: Combat response
        this.ecsWorld.addComponent(entityId, 'animation', new Animation('soldier', 'idle', 'down')); // ⭐ NEW: Animation
        
        return entityId;
    }
    
    createEnemySoldier(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(50, 50));
        this.ecsWorld.addComponent(entityId, 'combatStats', new CombatStats(10, 50, 1500));
        const enemyAppearance = new Appearance(0xff0000, 10, 'triangle');
        enemyAppearance.setWeapon({ type: null });
        enemyAppearance.hasArms = false; // ⭐ SỬA: Di chuyển dòng này xuống sau khi tạo appearance
        this.ecsWorld.addComponent(entityId, 'appearance', enemyAppearance); // Red triangle, no weapon
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('wander', { speed: 40, interval: 3000 }));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('wander'));
        this.ecsWorld.addComponent(entityId, 'entityType', new EntityType('unit')); // ⭐ NEW: Unit type
        this.ecsWorld.addComponent(entityId, 'clickBehavior', ClickBehaviorFactory.createEnemyBehavior()); // ⭐ NEW: Click behavior
        this.ecsWorld.addComponent(entityId, 'combatResponse', new CombatResponse({ chaseRange: 150, maxChaseDistance: 250 })); // ⭐ NEW: Combat response
        this.ecsWorld.addComponent(entityId, 'animation', new Animation('soldier', 'idle', 'down')); // ⭐ NEW: Animation
        
        return entityId;
    }

    createChaserEnemy(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(50, 50));
        this.ecsWorld.addComponent(entityId, 'combatStats', new CombatStats(10, 50, 1000));
        // Giao diện: Chấm tròn đỏ
        const chaserAppearance = new Appearance(0xff0000, 10, 'circle');
        this.ecsWorld.addComponent(entityId, 'appearance', chaserAppearance); 
        // Hành vi ban đầu là lang thang
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('wander', { speed: 40, interval: 3000 }));
        // AI: Loại 'chase' với tốc độ chậm hơn và có tầm nhìn
        this.ecsWorld.addComponent(entityId, 'ai', new AI('chase', {
            speed: 90,             // Tốc độ 90 (chậm hơn lính của bạn là 150)
            detectionRange: 350,   // Tầm nhìn 350 pixels
            reactionTime: 500      // Ra quyết định mỗi 0.5 giây
        }));
        this.ecsWorld.addComponent(entityId, 'entityType', new EntityType('unit')); // ⭐ NEW: Unit type
        this.ecsWorld.addComponent(entityId, 'clickBehavior', ClickBehaviorFactory.createEnemyBehavior()); // ⭐ NEW: Click behavior
        this.ecsWorld.addComponent(entityId, 'combatResponse', new CombatResponse({ chaseRange: 180, maxChaseDistance: 280 })); // ⭐ NEW: Combat response
        this.ecsWorld.addComponent(entityId, 'animation', new Animation('soldier', 'idle', 'down')); // ⭐ NEW: Animation
        
        return entityId;
    }

    createHarvesterUnit(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(80, 80));
        
        // ⭐ Combat stats cho dân thu hoạch (damage thấp hơn lính)
        this.ecsWorld.addComponent(entityId, 'combatStats', new CombatStats(8, 40, 1200)); // 8 damage, 40 range, 1.2s cooldown
        
        // ⭐ Appearance với vũ khí ngắn cho dân thu hoạch
        const harvesterAppearance = new Appearance(0x00AAFF, 14, 'circle'); // Màu xanh dương
        harvesterAppearance.setWeapon({ 
            type: 'short_stick', 
            offsetX: -5,  // Ngắn hơn lính
            offsetY: 15  // Thấp hơn lính
        });
        this.ecsWorld.addComponent(entityId, 'appearance', harvesterAppearance);
        
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('idle', { speed: 120 }));
        this.ecsWorld.addComponent(entityId, 'selectable', new Selectable());
        this.ecsWorld.addComponent(entityId, 'playerUnit', new PlayerUnit());
        this.ecsWorld.addComponent(entityId, 'harvester', new Harvester(100, 30)); // Sức chứa 100, tầm 30
        this.ecsWorld.addComponent(entityId, 'resourceStorage', new ResourceStorage());
        this.ecsWorld.addComponent(entityId, 'entityType', new EntityType('unit')); // ⭐ NEW: Unit type
        this.ecsWorld.addComponent(entityId, 'clickBehavior', ClickBehaviorFactory.createHarvesterBehavior()); // ⭐ NEW: Click behavior
        this.ecsWorld.addComponent(entityId, 'combatResponse', new CombatResponse({ chaseRange: 120, maxChaseDistance: 200, retreatDistance: 100 })); // ⭐ NEW: Combat response
        this.ecsWorld.addComponent(entityId, 'animation', new Animation('harvester', 'idle', 'down')); // ⭐ NEW: Animation
        
        console.log(`🌾 Created harvester unit at (${x}, ${y})`);
        return entityId;
    }

    // ⭐ TẠO NHÀ CHÍNH CỦA PLAYER
    createPlayerBase(x, y) {
        const tileSize = this.ecsWorld.scene.gridManager.tileSize;
        const buildingSizeInTiles = 3; // Nhà 3x3 ô (giống enemy building)
        
        // ⭐ Chuyển đổi từ world coordinates sang grid coordinates
        const gridX = Math.floor(x / tileSize);
        const gridY = Math.floor(y / tileSize);
        
        // Tính toán world position ở tâm building
        const buildingPixelSize = buildingSizeInTiles * tileSize;
        const worldX = gridX * tileSize + buildingPixelSize / 2;
        const worldY = gridY * tileSize + buildingPixelSize / 2;
        
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(worldX, worldY));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity(0, 0)); // Đứng yên
        this.ecsWorld.addComponent(entityId, 'health', new Health(1000, 1000)); // 1000 HP
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle')); // Cần behavior
        this.ecsWorld.addComponent(entityId, 'ai', new AI('idle', { speed: 0 })); // Cần AI (speed=0)
        
        // ⭐ Appearance: Hình vuông màu xanh lá
        const baseAppearance = new Appearance(0x00FF00, buildingPixelSize / 2, 'square'); // Size theo building
        baseAppearance.setWeapon({ type: null }); // Không có vũ khí
        baseAppearance.hasArms = false; // Không có tay
        this.ecsWorld.addComponent(entityId, 'appearance', baseAppearance);
        
        this.ecsWorld.addComponent(entityId, 'building', new Building()); // Là building
        this.ecsWorld.addComponent(entityId, 'selectable', new Selectable()); // Có thể chọn
        this.ecsWorld.addComponent(entityId, 'playerUnit', new PlayerUnit()); // Thuộc về player
        this.ecsWorld.addComponent(entityId, 'entityType', new EntityType('building')); // ⭐ NEW: Building type
        
        // ⭐ QUAN TRỌNG: Đánh dấu grid (giống enemy building)
        for (let x = gridX; x < gridX + buildingSizeInTiles; x++) {
            for (let y = gridY; y < gridY + buildingSizeInTiles; y++) {
                this.ecsWorld.scene.gridManager.setTileOccupied(x, y, entityId);
            }
        }
        
        // ⭐ Cập nhật pathfinding grid
        if (this.ecsWorld.scene.pathfindingManager) {
            this.ecsWorld.scene.pathfindingManager.updateGrid();
        }
        
        console.log(`🏠 Created player base at (${worldX}, ${worldY}), grid (${gridX}, ${gridY}), ID: ${entityId}`);
        return entityId;
    }
    // ⭐ CODE LẠI HOÀN TOÀN: Tạo enemy building
    createEnemyBuilding(gridX, gridY) {
        const tileSize = this.ecsWorld.scene.gridManager.tileSize;
        const buildingSizeInTiles = 3; // Nhà 3x3 ô
        const buildingPixelSize = buildingSizeInTiles * tileSize;

        // Tọa độ tâm building
        const worldX = gridX * tileSize + buildingPixelSize / 2;
        const worldY = gridY * tileSize + buildingPixelSize / 2;
        
        const entityId = this.ecsWorld.createEntity();

        // ⭐ CÁC COMPONENT CƠ BẢN (giống unit)
        this.ecsWorld.addComponent(entityId, 'position', new Position(worldX, worldY));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity(0, 0)); // Đứng yên
        this.ecsWorld.addComponent(entityId, 'health', new Health(500, 500)); // 500 HP
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle')); // ⭐ CẦN behavior
        this.ecsWorld.addComponent(entityId, 'ai', new AI('idle', { speed: 0 })); // ⭐ CẦN AI (speed=0)
        
        // Appearance
        const buildingAppearance = new Appearance(0xcc0000, buildingPixelSize / 2, 'rectangle');
        buildingAppearance.setWeapon({ type: null });
        this.ecsWorld.addComponent(entityId, 'appearance', buildingAppearance);

        // Đánh dấu là building
        this.ecsWorld.addComponent(entityId, 'building', new Building());
        this.ecsWorld.addComponent(entityId, 'entityType', new EntityType('building')); // ⭐ NEW: Building type

        // Đánh dấu grid
        for (let x = gridX; x < gridX + buildingSizeInTiles; x++) {
            for (let y = gridY; y < gridY + buildingSizeInTiles; y++) {
                this.ecsWorld.scene.gridManager.setTileOccupied(x, y, entityId);
            }
        }
        
        if (this.ecsWorld.scene.pathfindingManager) {
            this.ecsWorld.scene.pathfindingManager.updateGrid();
        }
        
        console.log(`🏗️ Created building at (${worldX}, ${worldY}) with ID: ${entityId}`);
        return entityId;
    }

    // ⭐ NEW: Tạo unit với faction (áp dụng race + tribe modifiers)
    createUnitWithFaction(x, y, raceId, tribeId, unitConfig = {}) {
        const entityId = this.ecsWorld.createEntity();
        
        // Base stats
        const baseStats = {
            health: unitConfig.baseHealth || 100,
            damage: unitConfig.baseDamage || 20,
            speed: unitConfig.baseSpeed || 150,
            attackRange: unitConfig.baseAttackRange || 50,
            attackRate: unitConfig.baseAttackRate || 1000
        };
        
        // ⭐ Tính toán final stats dựa trên race + tribe modifiers
        let finalStats = baseStats;
        if (this.factionManager) {
            finalStats = this.factionManager.calculateFinalStats(baseStats, raceId, tribeId);
        }
        
        // Lấy thông tin tribe để lấy màu
        const tribe = this.factionManager ? this.factionManager.getTribe(tribeId) : null;
        const color = tribe ? tribe.color : (unitConfig.color || 0x00ff00);
        
        // Thêm components
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(finalStats.health, finalStats.health));
        this.ecsWorld.addComponent(entityId, 'combatStats', new CombatStats(
            finalStats.damage,
            finalStats.attackRange,
            finalStats.attackRate
        ));
        
        // Appearance
        const appearance = new Appearance(color, unitConfig.size || 12, unitConfig.shape || 'circle');
        if (unitConfig.weapon) {
            appearance.setWeapon(unitConfig.weapon);
        }
        this.ecsWorld.addComponent(entityId, 'appearance', appearance);
        
        // Behavior & AI
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior(unitConfig.behavior || 'idle'));
        this.ecsWorld.addComponent(entityId, 'ai', new AI(unitConfig.aiType || 'idle', { speed: finalStats.speed }));
        
        // ⭐ Faction
        this.ecsWorld.addComponent(entityId, 'faction', new Faction(raceId, tribeId));
        
        // Optional: Selectable
        if (unitConfig.selectable) {
            this.ecsWorld.addComponent(entityId, 'selectable', new Selectable());
        }
        
        // Optional: PlayerUnit
        if (unitConfig.isPlayerUnit) {
            this.ecsWorld.addComponent(entityId, 'playerUnit', new PlayerUnit());
        }
        
        return entityId;
    }

    // ⭐ NEW: Tạo building với faction
    createBuildingWithFaction(gridX, gridY, raceId, tribeId, buildingConfig = {}) {
        const tileSize = this.ecsWorld.scene.gridManager.tileSize;
        const buildingSizeInTiles = buildingConfig.sizeInTiles || 3;
        const buildingPixelSize = buildingSizeInTiles * tileSize;
        
        const worldX = gridX * tileSize + buildingPixelSize / 2;
        const worldY = gridY * tileSize + buildingPixelSize / 2;
        
        const entityId = this.ecsWorld.createEntity();
        
        // Base stats
        const baseStats = {
            health: buildingConfig.baseHealth || 500,
            damage: 0,
            speed: 0,
            attackRange: 0,
            attackRate: 0
        };
        
        // Apply modifiers
        let finalStats = baseStats;
        if (this.factionManager) {
            finalStats = this.factionManager.calculateFinalStats(baseStats, raceId, tribeId);
        }
        
        // Lấy màu từ tribe
        const tribe = this.factionManager ? this.factionManager.getTribe(tribeId) : null;
        const color = tribe ? tribe.color : (buildingConfig.color || 0xcc0000);
        
        // Components
        this.ecsWorld.addComponent(entityId, 'position', new Position(worldX, worldY));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity(0, 0));
        this.ecsWorld.addComponent(entityId, 'health', new Health(finalStats.health, finalStats.health));
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('idle', { speed: 0 }));
        
        const buildingAppearance = new Appearance(color, buildingPixelSize / 2, 'rectangle');
        buildingAppearance.setWeapon({ type: null });
        this.ecsWorld.addComponent(entityId, 'appearance', buildingAppearance);
        
        this.ecsWorld.addComponent(entityId, 'building', new Building());
        this.ecsWorld.addComponent(entityId, 'faction', new Faction(raceId, tribeId));
        
        // Đánh dấu grid
        for (let x = gridX; x < gridX + buildingSizeInTiles; x++) {
            for (let y = gridY; y < gridY + buildingSizeInTiles; y++) {
                this.ecsWorld.scene.gridManager.setTileOccupied(x, y, entityId);
            }
        }
        
        if (this.ecsWorld.scene.pathfindingManager) {
            this.ecsWorld.scene.pathfindingManager.updateGrid();
        }
        
        console.log(`🏗️ Created ${tribe ? tribe.name : 'Unknown'} building at (${worldX}, ${worldY})`);
        return entityId;
    }

    // ⭐ TẠO CÁC LOẠI TÀI NGUYÊN
    createTree(x, y, woodAmount = 1000) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        const appearance = new Appearance(0x228B22, 20, 'circle'); // Màu xanh lá
        appearance.setWeapon({ type: null }); // ⭐ KHÔNG CÓ VŨ KHÍ
        appearance.hasArms = false; // ⭐ KHÔNG CÓ TAY
        this.ecsWorld.addComponent(entityId, 'appearance', appearance);
        this.ecsWorld.addComponent(entityId, 'resourceNode', new ResourceNode('wood', woodAmount, 2)); // 2 gỗ/giây
        this.ecsWorld.addComponent(entityId, 'entityType', new EntityType('resource')); // ⭐ NEW: Resource type
        
        // ⭐ Đánh dấu grid (cây chiếm 1 ô)
        const tileSize = this.ecsWorld.scene.gridManager.tileSize;
        const gridX = Math.floor(x / tileSize);
        const gridY = Math.floor(y / tileSize);
        this.ecsWorld.scene.gridManager.setTileOccupied(gridX, gridY, entityId);
        
        console.log(`🌲 Created tree at (${x}, ${y}) with ${woodAmount} wood`);
        return entityId;
    }

    createGoldMine(x, y, goldAmount = 500) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        const appearance = new Appearance(0xFFD700, 25, 'square'); // Hình vuông vàng
        appearance.setWeapon({ type: null }); // ⭐ KHÔNG CÓ VŨ KHÍ
        appearance.hasArms = false; // ⭐ KHÔNG CÓ TAY
        this.ecsWorld.addComponent(entityId, 'appearance', appearance);
        this.ecsWorld.addComponent(entityId, 'resourceNode', new ResourceNode('gold', goldAmount, 1)); // 1 vàng/giây
        this.ecsWorld.addComponent(entityId, 'entityType', new EntityType('resource'));
        
        // ⭐ Đánh dấu grid (mỏ vàng chiếm 1 ô)
        const tileSize = this.ecsWorld.scene.gridManager.tileSize;
        const gridX = Math.floor(x / tileSize);
        const gridY = Math.floor(y / tileSize);
        this.ecsWorld.scene.gridManager.setTileOccupied(gridX, gridY, entityId);
        
        console.log(`💰 Created gold mine at (${x}, ${y}) with ${goldAmount} gold`);
        return entityId;
    }

    createSilverMine(x, y, silverAmount = 300) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        const appearance = new Appearance(0xC0C0C0, 25, 'square'); // Hình vuông xám
        appearance.setWeapon({ type: null }); // ⭐ KHÔNG CÓ VŨ KHÍ
        appearance.hasArms = false; // ⭐ KHÔNG CÓ TAY
        this.ecsWorld.addComponent(entityId, 'appearance', appearance);
        this.ecsWorld.addComponent(entityId, 'resourceNode', new ResourceNode('silver', silverAmount, 1.5)); // 1.5 bạc/giây
        this.ecsWorld.addComponent(entityId, 'entityType', new EntityType('resource'));
        
        // ⭐ Đánh dấu grid (mỏ bạc chiếm 1 ô)
        const tileSize = this.ecsWorld.scene.gridManager.tileSize;
        const gridX = Math.floor(x / tileSize);
        const gridY = Math.floor(y / tileSize);
        this.ecsWorld.scene.gridManager.setTileOccupied(gridX, gridY, entityId);
        
        console.log(`⚪ Created silver mine at (${x}, ${y}) with ${silverAmount} silver`);
        return entityId;
    }

    createStoneMine(x, y, stoneAmount = 800) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        const appearance = new Appearance(0x8B4513, 25, 'square'); // Hình vuông nâu
        appearance.setWeapon({ type: null }); // ⭐ KHÔNG CÓ VŨ KHÍ
        appearance.hasArms = false; // ⭐ KHÔNG CÓ TAY
        this.ecsWorld.addComponent(entityId, 'appearance', appearance);
        this.ecsWorld.addComponent(entityId, 'resourceNode', new ResourceNode('stone', stoneAmount, 2.5)); // 2.5 đá/giây
        this.ecsWorld.addComponent(entityId, 'entityType', new EntityType('resource'));
        
        // ⭐ Đánh dấu grid (mỏ đá chiếm 1 ô)
        const tileSize = this.ecsWorld.scene.gridManager.tileSize;
        const gridX = Math.floor(x / tileSize);
        const gridY = Math.floor(y / tileSize);
        this.ecsWorld.scene.gridManager.setTileOccupied(gridX, gridY, entityId);
        
        console.log(`🧱 Created stone mine at (${x}, ${y}) with ${stoneAmount} stone`);
        return entityId;
    }

    createWaterSource(x, y, waterAmount = 400) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        const appearance = new Appearance(0x1E90FF, 20, 'circle'); // Hình tròn xanh
        appearance.setWeapon({ type: null }); // ⭐ KHÔNG CÓ VŨ KHÍ
        appearance.hasArms = false; // ⭐ KHÔNG CÓ TAY
        this.ecsWorld.addComponent(entityId, 'appearance', appearance);
        this.ecsWorld.addComponent(entityId, 'resourceNode', new ResourceNode('water', waterAmount, 3)); // 3 nước/giây
        this.ecsWorld.addComponent(entityId, 'entityType', new EntityType('resource'));
        
        // ⭐ Đánh dấu grid (nguồn nước chiếm 1 ô)
        const tileSize = this.ecsWorld.scene.gridManager.tileSize;
        const gridX = Math.floor(x / tileSize);
        const gridY = Math.floor(y / tileSize);
        this.ecsWorld.scene.gridManager.setTileOccupied(gridX, gridY, entityId);
        
        console.log(`💧 Created water source at (${x}, ${y}) with ${waterAmount} water`);
        return entityId;
    }

    createAnimal(x, y, meatAmount = 200) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        
        // ⭐ NEW: Sử dụng sprite cho animal
        const appearance = new Appearance(0x2F2F2F, 32, 'circle'); // Size 32 để phù hợp với sprite
        appearance.setWeapon({ type: null }); // ⭐ KHÔNG CÓ VŨ KHÍ
        appearance.hasArms = false; // ⭐ KHÔNG CÓ TAY (động vật không có tay)
        appearance.setSprite('animal_sprite', true); // ⭐ SỬ DỤNG SPRITE
        this.ecsWorld.addComponent(entityId, 'appearance', appearance);
        this.ecsWorld.addComponent(entityId, 'health', new Health(100, 100)); // ⭐ Có thể giết để lấy thịt
        this.ecsWorld.addComponent(entityId, 'resourceNode', new ResourceNode('meat', meatAmount, 1));
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('wander', { speed: 30, interval: 2000 }));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('wander'));
        this.ecsWorld.addComponent(entityId, 'selectable', new Selectable()); // ⭐ Có thể click để chọn hoặc tấn công
        this.ecsWorld.addComponent(entityId, 'entityType', new EntityType('animal')); // ⭐ NEW: Animal type
        this.ecsWorld.addComponent(entityId, 'animation', new Animation('animal', 'idle', 'down')); // ⭐ NEW: Animation
        
        console.log(`🐗 Created animal at (${x}, ${y}) with ${meatAmount} meat`);
        return entityId;
    }

    // ⭐ TẠO ĐƠN VỊ CÓ THỂ THU HOẠCH
    
}