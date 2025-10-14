// Factory để tạo các entity với hành vi khác nhau
import { Position } from './components/Position.js';
import { Velocity } from './components/Velocity.js';
import { Health } from './components/Health.js';
import { Behavior } from './components/Behavior.js';
import { Appearance } from './components/Appearance.js';
import { AI } from './components/AI.js';
import { Selectable } from './components/Selectable.js';
import { PlayerUnit } from './components/PlayerUnit.js';
import { Building } from './components/Building.js'; // ⭐ IMPORT COMPONENT MỚI


export class EntityFactory {
    constructor(ecsWorld) {
        this.ecsWorld = ecsWorld;
    }
    
    createPlayerSoldier(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        this.ecsWorld.addComponent(entityId, 'appearance', new Appearance(0x00ff00, 12, 'circle')); // Green circle
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('idle', { speed: 150 })); // AI for pathfinding speed etc.
        this.ecsWorld.addComponent(entityId, 'selectable', new Selectable()); // Can be selected
        this.ecsWorld.addComponent(entityId, 'playerUnit', new PlayerUnit()); // Belongs to player
        
        return entityId;
    }
    
    createEnemySoldier(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(50, 50));
        this.ecsWorld.addComponent(entityId, 'appearance', new Appearance(0xff0000, 10, 'triangle')); // Red triangle
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('wander', { speed: 40, interval: 3000 }));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('wander'));
        
        return entityId;
    }

    createChaserEnemy(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(50, 50));
        // Giao diện: Chấm tròn đỏ
        this.ecsWorld.addComponent(entityId, 'appearance', new Appearance(0xff0000, 10, 'circle')); 
        // Hành vi ban đầu là lang thang
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('wander', { speed: 40, interval: 3000 }));
        // AI: Loại 'chase' với tốc độ chậm hơn và có tầm nhìn
        this.ecsWorld.addComponent(entityId, 'ai', new AI('chase', {
            speed: 90,             // Tốc độ 90 (chậm hơn lính của bạn là 150)
            detectionRange: 350,   // Tầm nhìn 350 pixels
            reactionTime: 500      // Ra quyết định mỗi 0.5 giây
        }));
        
        return entityId;
    }

    // ⭐ THÊM PHƯƠNG THỨC MỚI
    createEnemyBuilding(gridX, gridY) {
        // Lấy kích thước ô từ GridManager của scene
        const tileSize = this.ecsWorld.scene.gridManager.tileSize;
        const buildingSizeInTiles = 3; // Nhà sẽ có kích thước 3x3 ô
        const buildingPixelSize = buildingSizeInTiles * tileSize;

        // Tính toán tọa độ thế giới (tâm của công trình)
        const worldX = gridX * tileSize + buildingPixelSize / 2;
        const worldY = gridY * tileSize + buildingPixelSize / 2;
        
        const entityId = this.ecsWorld.createEntity();

        this.ecsWorld.addComponent(entityId, 'position', new Position(worldX, worldY));
        this.ecsWorld.addComponent(entityId, 'appearance', new Appearance(0xcc0000, buildingPixelSize / 2, 'rectangle')); // Đỏ sẫm
        this.ecsWorld.addComponent(entityId, 'building', new Building()); // Đánh dấu là building

        // Đánh dấu các ô trên lưới là "đã bị chiếm"
        for (let x = gridX; x < gridX + buildingSizeInTiles; x++) {
            for (let y = gridY; y < gridY + buildingSizeInTiles; y++) {
                this.ecsWorld.scene.gridManager.setTileOccupied(x, y, entityId);
            }
        }
        
        // ⭐ CẬP NHẬT PATHFINDING GRID SAU KHI TẠO NHÀ
        if (this.ecsWorld.scene.pathfindingManager) {
            this.ecsWorld.scene.pathfindingManager.updateGrid();
        }
        
        return entityId;
    }

    // Your other create methods like createWandererEntity can remain for enemies or be refactored
    // ...
}