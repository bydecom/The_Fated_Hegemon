 # The Sovereign's Gambit - Project Documentation

*A 4X Survival Roguelike inspired by "Toàn Dân Lĩnh Chủ"*

## 1. Tổng quan Dự án (Project Overview)

The Fated Hegemon là một game chiến thuật sinh tồn 4X (eXplore, eXpand, eXploit, eXterminate) được phát triển bằng Phaser 3. Lấy cảm hứng từ thể loại truyện "Toàn Dân Lĩnh Chủ", người chơi sẽ được đưa vào một thế giới xa lạ, phải xây dựng đế chế của mình từ hai bàn tay trắng.

### Điểm nhấn gameplay độc đáo bao gồm:

- **Hệ thống "Roll" (Gacha)**: Thay vì cây công nghệ cố định, mọi đơn vị và công trình đều đến từ những lượt "roll" ngẫu nhiên.
- **Thế giới Sống**: Các lãnh chúa AI khác sẽ tự phát triển, tương tác và cạnh tranh với người chơi ngay cả khi không có mặt.
- **Wave Thủ thành Phân tách**: Khi Wave ập đến, lãnh địa chính của người chơi sẽ bị kéo vào một không gian riêng để chiến đấu, trong khi các lãnh thổ ngoại vi vẫn có nguy cơ bị tấn công ở thế giới chính.

## 2. Công nghệ Cốt lõi (Core Technologies)

- **Game Engine**: Phaser 3 - Một framework làm game 2D mạnh mẽ và linh hoạt cho nền tảng web.
- **Ngôn ngữ**: TypeScript - Giúp quản lý code của một dự án lớn một cách chặt chẽ và an toàn.
- **Kiến trúc Logic**: Entity Component System (ECS) - Sử dụng thư viện gecs để quản lý hàng ngàn đơn vị với hiệu năng cao.
- **Công cụ Build**: Vite - Cung cấp một môi trường phát triển siêu nhanh với server ảo và Hot-Module Replacement.
- **Quản lý phiên bản Node**: NVM (Node Version Manager) - Giúp đảm bảo môi trường Node.js luôn tương thích.

## 3. Cấu trúc Dự án (Project Structure)

Đây là bản đồ của toàn bộ project. Việc tuân thủ cấu trúc này là cực kỳ quan trọng để giữ cho code luôn sạch sẽ và dễ quản lý.

```
the-sovereigns-gambit/
│
├── public/                 # Nơi chứa tất cả các assets tĩnh (ảnh, âm thanh)
│   └── assets/
│       ├── images/
│       └── audio/
│
├── src/                    # Nơi chứa toàn bộ mã nguồn TypeScript của game
│   │
│   ├── ecs/                # BỘ NÃO CỦA GAME - Toàn bộ logic nằm ở đây
│   │   ├── components/     # Các mảnh dữ liệu (Vị trí, Máu, Tốc độ...)
│   │   ├── systems/        # Logic xử lý dữ liệu (Hệ thống di chuyển, render...)
│   │   └── world.ts        # File trung tâm để khởi tạo và đăng ký các System
│   │
│   ├── managers/           # Các module quản lý cấp cao
│   │   ├── WorldManager.ts # Logic tạo map, quản lý chunk...
│   │   └── EventManager.ts # Quản lý các sự kiện ngoài màn hình
│   │
│   ├── scenes/             # Mỗi màn hình/trạng thái của game là một Scene
│   │   ├── PreloaderScene.ts # Scene đầu tiên, dùng để tải assets
│   │   ├── GameScene.ts      # Scene gameplay chính
│   │   └── WaveDefenseScene.ts # Scene cho các trận chiến chống Wave
│   │
│   └── main.ts             # Điểm khởi đầu, cấu hình và khởi chạy game Phaser
│
├── index.html              # Cổng vào của ứng dụng web
├── package.json            # Quản lý các thư viện và script của project
└── README.md               # Chính là file này!
```

## 4. Bắt đầu (Getting Started)

Làm theo các bước sau để thiết lập môi trường phát triển trên một máy tính mới.

### Clone repository (Nếu có):
```bash
git clone [your-repository-url]
cd the-sovereigns-gambit
```

### Kiểm tra phiên bản Node.js:
Đảm bảo bạn đang dùng phiên bản Node.js tương thích.
```bash
nvm use
```
*(Lệnh này sẽ tự động đọc phiên bản yêu cầu từ file .nvmrc nếu bạn tạo nó)*

### Cài đặt các thư viện:
```bash
npm install
```

### Chạy server phát triển:
```bash
npm run dev
```

Mở trình duyệt và truy cập vào địa chỉ `http://localhost:xxxx` mà Vite cung cấp.

## 5. Quy trình Phát triển (Development Workflow)

### Tư duy ECS-First
Mọi logic gameplay phải được triển khai dưới dạng Components (dữ liệu) và Systems (hành vi). Tránh viết logic phức tạp trực tiếp trong các file Scene.

### Thêm Assets
Để thêm ảnh hoặc âm thanh mới, hãy đặt file vào thư mục `public/assets/`. Sau đó, khai báo và tải nó trong file `src/scenes/PreloaderScene.ts`.

### Tạo Logic mới:
1. Tạo một file Component mới trong `src/ecs/components/` để lưu trữ dữ liệu.
2. Tạo một file System mới trong `src/ecs/systems/` để xử lý dữ liệu đó.
3. Đăng ký System mới trong `src/ecs/world.ts`.
4. Trong `GameScene.ts` (hoặc các manager), tạo entity và gắn component cho nó.

## 6. Lộ trình & Các tính năng dự kiến (Roadmap)

Đây là danh sách các hệ thống lớn cần xây dựng để biến ý tưởng thành hiện thực.

- [ ] Nền tảng ECS cơ bản
- [ ] Hệ thống Render cơ bản (Vẽ sprite từ ECS)
- [ ] Hệ thống Tạo thế giới Thủ tục (Chunking & Perlin Noise)
- [ ] Hệ thống "Roll" (Gacha) cơ bản
- [ ] AI Tìm đường (Pathfinding - A*)
- [ ] AI Hành vi (Behavior Trees)
- [ ] Hệ thống Wave Thủ thành (Sử dụng Scene song song)
- [ ] Hệ thống Mô phỏng Trừu tượng & Sự kiện ngoài màn hình
- [ ] Lưu/Tải game (Sử dụng IndexedDB)
- [ ] Hệ thống Tùy biến Trang bị (Layered Sprites)

---

*Tài liệu này sẽ được cập nhật liên tục trong suốt quá trình phát triển.*