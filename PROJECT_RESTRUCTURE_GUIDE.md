# 🏗️ HƯỚNG DẪN TÁI CẤU TRÚC DỰ ÁN

## 🎯 Mục tiêu

Tái cấu trúc dự án để dễ dàng mở rộng:
- ✅ Nhiều loại units (soldier, archer, knight, mage, etc.)
- ✅ Nhiều loại buildings (barracks, tower, farm, etc.)
- ✅ Nhiều loại animals (boar, deer, wolf, etc.)
- ✅ Hệ thống faction phức tạp
- ✅ Dễ quản lý và maintain

---

## 📁 CẤU TRÚC MỚI ĐỀ XUẤT

```
src/
├── core/                           # 🧠 CORE SYSTEMS
│   ├── ECS/
│   │   ├── world.js
│   │   ├── EntityFactory.js
│   │   └── systems/
│   │       ├── MovementSystem.js
│   │       ├── RenderSystem.js
│   │       ├── AnimationSystem.js
│   │       └── ...
│   └── managers/
│       ├── GridManager.js
│       ├── PathfindingManager.js
│       ├── ResourceManager.js
│       └── ...
│
├── entities/                       # 🎭 ENTITIES & COMPONENTS
│   ├── components/
│   │   ├── common/                 # Components dùng chung
│   │   │   ├── Position.js
│   │   │   ├── Health.js
│   │   │   ├── Appearance.js
│   │   │   └── Animation.js
│   │   ├── units/                 # Components cho units
│   │   │   ├── CombatStats.js
│   │   │   ├── AI.js
│   │   │   ├── Behavior.js
│   │   │   └── Harvester.js
│   │   ├── buildings/             # Components cho buildings
│   │   │   ├── Building.js
│   │   │   ├── Production.js
│   │   │   └── Storage.js
│   │   └── resources/             # Components cho resources
│   │       ├── ResourceNode.js
│   │       └── ResourceStorage.js
│   │
│   ├── units/                     # 🪖 UNITS
│   │   ├── player/                # Units của player
│   │   │   ├── Soldier.js
│   │   │   ├── Archer.js
│   │   │   ├── Knight.js
│   │   │   └── Harvester.js
│   │   ├── enemy/                 # Units của enemy
│   │   │   ├── EnemySoldier.js
│   │   │   ├── EnemyArcher.js
│   │   │   └── EnemyMage.js
│   │   └── neutral/               # Units trung lập
│   │       ├── Animal.js
│   │       ├── Merchant.js
│   │       └── Villager.js
│   │
│   ├── buildings/                 # 🏰 BUILDINGS
│   │   ├── military/              # Buildings quân sự
│   │   │   ├── Barracks.js
│   │   │   ├── Tower.js
│   │   │   └── Fortress.js
│   │   ├── economic/              # Buildings kinh tế
│   │   │   ├── Farm.js
│   │   │   ├── Mill.js
│   │   │   └── Market.js
│   │   └── special/               # Buildings đặc biệt
│   │       ├── Temple.js
│   │       └── Academy.js
│   │
│   └── resources/                 # 💎 RESOURCES
│       ├── natural/               # Tài nguyên tự nhiên
│       │   ├── Tree.js
│       │   ├── GoldMine.js
│       │   └── StoneQuarry.js
│       └── animals/               # Động vật
│           ├── Boar.js
│           ├── Deer.js
│           └── Wolf.js
│
├── factions/                      # 🏴 FACTIONS
│   ├── FactionManager.js
│   ├── FactionSystem.js
│   ├── races/                     # Các chủng tộc
│   │   ├── Human.js
│   │   ├── Elf.js
│   │   └── Orc.js
│   └── tribes/                    # Các bộ lạc
│       ├── Kingdom.js
│       ├── Empire.js
│       └── Horde.js
│
├── animations/                    # 🎬 ANIMATIONS
│   ├── AnimationManager.js
│   ├── SpriteSheetManager.js
│   ├── configs/                   # Animation configs
│   │   ├── units/
│   │   │   ├── soldier.json
│   │   │   ├── archer.json
│   │   │   └── knight.json
│   │   ├── buildings/
│   │   │   ├── barracks.json
│   │   │   └── tower.json
│   │   └── animals/
│   │       ├── boar.json
│   │       └── deer.json
│   └── sprites/                   # Sprite sheets
│       ├── units/
│       ├── buildings/
│       └── animals/
│
├── commands/                      # 🎮 COMMANDS
│   ├── CommandManager.js
│   ├── CommandSystem.js
│   ├── types/                     # Các loại lệnh
│   │   ├── MoveCommand.js
│   │   ├── AttackCommand.js
│   │   ├── HarvestCommand.js
│   │   └── BuildCommand.js
│   └── behaviors/                 # Behaviors
│       ├── IdleBehavior.js
│       ├── ChaseBehavior.js
│       └── HarvestBehavior.js
│
├── ui/                           # 🖥️ USER INTERFACE
│   ├── UIScene.js
│   ├── components/                # UI Components
│   │   ├── ResourcePanel.js
│   │   ├── UnitPanel.js
│   │   └── BuildingPanel.js
│   └── styles/                    # UI Styles
│       ├── colors.js
│       └── fonts.js
│
├── scenes/                       # 🎬 SCENES
│   ├── GameScene.js
│   ├── MenuScene.js
│   ├── PauseScene.js
│   └── PreloaderScene.js
│
├── data/                         # 📊 DATA & CONFIGS
│   ├── units/                    # Unit configs
│   │   ├── soldier.json
│   │   ├── archer.json
│   │   └── knight.json
│   ├── buildings/                # Building configs
│   │   ├── barracks.json
│   │   └── tower.json
│   ├── factions/                 # Faction configs
│   │   ├── human.json
│   │   └── elf.json
│   └── game/                     # Game configs
│       ├── balance.json
│       └── settings.json
│
└── utils/                        # 🛠️ UTILITIES
    ├── MathUtils.js
    ├── ColorUtils.js
    ├── FileUtils.js
    └── DebugUtils.js
```

