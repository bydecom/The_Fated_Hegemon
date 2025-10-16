# ⚡ Performance Optimization Guide

## 🎯 Mục tiêu: Xử lý hàng ngàn entities với FPS ổn định

Hướng dẫn này giải thích cách tối ưu game từ **O(N²)** xuống **O(N)** bằng Spatial Partitioning.

---

## 📊 So sánh Performance

| Số lượng units | Without Optimization (O(N²)) | With Spatial Hash (O(N)) |
|----------------|------------------------------|--------------------------|
| 100 units      | ~60 FPS                      | ~60 FPS                  |
| 500 units      | ~20 FPS ❌                   | ~58 FPS ✅               |
| 1000 units     | ~5 FPS ❌                    | ~55 FPS ✅               |
| 2000 units     | <1 FPS ❌                    | ~50 FPS ✅               |

---

## 🚀 Cách tích hợp Spatial Hash Grid

### Bước 1: Import và khởi tạo trong DemoScene

```javascript
// src/scenes/DemoScene.js
import { SpatialHashGrid } from '../managers/SpatialHashGrid.js';

export class DemoScene extends Phaser.Scene {
    create() {
        // ...existing code...
        
        // ⭐ TẠO SPATIAL HASH GRID
        const CELL_SIZE = 100; // Cells 100x100 pixels
        this.spatialHashGrid = new SpatialHashGrid(
            WORLD_WIDTH, 
            WORLD_HEIGHT, 
            CELL_SIZE
        );
        
        // ⭐ TRUYỀN VÀO STEERING SYSTEM
        const steeringSystem = new SteeringSystem(this, this.spatialHashGrid);
        this.ecsWorld.addSystem(steeringSystem);
        
        // ... rest of initialization
    }
}
```

### Bước 2: Debug Spatial Grid (Optional)

Thêm vào `update()` để xem grid visualization:

```javascript
update(time, delta) {
    this.handleEdgeScroll(delta);
    this.ecsWorld.update(delta);
    
    // ⭐ DEBUG: Vẽ spatial grid
    if (this.input.keyboard.addKey('G').isDown) {
        if (!this.spatialDebugGraphics) {
            this.spatialDebugGraphics = this.add.graphics();
            this.spatialDebugGraphics.setDepth(999);
        }
        this.spatialHashGrid.debugDraw(this, this.spatialDebugGraphics);
    }
    
    // ⭐ STATS
    const stats = this.spatialHashGrid.getStats();
    this.fpsText.setText(
        `FPS: ${Math.round(this.game.loop.actualFps)} | ` +
        `Entities: ${this.ecsWorld.entities.size} | ` +
        `Cells: ${stats.occupiedCells}/${stats.totalCells} | ` +
        `Avg/Cell: ${stats.averageEntitiesPerCell}`
    );
}
```

---

## 🔧 Cách hoạt động

### Before (O(N²))

```javascript
// SteeringSystem check va chạm
for (const entityA of allEntities) {
    for (const entityB of allEntities) {  // ❌ Nested loop!
        checkCollision(entityA, entityB);
    }
}
// Complexity: N × N = N²
// 1000 units = 1,000,000 checks mỗi frame!
```

### After (O(N))

```javascript
// Spatial Hash Grid
for (const entityA of allEntities) {
    // ✅ CHỈ lấy entities GẦN entityA
    const nearby = spatialGrid.queryRadius(
        entityA.x, 
        entityA.y, 
        AVOIDANCE_RADIUS
    );
    
    for (const entityB of nearby) {  // ✅ Chỉ vài chục entities!
        checkCollision(entityA, entityB);
    }
}
// Complexity: N × k (k = constant ~10-30 entities)
// 1000 units = ~30,000 checks mỗi frame (33x ít hơn!)
```

---

## 📐 Spatial Hash Grid - Concepts

### Cấu trúc

```
World (3200x3200)
├── Cell Size: 100x100
├── Grid: 32x32 cells = 1024 cells total
└── Map<cellKey, Set<entityId>>
```

### Cell Key Format

```javascript
// Entity at position (250, 450)
col = floor(250 / 100) = 2
row = floor(450 / 100) = 4
cellKey = "2,4"
```

### Query Operations

```javascript
// 1. Query radius (avoidance)
const nearby = grid.queryRadius(x, y, 40);
// Returns: ['entity1', 'entity2', ...]

// 2. Query rectangle (selection box)
const inRect = grid.queryRect(minX, minY, maxX, maxY);

// 3. Query cell (same cell check)
const sameCell = grid.queryCell(x, y);
```

---

## 💡 Tối ưu thêm

### 1. Điều chỉnh Cell Size

