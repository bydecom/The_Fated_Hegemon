# 🎬 HƯỚNG DẪN HỆ THỐNG ANIMATION

## 🎯 Tổng quan

Hệ thống animation được thiết kế để quản lý tất cả animations trong game một cách linh hoạt và hiệu quả. Hỗ trợ:

- ✅ **4 loại animation cơ bản**: Idle, Move, Attack, Die
- ✅ **4 hướng di chuyển**: Up, Down, Left, Right  
- ✅ **Animation queue**: Xếp hàng animations không thể gián đoạn
- ✅ **Priority system**: Animation quan trọng hơn sẽ được ưu tiên
- ✅ **JSON config**: Dễ dàng thêm/sửa animations
- ✅ **Performance optimized**: Cập nhật theo interval thay vì mỗi frame

---

## 📁 Cấu trúc file

```
src/
├── managers/
│   └── AnimationManager.js          # 🎭 Quản lý animations
├── ecs/
│   ├── components/
│   │   └── Animation.js             # 📦 Animation component
│   └── systems/
│       └── AnimationSystem.js       # ⚙️ Xử lý animation logic
├── data/
│   └── AnimationConfigs.json        # 📋 Config animations
└── scenes/
    └── DemoScene.js                 # 🎬 Tích hợp animation system
```

---

## 🧩 Các thành phần chính

### 1. **AnimationManager** 
- Quản lý tất cả animation states
- Load configs từ JSON
- Tạo và chạy animations

### 2. **Animation Component**
- Lưu trữ thông tin animation của entity
- Quản lý animation queue
- Xử lý priority và interrupt

### 3. **AnimationSystem**
- Cập nhật animations mỗi frame
- Xác định animation cần chạy
- Xử lý thay đổi behavior/velocity

### 4. **AnimationConfigs.json**
- Chứa config cho tất cả loại đơn vị
- Định nghĩa frames, frameRate, directions

---

## 🚀 Cách sử dụng

### Bước 1: Thêm Animation Component vào Entity

```javascript
// Trong EntityFactory.js
import { Animation } from './components/Animation.js';

createSoldier(x, y) {
    const entityId = this.ecsWorld.createEntity();
    
    // ... các components khác ...
    
    // ⭐ THÊM ANIMATION COMPONENT
    this.ecsWorld.addComponent(entityId, 'animation', new Animation('soldier', 'idle', 'down'));
    
    return entityId;
}
```

### Bước 2: Thêm AnimationSystem vào ECS World

```javascript
// Trong DemoScene.js
import { AnimationManager } from '../managers/AnimationManager.js';
import { AnimationSystem } from '../ecs/systems/AnimationSystem.js';

create() {
    // ... code khởi tạo ...
    
    // Tạo AnimationManager
    this.animationManager = new AnimationManager(this);
    
    // Thêm AnimationSystem (trước RenderSystem)
    this.ecsWorld.addSystem(new AnimationSystem(this.animationManager));
    this.ecsWorld.addSystem(this.renderSystem); // Render luôn cuối cùng
}
```

### Bước 3: Cấu hình Animation trong JSON

```json
// src/data/AnimationConfigs.json
{
  "soldier": {
    "idle": {
      "frames": 4,
      "frameRate": 8,
      "repeat": -1,
      "key": "soldier_idle"
    },
    "move": {
      "frames": 8,
      "frameRate": 12,
      "repeat": -1,
      "key": "soldier_move",
      "directions": ["up", "down", "left", "right"]
    },
    "attack": {
      "frames": 6,
      "frameRate": 15,
      "repeat": 0,
      "key": "soldier_attack",
      "directions": ["up", "down", "left", "right"]
    },
    "die": {
      "frames": 5,
      "frameRate": 10,
      "repeat": 0,
      "key": "soldier_die"
    }
  }
}
```

---

## 🎮 Animation Types

### 1. **Idle Animation**
- Chạy khi unit đứng yên
- Loop vô hạn (`repeat: -1`)
- Không có directions

```json
"idle": {
  "frames": 4,
  "frameRate": 8,
  "repeat": -1,
  "key": "soldier_idle"
}
```

### 2. **Move Animation**
- Chạy khi unit di chuyển
- Có 4 directions: up, down, left, right
- Loop vô hạn

```json
"move": {
  "frames": 8,
  "frameRate": 12,
  "repeat": -1,
  "key": "soldier_move",
  "directions": ["up", "down", "left", "right"]
}
```

### 3. **Attack Animation**
- Chạy khi unit tấn công
- Có 4 directions
- Chạy 1 lần (`repeat: 0`)
- Không thể bị gián đoạn

```json
"attack": {
  "frames": 6,
  "frameRate": 15,
  "repeat": 0,
  "key": "soldier_attack",
  "directions": ["up", "down", "left", "right"]
}
```