---

## 🚀 KẾ HOẠCH MIGRATION

### Phase 1: Tạo cấu trúc mới
```bash
# Tạo các thư mục chính
mkdir -p src/core/ECS/systems
mkdir -p src/core/managers
mkdir -p src/entities/components/{common,units,buildings,resources}
mkdir -p src/entities/{units,buildings,resources}
mkdir -p src/factions/{races,tribes}
mkdir -p src/animations/{configs,sprites}
mkdir -p src/commands/{types,behaviors}
mkdir -p src/ui/{components,styles}
mkdir -p src/data/{units,buildings,factions,game}
mkdir -p src/utils
```

### Phase 2: Di chuyển files hiện tại
```bash
# Core systems
mv src/ecs/world.js src/core/ECS/
mv src/ecs/EntityFactory.js src/core/ECS/
mv src/ecs/systems/* src/core/ECS/systems/
mv src/managers/* src/core/managers/

# Components
mv src/ecs/components/Position.js src/entities/components/common/
mv src/ecs/components/Health.js src/entities/components/common/
mv src/ecs/components/Appearance.js src/entities/components/common/
mv src/ecs/components/Animation.js src/entities/components/common/
mv src/ecs/components/CombatStats.js src/entities/components/units/
mv src/ecs/components/AI.js src/entities/components/units/
mv src/ecs/components/Behavior.js src/entities/components/units/
mv src/ecs/components/Harvester.js src/entities/components/units/
mv src/ecs/components/Building.js src/entities/components/buildings/
mv src/ecs/components/ResourceNode.js src/entities/components/resources/
mv src/ecs/components/ResourceStorage.js src/entities/components/resources/

# Scenes
mv src/scenes/* src/scenes/

# Data
mv src/data/* src/data/
```

### Phase 3: Tạo entity classes mới

#### Unit Classes
```javascript
// src/entities/units/player/Soldier.js
export class Soldier {
    static create(ecsWorld, x, y, faction = 'human') {
        const entityId = ecsWorld.createEntity();
        
        // Base components
        ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        ecsWorld.addComponent(entityId, 'appearance', new Appearance(0x00ff00, 12, 'circle'));
        
        // Unit-specific components
        ecsWorld.addComponent(entityId, 'combatStats', new CombatStats(20, 50, 1000));
        ecsWorld.addComponent(entityId, 'ai', new AI('idle', { speed: 150 }));
        ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
        
        // Faction
        ecsWorld.addComponent(entityId, 'faction', new Faction('human', 'kingdom'));
        
        // Animation
        ecsWorld.addComponent(entityId, 'animation', new Animation('soldier', 'idle', 'down'));
        
        return entityId;
    }
}
```

