# 🖼️ HƯỚNG DẪN SỬ DỤNG SPRITE SHEET

## 🎯 Tổng quan

Hướng dẫn này sẽ giúp bạn tích hợp sprite sheet vào hệ thống animation của game. Ví dụ cụ thể với sprite sheet animal 384x512 (6 cột x 8 hàng).

---

## 📐 Thông tin Sprite Sheet

### Kích thước và Layout:
- **Tổng kích thước**: 384x512 pixels
- **Số cột**: 6
- **Số hàng**: 8  
- **Kích thước mỗi frame**: 64x64 pixels

### Layout Animation:
```
Hàng 1 (0-5):   move_down  - 6 frames
Hàng 2 (6-11):  move_up    - 6 frames  
Hàng 3 (12-17): move_left  - 6 frames
Hàng 4 (18-23): move_right - 6 frames
Hàng 5-8:       Không sử dụng (lặp lại)
```

---

## 🚀 Cách tích hợp

### Bước 1: Đặt file sprite sheet

```
public/
└── assets/
    └── sprites/
        └── animal.png  ← Đặt file sprite sheet ở đây
```

### Bước 2: Load sprite sheet trong Scene

```javascript
// Trong DemoScene.js
preload() {
    console.log('Loading assets...');
    
    // Load animal sprite sheet
    this.spriteSheetManager.loadAnimalSpriteSheet();
}
```

### Bước 3: Tạo animations từ sprite sheet

```javascript
// SpriteSheetManager tự động tạo các animations:
// - animal_idle (frame 0)
// - animal_move_down (frames 0-5)
// - animal_move_up (frames 6-11)  
// - animal_move_left (frames 12-17)
// - animal_move_right (frames 18-23)
// - animal_die (frame 5)
```

### Bước 4: Sử dụng trong EntityFactory

```javascript
// Trong EntityFactory.js
createAnimal(x, y, meatAmount = 200) {
    const entityId = this.ecsWorld.createEntity();
    
    // ... các components khác ...
    
    // ⭐ Sử dụng sprite cho animal
    const appearance = new Appearance(0x2F2F2F, 32, 'circle');
    appearance.setSprite('animal_sprite', true); // ← Quan trọng!
    this.ecsWorld.addComponent(entityId, 'appearance', appearance);
    
    // ⭐ Thêm Animation component
    this.ecsWorld.addComponent(entityId, 'animation', new Animation('animal', 'idle', 'down'));
    
    return entityId;
}
```

---

## 🎬 Animation Mapping

### Frame Index Mapping:

| Animation | Direction | Frame Range | Frame Indexes |
|-----------|-----------|-------------|---------------|
| idle | - | 0 | [0] |
| move | down | 0-5 | [0,1,2,3,4,5] |
| move | up | 6-11 | [6,7,8,9,10,11] |
| move | left | 12-17 | [12,13,14,15,16,17] |
| move | right | 18-23 | [18,19,20,21,22,23] |
| die | - | 5 | [5] |

### Code tạo animations:

```javascript
// Animal idle (sử dụng frame đầu tiên của move_down)
this.scene.anims.create({
    key: 'animal_idle',
    frames: [{ key: 'animal_sprite', frame: 0 }],
    frameRate: 1,
    repeat: -1
});

// Animal move_down (hàng 1: frames 0-5)
this.scene.anims.create({
    key: 'animal_move_down',
    frames: this.scene.anims.generateFrameNumbers('animal_sprite', {
        start: 0,
        end: 5
    }),
    frameRate: 8,
    repeat: -1
});

// Animal move_up (hàng 2: frames 6-11)
this.scene.anims.create({
    key: 'animal_move_up',
    frames: this.scene.anims.generateFrameNumbers('animal_sprite', {
        start: 6,
        end: 11
    }),
    frameRate: 8,
    repeat: -1
});

// Animal move_left (hàng 3: frames 12-17)
this.scene.anims.create({
    key: 'animal_move_left',
    frames: this.scene.anims.generateFrameNumbers('animal_sprite', {
        start: 12,
        end: 17
    }),
    frameRate: 8,
    repeat: -1
});

// Animal move_right (hàng 4: frames 18-23)
this.scene.anims.create({
    key: 'animal_move_right',
    frames: this.scene.anims.generateFrameNumbers('animal_sprite', {
        start: 18,
        end: 23
    }),
    frameRate: 8,
    repeat: -1
});

// Animal die (sử dụng frame cuối của move_down)
this.scene.anims.create({
    key: 'animal_die',
    frames: [{ key: 'animal_sprite', frame: 5 }],
    frameRate: 1,
    repeat: 0
});
```

