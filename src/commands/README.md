# Command System

Hệ thống command đã được tách thành các file riêng biệt để dễ bảo trì và mở rộng.

## Cấu trúc thư mục

```
src/commands/
├── behaviors/           # Các command behaviors riêng biệt
│   ├── AttackCommand.js
│   ├── StopCommand.js
│   ├── DefenceCommand.js
│   ├── PatrolCommand.js    
│   ├── HarvestCommand.js
│   ├── MoveCommand.js
│   ├── FixCommand.js
│   └── index.js         # Export tất cả commands
├── CommandManager.js    # Quản lý và điều phối các commands
└── README.md           # Tài liệu này
```

## Cách sử dụng

### 1. CommandManager

`CommandManager` là class chính để quản lý tất cả các commands:

```javascript
import { CommandManager } from '../commands/CommandManager.js';

// Khởi tạo
this.commandManager = new CommandManager(this);

// Sử dụng
this.commandManager.executeAttack(targetId, worldPoint);
this.commandManager.executeStop();
this.commandManager.executeHarvest(worldPoint);
```

### 2. Các Commands có sẵn

- **AttackCommand**: Tấn công mục tiêu cụ thể hoặc attack-move
- **StopCommand**: Dừng tất cả hành động
- **DefenceCommand**: Phòng thủ tại vị trí
- **PatrolCommand**: Tuần tra giữa 2 điểm
- **HarvestCommand**: Thu hoạch tài nguyên
- **MoveCommand**: Di chuyển đến vị trí
- **FixCommand**: Sửa chữa building (TODO)

### 3. Thêm Command mới

1. Tạo file mới trong `behaviors/`:
```javascript
// src/commands/behaviors/NewCommand.js
export class NewCommand {
    constructor(scene) {
        this.scene = scene;
    }

    execute(...args) {
        // Logic của command
    }
}
```

2. Thêm vào `behaviors/index.js`:
```javascript
export { NewCommand } from './NewCommand.js';
```

3. Thêm vào `CommandManager.js`:
```javascript
import { NewCommand } from './behaviors/index.js';

// Trong constructor
this.commands = {
    // ... existing commands
    newCommand: new NewCommand(scene)
};

// Thêm method helper
executeNewCommand(...args) {
    this.commands.newCommand.execute(...args);
}
```

## Lợi ích

- **Modularity**: Mỗi command là một file riêng biệt
- **Maintainability**: Dễ sửa lỗi và cập nhật từng command
- **Extensibility**: Dễ dàng thêm command mới
- **Testability**: Có thể test từng command riêng biệt
- **Reusability**: Commands có thể được sử dụng ở nhiều nơi

## Migration từ DemoScene

Tất cả các method command cũ trong `DemoScene.js` đã được di chuyển vào các file command riêng biệt:

- `executeAttackCommand()` → `AttackCommand.execute()`
- `executeStopCommand()` → `StopCommand.execute()`
- `executeDefenceCommand()` → `DefenceCommand.execute()`
- `executePatrolCommand()` → `PatrolCommand.execute()`
- `executeHarvestCommand()` → `HarvestCommand.execute()`
- `executeMoveCommand()` → `MoveCommand.execute()`
- `executeFixCommand()` → `FixCommand.execute()`

`DemoScene.js` giờ chỉ còn `handleCommandExecution()` để điều phối các commands thông qua `CommandManager`.