### 4. **Die Animation**
- Chạy khi unit chết
- Chạy 1 lần
- Không có directions

```json
"die": {
  "frames": 5,
  "frameRate": 10,
  "repeat": 0,
  "key": "soldier_die"
}
```

---

## ⚙️ Animation Logic

### Priority System

Animations có độ ưu tiên khác nhau:

```javascript
// Trong Animation.js
this.states = {
    idle: { priority: 1, interruptible: true },
    move: { priority: 2, interruptible: true },
    attack: { priority: 3, interruptible: false },
    harvest: { priority: 2, interruptible: true },
    die: { priority: 4, interruptible: false }
};
```

**Quy tắc:**
- Priority cao hơn = quan trọng hơn
- `interruptible: false` = không thể bị gián đoạn
- Animation không thể gián đoạn sẽ được thêm vào queue

### Animation Queue

Khi animation không thể bị gián đoạn đang chạy, animation mới sẽ được thêm vào queue:

```javascript
// Ví dụ: Unit đang attack, player ra lệnh move
// → Move animation sẽ được thêm vào queue
// → Chạy move animation sau khi attack xong
```

### Direction Detection

Hệ thống tự động xác định hướng dựa trên velocity:

```javascript
// Trong AnimationSystem.js
determineTargetDirection(velocity) {
    if (!velocity || (velocity.x === 0 && velocity.y === 0)) {
        return 'down'; // Mặc định
    }
    
    const absX = Math.abs(velocity.x);
    const absY = Math.abs(velocity.y);
    
    if (absX > absY) {
        return velocity.x > 0 ? 'right' : 'left';
    } else {
        return velocity.y > 0 ? 'down' : 'up';
    }
}
```

---

## 🎨 Thêm Animation mới

### Bước 1: Thêm config vào JSON

```json
// src/data/AnimationConfigs.json
{
  "archer": {
    "idle": {
      "frames": 3,
      "frameRate": 6,
      "repeat": -1,
      "key": "archer_idle"
    },
    "move": {
      "frames": 6,
      "frameRate": 10,
      "repeat": -1,
      "key": "archer_move",
      "directions": ["up", "down", "left", "right"]
    },
    "attack": {
      "frames": 8,
      "frameRate": 18,
      "repeat": 0,
      "key": "archer_attack",
      "directions": ["up", "down", "left", "right"]
    },
    "die": {
      "frames": 4,
      "frameRate": 8,
      "repeat": 0,
      "key": "archer_die"
    }
  }
}
```

### Bước 2: Thêm Animation Component

```javascript
// Trong EntityFactory.js
createArcher(x, y) {
    const entityId = this.ecsWorld.createEntity();
    
    // ... các components khác ...
    
    // ⭐ Animation cho Archer
    this.ecsWorld.addComponent(entityId, 'animation', new Animation('archer', 'idle', 'down'));
    
    return entityId;
}
```

### Bước 3: Load textures (nếu cần)

```javascript
// Trong DemoScene.js, method preload()
preload() {
    // Load sprite sheets
    this.load.spritesheet('archer_sprite', 'assets/sprites/archer.png', {
        frameWidth: 32,
        frameHeight: 32
    });
}
```

---

## 🎯 Thêm Animation Type mới

### Ví dụ: Thêm "Harvest" Animation

#### Bước 1: Cập nhật Animation Component

```javascript
// Trong Animation.js
this.states = {
    idle: { priority: 1, interruptible: true },
    move: { priority: 2, interruptible: true },
    attack: { priority: 3, interruptible: false },
    harvest: { priority: 2, interruptible: true }, // ⭐ THÊM
    die: { priority: 4, interruptible: false }
};
```

#### Bước 2: Cập nhật AnimationSystem

```javascript
// Trong AnimationSystem.js, method determineTargetAnimation()
determineTargetAnimation(behavior, health) {
    if (health && health.current <= 0) {
        return 'die';
    }
    
    if (!behavior) return 'idle';
    
    switch (behavior.current) {
        case 'idle':
            return 'idle';
        case 'followPath':
        case 'chase':
        case 'wander':
            return 'move';
        case 'attack':
            return 'attack';
        case 'harvest': // ⭐ THÊM
            return 'harvest';
        default:
            return 'idle';
    }
}
```

#### Bước 3: Thêm config vào JSON

```json
// src/data/AnimationConfigs.json
{
  "harvester": {
    "harvest": {
      "frames": 4,
      "frameRate": 8,
      "repeat": -1,
      "key": "harvester_harvest"
    }
  }
}
```

---

## 🎮 Sử dụng trong Code

### Force Animation (Bỏ qua priority)

```javascript
// Trong DemoScene.js hoặc System khác
const animationSystem = this.ecsWorld.systems.find(s => s instanceof AnimationSystem);
animationSystem.forceAnimation(entityId, animation, 'attack', 'right');
```

