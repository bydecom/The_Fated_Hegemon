// src/managers/PathfindingManager.js
import EasyStar from 'easystarjs';

export class PathfindingManager {
    constructor(gridManager) {
        this.gridManager = gridManager;
        this.easystar = new EasyStar.js();
        this.updateGrid();
    }

    // Cập nhật grid từ GridManager
    updateGrid() {
        const grid = this.gridManager.grid;
        const gridWidth = this.gridManager.gridWidth;
        const gridHeight = this.gridManager.gridHeight;

        // Tạo một mảng 2D chỉ chứa 0 (đi được) và 1 (không đi được)
        const simplifiedGrid = [];
        for (let y = 0; y < gridHeight; y++) {
            simplifiedGrid[y] = [];
            for (let x = 0; x < gridWidth; x++) {
                simplifiedGrid[y][x] = grid[x][y].isWalkable ? 0 : 1;
            }
        }
        
        this.easystar.setGrid(simplifiedGrid);
        this.easystar.setAcceptableTiles([0]); // Chỉ chấp nhận đi vào ô có giá trị 0

        // ⭐ SỬA LỖI TẠI ĐÂY: BẬT CHẾ ĐỘ ĐI CHÉO
        this.easystar.enableDiagonals();
        
        // (Tùy chọn) Cho phép lính "cắt góc" khi đi chéo qua các vật cản
        this.easystar.enableCornerCutting();
    }
    
    // Hàm tìm đường bất đồng bộ
    findPath(startNode, endNode, callback) {
        // Yêu cầu EasyStar tìm đường
        this.easystar.findPath(startNode.x, startNode.y, endNode.x, endNode.y, (path) => {
            if (path === null) {
                console.warn("Path was not found.");
                callback(null);
            } else {
                console.log(`Path found with ${path.length} nodes`);
                callback(path);
            }
        });
        
        // Bắt buộc phải có lệnh này để EasyStar bắt đầu tính toán
        this.easystar.calculate();
    }

    // ⭐ HÀM DEBUG: Hiển thị trạng thái grid
    debugGrid() {
        const grid = this.gridManager.grid;
        const gridWidth = this.gridManager.gridWidth;
        const gridHeight = this.gridManager.gridHeight;
        
        console.log("=== PATHFINDING GRID DEBUG ===");
        for (let y = 0; y < Math.min(10, gridHeight); y++) {
            let row = "";
            for (let x = 0; x < Math.min(20, gridWidth); x++) {
                row += grid[x][y].isWalkable ? "." : "#";
            }
            console.log(`Row ${y}: ${row}`);
        }
        console.log("=============================");
    }
}
