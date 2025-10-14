// src/managers/GridManager.js

// Đại diện cho một ô (tile) trên lưới
class GridNode {
    constructor(x, y) {
        this.x = x; // Tọa độ lưới X
        this.y = y; // Tọa độ lưới Y
        this.isWalkable = true; // Lính có thể đi qua không?
        this.occupantId = null; // ID của entity (nhà hoặc lính) đang chiếm ô này
    }
}

export class GridManager {
    constructor(worldWidth, worldHeight, tileSize) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.tileSize = tileSize; // Kích thước mỗi ô vuông (ví dụ: 64x64 pixels)

        this.gridWidth = Math.floor(worldWidth / tileSize);
        this.gridHeight = Math.floor(worldHeight / tileSize);
        
        this.grid = [];
        this.createGrid();
    }

    // Khởi tạo cấu trúc dữ liệu lưới
    createGrid() {
        for (let x = 0; x < this.gridWidth; x++) {
            this.grid[x] = [];
            for (let y = 0; y < this.gridHeight; y++) {
                this.grid[x][y] = new GridNode(x, y);
            }
        }
        console.log(`Grid created: ${this.gridWidth}x${this.gridHeight} tiles`);
    }

    // Chuyển từ tọa độ pixel (thế giới) sang tọa độ lưới
    worldToGrid(worldX, worldY) {
        const gridX = Math.floor(worldX / this.tileSize);
        const gridY = Math.floor(worldY / this.tileSize);
        
        // Đảm bảo không vượt ra ngoài biên của lưới
        const clampedX = Phaser.Math.Clamp(gridX, 0, this.gridWidth - 1);
        const clampedY = Phaser.Math.Clamp(gridY, 0, this.gridHeight - 1);

        return new Phaser.Math.Vector2(clampedX, clampedY);
    }

    // Chuyển từ tọa độ lưới về tọa độ pixel (lấy tâm của ô)
    gridToWorldCenter(gridX, gridY) {
        const worldX = gridX * this.tileSize + this.tileSize / 2;
        const worldY = gridY * this.tileSize + this.tileSize / 2;
        return new Phaser.Math.Vector2(worldX, worldY);
    }

    // Lấy một node trên lưới từ tọa độ pixel
    getNodeAtWorld(worldX, worldY) {
        const gridPos = this.worldToGrid(worldX, worldY);
        return this.grid[gridPos.x][gridPos.y];
    }

    // Cập nhật trạng thái một ô
    setTileOccupied(gridX, gridY, entityId) {
        if (this.grid[gridX] && this.grid[gridX][gridY]) {
            this.grid[gridX][gridY].isWalkable = false;
            this.grid[gridX][gridY].occupantId = entityId;
        }
    }
    
    setTileFree(gridX, gridY) {
        if (this.grid[gridX] && this.grid[gridX][gridY]) {
            this.grid[gridX][gridY].isWalkable = true;
            this.grid[gridX][gridY].occupantId = null;
        }
    }

    // Vẽ lưới để debug (rất quan trọng)
    createDebugGraphics(scene) {
        const graphics = scene.add.graphics({ lineStyle: { width: 1, color: 0x333333, alpha: 0.3 } });
        graphics.setDepth(-1); // ⭐ Depth thấp nhất - nằm dưới tất cả

        for (let i = 0; i <= this.gridWidth; i++) {
            const x = i * this.tileSize;
            graphics.lineBetween(x, 0, x, this.worldHeight);
        }
        for (let j = 0; j <= this.gridHeight; j++) {
            const y = j * this.tileSize;
            graphics.lineBetween(0, y, this.worldWidth, y);
        }
        return graphics;
    }
}
