# 🎮 Command System Guide - RTS Commands

## Tổng quan

Hệ thống lệnh RTS chuyên nghiệp với 4 lệnh cơ bản:
- **A** - Attack: Chase và tấn công kẻ địch
- **S** - Stop: Đứng yên, tự động phản công
- **D** - Defence: Phòng thủ vị trí, không rời xa
- **P** - Patrol: Tuần tra qua lại giữa 2 điểm

---

## 🎯 Các lệnh chi tiết

### A - Attack Command

**Mô tả**: Lính sẽ chase kẻ địch và tấn công cho đến khi một trong hai chết

**Cursor**: `crosshair` (⊕)

**Cách dùng**:
1. Chọn units
2. Click button "A" trong UI
3. Click vào enemy unit hoặc building
4. Units sẽ chase và tấn công target

**Behavior**:
- Chase target với `manualAttack: true` (không bị giới hạn detectionRange)
- Tấn công cho đến khi target chết
- Sau khi kill target → idle

**Code**:
```javascript
// DemoScene.js
executeAttackCommand(targetId, worldPoint) {
    this.selectedEntities.forEach(entityId => {
        const ai = entity.get('ai');
        const behavior = entity.get('behavior');
        
        ai.setTargetId(targetId);
        behavior.setBehavior('chase', { manualAttack: true });
    });
}
```

---

### S - Stop Command

**Mô tả**: Lính đứng im tại chỗ, nhưng tự động phản công khi có enemy gần

**Cursor**: `default` (→)

**Cách dùng**:
1. Chọn units
2. Click button "S"
3. Units ngay lập tức dừng lại

**Behavior**:
- Velocity = 0 (dừng hẳn)
- Clear tất cả targets
- Behavior = 'idle'
- AISystem sẽ tự động tìm enemy trong `detectionRange` và chase

**Code**:
```javascript
// DemoScene.js
executeStopCommand() {
    this.selectedEntities.forEach(entityId => {
        const velocity = entity.get('velocity');
        velocity.x = 0;
        velocity.y = 0;
        
        ai.clearTarget();
        behavior.setBehavior('idle'); // AISystem tự động phản công
    });
}
```

---

### D - Defence Command

**Mô tả**: Phòng thủ tại vị trí, chỉ phản công khi bị tấn công, sau đó chạy về vị trí ban đầu

**Cursor**: `help` (?)

**Cách dùng**:
1. Chọn units
2. Click button "D"
3. Click vào vị trí cần phòng thủ (hoặc không click → units phòng thủ tại chỗ)

**Behavior**:
- Add component `DefencePosition(x, y, radius: 100)`
- Behavior = 'defence'
- Chỉ tấn công enemy trong bán kính 100px
- Sau khi enemy chết hoặc ra khỏi bán kính → chạy về vị trí phòng thủ

**Code**:
```javascript
// DemoScene.js
executeDefenceCommand(worldPoint) {
    this.selectedEntities.forEach(entityId => {
        const defencePosition = new DefencePosition(
            worldPoint.x, 
            worldPoint.y, 
            100 // radius
        );
        
        this.ecsWorld.addComponent(entityId, 'defencePosition', defencePosition);
        behavior.setBehavior('defence');
    });
}

// BehaviorSystem.js - handleDefence()
handleDefence(entityId, components, behavior, position, velocity, deltaTime) {
    const defencePosition = components.get('defencePosition');
    
    // 1. Tìm enemy gần nhất
    const nearestEnemy = findNearestEnemyInRadius();
    
    // 2. Nếu có enemy và đang trong defence radius → PHẢN CÔNG
    if (nearestEnemy && defencePosition.isWithinRadius(position.x, position.y)) {
        behavior.setBehavior('chase', { 
            manualAttack: true,
            isDefenceCounterAttack: true 
        });
        return;
    }
    
    // 3. Nếu đã rời xa vị trí phòng thủ → CHẠY VỀ
    const distanceFromDefence = defencePosition.getDistanceFromDefencePoint(position.x, position.y);
    if (distanceFromDefence > defencePosition.radius * 0.5) {
        // Move back to defence position
        velocity = moveTowards(defencePosition.x, defencePosition.y);
    } else {
        // Đứng yên tại vị trí phòng thủ
        velocity.x = 0;
        velocity.y = 0;
    }
}
```

