# ⌨️ Hotkeys Guide - RTS Shortcuts

## Tổng quan

Hệ thống hotkeys cho phép điều khiển nhanh bằng bàn phím thay vì click button.

---

## 🎮 Command Hotkeys

| Key | Command | Cursor | Behavior |
|-----|---------|--------|----------|
| **A** | Attack | ⊕ (crosshair) | Click enemy để chase và tấn công |
| **S** | Stop | → (default) | Đứng yên ngay lập tức, tự động phản công |
| **D** | Defence | ? (help) | Click vị trí để phòng thủ |
| **P** | Patrol | 👆 (pointer) | Click 2 điểm để tuần tra |

---

## 🎯 Cách sử dụng

### 1. Attack (A)
```
[Chọn units] → Press A → [Cursor đổi thành ⊕] → Right-click enemy
```

**Example**:
1. Drag chọn 5 units
2. Nhấn phím **A**
3. Cursor đổi thành `crosshair`
4. Right-click vào enemy unit
5. 5 units sẽ chase và tấn công

**Cancel**: Left-click vào map để hủy

---

### 2. Stop (S)
```
[Chọn units] → Press S → [Units dừng ngay lập tức]
```

**Example**:
1. Chọn units đang di chuyển
2. Nhấn phím **S**
3. Units dừng ngay, không cần click thêm

**Special**: Stop command thực thi ngay, không cần click thêm!

---

### 3. Defence (D)
```
[Chọn units] → Press D → [Cursor đổi thành ?] → Right-click vị trí
```

**Example**:
1. Chọn units
2. Nhấn phím **D**
3. Cursor đổi thành `help`
4. Right-click vào vị trí cần phòng thủ
5. Units sẽ đứng tại đó và chỉ phản công trong bán kính 100px

**Cancel**: Left-click vào map để hủy

---

### 4. Patrol (P)
```
[Chọn units] → Press P → [Cursor đổi thành 👆] → Right-click điểm A → Right-click điểm B
```

**Example**:
1. Chọn units
2. Nhấn phím **P**
3. Cursor đổi thành `pointer`
4. Right-click điểm A (patrol start)
5. Right-click điểm B (patrol end)
6. Units tuần tra qua lại giữa A và B

**Cancel**: Left-click vào map để hủy (cả khi đã click điểm A)

**Note**: Nếu không có units selected, phím P sẽ pause game (ESC cũng pause)

---

## 🖱️ Mouse Behavior với Commands

### Khi KHÔNG có command active:
- **Left-click**: Drag để chọn units
- **Right-click**: Move hoặc Attack (nếu click vào enemy)

### Khi CÓ command active (A/D/P):
- **Left-click**: ❌ CANCEL command → Cursor về `default`
- **Right-click**: ✅ EXECUTE command
- **Dragging**: ❌ DISABLED (không thể kéo thả khi command active)

---

## 📊 Flow Diagram

### Attack Command (A)

```
[Select units] → Press A
    ↓
Cursor: crosshair ⊕
Button "A" highlighted
    ↓
User action?
    ├─ Left-click → Cancel (cursor → default)
    └─ Right-click enemy → Execute attack
                              ↓
                         Units chase & attack
                              ↓
                         Command auto-reset
```

### Stop Command (S)

```
[Select units] → Press S
    ↓
Execute IMMEDIATELY (no click needed)
    ↓
Units stop & set to idle
    ↓
Command auto-reset
```

### Defence Command (D)

```
[Select units] → Press D
    ↓
Cursor: help ?
Button "D" highlighted
    ↓
User action?
    ├─ Left-click → Cancel
    └─ Right-click position → Execute defence
                                 ↓
                            Units defend at position
                                 ↓
                            Command auto-reset
```

### Patrol Command (P)

```
[Select units] → Press P
    ↓
Cursor: pointer 👆
Button "P" highlighted
    ↓
Right-click point A
    ↓
Keep cursor as pointer (waiting for point B)
    ↓
User action?
    ├─ Left-click → Cancel (reset start point)
    └─ Right-click point B → Execute patrol
                                 ↓
                            Units patrol A ↔ B
                                 ↓
                            Command auto-reset
```

---

## 🔧 Implementation Details

### DemoScene.js

#### Setup Hotkeys
```javascript
setupCommandHotkeys() {
    this.input.keyboard.on('keydown-A', () => {
        if (this.selectedEntities.size > 0) {
            this.activateCommand('attack');
        }
    });
    
    // ... S, D, P similar
}
```

#### Activate Command
```javascript
activateCommand(commandKey) {
    this.currentCommand = commandKey;
    this.input.setDefaultCursor(cursorType);
    this.events.emit('commandActivated', commandKey);
    
    // Special case: Stop executes immediately
    if (commandKey === 'stop') {
        this.executeStopCommand();
        this.resetCommand();
    }
}
```