### Kiểm tra Animation đang chạy

```javascript
const isAttacking = animationSystem.isAnimationPlaying(entityId, 'attack');
if (isAttacking) {
    console.log('Unit đang tấn công!');
}
```

### Lấy thông tin Animation

```javascript
const animInfo = animationSystem.getEntityAnimationInfo(entityId);
console.log(animInfo);
// Output: {
//   animation: 'move',
//   direction: 'right',
//   isPlaying: true,
//   speed: 1.0,
//   canInterrupt: true,
//   queueLength: 0
// }
```

---

## 🔧 Tùy chỉnh nâng cao

### Thay đổi Animation Speed

```javascript
// Trong Animation Component
animation.setAnimationSpeed(1.5); // 1.5x tốc độ bình thường
```

### Thêm Animation vào Queue

```javascript
// Thêm animation vào queue (sẽ chạy sau animation hiện tại)
animation.queueAnimation('attack', 'right');
```

### Xóa Animation Queue

```javascript
// Xóa tất cả animations trong queue
animation.clearQueue();
```

### Clone Animation State

```javascript
// Backup animation state
const backup = animation.clone();
// ... làm gì đó ...
// Restore: animation = backup;
```

---

## 📊 Performance Tips

### 1. Update Interval

AnimationSystem chỉ cập nhật mỗi 100ms thay vì mỗi frame:

```javascript
// Trong AnimationSystem.js
this.updateInterval = 100; // 10 FPS thay vì 60 FPS
```

### 2. Chỉ cập nhật khi cần thiết

```javascript
// Chỉ thay đổi animation khi có thay đổi thực sự
const needsChange = this.shouldChangeAnimation(
    animation, 
    targetAnimation, 
    targetDirection, 
    behavior, 
    velocity
);
```

### 3. Sử dụng Animation Queue hiệu quả

```javascript
// Thay vì force animation, sử dụng queue
if (animation.canInterrupt()) {
    animation.setAnimation('attack', 'right');
} else {
    animation.queueAnimation('attack', 'right');
}
```

---

## 🐛 Debug Animation

### Console Logs

```javascript
// Trong AnimationSystem.js
console.log(`🎬 Entity ${entityId}: ${animation.currentAnimation} (${animation.currentDirection})`);
```

### Kiểm tra Animation State

```javascript
// Debug animation state
const animState = this.animationManager.getAnimationState(entityId);
console.log('Animation State:', animState);
```

### Kiểm tra Queue

```javascript
// Debug animation queue
const animInfo = animation.getCurrentAnimationInfo();
console.log('Queue length:', animInfo.queueLength);
```

---

## 📋 Checklist thêm Animation

### Thêm Unit Type mới
- [ ] Thêm config vào `AnimationConfigs.json`
- [ ] Thêm Animation component vào EntityFactory
- [ ] Test animations trong game

### Thêm Animation Type mới
- [ ] Cập nhật `Animation.js` states
- [ ] Cập nhật `AnimationSystem.js` logic
- [ ] Thêm config vào JSON
- [ ] Test behavior mapping

### Tối ưu Performance
- [ ] Kiểm tra update interval
- [ ] Sử dụng animation queue đúng cách
- [ ] Tránh force animation không cần thiết

---

## 🎉 Kết luận

Hệ thống animation được thiết kế để:

- ✅ **Dễ sử dụng**: Chỉ cần thêm component và config
- ✅ **Linh hoạt**: Hỗ trợ nhiều loại animation và directions
- ✅ **Hiệu quả**: Tối ưu performance với update interval
- ✅ **Mở rộng**: Dễ dàng thêm animation types mới
- ✅ **Robust**: Xử lý priority và queue đúng cách

**Bước tiếp theo**: Thử thêm animation cho một loại đơn vị mới hoặc tạo animation type mới!

---

## 💡 Tips & Tricks

### 1. Naming Convention
- Animation keys: `{unitType}_{animationName}_{direction}`
- Ví dụ: `soldier_move_right`, `archer_attack_up`

### 2. Frame Rate Guidelines
- Idle: 4-8 FPS (chậm, tiết kiệm)
- Move: 8-12 FPS (mượt mà)
- Attack: 12-18 FPS (nhanh, ấn tượng)
- Die: 6-10 FPS (chậm, dramatic)

### 3. Frame Count Guidelines
- Idle: 2-4 frames
- Move: 6-8 frames
- Attack: 4-8 frames
- Die: 3-6 frames

### 4. Direction Mapping
- `up`: velocity.y < 0
- `down`: velocity.y > 0
- `left`: velocity.x < 0
- `right`: velocity.x > 0

**Chúc bạn tạo ra những animation đẹp mắt! 🎬✨**
