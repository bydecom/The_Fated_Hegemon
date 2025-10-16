# 📚 HƯỚNG DẪN ECS CHO NGƯỜI MỚI BẮT ĐẦU

## 🎯 Mục lục
1. [ECS là gì?](#ecs-là-gì)
2. [Cấu trúc dự án](#cấu-trúc-dự-án)
3. [Thêm đơn vị mới (Units)](#thêm-đơn-vị-mới)
4. [Thêm Component mới](#thêm-component-mới)
5. [Thêm System mới](#thêm-system-mới)
6. [Thêm lệnh mới (Commands)](#thêm-lệnh-mới)
7. [Thêm hành vi mới (Behaviors)](#thêm-hành-vi-mới)
8. [Thêm building mới](#thêm-building-mới)
9. [Thêm tài nguyên mới](#thêm-tài-nguyên-mới)
10. [Checklist nhanh](#checklist-nhanh)

---

## 🧩 ECS là gì?

**ECS = Entity Component System** - Một kiến trúc lập trình game phổ biến.

### 3 thành phần chính:

#### 1. **Entity** (Thực thể)
- Là một **ID duy nhất** (ví dụ: `"abc123"`)
- KHÔNG chứa logic, chỉ là một "cái tên"
- Ví dụ: Một con lính chỉ là một ID `"soldier_01"`

#### 2. **Component** (Thành phần)
- Là **dữ liệu thuần túy** (không có logic)
- Gắn vào Entity để mô tả nó
- Ví dụ:
  - `Position(x, y)` - Vị trí
  - `Health(100, 100)` - Máu
  - `CombatStats(damage: 20)` - Sát thương

#### 3. **System** (Hệ thống)
- Là **logic xử lý** các Component
- Chạy mỗi frame để cập nhật game
- Ví dụ:
  - `MovementSystem` - Di chuyển các entity có Position + Velocity
  - `CombatSystem` - Xử lý chiến đấu giữa các entity

### 📊 Sơ đồ minh họa:

```
Entity "soldier_01" gồm:
  ├─ Position(100, 200)
  ├─ Health(100, 100)
  ├─ CombatStats(damage: 20)
  └─ Velocity(0, 0)

Mỗi frame:
  MovementSystem -> Đọc Position + Velocity -> Cập nhật vị trí
  CombatSystem   -> Đọc CombatStats + Health -> Xử lý đánh nhau
```

---

## 📁 Cấu trúc dự án

```
src/
├── ecs/
│   ├── world.js                      # 🧠 BỘ NÃO - Quản lý tất cả entities & systems
│   ├── EntityFactory.js              # 🏭 NHÀ MÁY - Tạo entities
│   ├── components/                   # 📦 DỮ LIỆU
│   │   ├── Position.js
│   │   ├── Health.js
│   │   ├── CombatStats.js
│   │   └── ...
│   └── systems/                      # ⚙️ LOGIC
│       ├── MovementSystem.js
│       ├── CombatSystem.js
│       └── ...
├── scenes/
│   └── DemoScene.js                  # 🎬 KHỞI TẠO game
└── managers/                         # 🛠️ CÔNG CỤ HỖ TRỢ
    ├── GridManager.js
    ├── PathfindingManager.js
    └── ...
```

### ⚡ Luồng hoạt động:

1. **DemoScene.create()** - Khởi tạo world, systems, entities
2. **Mỗi frame**: `DemoScene.update()` → `ECSWorld.update()` → Chạy tất cả systems
3. **Systems** đọc/ghi dữ liệu vào components

---

## 🪖 Thêm đơn vị mới

### Bước 1: Mở file `EntityFactory.js`

Đây là nơi tạo tất cả các loại đơn vị.

### Bước 2: Tạo method mới

**Ví dụ: Thêm "Cung thủ" (Archer)**

```javascript
// Trong EntityFactory.js
createArcher(x, y) {
    // 1️⃣ Tạo entity ID
    const entityId = this.ecsWorld.createEntity();
    
    // 2️⃣ Thêm components (DỮ LIỆU)
    this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
    this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
    this.ecsWorld.addComponent(entityId, 'health', new Health(80, 80)); // 80 HP (ít máu hơn lính)
    this.ecsWorld.addComponent(entityId, 'combatStats', new CombatStats(
        15,    // damage = 15 (yếu hơn lính)
        150,   // attackRange = 150 (xa hơn lính)
        800    // attackRate = 800ms (nhanh hơn lính)
    ));
    
    // 3️⃣ Giao diện (màu tím, hình tam giác)
    const appearance = new Appearance(0x9932CC, 10, 'triangle');
    appearance.setWeapon({ type: 'bow', offsetX: -3, offsetY: 12 });
    this.ecsWorld.addComponent(entityId, 'appearance', appearance);
    
    // 4️⃣ Hành vi & AI
    this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
    this.ecsWorld.addComponent(entityId, 'ai', new AI('idle', { speed: 130 })); // Chậm hơn lính
    
    // 5️⃣ Các components khác
    this.ecsWorld.addComponent(entityId, 'selectable', new Selectable());
    this.ecsWorld.addComponent(entityId, 'playerUnit', new PlayerUnit());
    this.ecsWorld.addComponent(entityId, 'entityType', new EntityType('unit'));
    this.ecsWorld.addComponent(entityId, 'clickBehavior', ClickBehaviorFactory.createSoldierBehavior());
    this.ecsWorld.addComponent(entityId, 'combatResponse', new CombatResponse({ 
        chaseRange: 180,        // Đuổi theo kẻ địch xa hơn
        maxChaseDistance: 350   // Đuổi xa hơn vì là cung thủ
    }));
    
    console.log(`🏹 Created archer at (${x}, ${y})`);
    return entityId;
}
```

### Bước 3: Sử dụng trong `DemoScene.js`

```javascript
// Trong DemoScene.js, method createPlayerUnits()
createPlayerUnits() {
    console.log('Creating player units...');
    
    // Tạo lính
    this.entityFactory.createPlayerSoldier(100, 100);
    this.entityFactory.createPlayerSoldier(150, 100);
    
    // ⭐ THÊM CUNG THỦ
    this.entityFactory.createArcher(200, 100);
    this.entityFactory.createArcher(250, 100);
}
```

### 📌 Giải thích các Component quan trọng:

| Component | Mục đích | Ví dụ |
|-----------|----------|-------|
| `Position` | Vị trí trên bản đồ | `(100, 200)` |
| `Velocity` | Tốc độ di chuyển | `(50, 0)` = đang di chuyển sang phải |
| `Health` | Máu hiện tại/tối đa | `Health(80, 100)` = 80/100 HP |
| `CombatStats` | Sát thương, tầm đánh | `damage: 20, range: 50` |
| `Appearance` | Hình dạng, màu sắc | `color: 0xff0000, size: 12, shape: 'circle'` |
| `Behavior` | Hành vi hiện tại | `'idle'`, `'chase'`, `'followPath'` |
| `AI` | Trí tuệ nhân tạo | Tốc độ, tầm nhìn, mục tiêu |
| `Selectable` | Có thể chọn bằng chuột | Không có dữ liệu, chỉ đánh dấu |
| `PlayerUnit` | Thuộc về player | Không có dữ liệu |

---

## 📦 Thêm Component mới

Component = Dữ liệu thuần túy, không có logic.

### Bước 1: Tạo file mới trong `src/ecs/components/`

**Ví dụ: Thêm "Armor" (Giáp)**

```javascript
// src/ecs/components/Armor.js
export class Armor {
    constructor(armorValue = 10, armorType = 'light') {
        this.armorValue = armorValue;     // Giảm sát thương nhận vào
        this.armorType = armorType;       // 'light', 'medium', 'heavy'
        this.durability = 100;            // Độ bền (giảm dần khi bị đánh)
        this.maxDurability = 100;
    }
    
    // Helper method: Tính sát thương sau khi giảm giáp
    reduceDamage(incomingDamage) {
        if (this.durability <= 0) return incomingDamage; // Giáp hỏng
        
        const reduction = this.armorValue / 100; // 10 armor = giảm 10%
        const finalDamage = Math.max(1, incomingDamage * (1 - reduction));
        
        // Giảm độ bền giáp
        this.durability = Math.max(0, this.durability - 1);
        
        return finalDamage;
    }
    
    isBroken() {
        return this.durability <= 0;
    }
}
```

### Bước 2: Import component vào `EntityFactory.js`

```javascript
// Đầu file EntityFactory.js
import { Armor } from './components/Armor.js';
```

### Bước 3: Thêm vào entity

```javascript
// Trong EntityFactory.js, method createKnight() (기사 - Knight)
createKnight(x, y) {
    const entityId = this.ecsWorld.createEntity();
    
    // ... các components khác ...
    
    // ⭐ THÊM GIÁP
    this.ecsWorld.addComponent(entityId, 'armor', new Armor(20, 'heavy')); // 20% giảm sát thương
    
    return entityId;
}
```

### Bước 4: Sử dụng trong System

```javascript
// Trong CombatSystem.js, khi tính sát thương:
const targetArmor = targetEntity.get('armor');
if (targetArmor) {
    // Sử dụng armor để giảm sát thương
    finalDamage = targetArmor.reduceDamage(baseDamage);
} else {
    finalDamage = baseDamage;
}
targetHealth.current -= finalDamage;
```

---

## ⚙️ Thêm System mới

System = Logic xử lý, chạy mỗi frame.

### Bước 1: Tạo file mới trong `src/ecs/systems/`

**Ví dụ: Thêm "RegenerationSystem" (Hồi máu tự động)**

```javascript
// src/ecs/systems/RegenerationSystem.js
export class RegenerationSystem {
    constructor() {
        this.regenInterval = 1000; // Hồi máu mỗi 1 giây
        this.timeSinceLastRegen = 0;
    }
    
    update(deltaTime, entities) {
        this.timeSinceLastRegen += deltaTime;
        
        // Chỉ hồi máu sau mỗi 1 giây
        if (this.timeSinceLastRegen < this.regenInterval) return;
        
        this.timeSinceLastRegen = 0; // Reset timer
        
        // Duyệt qua tất cả entities có Health
        entities.forEach((components, entityId) => {
            const health = components.get('health');
            const behavior = components.get('behavior');
            
            // Chỉ hồi máu khi idle (không chiến đấu)
            if (health && behavior && behavior.current === 'idle') {
                // Hồi 2 HP mỗi giây
                if (health.current < health.max) {
                    health.current = Math.min(health.max, health.current + 2);
                    console.log(`💚 Entity ${entityId} regenerated to ${health.current}/${health.max} HP`);
                }
            }
        });
    }
}
```

### Bước 2: Import vào `DemoScene.js`

```javascript
// Đầu file DemoScene.js
import { RegenerationSystem } from '../ecs/systems/RegenerationSystem.js';
```

### Bước 3: Thêm vào ECS World

```javascript
// Trong DemoScene.js, method create()
create() {
    // ... code khởi tạo khác ...
    
    // Thêm systems
    this.ecsWorld.addSystem(new AISystem());
    this.ecsWorld.addSystem(new BehaviorSystem());
    this.ecsWorld.addSystem(new MovementSystem());
    this.ecsWorld.addSystem(new CombatSystem());
    
    // ⭐ THÊM SYSTEM MỚI
    this.ecsWorld.addSystem(new RegenerationSystem());
    
    this.ecsWorld.addSystem(new RenderSystem()); // Render luôn là cuối cùng
    
    // ...
}
```

### 📌 Thứ tự Systems quan trọng:

```
1. AISystem           → Quyết định hành động (target, path)
2. BehaviorSystem     → Thay đổi behavior dựa trên AI
3. SteeringSystem     → Điều khiển velocity
4. MovementSystem     → Cập nhật position từ velocity
5. CollisionSystem    → Kiểm tra va chạm
6. CombatSystem       → Xử lý chiến đấu
7. RegenerationSystem → Hồi máu
8. HarvestSystem      → Thu hoạch tài nguyên
9. RenderSystem       → Vẽ lên màn hình (LUÔN CUỐI CÙNG)
```

---

## 🎮 Thêm lệnh mới (Commands)

Lệnh = Hành động mà player ra cho units (di chuyển, tấn công, thu hoạch, v.v.)

### Bước 1: Thêm hotkey trong `DemoScene.js`

```javascript
// Trong method setupCommandHotkeys()
setupCommandHotkeys() {
    // Lệnh hiện có: A (Attack), S (Stop), D (Defence), P (Patrol), H (Harvest)
    
    // ⭐ THÊM LỆNH MỚI: F - Formation (Đội hình)
    this.input.keyboard.on('keydown-F', () => {
        if (this.selectedEntities.size > 0) {
            this.activateCommand('formation');
        }
    });
}
```

### Bước 2: Thêm vào method `activateCommand()`

```javascript
// Trong method activateCommand()
activateCommand(commandKey) {
    const commandData = {
        'attack': { cursor: 'crosshair' },
        'stop': { cursor: 'default' },
        'defence': { cursor: 'help' },
        'patrol': { cursor: 'pointer' },
        'harvest': { cursor: 'grab' },
        // ⭐ THÊM LỆNH MỚI
        'formation': { cursor: 'move' }
    };
    
    const command = commandData[commandKey];
    if (!command) return;
    
    this.currentCommand = commandKey;
    this.input.setDefaultCursor(command.cursor);
    this.events.emit('commandActivated', commandKey);
    
    console.log(`⌨️ Hotkey: ${commandKey.toUpperCase()} activated`);
}
```

### Bước 3: Xử lý lệnh trong `handleCommandExecution()`

```javascript
// Trong method handleCommandExecution()
handleCommandExecution(worldPoint) {
    console.log(`🎮 Executing command: ${this.currentCommand}`);
    
    switch (this.currentCommand) {
        case 'attack':
            // ... code hiện có ...
            break;
            
        case 'stop':
            // ... code hiện có ...
            break;
            
        // ⭐ THÊM CASE MỚI
        case 'formation':
            this.executeFormationCommand(worldPoint);
            break;
    }
    
    // Reset command
    this.currentCommand = null;
    if (this.uiScene) {
        this.uiScene.resetCommand();
    }
}
```

### Bước 4: Tạo method thực thi lệnh

```javascript
// Thêm method mới trong DemoScene.js
executeFormationCommand(worldPoint) {
    console.log(`📐 Formation command: ${this.selectedEntities.size} units at (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`);
    
    const units = Array.from(this.selectedEntities);
    const numUnits = units.length;
    
    // Tính vị trí cho mỗi đơn vị (hàng ngang)
    const spacing = 50; // Khoảng cách giữa các đơn vị
    const startX = worldPoint.x - (numUnits - 1) * spacing / 2;
    
    units.forEach((entityId, index) => {
        const entity = this.ecsWorld.entities.get(entityId);
        if (!entity) return;
        
        const pos = entity.get('position');
        const ai = entity.get('ai');
        const behavior = entity.get('behavior');
        
        if (pos && ai && behavior) {
            // Tính vị trí trong đội hình
            const targetX = startX + index * spacing;
            const targetY = worldPoint.y;
            
            // Di chuyển đến vị trí
            const targetWorldPoint = { x: targetX, y: targetY };
            const startGridPos = this.gridManager.worldToGrid(pos.x, pos.y);
            const endGridPos = this.gridManager.worldToGrid(targetX, targetY);
            
            this.pathfindingManager.findPath(startGridPos, endGridPos, (path) => {
                if (path) {
                    ai.setPath(path);
                    behavior.setBehavior('followPath');
                    console.log(`  Unit ${entityId}: Moving to formation position (${targetX.toFixed(0)}, ${targetY.toFixed(0)})`);
                }
            });
        }
    });
}
```

### Bước 5: Thêm button trong UI (tùy chọn)

Nếu muốn có button trong `UIScene.js`:

```javascript
// Trong UIScene.js, method createCommandButtons()
createCommandButtons() {
    const commands = [
        { key: 'attack', icon: '⚔️', hotkey: 'A', tooltip: 'Attack (A)' },
        { key: 'stop', icon: '🛑', hotkey: 'S', tooltip: 'Stop (S)' },
        { key: 'defence', icon: '🛡️', hotkey: 'D', tooltip: 'Defence (D)' },
        { key: 'patrol', icon: '🚶', hotkey: 'P', tooltip: 'Patrol (P)' },
        { key: 'harvest', icon: '🌾', hotkey: 'H', tooltip: 'Harvest (H)' },
        // ⭐ THÊM BUTTON MỚI
        { key: 'formation', icon: '📐', hotkey: 'F', tooltip: 'Formation (F)' }
    ];
    
    // ... code tạo buttons ...
}
```

---

## 🚶 Thêm hành vi mới (Behaviors)

Behavior = Trạng thái hoạt động của unit (`idle`, `chase`, `followPath`, v.v.)

### Bước 1: Hiểu component `Behavior.js`

```javascript
// src/ecs/components/Behavior.js
export class Behavior {
    constructor(initialBehavior = 'idle', params = {}) {
        this.current = initialBehavior;  // Hành vi hiện tại
        this.params = params;             // Tham số (ví dụ: speed, interval)
        this.stateData = {};              // Dữ liệu trạng thái
    }
    
    setBehavior(newBehavior, params = {}) {
        this.current = newBehavior;
        this.params = { ...this.params, ...params };
    }
}
```

### Bước 2: Thêm logic vào `BehaviorSystem.js`

**Ví dụ: Thêm behavior "flee" (Chạy trốn)**

```javascript
// Trong BehaviorSystem.js, method update()
update(deltaTime, entities) {
    entities.forEach((components, entityId) => {
        const behavior = components.get('behavior');
        const ai = components.get('ai');
        
        if (!behavior || !ai) return;
        
        // Xử lý các behavior hiện có
        switch (behavior.current) {
            case 'idle':
                this.handleIdle(entityId, components);
                break;
                
            case 'chase':
                this.handleChase(entityId, components);
                break;
                
            // ⭐ THÊM BEHAVIOR MỚI
            case 'flee':
                this.handleFlee(entityId, components);
                break;
        }
    });
}

// ⭐ Method mới: Xử lý behavior "flee"
handleFlee(entityId, components) {
    const position = components.get('position');
    const velocity = components.get('velocity');
    const behavior = components.get('behavior');
    const ai = components.get('ai');
    
    if (!position || !velocity || !ai) return;
    
    const threat = behavior.params.threatId; // ID của kẻ thù đang đuổi theo
    if (!threat) {
        // Không còn mối đe dọa → quay về idle
        behavior.setBehavior('idle');
        velocity.x = 0;
        velocity.y = 0;
        return;
    }
    
    const threatEntity = this.world.entities.get(threat);
    if (!threatEntity) {
        behavior.setBehavior('idle');
        return;
    }
    
    const threatPos = threatEntity.get('position');
    if (!threatPos) return;
    
    // Tính hướng chạy trốn (ngược lại với kẻ thù)
    const dx = position.x - threatPos.x;
    const dy = position.y - threatPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 300) {
        // Đã chạy đủ xa → dừng lại
        behavior.setBehavior('idle');
        velocity.x = 0;
        velocity.y = 0;
        console.log(`🏃 Entity ${entityId}: Escaped successfully`);
        return;
    }
    
    // Chạy trốn với tốc độ cao
    const fleeSpeed = ai.speed * 1.5; // Chạy nhanh hơn bình thường 50%
    const normalizedX = dx / distance;
    const normalizedY = dy / distance;
    
    velocity.x = normalizedX * fleeSpeed;
    velocity.y = normalizedY * fleeSpeed;
    
    console.log(`🏃 Entity ${entityId}: Fleeing from ${threat}`);
}
```

### Bước 3: Sử dụng behavior mới

```javascript
// Ví dụ: Khi một unit bị tấn công và máu thấp, nó sẽ chạy trốn
// Trong CombatSystem.js hoặc AISystem.js

if (health.current < health.max * 0.3) { // Máu dưới 30%
    behavior.setBehavior('flee', { threatId: attackerId });
    console.log(`😱 Entity ${entityId}: Fleeing from attacker!`);
}
```

---

## 🏰 Thêm building mới

Building = Công trình (nhà, tháp, v.v.)

### Bước 1: Tạo method trong `EntityFactory.js`

**Ví dụ: Thêm "Barracks" (Doanh trại)**

```javascript
// Trong EntityFactory.js
createBarracks(gridX, gridY) {
    const tileSize = this.ecsWorld.scene.gridManager.tileSize;
    const buildingSizeInTiles = 4; // Doanh trại 4x4 ô (lớn hơn nhà thường)
    const buildingPixelSize = buildingSizeInTiles * tileSize;
    
    // Tính tọa độ world (tâm building)
    const worldX = gridX * tileSize + buildingPixelSize / 2;
    const worldY = gridY * tileSize + buildingPixelSize / 2;
    
    const entityId = this.ecsWorld.createEntity();
    
    // Components cơ bản
    this.ecsWorld.addComponent(entityId, 'position', new Position(worldX, worldY));
    this.ecsWorld.addComponent(entityId, 'velocity', new Velocity(0, 0)); // Đứng yên
    this.ecsWorld.addComponent(entityId, 'health', new Health(800, 800)); // 800 HP (bền hơn nhà thường)
    this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
    this.ecsWorld.addComponent(entityId, 'ai', new AI('idle', { speed: 0 }));
    
    // Appearance: Hình chữ nhật màu xanh lá
    const appearance = new Appearance(0x228B22, buildingPixelSize / 2, 'rectangle');
    appearance.setWeapon({ type: null });
    appearance.hasArms = false;
    this.ecsWorld.addComponent(entityId, 'appearance', appearance);
    
    // Building components
    this.ecsWorld.addComponent(entityId, 'building', new Building());
    this.ecsWorld.addComponent(entityId, 'selectable', new Selectable());
    this.ecsWorld.addComponent(entityId, 'playerUnit', new PlayerUnit());
    this.ecsWorld.addComponent(entityId, 'entityType', new EntityType('building'));
    
    // ⭐ THÊM COMPONENT ĐẶC BIỆT: TrainingFacility (Có thể đào tạo lính)
    // (Cần tạo component mới TrainingFacility.js trước)
    // this.ecsWorld.addComponent(entityId, 'trainingFacility', new TrainingFacility(['soldier', 'archer']));
    
    // Đánh dấu grid là bị chiếm
    for (let x = gridX; x < gridX + buildingSizeInTiles; x++) {
        for (let y = gridY; y < gridY + buildingSizeInTiles; y++) {
            this.ecsWorld.scene.gridManager.setTileOccupied(x, y, entityId);
        }
    }
    
    // Cập nhật pathfinding
    if (this.ecsWorld.scene.pathfindingManager) {
        this.ecsWorld.scene.pathfindingManager.updateGrid();
    }
    
    console.log(`🏰 Created barracks at (${worldX}, ${worldY}), size: ${buildingSizeInTiles}x${buildingSizeInTiles}`);
    return entityId;
}
```

### Bước 2: Đặt building trong map

```javascript
// Trong DemoScene.js
createPlayerBuildings() {
    // Tạo nhà chính
    this.entityFactory.createPlayerBase(10, 10);
    
    // ⭐ THÊM DOANH TRẠI
    this.entityFactory.createBarracks(20, 10);
    this.entityFactory.createBarracks(30, 10);
}
```

### 📌 Lưu ý:

- **Grid Coordinates**: Building dùng tọa độ grid (`gridX, gridY`), không phải world coordinates
- **Đánh dấu grid**: Phải gọi `gridManager.setTileOccupied()` để pathfinding biết ô bị chiếm
- **Cập nhật pathfinding**: Gọi `pathfindingManager.updateGrid()` sau khi tạo/xóa building

---

## 💎 Thêm tài nguyên mới

Tài nguyên = Vật phẩm thu hoạch (gỗ, vàng, đá, v.v.)

### Bước 1: Tạo method trong `EntityFactory.js`

**Ví dụ: Thêm "Crystal" (Pha lê)**

```javascript
// Trong EntityFactory.js
createCrystal(x, y, crystalAmount = 300) {
    const entityId = this.ecsWorld.createEntity();
    
    // Position
    this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
    
    // Appearance: Hình kim cương màu xanh dương sáng
    const appearance = new Appearance(0x00FFFF, 22, 'diamond'); // Sử dụng shape đặc biệt (cần thêm vào RenderSystem)
    appearance.setWeapon({ type: null });
    appearance.hasArms = false;
    this.ecsWorld.addComponent(entityId, 'appearance', appearance);
    
    // Resource node: Loại 'crystal', thu hoạch chậm (0.5 crystal/giây)
    this.ecsWorld.addComponent(entityId, 'resourceNode', new ResourceNode('crystal', crystalAmount, 0.5));
    this.ecsWorld.addComponent(entityId, 'entityType', new EntityType('resource'));
    
    // Đánh dấu grid (chiếm 1 ô)
    const tileSize = this.ecsWorld.scene.gridManager.tileSize;
    const gridX = Math.floor(x / tileSize);
    const gridY = Math.floor(y / tileSize);
    this.ecsWorld.scene.gridManager.setTileOccupied(gridX, gridY, entityId);
    
    console.log(`💎 Created crystal at (${x}, ${y}) with ${crystalAmount} crystal`);
    return entityId;
}
```

### Bước 2: Tạo tài nguyên trong scene

```javascript
// Trong DemoScene.js, method createResources()
createResources() {
    // Tài nguyên hiện có: Tree, GoldMine, SilverMine, StoneMine, WaterSource, Animal
    
    // ⭐ THÊM PHA LÊ
    for (let i = 0; i < 5; i++) {
        const x = Phaser.Math.Between(200, WORLD_WIDTH - 200);
        const y = Phaser.Math.Between(200, WORLD_HEIGHT - 200);
        this.entityFactory.createCrystal(x, y, Phaser.Math.Between(200, 400));
    }
}
```

### Bước 3: Cập nhật ResourceManager

```javascript
// Trong ResourceManager.js, thêm loại tài nguyên mới
constructor() {
    this.resources = {
        wood: 0,
        gold: 0,
        silver: 0,
        stone: 0,
        water: 0,
        meat: 0,
        crystal: 0  // ⭐ THÊM
    };
}
```

### Bước 4: Cập nhật UI hiển thị

```javascript
// Trong UIScene.js, method updateResourceDisplay()
updateResourceDisplay(resourceManager) {
    const resources = resourceManager.getAllResources();
    
    this.resourceText.setText(`
        🌲 Wood: ${resources.wood}
        💰 Gold: ${resources.gold}
        ⚪ Silver: ${resources.silver}
        🧱 Stone: ${resources.stone}
        💧 Water: ${resources.water}
        🍖 Meat: ${resources.meat}
        💎 Crystal: ${resources.crystal}  <!-- ⭐ THÊM -->
    `);
}
```

---

## ✅ Checklist nhanh

### Thêm đơn vị mới
- [ ] Tạo method `create[UnitName]()` trong `EntityFactory.js`
- [ ] Thêm các components cần thiết (Position, Health, CombatStats, etc.)
- [ ] Gọi method trong `DemoScene.createPlayerUnits()` hoặc `createEnemyUnits()`
- [ ] Test trong game

### Thêm Component mới
- [ ] Tạo file `src/ecs/components/[ComponentName].js`
- [ ] Export class với constructor và properties
- [ ] Import vào `EntityFactory.js`
- [ ] Thêm vào entities cần thiết
- [ ] Cập nhật System để sử dụng component

### Thêm System mới
- [ ] Tạo file `src/ecs/systems/[SystemName].js`
- [ ] Tạo method `update(deltaTime, entities)`
- [ ] Import vào `DemoScene.js`
- [ ] Thêm vào `ecsWorld.addSystem()` (CHÚ Ý THỨ TỰ)
- [ ] Test logic

### Thêm lệnh mới
- [ ] Thêm hotkey trong `setupCommandHotkeys()`
- [ ] Thêm vào `activateCommand()`
- [ ] Thêm case trong `handleCommandExecution()`
- [ ] Tạo method `execute[Command]Command()`
- [ ] (Tùy chọn) Thêm button trong `UIScene.js`

### Thêm hành vi mới
- [ ] Thêm case trong `BehaviorSystem.update()`
- [ ] Tạo method `handle[Behavior]()`
- [ ] Gọi `behavior.setBehavior('[newBehavior]')` từ nơi cần thiết
- [ ] Test behavior

### Thêm building mới
- [ ] Tạo method `create[BuildingName]()` trong `EntityFactory.js`
- [ ] Đánh dấu grid bị chiếm
- [ ] Cập nhật pathfinding grid
- [ ] Gọi method trong scene
- [ ] Test va chạm và pathfinding

### Thêm tài nguyên mới
- [ ] Tạo method `create[ResourceName]()` trong `EntityFactory.js`
- [ ] Thêm component `resourceNode`
- [ ] Đánh dấu grid
- [ ] Cập nhật `ResourceManager.js`
- [ ] Cập nhật UI hiển thị
- [ ] Test thu hoạch

---

## 🎓 Mẹo và Best Practices

### 1. Naming Convention (Quy tắc đặt tên)

```javascript
// Components: Danh từ, PascalCase
Position, Health, CombatStats, Armor

// Systems: Danh từ + "System", PascalCase
MovementSystem, CombatSystem, RegenerationSystem

// Methods: Động từ + Tên, camelCase
createArcher, handleFlee, executeAttackCommand

// Behaviors: Động từ nguyên mẫu, lowercase
'idle', 'chase', 'flee', 'followPath', 'harvest'
```

### 2. Component vs System

**Component** = Dữ liệu
```javascript
// ✅ ĐÚNG
class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

// ❌ SAI - Component không nên có logic
class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    
    moveTowards(target) { // ← Logic không thuộc component
        // ...
    }
}
```

**System** = Logic
```javascript
// ✅ ĐÚNG
class MovementSystem {
    update(deltaTime, entities) {
        entities.forEach((components, entityId) => {
            const pos = components.get('position');
            const vel = components.get('velocity');
            
            if (pos && vel) {
                pos.x += vel.x * deltaTime;
                pos.y += vel.y * deltaTime;
            }
        });
    }
}
```

### 3. Performance Tips

```javascript
// ❌ CHẬM: Duyệt toàn bộ entities mỗi frame
update(deltaTime, entities) {
    entities.forEach((components, entityId) => {
        // Làm gì đó với TẤT CẢ entities
    });
}

// ✅ NHANH: Chỉ xử lý entities có components cần thiết
update(deltaTime, entities) {
    entities.forEach((components, entityId) => {
        // Check ngay từ đầu
        if (!components.has('position') || !components.has('velocity')) return;
        
        const pos = components.get('position');
        const vel = components.get('velocity');
        // Xử lý...
    });
}

// ✅ NHANH HƠN: Sử dụng query cache
update(deltaTime, entities) {
    // Chỉ lấy entities có Position + Velocity
    const movingEntities = this.world.query.all(Position, Velocity).get();
    movingEntities.forEach(entity => {
        // Xử lý...
    });
}
```

### 4. Debugging Tips

```javascript
// Thêm log để debug
console.log(`🐛 Entity ${entityId}: ${JSON.stringify(components.get('behavior'))}`);

// Sử dụng emoji để dễ nhận diện
console.log(`⚔️ Attack:`, data);      // Combat
console.log(`🚶 Move:`, data);        // Movement
console.log(`💚 Regen:`, data);       // Regeneration
console.log(`🌾 Harvest:`, data);     // Harvesting
console.log(`❌ Error:`, error);      // Errors
```

---

## 📚 Tài nguyên học thêm

### Khái niệm ECS
- [ECS FAQ](https://github.com/SanderMertens/ecs-faq) - Câu hỏi thường gặp về ECS
- [Overwatch Gameplay Architecture](https://www.youtube.com/watch?v=W3aieHjyNvw) - GDC talk về ECS trong Overwatch

### Phaser 3
- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [Phaser 3 Examples](https://phaser.io/examples)

---

## 💬 Câu hỏi thường gặp

### Q: Tại sao không gộp chung Position và Velocity thành một component?
**A**: Vì một số entity chỉ cần Position (như building), không cần Velocity. ECS khuyến khích chia nhỏ components để linh hoạt.

### Q: System nào chạy trước, System nào chạy sau?
**A**: Thứ tự quan trọng! Thường: AI → Behavior → Steering → Movement → Collision → Combat → Render.

### Q: Làm sao để một entity có nhiều behaviors cùng lúc?
**A**: Behavior component chỉ lưu 1 trạng thái tại một thời điểm. Nếu cần phức tạp hơn, tạo StateMachine component riêng.

### Q: Khi nào nên tạo Component mới, khi nào dùng lại Component cũ?
**A**: Tạo mới nếu dữ liệu không liên quan. Ví dụ: `Armor` và `CombatStats` là riêng biệt, nhưng `attackDamage` nên nằm trong `CombatStats`.

### Q: Làm sao để giao tiếp giữa các Systems?
**A**: Thông qua Components! System A ghi dữ liệu vào component, System B đọc component đó.

---

## 🎉 Kết luận

Bạn đã học được:
- ✅ ECS là gì và cách hoạt động
- ✅ Thêm đơn vị, component, system, lệnh, behavior
- ✅ Thêm building và tài nguyên
- ✅ Best practices và debugging

**Bước tiếp theo**: Thử tạo một đơn vị hoặc lệnh mới theo hướng dẫn trên!

Nếu gặp khó khăn, hãy:
1. Kiểm tra console log (F12)
2. Đọc lại hướng dẫn phần liên quan
3. Xem code của các entity/system hiện có để tham khảo

**Chúc bạn code vui! 🚀**