#### Building Classes
```javascript
// src/entities/buildings/military/Barracks.js
export class Barracks {
    static create(ecsWorld, gridX, gridY, faction = 'human') {
        const entityId = ecsWorld.createEntity();
        
        // Base components
        ecsWorld.addComponent(entityId, 'position', new Position(worldX, worldY));
        ecsWorld.addComponent(entityId, 'health', new Health(800, 800));
        ecsWorld.addComponent(entityId, 'appearance', new Appearance(0x228B22, 32, 'rectangle'));
        
        // Building-specific components
        ecsWorld.addComponent(entityId, 'building', new Building());
        ecsWorld.addComponent(entityId, 'production', new Production(['soldier', 'archer']));
        
        // Faction
        ecsWorld.addComponent(entityId, 'faction', new Faction('human', 'kingdom'));
        
        return entityId;
    }
}
```

#### Animal Classes
```javascript
// src/entities/resources/animals/Boar.js
export class Boar {
    static create(ecsWorld, x, y, meatAmount = 200) {
        const entityId = ecsWorld.createEntity();
        
        // Base components
        ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        ecsWorld.addComponent(entityId, 'appearance', new Appearance(0x2F2F2F, 32, 'circle'));
        
        // Animal-specific components
        ecsWorld.addComponent(entityId, 'resourceNode', new ResourceNode('meat', meatAmount, 1));
        ecsWorld.addComponent(entityId, 'behavior', new Behavior('wander', { speed: 30, interval: 2000 }));
        ecsWorld.addComponent(entityId, 'ai', new AI('wander'));
        
        // Animation
        ecsWorld.addComponent(entityId, 'animation', new Animation('boar', 'idle', 'down'));
        
        return entityId;
    }
}
```

---

## 🎯 LỢI ÍCH CỦA CẤU TRÚC MỚI

### 1. **Tổ chức rõ ràng**
- Mỗi loại entity có thư mục riêng
- Components được phân loại theo chức năng
- Dễ tìm và sửa code

### 2. **Dễ mở rộng**
- Thêm unit mới: Tạo file trong `src/entities/units/`
- Thêm building mới: Tạo file trong `src/entities/buildings/`
- Thêm animal mới: Tạo file trong `src/entities/resources/animals/`

### 3. **Tái sử dụng code**
- Components chung trong `src/entities/components/common/`
- Base classes cho từng loại entity
- Shared utilities

### 4. **Quản lý config**
- Mỗi entity có config riêng
- Dễ balance game
- Dễ thêm content mới

### 5. **Team collaboration**
- Mỗi developer có thể làm việc trên module riêng
- Ít conflict khi merge code
- Dễ review code

---

## 🔧 IMPLEMENTATION STEPS

### Bước 1: Tạo cấu trúc thư mục
```bash
# Chạy script tạo thư mục
node scripts/create-structure.js
```

### Bước 2: Di chuyển files
```bash
# Chạy script migration
node scripts/migrate-files.js
```

### Bước 3: Cập nhật imports
```javascript
// Cập nhật tất cả import paths
// Từ: import { Position } from '../ecs/components/Position.js'
// Thành: import { Position } from '../entities/components/common/Position.js'
```

### Bước 4: Tạo entity classes
```javascript
// Tạo base classes cho từng loại entity
// Implement factory pattern
// Tạo config files
```

### Bước 5: Test và debug
```javascript
// Test từng module
// Fix import errors
// Verify functionality
```

---

## 📋 MIGRATION CHECKLIST

### Phase 1: Structure
- [ ] Tạo cấu trúc thư mục mới
- [ ] Tạo base classes
- [ ] Tạo config templates

### Phase 2: Migration
- [ ] Di chuyển core systems
- [ ] Di chuyển components
- [ ] Di chuyển scenes
- [ ] Cập nhật import paths

### Phase 3: Entity Classes
- [ ] Tạo Unit classes
- [ ] Tạo Building classes
- [ ] Tạo Animal classes
- [ ] Tạo Resource classes

### Phase 4: Systems
- [ ] Cập nhật EntityFactory
- [ ] Cập nhật AnimationSystem
- [ ] Cập nhật RenderSystem
- [ ] Test tất cả systems

### Phase 5: Polish
- [ ] Tạo documentation
- [ ] Tạo examples
- [ ] Performance optimization
- [ ] Code cleanup

---

## 🎉 KẾT QUẢ MONG ĐỢI

Sau khi tái cấu trúc, bạn sẽ có:

- ✅ **Cấu trúc rõ ràng** và dễ hiểu
- ✅ **Dễ mở rộng** thêm units, buildings, animals
- ✅ **Code tái sử dụng** cao
- ✅ **Dễ maintain** và debug
- ✅ **Team-friendly** structure
- ✅ **Scalable** architecture

**Bạn có muốn tôi bắt đầu tạo cấu trúc mới không? 🚀**