**Flow**:
```
Defence Mode
    ↓
Enemy detected in radius?
    ├─ YES → Counter-attack (chase)
    │         ↓
    │    Enemy dead or out of radius?
    │         ↓
    │    Return to defence position
    │         ↓
    │    Back to Defence Mode
    │
    └─ NO → Stay at defence position
```

---

### P - Patrol Command

**Mô tả**: Tuần tra qua lại giữa 2 điểm

**Cursor**: `pointer` (👆)

**Cách dùng**:
1. Chọn units
2. Click button "P"
3. Click điểm đầu (patrol start)
4. Click điểm cuối (patrol end)
5. Units sẽ đi qua lại giữa 2 điểm

**Behavior**:
- Behavior = 'patrol'
- `behavior.data.patrolPoints = [{ x1, y1 }, { x2, y2 }]`
- `behavior.data.currentTarget` = index của điểm đang đi tới
- Đến điểm → chuyển sang điểm kia

**Code**:
```javascript
// DemoScene.js - executePatrolCommand()
executePatrolCommand(worldPoint) {
    if (!this.patrolStartPoint) {
        // First click: Save start point
        this.patrolStartPoint = { x: worldPoint.x, y: worldPoint.y };
        this.currentCommand = 'patrol'; // Keep active for 2nd click
        return;
    }
    
    // Second click: Set end point
    this.selectedEntities.forEach(entityId => {
        const patrolPoints = [
            this.patrolStartPoint,
            { x: worldPoint.x, y: worldPoint.y }
        ];
        
        behavior.setBehavior('patrol', { 
            patrolPoints,
            currentTarget: 0
        });
    });
    
    this.patrolStartPoint = null; // Reset
}

// BehaviorSystem.js - handlePatrol()
handlePatrol(behavior, position, velocity, ai, deltaTime) {
    const patrolPoints = behavior.data.patrolPoints || [];
    const currentTarget = behavior.data.currentTarget || 0;
    const targetPoint = patrolPoints[currentTarget];
    
    const dx = targetPoint.x - position.x;
    const dy = targetPoint.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 10) {
        // Đã đến điểm → chuyển sang điểm kia
        behavior.data.currentTarget = (currentTarget + 1) % patrolPoints.length;
    } else {
        // Di chuyển về phía điểm
        const speed = ai.config.speed;
        velocity.x = (dx / distance) * speed;
        velocity.y = (dy / distance) * speed;
    }
}
```

---

## 🎨 UI Implementation

### Command Buttons

```javascript
// UIScene.js
const commands = [
    { 
        key: 'attack', 
        label: 'A\nAttack',
        color: 0xff4444,      // Đỏ
        cursor: 'crosshair',
        description: 'Chase và tấn công kẻ địch' 
    },
    { 
        key: 'stop', 
        label: 'S\nStop',
        color: 0xffaa44,      // Cam
        cursor: 'default',
        description: 'Đứng im, tự động phản công' 
    },
    { 
        key: 'defence', 
        label: 'D\nDefence',
        color: 0x4444ff,      // Xanh dương
        cursor: 'help',
        description: 'Thế phòng thủ tại chỗ' 
    },
    { 
        key: 'patrol', 
        label: 'P\nPatrol',
        color: 0x44ff44,      // Xanh lá
        cursor: 'pointer',
        description: 'Tuần tra qua lại' 
    }
];
```

### Cursor Changes

Khi click button, cursor sẽ đổi:
- **Attack**: `crosshair` ⊕
- **Stop**: `default` →
- **Defence**: `help` ?
- **Patrol**: `pointer` 👆

```javascript
// UIScene.js
handleCommandClick(command) {
    this.activeCommand = command.key;
    gameScene.input.setDefaultCursor(command.cursor);
}
```

### Button Highlight

Button đang active sẽ:
- Background color = command color
- Border color = white (0xffffff)
- Border width = 2px

```javascript
// UIScene.js
updateCommandButtonHighlight() {
    this.commandButtonsContainer.list.forEach(child => {
        if (child.commandKey) {
            const isActive = this.activeCommand === child.commandKey;
            child.setFillStyle(isActive ? child.commandColor : 0x444444);
            child.setStrokeStyle(2, isActive ? 0xffffff : 0x999999);
        }
    });
}
```

