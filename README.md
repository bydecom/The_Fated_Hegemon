 # The Fated Hegemon - Project Documentation

*Một game RTS (Real-Time Strategy) được phát triển bằng Phaser 3 với hệ thống ECS*

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/1025df49-7248-44f2-a15e-eb7442c0a70f" />


## 1. Tổng quan Dự án (Project Overview)

The Fated Hegemon là một game chiến thuật thời gian thực được phát triển bằng Phaser 3 và JavaScript. Game sử dụng kiến trúc Entity Component System (ECS) để quản lý hàng ngàn đơn vị với hiệu năng cao, kết hợp với các hệ thống quản lý thông minh như Fog of War, Pathfinding và Grid-based movement.

### Các tính năng đã triển khai:

- **Hệ thống ECS hoàn chỉnh**: Quản lý entities, components và systems một cách hiệu quả
- **Fog of War**: Hệ thống sương mù chiến thuật với 3 trạng thái (UNSEEN, SEEN, VISIBLE)
- **Pathfinding A***: Tìm đường thông minh với thuật toán A* và grid-based navigation
- **RTS Controls**: Chọn đơn vị, di chuyển camera, kéo chọn nhiều đơn vị
- **AI Behavior System**: Hệ thống hành vi AI cho đơn vị địch với các trạng thái khác nhau
- **Minimap**: Bản đồ thu nhỏ hiển thị vị trí đơn vị và khung nhìn camera
- **UI System**: Giao diện người dùng với portrait view, command cards và minimap

## 2. Công nghệ Cốt lõi (Core Technologies)

- **Game Engine**: Phaser 3 - Framework làm game 2D mạnh mẽ và linh hoạt cho nền tảng web
- **Ngôn ngữ**: JavaScript (ES6+) - Ngôn ngữ chính để phát triển game
- **Kiến trúc Logic**: Entity Component System (ECS) - Kiến trúc tùy chỉnh để quản lý hàng ngàn đơn vị với hiệu năng cao
- **Công cụ Build**: Vite - Môi trường phát triển nhanh với Hot-Module Replacement
- **Pathfinding**: Thuật toán A* tùy chỉnh với grid-based navigation
- **Rendering**: RenderTexture cho minimap và Graphics API cho các đối tượng game

## 3. Cấu trúc Dự án (Project Structure)

Cấu trúc thực tế của dự án hiện tại:

```
the-fated-hegemon/
│
├── public/                 # Assets tĩnh (ảnh, âm thanh)
│   └── assets/
│       ├── images/
│       └── audio/
│
├── src/                    # Mã nguồn JavaScript của game
│   │
│   ├── ecs/                # HỆ THỐNG ECS - Trái tim của game
│   │   ├── components/     # Components (dữ liệu)
│   │   │   ├── AI.js           # Component AI cho đơn vị địch
│   │   │   ├── Appearance.js   # Component vẻ ngoài (màu sắc, kích thước)
│   │   │   ├── Behavior.js     # Component hành vi (trạng thái, mục tiêu)
│   │   │   ├── Building.js     # Component cho công trình
│   │   │   ├── Health.js       # Component máu và sức khỏe
│   │   │   ├── MoveTarget.js   # Component mục tiêu di chuyển
│   │   │   ├── PlayerUnit.js   # Component đánh dấu đơn vị người chơi
│   │   │   ├── Position.js     # Component vị trí (x, y)
│   │   │   ├── Selectable.js   # Component cho phép chọn
│   │   │   ├── Selected.js     # Component trạng thái được chọn
│   │   │   └── Velocity.js     # Component vận tốc (vx, vy)
│   │   ├── systems/        # Systems (logic xử lý)
│   │   │   ├── AISystem.js     # Hệ thống AI cho đơn vị địch
│   │   │   ├── BehaviorSystem.js # Hệ thống hành vi và trạng thái
│   │   │   ├── CollisionSystem.js # Hệ thống va chạm
│   │   │   ├── MovementSystem.js # Hệ thống di chuyển
│   │   │   └── RenderSystem.js  # Hệ thống vẽ và hiển thị
│   │   ├── EntityFactory.js # Factory tạo entities với components
│   │   └── world.js        # ECS World - quản lý entities và systems
│   │
│   ├── managers/           # Các manager cấp cao
│   │   ├── EventManager.js    # Quản lý sự kiện
│   │   ├── FogOfWarManager.js # Quản lý sương mù chiến thuật
│   │   ├── GridManager.js     # Quản lý lưới và chuyển đổi tọa độ
│   │   ├── PathfindingManager.js # Quản lý tìm đường A*
│   │   └── WorldManager.js    # Quản lý thế giới game
│   │
│   ├── scenes/             # Các Scene của game
│   │   ├── DemoScene.js       # Scene chính - gameplay RTS
│   │   ├── GameScene.js       # Scene game (chưa sử dụng)
│   │   ├── PauseScene.js      # Scene tạm dừng
│   │   ├── PreloaderScene.js  # Scene tải assets
│   │   ├── UIScene.js         # Scene giao diện người dùng
│   │   └── WaveDefenseScene.js # Scene phòng thủ (chưa triển khai)
│   │
│   ├── main.js             # Entry point - cấu hình Phaser
│   ├── style.css           # CSS styling
│   └── counter.js          # File demo (có thể xóa)
│
├── index.html              # Cổng vào ứng dụng web
├── package.json            # Quản lý dependencies
├── package-lock.json       # Lock file cho dependencies
├── GDD.md                  # Game Design Document
├── PATHFINDING_SETUP.md    # Hướng dẫn setup pathfinding
└── README.md               # Tài liệu này
```

