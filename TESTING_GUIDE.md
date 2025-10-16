# 🧪 HƯỚNG DẪN TEST HỆ THỐNG ANIMATION

## 🎯 Tình trạng hiện tại

Hệ thống animation đã được tích hợp hoàn chỉnh! Bây giờ bạn có thể test:

### ✅ **Đã sửa:**
- Lỗi `appearance is not defined` trong EntityFactory
- Lỗi `Cannot read properties of undefined` trong DemoScene
- Hệ thống fallback khi không có sprite sheet

### 🚀 **Cách test:**

#### 1. **Test với Graphics (hiện tại)**
- Mở game trong browser
- Animals sẽ hiển thị dưới dạng hình tròn đen
- Animations sẽ hoạt động với graphics shapes

#### 2. **Test với Sprite Sheet (tương lai)**
- Đặt file `animal.png` (384x512) vào `public/assets/sprites/`
- Animals sẽ hiển thị với sprite animations
- Animations sẽ mượt mà hơn

---

## 🎮 Test Cases

### Test 1: Tạo Animals
```javascript
// Trong console browser
// Kiểm tra animals được tạo
console.log('Animals created:', this.ecsWorld.entities.size);
```

### Test 2: Kiểm tra Animations
```javascript
// Kiểm tra animations có tồn tại
console.log('Available animations:', this.scene.anims.anims.entries.keys());
```

### Test 3: Test Movement
- Chọn animal
- Di chuyển bằng chuột phải
- Quan sát animation thay đổi theo hướng

### Test 4: Test Behavior
- Animals sẽ tự động wander
- Animation sẽ chuyển giữa idle và move
- Hướng animation sẽ thay đổi theo velocity

---

## 🐛 Debug Commands

### Kiểm tra Entity Components
```javascript
// Lấy animal đầu tiên
const animalId = Array.from(this.ecsWorld.entities.keys())[0];
const animal = this.ecsWorld.entities.get(animalId);
console.log('Animal components:', animal);
```

### Kiểm tra Animation State
```javascript
// Lấy animation component
const animation = animal.get('animation');
console.log('Animation state:', animation.getCurrentAnimationInfo());
```

### Kiểm tra Appearance
```javascript
// Lấy appearance component
const appearance = animal.get('appearance');
console.log('Using sprite:', appearance.isUsingSprite());
console.log('Sprite key:', appearance.spriteKey);
```

---

## 📊 Expected Results

### Với Graphics (hiện tại):
- ✅ Animals hiển thị dưới dạng hình tròn đen
- ✅ Animations hoạt động (idle/move)
- ✅ Direction changes work
- ✅ No errors in console

### Với Sprite Sheet (khi có file):
- ✅ Animals hiển thị với sprite
- ✅ Smooth animations
- ✅ Proper frame sequences
- ✅ Better visual quality

---

## 🔧 Troubleshooting

### Lỗi thường gặp:

#### 1. **"appearance is not defined"**
- ✅ **Đã sửa**: Di chuyển dòng code xuống sau khi tạo appearance

#### 2. **"Cannot read properties of undefined"**
- ✅ **Đã sửa**: Khởi tạo SpriteSheetManager trong preload()

#### 3. **"Texture not found"**
- ⚠️ **Expected**: Sẽ fallback về graphics nếu không có sprite sheet

#### 4. **Animation không chạy**
- Kiểm tra Animation component có được thêm không
- Kiểm tra AnimationSystem có được add vào ECS World không

---

## 🎉 Next Steps

### Để có sprite animations:
1. Tạo file `animal.png` (384x512, 6x8 frames)
2. Đặt vào `public/assets/sprites/animal.png`
3. Refresh browser
4. Animals sẽ hiển thị với sprite!

### Để thêm animations khác:
1. Tạo sprite sheet mới
2. Cập nhật SpriteSheetManager
3. Thêm config vào AnimationConfigs.json
4. Test trong game

---

## 📝 Notes

- Hệ thống hiện tại hoạt động với graphics fallback
- Sprite animations sẽ tự động hoạt động khi có file
- Performance được tối ưu với update interval
- Code được tổ chức rõ ràng và dễ mở rộng

**Chúc bạn test vui! 🎮✨**