---

## 🔄 Command Flow

### 1. User clicks command button
```
User clicks "A" button
    ↓
UIScene.handleCommandClick()
    ↓
activeCommand = 'attack'
cursor = 'crosshair'
    ↓
Emit 'commandActivated' event
    ↓
DemoScene.currentCommand = 'attack'
```

### 2. User clicks on map
```
User right-clicks on enemy
    ↓
DemoScene.handlePointerDown()
    ↓
Check: currentCommand?
    ├─ YES → handleCommandExecution()
    │         ↓
    │    Execute command (attack/stop/defence/patrol)
    │         ↓
    │    Reset command & cursor
    │
    └─ NO → Default behavior (attack-move or move)
```

### 3. Behavior execution
```
executeAttackCommand()
    ↓
Set ai.targetId = enemyId
Set behavior = 'chase'
    ↓
BehaviorSystem.handleChase()
    ↓
Chase → Attack → Kill → Idle
```

---

## 🧪 Testing

### Test Scenario 1: Attack Command
1. Chọn 2 player units
2. Click "A" button (cursor → crosshair)
3. Click vào enemy unit
4. **Expected**: 2 units chase và tấn công enemy

### Test Scenario 2: Stop Command
1. Chọn units đang di chuyển
2. Click "S" button
3. **Expected**: Units dừng ngay lập tức
4. Đưa enemy đến gần
5. **Expected**: Units tự động phản công

### Test Scenario 3: Defence Command
1. Chọn units
2. Click "D" button (cursor → help)
3. Click vào vị trí cần phòng thủ
4. **Expected**: Units đứng tại vị trí
5. Đưa enemy đến gần
6. **Expected**: Units phản công, sau khi kill enemy → chạy về vị trí phòng thủ

### Test Scenario 4: Patrol Command
1. Chọn units
2. Click "P" button (cursor → pointer)
3. Click điểm A
4. Click điểm B
5. **Expected**: Units đi từ A → B → A → B (lặp lại)

---

## 📊 Component Summary

| Component | Used By | Purpose |
|-----------|---------|---------|
| `DefencePosition` | Defence (D) | Lưu vị trí và bán kính phòng thủ |
| `AI.targetId` | Attack (A), Defence (D) | Lưu ID của enemy đang chase |
| `Behavior.data.patrolPoints` | Patrol (P) | Lưu các điểm tuần tra |
| `Behavior.data.isDefenceCounterAttack` | Defence (D) | Flag để biết đang phản công |
| `Behavior.data.hasDealtDamage` | Attack (A) | Flag để tránh gây damage nhiều lần |

---

## 🐛 Known Issues & Solutions

### Issue 1: Patrol không hoạt động

**Nguyên nhân**: `BehaviorSystem` đã có `handlePatrol()`, kiểm tra xem có conflict không

**Giải pháp**: Đã có sẵn, chỉ cần set `patrolPoints` đúng

### Issue 2: Defence units không chạy về

**Nguyên nhân**: `defencePosition.radius` quá nhỏ hoặc quá lớn

**Giải pháp**: Điều chỉnh radius (default = 100px)

### Issue 3: Stop command units không phản công

**Nguyên nhân**: AISystem không tự động tìm enemies

**Giải pháp**: Đảm bảo AISystem đang chạy và có logic tự động chase enemies gần

---

## 🚀 Next Steps

- [ ] Add hotkeys (A, S, D, P) để activate commands
- [ ] Add visual indicator cho defence radius (circle)
- [ ] Add visual indicator cho patrol path (line)
- [ ] Add command queue (Shift+click để queue commands)
- [ ] Add "Hold Position" command (H) - giống Stop nhưng không phản công

---

## 📝 Code Files Modified

- ✅ `src/ecs/components/DefencePosition.js` (NEW)
- ✅ `src/scenes/UIScene.js` (UPDATED - command buttons)
- ✅ `src/scenes/DemoScene.js` (UPDATED - command execution)
- ✅ `src/ecs/systems/BehaviorSystem.js` (UPDATED - handleDefence)


