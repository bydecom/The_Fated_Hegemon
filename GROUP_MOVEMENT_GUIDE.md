# 🎖️ Group Movement & Formation Guide

## Mục tiêu

Khi người chơi chọn nhiều units và ra lệnh di chuyển, thay vì tất cả đổ xô về một điểm, chúng sẽ:
1. **Xếp hàng formation** (circle, square, line, wedge, column)
2. **Tự động tấn công enemies** gặp trên đường đi (Attack-Move)
3. **Giữ khoảng cách** với nhau (không đẩy chen)

---

## 🎯 Component: AttackMoveTarget

### Khái niệm

`AttackMoveTarget` component khác với `MoveTarget` thông thường:

| Feature | MoveTarget | AttackMoveTarget |
|---------|------------|------------------|
| Di chuyển đến điểm | ✅ | ✅ |
| Bỏ qua enemies | ✅ | ❌ Auto-engage |
| Về đích sau khi kill | ❌ | ✅ Tiếp tục về đích |

### Code

```javascript
import { AttackMoveTarget } from './ecs/components/AttackMoveTarget.js';

// Tạo attack-move command
const attackMove = new AttackMoveTarget(destinationX, destinationY);
ecsWorld.addComponent(unitId, 'attackMoveTarget', attackMove);
```

---

## 🏛️ Manager: FormationManager

### API Chính

#### 1. Calculate Formation Positions

```javascript
import { FormationManager, FORMATION_TYPE } from '../managers/FormationManager.js';

const formationManager = new FormationManager();

// Input
const unitIds = ['unit1', 'unit2', 'unit3', 'unit4', 'unit5'];
const centerX = 500;
const centerY = 500;

// Calculate positions
const positions = formationManager.calculateFormationPositions(
    unitIds,
    centerX,
    centerY,
    FORMATION_TYPE.CIRCLE,  // hoặc SQUARE, LINE, WEDGE, COLUMN
    30  // spacing (optional, default = 30)
);

// Output: Map { 
//   'unit1' => { x: 500, y: 530 },
//   'unit2' => { x: 530, y: 500 },
//   ...
// }
```

#### 2. Formation Types

```javascript
// CIRCLE - Bao quanh center
FORMATION_TYPE.CIRCLE

// SQUARE - Lưới vuông
FORMATION_TYPE.SQUARE

// LINE - 1 hàng ngang
FORMATION_TYPE.LINE

// WEDGE - V-shape (cavalry charge)
FORMATION_TYPE.WEDGE

// COLUMN - Hàng dọc (march)
FORMATION_TYPE.COLUMN
```

#### 3. Calculate Group Center

```javascript
const selectedUnits = ['unit1', 'unit2', 'unit3'];
const center = formationManager.calculateGroupCenter(selectedUnits, ecsWorld);
// Returns: { x: avgX, y: avgY }
```

#### 4. Formation Facing Point

```javascript
// Tạo formation hướng về một điểm (e.g., enemy base)
const positions = formationManager.calculateFormationFacingPoint(
    unitIds,
    centerX,      // Formation center
    centerY,
    targetX,      // Point to face
    targetY,
    FORMATION_TYPE.WEDGE,
    30
);
// Formation sẽ tự động xoay để "nhìn" về (targetX, targetY)
```

---

## 🔧 Tích hợp vào DemoScene

### Bước 1: Setup FormationManager

```javascript
// src/scenes/DemoScene.js
import { FormationManager, FORMATION_TYPE } from '../managers/FormationManager.js';
import { AttackMoveTarget } from '../ecs/components/AttackMoveTarget.js';

export class DemoScene extends Phaser.Scene {
    create() {
        // ... existing code ...
        
        // ⭐ Tạo Formation Manager
        this.formationManager = new FormationManager();
        
        // ⭐ Default formation type (có thể thay đổi bằng UI)
        this.currentFormationType = FORMATION_TYPE.CIRCLE;
    }
}
```

### Bước 2: Sửa handlePointerDown - Right Click

