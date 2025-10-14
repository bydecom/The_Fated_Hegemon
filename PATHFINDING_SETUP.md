# Hướng Dẫn Cài Đặt Pathfinding A*

## Bước 1: Cài Đặt Thư Viện
Chạy lệnh sau trong terminal:

```bash
npm install easystarjs
```

## Bước 2: Các File Đã Được Tạo/Cập Nhật

### ✅ File Mới:
- `src/managers/PathfindingManager.js` - Quản lý thuật toán A*

### ✅ File Đã Cập Nhật:
- `src/ecs/components/AI.js` - Thêm phương thức pathfinding
- `src/ecs/systems/BehaviorSystem.js` - Thêm hành vi `followPath`
- `src/scenes/DemoScene.js` - Tích hợp pathfinding vào điều khiển

## Bước 3: Cách Hoạt Động

1. **Chọn lính** bằng cách click chuột trái
2. **Ra lệnh di chuyển** bằng cách click chuột phải vào vị trí đích
3. **Lính sẽ tự động tìm đường** vòng qua các tòa nhà và vật cản

## Tính Năng Mới:

- ✅ **Tìm đường thông minh**: Lính không còn đâm đầu vào tường
- ✅ **Tránh vật cản**: Tự động vòng qua các tòa nhà
- ✅ **Đường đi tối ưu**: Sử dụng thuật toán A* chuyên nghiệp
- ✅ **Tương thích với sương mù**: Hoạt động với hệ thống Fog of War

## Lưu Ý:
- Đảm bảo đã cài đặt `easystarjs` trước khi chạy game
- Pathfinding chỉ hoạt động với các đơn vị có component `AI`
- Các tòa nhà sẽ được tự động đánh dấu là vật cản