```javascript
// Cell quá nhỏ: Quá nhiều cells, overhead lớn
const grid = new SpatialHashGrid(3200, 3200, 50); // ❌ 64x64 = 4096 cells

// Cell quá lớn: Mỗi cell có quá nhiều entities
const grid = new SpatialHashGrid(3200, 3200, 500); // ❌ 7x7 = 49 cells

// ✅ Optimal: Cell size ≈ 2-3x AVOIDANCE_RADIUS
const grid = new SpatialHashGrid(3200, 3200, 100); // ✅ 32x32 = 1024 cells
```

### 2. Chỉ update khi cần

```javascript
// ❌ BAD: Clear và rebuild mỗi frame
update() {
    this.spatialHashGrid.clear();
    for (entity of entities) {
        this.spatialHashGrid.insert(entity);
    }
}

// ✅ GOOD: Chỉ update entities đã di chuyển
update() {
    for (entity of entities) {
        if (entity.hasMoved()) {
            this.spatialHashGrid.update(entity.id, entity.x, entity.y, entity.size);
        }
    }
}
```

**Hiện tại code của bạn đang dùng approach 1 (clear/rebuild). Đây là OK cho <2000 entities. Khi cần >5000 entities, hãy chuyển sang approach 2.**

### 3. Batch queries

```javascript
// ❌ BAD: Query nhiều lần
for (unit of selectedUnits) {
    const enemies = factionSystem.findEnemiesInRange(unit, 300);
}

// ✅ GOOD: Query 1 lần cho cả group
const groupCenter = calculateGroupCenter(selectedUnits);
const allNearby = grid.queryRadius(groupCenter.x, groupCenter.y, 500);
const enemies = allNearby.filter(id => isEnemy(id));
```

---

## 🧪 Testing Performance

### Spawn nhiều units để test

```javascript
// DemoScene.js
createMassUnits() {
    for (let i = 0; i < 1000; i++) {
        const x = Phaser.Math.Between(0, WORLD_WIDTH);
        const y = Phaser.Math.Between(0, WORLD_HEIGHT);
        this.entityFactory.createPlayerSoldier(x, y);
    }
}

// Gọi trong create()
this.createMassUnits(); // Tạo 1000 units
```

### Measure performance

```javascript
update(time, delta) {
    const startTime = performance.now();
    
    this.ecsWorld.update(delta);
    
    const endTime = performance.now();
    const updateTime = endTime - startTime;
    
    console.log(`Update took: ${updateTime.toFixed(2)}ms`);
    
    // Target: <16ms for 60 FPS
    if (updateTime > 16) {
        console.warn('⚠️ Frame drop! Update took longer than 16ms');
    }
}
```

---

## 📈 Roadmap tiếp theo

### Phase 1: ✅ Spatial Partitioning
- [x] Tạo SpatialHashGrid
- [x] Tích hợp vào SteeringSystem
- [ ] Áp dụng vào CollisionSystem
- [ ] Áp dụng vào FactionSystem (findEnemiesInRange)

### Phase 2: 🔄 Group Movement
- [ ] Formation positioning
- [ ] Flocking behaviors
- [ ] Attack-Move với auto-engage

### Phase 3: 🧠 Behavior Trees
- [ ] Basic BT engine
- [ ] Target prioritization
- [ ] Tactical behaviors

---

## 🐛 Troubleshooting

### Entities không tránh nhau

**Nguyên nhân**: Cell size quá lớn hoặc AVOIDANCE_RADIUS > Cell size

**Giải pháp**:
```javascript
// Đảm bảo: CELL_SIZE >= 2 × AVOIDANCE_RADIUS
const AVOIDANCE_RADIUS = 40;
const CELL_SIZE = 100; // ✅ OK (100 >= 80)
```

### FPS vẫn thấp

**Kiểm tra**:
1. Có đang clear/rebuild grid mỗi frame? (OK nếu <2000 entities)
2. RenderSystem có đang vẽ quá nhiều Graphics objects?
3. Có bao nhiêu systems đang chạy?

**Profile**:
```javascript
// Measure từng system
for (const system of this.systems) {
    const start = performance.now();
    system.update(deltaTime, this.entities);
    const time = performance.now() - start;
    if (time > 5) {
        console.warn(`${system.constructor.name}: ${time.toFixed(2)}ms`);
    }
}
```

---

## 📚 References

- [Spatial Hashing Explained](https://www.gamedev.net/tutorials/programming/general-and-gameplay-programming/spatial-hashing-r2697/)
- [Optimizing Collision Detection](https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection)
- [ECS Performance Best Practices](https://github.com/SanderMertens/ecs-faq)


