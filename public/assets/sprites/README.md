# 🖼️ Sprites Directory

Đặt các file sprite sheet vào thư mục này.

## 📁 Cấu trúc thư mục:

```
public/assets/sprites/
├── animal.png          # Sprite sheet cho animal (384x512, 6x8 frames)
├── soldier.png         # Sprite sheet cho soldier (tương lai)
├── archer.png          # Sprite sheet cho archer (tương lai)
└── harvester.png       # Sprite sheet cho harvester (tương lai)
```

## 🎯 Animal Sprite Sheet:

- **File**: `animal.png`
- **Kích thước**: 384x512 pixels
- **Layout**: 6 cột x 8 hàng
- **Frame size**: 64x64 pixels
- **Animations**:
  - Hàng 1 (0-5): move_down
  - Hàng 2 (6-11): move_up  
  - Hàng 3 (12-17): move_left
  - Hàng 4 (18-23): move_right
  - Hàng 5-8: Không sử dụng

## 📝 Lưu ý:

1. Đặt file `animal.png` vào thư mục này để sử dụng sprite animation
2. Nếu không có file, game sẽ fallback về graphics shapes
3. File phải có đúng kích thước và layout như mô tả