```javascript
// Thay thế logic di chuyển cũ
handlePointerDown(pointer) {
    // ... existing left click logic ...
    
    // ⭐ RIGHT CLICK - GROUP MOVEMENT WITH FORMATION
    if (pointer.rightButtonDown()) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        const targetId = this.findUnitIdAtWorldPoint(worldPoint);
        
        if (targetId && this.selectedEntities.size > 0) {
            // ⭐ ATTACK-MOVE TO ENEMY
            this.issueAttackMoveCommand(targetId, worldPoint);
        } 
        else if (this.selectedEntities.size > 0) {
            // ⭐ MOVE TO POINT WITH FORMATION
            this.issueMoveWithFormation(worldPoint);
        }
    }
}
```

### Bước 3: Issue Move with Formation

```javascript
issueMoveWithFormation(worldPoint) {
    const selectedArray = Array.from(this.selectedEntities);
    
    // ⭐ Tính formation positions
    const formationPositions = this.formationManager.calculateFormationPositions(
        selectedArray,
        worldPoint.x,
        worldPoint.y,
        this.currentFormationType,  // CIRCLE, SQUARE, etc.
        35  // Spacing
    );
    
    // ⭐ Gán từng unit một điểm riêng
    formationPositions.forEach((targetPos, unitId) => {
        const entity = this.ecsWorld.entities.get(unitId);
        if (!entity) return;
        
        const ai = entity.get('ai');
        const behavior = entity.get('behavior');
        
        if (ai && behavior) {
            // Clear target cũ
            ai.clearTarget();
            
            // Pathfinding đến vị trí formation
            const pos = entity.get('position');
            const startGridPos = this.gridManager.worldToGrid(pos.x, pos.y);
            const endGridPos = this.gridManager.worldToGrid(targetPos.x, targetPos.y);
            
            this.pathfindingManager.findPath(startGridPos, endGridPos, (path) => {
                if (path) {
                    ai.setPath(path);
                    behavior.setBehavior('followPath');
                }
            });
        }
    });
}
```

### Bước 4: Issue Attack-Move Command

```javascript
issueAttackMoveCommand(targetId, worldPoint) {
    // ⭐ Tạo formation quanh target
    const selectedArray = Array.from(this.selectedEntities);
    const formationPositions = this.formationManager.calculateFormationPositions(
        selectedArray,
        worldPoint.x,
        worldPoint.y,
        FORMATION_TYPE.CIRCLE,  // Attack từ mọi hướng
        50  // Spacing rộng hơn cho combat
    );
    
    formationPositions.forEach((targetPos, unitId) => {
        const entity = this.ecsWorld.entities.get(unitId);
        if (!entity) return;
        
        const ai = entity.get('ai');
        const behavior = entity.get('behavior');
        
        if (ai && behavior) {
            // ⭐ Set AttackMoveTarget component
            const attackMove = new AttackMoveTarget(targetPos.x, targetPos.y);
            this.ecsWorld.addComponent(unitId, 'attackMoveTarget', attackMove);
            
            // Start chase target
            ai.setTargetId(targetId);
            behavior.setBehavior('chase', { manualAttack: true });
        }
    });
}
```

---

## 🧠 BehaviorSystem - Handle Attack-Move

Cập nhật `BehaviorSystem.js` để xử lý `AttackMoveTarget`:

```javascript
// Trong processBehavior(), thêm case mới
case 'attackMove':
    this.handleAttackMove(entityId, components, behavior, position, velocity, deltaTime);
    break;

// Method mới
handleAttackMove(entityId, components, behavior, position, velocity, deltaTime) {
    const attackMoveTarget = components.get('attackMoveTarget');
    const ai = components.get('ai');
    
    if (!attackMoveTarget || !ai) {
        behavior.setBehavior('idle');
        return;
    }
    
    // ⭐ PRIORITY 1: Nếu có enemy trong tầm nhìn → CHASE
    const factionSystem = this.ecsWorld.systems.find(s => s.constructor.name === 'FactionSystem');
    if (factionSystem) {
        const enemies = factionSystem.findEnemiesInRange(
            components,
            this.ecsWorld.entities,
            ai.config.detectionRange,
            position
        );
        
        if (enemies.length > 0) {
            // Engage nearest enemy
            const nearestEnemy = enemies[0];
            ai.setTargetId(nearestEnemy.entityId);
            attackMoveTarget.engageEnemy(nearestEnemy.entityId);
            behavior.setBehavior('chase', { manualAttack: true });
            return;
        }
    }
    
    // ⭐ PRIORITY 2: Nếu không có enemy → Tiếp tục về destination
    const dx = attackMoveTarget.destinationX - position.x;
    const dy = attackMoveTarget.destinationY - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 10) {
        // ✅ Đã đến đích
        this.ecsWorld.removeComponent(entityId, 'attackMoveTarget');
        behavior.setBehavior('idle');
        velocity.x = 0;
        velocity.y = 0;
    } else {
        // 🚶 Di chuyển về đích
        const speed = ai.config.speed || 100;
        velocity.x = (dx / distance) * speed;
        velocity.y = (dy / distance) * speed;
    }
}
```