---

## ⚙️ Cấu hình Animation

### Trong AnimationConfigs.json:

```json
{
  "animal": {
    "idle": {
      "frames": 1,
      "frameRate": 1,
      "repeat": -1,
      "key": "animal_idle"
    },
    "move": {
      "frames": 6,
      "frameRate": 8,
      "repeat": -1,
      "key": "animal_move",
      "directions": ["down", "up", "left", "right"]
    },
    "die": {
      "frames": 1,
      "frameRate": 1,
      "repeat": 0,
      "key": "animal_die"
    }
  }
}
```

---

## 🎮 Sử dụng trong Game

### Tự động Animation:

Khi animal di chuyển, hệ thống sẽ tự động:

1. **Detect velocity direction** (up/down/left/right)
2. **Chọn animation tương ứng** (animal_move_up, animal_move_down, etc.)
3. **Play animation** trên sprite

```javascript
// Khi animal di chuyển sang phải
velocity.x = 50;
velocity.y = 0;
behavior.current = 'wander';

// → Tự động chuyển sang animal_move_right animation
```

### Manual Animation:

```javascript
// Force chạy animation cụ thể
const animationSystem = this.ecsWorld.systems.find(s => s instanceof AnimationSystem);
animationSystem.forceAnimation(entityId, animation, 'move', 'up');
```

---

## 🔧 Tùy chỉnh Sprite Sheet khác

### Ví dụ: Sprite sheet 256x128 (4 cột x 2 hàng)

```javascript
// Cấu hình sprite sheet
const config = {
    frameWidth: 64,   // 256 / 4 = 64
    frameHeight: 64,  // 128 / 2 = 64
    startFrame: 0,
    endFrame: 7       // 4 frames x 2 hàng - 1
};

// Load sprite sheet
this.scene.load.spritesheet('new_sprite', 'assets/sprites/new_sprite.png', config);

// Tạo animations
// Hàng 1 (0-3): move_down
this.scene.anims.create({
    key: 'new_move_down',
    frames: this.scene.anims.generateFrameNumbers('new_sprite', { start: 0, end: 3 }),
    frameRate: 8,
    repeat: -1
});

// Hàng 2 (4-7): move_up  
this.scene.anims.create({
    key: 'new_move_up',
    frames: this.scene.anims.generateFrameNumbers('new_sprite', { start: 4, end: 7 }),
    frameRate: 8,
    repeat: -1
});
```

---

## 📊 Performance Tips

### 1. Sprite Sheet Optimization

```javascript
// Sử dụng texture atlas thay vì nhiều file riêng lẻ
// Ví dụ: Tất cả animations trong 1 file 1024x1024
```

### 2. Frame Rate Guidelines

```javascript
// Idle: 1-4 FPS (tiết kiệm)
// Move: 6-12 FPS (mượt mà)
// Attack: 12-20 FPS (nhanh)
// Die: 4-8 FPS (dramatic)
```

### 3. Memory Management

```javascript
// Chỉ load sprite sheets cần thiết
// Sử dụng texture cache
// Destroy unused animations
```

---

## 🐛 Debug Sprite Sheet

### Kiểm tra sprite sheet đã load:

```javascript
// Trong SpriteSheetManager
debugSpriteSheet('animal_sprite');
// Output: Sprite Sheet Debug - animal_sprite:
//   - Source: file:///path/to/animal.png
//   - Frame count: 24
//   - Frame size: 64x64
```