#### Handle Pointer Down
```javascript
handlePointerDown(pointer) {
    if (pointer.leftButtonDown()) {
        // Left-click với command active → CANCEL
        if (this.currentCommand) {
            this.currentCommand = null;
            this.input.setDefaultCursor('default');
            this.uiScene.resetCommand();
            return; // KHÔNG enable dragging
        }
        
        // Left-click bình thường → ENABLE dragging
        this.isDragging = true;
        // ... selection logic
    }
    
    if (pointer.rightButtonDown()) {
        // Right-click với command active → EXECUTE
        if (this.currentCommand) {
            this.handleCommandExecution(worldPoint);
        } else {
            // Default: attack-move or move
        }
    }
}
```

### UIScene.js

#### Listen for Command Activation
```javascript
gameScene.events.on('commandActivated', (commandKey) => {
    this.activeCommand = commandKey;
    this.updateCommandButtonHighlight(); // Highlight button
}, this);
```

---

## 🎨 Visual Feedback

### Cursor Changes
- **Default**: `default` →
- **Attack (A)**: `crosshair` ⊕
- **Defence (D)**: `help` ?
- **Patrol (P)**: `pointer` 👆

### Button Highlight
Khi command active (từ hotkey hoặc click):
- Background: Màu command (đỏ/cam/xanh/xanh lá)
- Border: Trắng (2px)
- Border color inactive: Xám

### Console Logs
```javascript
// Hotkey pressed
⌨️ Hotkey: ATTACK activated

// Command cancelled
❌ Command cancelled: attack

// Command executed
🎮 Executing command: attack
⚔️ Attack command: 2 units → Target xyz123
```

---

## 🧪 Testing Scenarios

### Test 1: Attack Hotkey
1. Chọn 2 units
2. Press **A**
3. Verify:
   - Cursor = crosshair
   - Button "A" highlighted
4. Left-click map
5. Verify:
   - Cursor = default
   - Button "A" not highlighted
6. Press **A** again
7. Right-click enemy
8. Verify:
   - Units chase enemy
   - Cursor auto-reset to default

### Test 2: Stop Hotkey
1. Chọn units đang di chuyển
2. Press **S**
3. Verify:
   - Units dừng ngay
   - No cursor change (vì execute ngay)

### Test 3: Patrol with Cancel
1. Chọn units
2. Press **P**
3. Right-click point A
4. Verify:
   - Cursor vẫn = pointer (waiting for point B)
5. Left-click map (cancel)
6. Verify:
   - Cursor = default
   - Patrol start point reset

### Test 4: Disable Dragging
1. Chọn 1 unit
2. Press **D** (Defence)
3. Try to drag-select
4. Verify:
   - Cannot drag (isDragging not set)
   - No selection box appears
5. Left-click to cancel
6. Try drag-select again
7. Verify:
   - Dragging works normally

---

## 🐛 Known Issues & Solutions

### Issue 1: P key conflicts với Pause

**Nguyên nhân**: Cả Patrol và Pause đều dùng phím P

**Giải pháp**: ✅ SOLVED
- P key chỉ pause khi `selectedEntities.size === 0`
- Nếu có units selected, P = Patrol
- Nếu không có units, P = Pause

```javascript
this.input.keyboard.on('keydown-P', () => {
    if (this.selectedEntities.size === 0) {
        handlePause(); // Pause game
    }
    // Nếu có units, P được handle bởi setupCommandHotkeys()
});
```

### Issue 2: Dragging vẫn hoạt động khi command active

**Nguyên nhân**: Không check `currentCommand` trước khi set `isDragging`

**Giải pháp**: ✅ SOLVED
```javascript
if (pointer.leftButtonDown()) {
    if (this.currentCommand) {
        // Cancel command, KHÔNG enable dragging
        return;
    }
    // Chỉ enable dragging khi không có command
    this.isDragging = true;
}
```

### Issue 3: UI button không highlight khi dùng hotkey

**Nguyên nhân**: UIScene không nhận event từ hotkey

**Giải pháp**: ✅ SOLVED
```javascript
// UIScene.js
gameScene.events.on('commandActivated', (commandKey) => {
    this.activeCommand = commandKey;
    this.updateCommandButtonHighlight();
});
```

---

## 📚 References

- Command System: `COMMAND_SYSTEM_GUIDE.md`
- UI Controls: `src/scenes/UIScene.js`
- Input Handling: `src/scenes/DemoScene.js`

---

## 🎯 Summary

| Feature | Status |
|---------|--------|
| Hotkeys A/S/D/P | ✅ Working |
| Cursor changes | ✅ Working |
| Button highlight from hotkey | ✅ Working |
| Cancel with left-click | ✅ Working |
| Execute with right-click | ✅ Working |
| Disable dragging when command active | ✅ Working |
| Stop executes immediately | ✅ Working |
| Patrol 2-click flow | ✅ Working |
| P key conflict resolution | ✅ Working |

**Tất cả features đã hoàn thành và tested!** ✅