### Sau khi kill enemy, quay lại Attack-Move

```javascript
// Trong handleAttack(), khi target chết
if (!targetComponents || targetHealth.isDead()) {
    const attackMoveTarget = components.get('attackMoveTarget');
    
    if (attackMoveTarget) {
        // ⭐ Quay lại destination
        attackMoveTarget.resetToDestination();
        behavior.setBehavior('attackMove');
    } else {
        behavior.setBehavior('idle');
    }
    
    ai.clearTarget();
    return;
}
```

---

## 🎨 UI Controls (Optional)

Cho phép người chơi chọn formation type:

```javascript
// UIScene.js
createFormationButtons() {
    const formations = [
        { type: FORMATION_TYPE.CIRCLE, icon: '⭕' },
        { type: FORMATION_TYPE.SQUARE, icon: '⬜' },
        { type: FORMATION_TYPE.LINE, icon: '➖' },
        { type: FORMATION_TYPE.WEDGE, icon: '🔺' },
        { type: FORMATION_TYPE.COLUMN, icon: '🪜' }
    ];
    
    formations.forEach((formation, index) => {
        const button = this.add.text(
            10, 
            100 + index * 30, 
            formation.icon, 
            { fontSize: '20px' }
        ).setInteractive();
        
        button.on('pointerdown', () => {
            this.scene.get('DemoScene').currentFormationType = formation.type;
            console.log(`Formation changed to: ${formation.type}`);
        });
    });
}
```

---

## 🧪 Testing

### Test Formation Types

```javascript
// DemoScene.js - Thêm keyboard shortcuts
create() {
    // ... existing code ...
    
    // ⭐ Formation shortcuts
    this.input.keyboard.on('keydown-ONE', () => {
        this.currentFormationType = FORMATION_TYPE.CIRCLE;
        console.log('Formation: CIRCLE');
    });
    
    this.input.keyboard.on('keydown-TWO', () => {
        this.currentFormationType = FORMATION_TYPE.SQUARE;
        console.log('Formation: SQUARE');
    });
    
    this.input.keyboard.on('keydown-THREE', () => {
        this.currentFormationType = FORMATION_TYPE.LINE;
        console.log('Formation: LINE');
    });
    
    this.input.keyboard.on('keydown-FOUR', () => {
        this.currentFormationType = FORMATION_TYPE.WEDGE;
        console.log('Formation: WEDGE');
    });
    
    this.input.keyboard.on('keydown-FIVE', () => {
        this.currentFormationType = FORMATION_TYPE.COLUMN;
        console.log('Formation: COLUMN');
    });
}
```

### Test scenario

1. **Chọn 10 units** (drag select)
2. **Press "1"** để chọn CIRCLE formation
3. **Right-click** vào một điểm xa
4. **Observe**: Units xếp thành hình tròn khi đến đích

---

## 📊 Performance Tips

### 1. Limit Pathfinding

```javascript
// Chỉ tính pathfinding cho vài units đầu, còn lại follow leader
const leaders = selectedArray.slice(0, 3);
const followers = selectedArray.slice(3);

// Leaders tính path riêng
leaders.forEach(leaderId => {
    // ... calculate path ...
});

// Followers follow leaders
followers.forEach(followerId => {
    // ... simple follow behavior ...
});
```

### 2. Cache Formation

```javascript
// Lưu formation positions để không tính lại mỗi frame
this.cachedFormation = {
    unitIds: selectedArray,
    positions: formationPositions,
    timestamp: Date.now()
};
```

---

## 🎯 Next Steps

1. ✅ **Phase 1**: Basic formation positioning
2. 🔄 **Phase 2**: Attack-Move auto-engage
3. 📈 **Phase 3**: Dynamic formation (adjust while moving)
4. 🧠 **Phase 4**: Smart formation (avoid obstacles, split around buildings)