### Kiểm tra animations:

```javascript
// Kiểm tra animation có tồn tại không
const hasAnimation = this.spriteSheetManager.hasAnimation('animal_move_down');
console.log('Has move_down animation:', hasAnimation);

// Lấy danh sách animations
const animations = this.spriteSheetManager.getAvailableAnimations();
console.log('Available animations:', animations);
```

### Kiểm tra sprite trong game:

```javascript
// Lấy sprite của entity
const sprite = this.spriteSheetManager.getEntitySprite(entityId);
if (sprite) {
    console.log('Sprite position:', sprite.x, sprite.y);
    console.log('Sprite scale:', sprite.scaleX, sprite.scaleY);
    console.log('Current animation:', sprite.anims.currentAnim?.key);
}
```

---

## 📋 Checklist tích hợp Sprite Sheet

### Chuẩn bị:
- [ ] Đặt file sprite sheet vào `public/assets/sprites/`
- [ ] Kiểm tra kích thước và layout sprite sheet
- [ ] Tính toán frame indexes cho mỗi animation

### Code:
- [ ] Thêm `SpriteSheetManager` vào scene
- [ ] Load sprite sheet trong `preload()`
- [ ] Tạo animations từ sprite sheet
- [ ] Cập nhật `Appearance` component để sử dụng sprite
- [ ] Thêm `Animation` component vào entity
- [ ] Cập nhật `AnimationConfigs.json`

### Test:
- [ ] Kiểm tra sprite hiển thị đúng
- [ ] Test các animations (idle, move, die)
- [ ] Test thay đổi direction
- [ ] Kiểm tra performance

---

## 🎨 Best Practices

### 1. Sprite Sheet Design

```
✅ Tốt:
- Tất cả frames cùng kích thước
- Sắp xếp logic (theo animation, direction)
- Padding đều giữa các frames
- Sử dụng power-of-2 dimensions (256, 512, 1024)

❌ Tránh:
- Frames kích thước khác nhau
- Sắp xếp lộn xộn
- Không có padding
- Kích thước quá lớn (ảnh hưởng memory)
```

### 2. Animation Design

```
✅ Tốt:
- Smooth transitions giữa frames
- Consistent timing
- Clear direction indicators
- Appropriate frame count (không quá ít, không quá nhiều)

❌ Tránh:
- Jumpy animations
- Inconsistent frame rates
- Unclear direction
- Quá nhiều frames (waste memory)
```

### 3. Code Organization

```
✅ Tốt:
- Tách riêng SpriteSheetManager
- Sử dụng config files
- Reusable animation creation
- Clear naming conventions

❌ Tránh:
- Hardcode frame numbers
- Duplicate animation creation
- Unclear naming
- Mixed responsibilities
```

---

## 🎉 Kết luận

Với hướng dẫn này, bạn có thể:

- ✅ **Tích hợp sprite sheet** vào hệ thống animation
- ✅ **Tạo animations** từ sprite sheet tự động
- ✅ **Sử dụng trong game** với AnimationSystem
- ✅ **Tùy chỉnh** cho sprite sheets khác
- ✅ **Debug và optimize** performance

**Bước tiếp theo**: Thử tạo sprite sheet cho các loại đơn vị khác (soldier, archer, harvester)!

---

## 💡 Tips & Tricks

### 1. Sprite Sheet Tools
- **Aseprite**: Tạo và edit sprite sheets
- **TexturePacker**: Pack multiple sprites
- **Photoshop/GIMP**: Basic sprite editing

### 2. Animation Tools
- **Spine**: Professional 2D animation
- **DragonBones**: Free alternative to Spine
- **Lottie**: Vector animations

### 3. Performance Tools
- **Chrome DevTools**: Memory profiling
- **Phaser Debug**: Built-in performance tools
- **FPS Monitor**: Real-time performance

**Chúc bạn tạo ra những animation đẹp mắt! 🎬✨**

