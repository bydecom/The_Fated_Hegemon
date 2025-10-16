# 📜 Hướng dẫn sử dụng Hệ thống Faction (Chủng tộc & Bộ lạc)

## Tổng quan

Hệ thống Faction cho phép bạn:
- Định nghĩa nhiều **chủng tộc** (Races) với stats modifiers riêng
- Mỗi chủng tộc có nhiều **bộ lạc** (Tribes) với màu sắc và bonuses riêng
- Quản lý quan hệ giữa các bộ lạc (Ally, Enemy, Neutral)
- Tự động tính toán stats dựa trên race + tribe modifiers

---

## Cấu trúc

### 1. **Component: Faction** (`src/ecs/components/Faction.js`)
```javascript
import { Faction } from './ecs/components/Faction.js';

const faction = new Faction('human', 'stormwind');
// raceId: 'human'
// tribeId: 'stormwind'
```

### 2. **Manager: FactionManager** (`src/managers/FactionManager.js`)
Quản lý tất cả races, tribes và quan hệ giữa chúng.

### 3. **System: FactionSystem** (`src/ecs/systems/FactionSystem.js`)
Xử lý logic liên quan đến faction trong ECS (tìm enemies, allies, v.v.)

---

## Cách sử dụng

### Bước 1: Khởi tạo trong DemoScene

```javascript
import { FactionManager } from '../managers/FactionManager.js';
import { FactionSystem } from '../ecs/systems/FactionSystem.js';

export class DemoScene extends Phaser.Scene {
    create() {
        // 1. Tạo FactionManager
        this.factionManager = new FactionManager();
        
        // 2. Tạo FactionSystem
        const factionSystem = new FactionSystem(this.factionManager);
        this.ecsWorld.addSystem(factionSystem);
        
        // 3. Truyền factionManager vào EntityFactory
        this.entityFactory = new EntityFactory(this.ecsWorld, this.factionManager);
        
        // ...
    }
}
```

### Bước 2: Tạo units với faction

```javascript
// Tạo Human soldier của Kingdom of Stormwind
this.entityFactory.createUnitWithFaction(100, 100, 'human', 'stormwind', {
    selectable: true,
    isPlayerUnit: true,
    weapon: { type: 'long_stick', offsetX: 10, offsetY: 0 }
});

// Tạo Orc soldier của Frostwolf Clan
this.entityFactory.createUnitWithFaction(500, 500, 'orc', 'frostwolf', {
    aiType: 'wander',
    behavior: 'wander',
    weapon: { type: 'long_stick', offsetX: 10, offsetY: 0 }
});

// Tạo Elf archer của Night Elves
this.entityFactory.createUnitWithFaction(300, 300, 'elf', 'nightelf', {
    baseHealth: 80,        // Stats trước khi áp dụng modifiers
    baseDamage: 15,
    baseSpeed: 180,
    baseAttackRange: 80,
    shape: 'triangle'
});
```

### Bước 3: Tạo buildings với faction

```javascript
// Tạo building của Stormwind
this.entityFactory.createBuildingWithFaction(10, 10, 'human', 'stormwind', {
    sizeInTiles: 3,
    baseHealth: 500
});

// Tạo building của Frostwolf
this.entityFactory.createBuildingWithFaction(50, 50, 'orc', 'frostwolf', {
    sizeInTiles: 4,
    baseHealth: 800
});
```

---

## Races & Tribes mặc định

### 🧑 HUMAN (Con người)
**Stats Modifiers:** Cân bằng (1.0x tất cả)

**Tribes:**
- **Stormwind** (Xanh dương `0x0066ff`)
  - +10 HP, +2 Damage
- **Lordaeron** (Xanh cyan `0x00ffff`)
  - +5 HP, +10 Speed

### 💪 ORC
**Stats Modifiers:** +20% HP, +30% Damage, -10% Speed, +10% Attack Rate

**Tribes:**
- **Frostwolf** (Xanh lá `0x00ff00`)
  - +20 HP, +5 Damage