## 4. Bắt đầu (Getting Started)

### Yêu cầu hệ thống:
- Node.js (phiên bản 14 trở lên)
- Trình duyệt web hiện đại (Chrome, Firefox, Safari, Edge)

### Cài đặt và chạy:
```bash
# Clone repository
git clone [your-repository-url]
cd the-fated-hegemon

# Cài đặt dependencies
npm install

# Chạy server phát triển
npm run dev
```

Mở trình duyệt và truy cập vào địa chỉ `http://localhost:5173` (hoặc port mà Vite hiển thị).

### Cách chơi hiện tại:
- **Chuột trái**: Chọn đơn vị (click đơn) hoặc kéo chọn nhiều đơn vị
- **Chuột phải**: Di chuyển đơn vị đã chọn đến vị trí click
- **Scroll chuột**: Phóng to/thu nhỏ camera
- **P**: Tạm dừng game
- **ESC**: Tạm dừng game
- **Click vào avatar**: Focus camera vào đơn vị đã chọn

## 5. Chi tiết Hệ thống (System Details)

### ECS Architecture
Game sử dụng kiến trúc Entity Component System với các thành phần chính:

#### Components (Dữ liệu):
- **Position**: Vị trí x, y của entity
- **Velocity**: Vận tốc vx, vy cho di chuyển
- **Appearance**: Màu sắc, kích thước để vẽ
- **Health**: Máu hiện tại và tối đa
- **AI**: Cấu hình AI cho đơn vị địch
- **Behavior**: Trạng thái hành vi và mục tiêu
- **Selectable/Selected**: Quản lý việc chọn đơn vị
- **PlayerUnit**: Đánh dấu đơn vị thuộc về người chơi
- **Building**: Đánh dấu công trình
- **MoveTarget**: Mục tiêu di chuyển

#### Systems (Logic xử lý):
- **MovementSystem**: Cập nhật vị trí dựa trên vận tốc
- **RenderSystem**: Vẽ entities lên màn hình với Fog of War
- **AISystem**: Xử lý AI cho đơn vị địch
- **BehaviorSystem**: Quản lý trạng thái và hành vi
- **CollisionSystem**: Xử lý va chạm giữa entities

### Managers (Quản lý cấp cao):
- **FogOfWarManager**: Quản lý sương mù chiến thuật với 3 trạng thái
- **PathfindingManager**: Tìm đường A* với grid-based navigation
- **GridManager**: Chuyển đổi tọa độ world ↔ grid
- **EventManager**: Quản lý sự kiện giữa các hệ thống
- **WorldManager**: Quản lý thế giới game tổng thể

### Scenes (Màn hình game):
- **DemoScene**: Scene chính với gameplay RTS
- **UIScene**: Giao diện người dùng (minimap, portrait, commands)
- **PauseScene**: Màn hình tạm dừng
- **PreloaderScene**: Tải assets
- **GameScene/WaveDefenseScene**: Chưa triển khai

## 6. Trạng thái Phát triển (Development Status)

### ✅ Đã hoàn thành:
- [x] Nền tảng ECS cơ bản với 11 components và 5 systems
- [x] Hệ thống Render với Graphics API và RenderTexture
- [x] AI Tìm đường (Pathfinding - A*) với grid-based navigation
- [x] AI Hành vi cơ bản (Behavior System) với các trạng thái
- [x] Hệ thống Fog of War với 3 trạng thái (UNSEEN, SEEN, VISIBLE)
- [x] RTS Controls (chọn đơn vị, kéo chọn, di chuyển camera)
- [x] Minimap với hiển thị đơn vị và khung camera
- [x] UI System với portrait view và command cards
- [x] Hệ thống va chạm cơ bản
- [x] Pause/Resume functionality
- [x] Entity Factory để tạo đơn vị và công trình

### 🚧 Đang phát triển:
- [ ] Tối ưu hóa hiệu năng cho hàng ngàn entities
- [ ] Cải thiện AI behavior với state machine phức tạp hơn
- [ ] Thêm âm thanh và hiệu ứng âm thanh

### 📋 Kế hoạch tương lai:
- [ ] Hệ thống Tạo thế giới Thủ tục (Chunking & Perlin Noise)
- [ ] Hệ thống "Roll" (Gacha) cơ bản
- [ ] Hệ thống Wave Thủ thành (Sử dụng Scene song song)
- [ ] Hệ thống Mô phỏng Trừu tượng & Sự kiện ngoài màn hình
- [ ] Lưu/Tải game (Sử dụng IndexedDB)
- [ ] Hệ thống Tùy biến Trang bị (Layered Sprites)
- [ ] Multiplayer support
- [ ] Advanced AI với machine learning

## 7. Hướng dẫn Phát triển (Development Guide)

### Thêm Component mới:
1. Tạo file trong `src/ecs/components/`
2. Export class với constructor nhận dữ liệu
3. Sử dụng trong EntityFactory hoặc trực tiếp trong Scene

### Thêm System mới:
1. Tạo file trong `src/ecs/systems/`
2. Implement method `update(delta)` 
3. Đăng ký trong `DemoScene.create()` với `ecsWorld.addSystem()`

### Thêm Manager mới:
1. Tạo file trong `src/managers/`
2. Khởi tạo trong `DemoScene.create()`
3. Truyền reference vào các System cần thiết

---

*Tài liệu này được cập nhật lần cuối: Tháng 12, 2024*