- **Warsong** (Cam đỏ `0xff6600`)
  - +8 Damage, +5 Speed

### 🏹 ELF (Tinh linh)
**Stats Modifiers:** -20% HP, -10% Damage, +30% Speed, -20% Attack Rate (nhanh hơn)

**Tribes:**
- **Night Elves** (Tím `0x9900ff`)
  - +20 Speed, +10 Attack Range
- **High Elves** (Vàng `0xffff00`)
  - +15 HP, +15 Attack Range

---

## Quan hệ mặc định

| Faction 1   | Faction 2    | Relation  |
|-------------|--------------|-----------|
| Human       | Human        | **Ally**  |
| Orc         | Orc          | **Ally**  |
| Elf         | Elf          | **Ally**  |
| Human       | Orc          | **Enemy** |
| Human       | Elf          | **Ally**  |
| Orc         | Elf          | **Enemy** |

---

## API Reference

### FactionManager

#### Đăng ký chủng tộc mới
```javascript
factionManager.registerRace('undead', {
    name: 'Undead',
    description: 'The Undead Scourge',
    healthMultiplier: 0.9,
    damageMultiplier: 1.1,
    speedMultiplier: 0.8,
    attackRateMultiplier: 1.0
});
```

#### Đăng ký bộ lạc mới
```javascript
factionManager.registerTribe('scourge', {
    raceId: 'undead',
    name: 'The Scourge',
    description: 'Lich King\'s army',
    color: 0x8800ff,
    bonusHealth: 15,
    bonusDamage: 10
});
```

#### Thiết lập quan hệ
```javascript
factionManager.setRelation('stormwind', 'scourge', RELATION_TYPE.ENEMY);
```

#### Kiểm tra quan hệ
```javascript
const isEnemy = factionManager.areEnemies('stormwind', 'frostwolf'); // true
const isAlly = factionManager.areAllies('stormwind', 'lordaeron'); // true
```

### FactionSystem

#### Tìm enemies trong tầm nhìn
```javascript
const factionSystem = ecsWorld.systems.find(s => s instanceof FactionSystem);
const position = components.get('position');
const enemies = factionSystem.findEnemiesInRange(
    components,
    ecsWorld.entities,
    300, // range
    position
);
// Returns: [{ entityId, components, distance }, ...]
```

#### Kiểm tra 2 entities có phải enemies không
```javascript
if (factionSystem.areEnemies(components1, components2)) {
    // Attack!
}
```

---

## Ví dụ: Tự động tấn công enemies

```javascript
// Trong AISystem hoặc BehaviorSystem
const factionSystem = this.ecsWorld.systems.find(s => s instanceof FactionSystem);
const position = components.get('position');
const ai = components.get('ai');

// Tìm enemy gần nhất
const enemies = factionSystem.findEnemiesInRange(
    components,
    this.ecsWorld.entities,
    ai.config.detectionRange,
    position
);

if (enemies.length > 0) {
    const nearestEnemy = enemies[0];
    ai.setTargetId(nearestEnemy.entityId);
    behavior.setBehavior('chase');
}
```

---

## Ví dụ: Query entities theo faction

```javascript
// Lấy tất cả units của Stormwind
const stormwindUnits = factionSystem.getEntitiesByTribe(
    ecsWorld.entities,
    'stormwind'
);

// Lấy tất cả units của chủng tộc Human
const humanUnits = factionSystem.getEntitiesByRace(
    ecsWorld.entities,
    'human'
);
```

---

## Lưu ý

1. **Faction component là optional** - Entities cũ vẫn hoạt động bình thường
2. **Màu sắc tự động** - Units sẽ có màu của tribe (không cần hard-code)
3. **Stats được tính tự động** - Race modifiers × Base Stats + Tribe bonuses
4. **Quan hệ có thể thay đổi** - Có thể đổi ally/enemy trong game

---

## Mở rộng

Bạn có thể thêm:
- Diplomacy system (thay đổi quan hệ động)
- Tech tree riêng cho mỗi race
- Special abilities cho mỗi tribe
- Resource bonuses
- Unique units


