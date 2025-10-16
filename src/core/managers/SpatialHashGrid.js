// Spatial Hash Grid - Phân vùng không gian để tối ưu collision detection
// Giảm độ phức tạp từ O(N²) xuống O(N)

export class SpatialHashGrid {
    constructor(worldWidth, worldHeight, cellSize = 100) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.cellSize = cellSize; // Kích thước mỗi cell (100x100 pixels)
        
        this.cols = Math.ceil(worldWidth / cellSize);
        this.rows = Math.ceil(worldHeight / cellSize);
        
        // Map<cellKey, Set<entityId>>
        this.grid = new Map();
        
        // Map<entityId, Set<cellKey>> - Track entity ở những cell nào
        this.entityCells = new Map();
        
        console.log(`🗺️ SpatialHashGrid initialized: ${this.cols}x${this.rows} cells (${cellSize}px each)`);
    }
    
    // ============================================
    // CORE OPERATIONS
    // ============================================
    
    // Tính cell key từ tọa độ world
    getCellKey(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        
        // Clamp để tránh out of bounds
        const clampedCol = Math.max(0, Math.min(col, this.cols - 1));
        const clampedRow = Math.max(0, Math.min(row, this.rows - 1));
        
        return `${clampedCol},${clampedRow}`;
    }
    
    // Parse cell key thành {col, row}
    parseCellKey(key) {
        const [col, row] = key.split(',').map(Number);
        return { col, row };
    }
    
    // Lấy tất cả cell keys trong bán kính radius quanh (x, y)
    getCellKeysInRadius(x, y, radius) {
        const keys = new Set();
        
        // Tính số cell cần check
        const cellRadius = Math.ceil(radius / this.cellSize);
        
        const centerCol = Math.floor(x / this.cellSize);
        const centerRow = Math.floor(y / this.cellSize);
        
        for (let col = centerCol - cellRadius; col <= centerCol + cellRadius; col++) {
            for (let row = centerRow - cellRadius; row <= centerRow + cellRadius; row++) {
                if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
                    keys.add(`${col},${row}`);
                }
            }
        }
        
        return keys;
    }
    
    // ============================================
    // ENTITY MANAGEMENT
    // ============================================
    
    // Thêm entity vào grid
    insert(entityId, x, y, size = 0) {
        // Xóa entity khỏi các cell cũ (nếu có)
        this.remove(entityId);
        
        // Tính các cell mà entity chiếm (dựa trên size)
        const cellKeys = this.getCellKeysInRadius(x, y, size);
        
        // Thêm entity vào các cell
        cellKeys.forEach(key => {
            if (!this.grid.has(key)) {
                this.grid.set(key, new Set());
            }
            this.grid.get(key).add(entityId);
        });
        
        // Track entity ở những cell nào
        this.entityCells.set(entityId, cellKeys);
    }
    
    // Xóa entity khỏi grid
    remove(entityId) {
        const cellKeys = this.entityCells.get(entityId);
        if (!cellKeys) return;
        
        // Xóa khỏi tất cả cells
        cellKeys.forEach(key => {
            const cell = this.grid.get(key);
            if (cell) {
                cell.delete(entityId);
                // Xóa cell rỗng để tiết kiệm bộ nhớ
                if (cell.size === 0) {
                    this.grid.delete(key);
                }
            }
        });
        
        this.entityCells.delete(entityId);
    }
    
    // Cập nhật vị trí entity (nhanh hơn remove + insert)
    update(entityId, x, y, size = 0) {
        const newCellKeys = this.getCellKeysInRadius(x, y, size);
        const oldCellKeys = this.entityCells.get(entityId) || new Set();
        
        // Tìm cells cần remove và cells cần add
        const toRemove = new Set([...oldCellKeys].filter(key => !newCellKeys.has(key)));
        const toAdd = new Set([...newCellKeys].filter(key => !oldCellKeys.has(key)));
        
        // Remove từ cells cũ
        toRemove.forEach(key => {
            const cell = this.grid.get(key);
            if (cell) {
                cell.delete(entityId);
                if (cell.size === 0) {
                    this.grid.delete(key);
                }
            }
        });
        
        // Add vào cells mới
        toAdd.forEach(key => {
            if (!this.grid.has(key)) {
                this.grid.set(key, new Set());
            }
            this.grid.get(key).add(entityId);
        });
        
        // Update tracking
        this.entityCells.set(entityId, newCellKeys);
    }
    
    // ============================================
    // QUERY OPERATIONS
    // ============================================
    
    // Lấy tất cả entities gần (x, y) trong bán kính radius
    queryRadius(x, y, radius, excludeEntityId = null) {
        const cellKeys = this.getCellKeysInRadius(x, y, radius);
        const nearbyEntities = new Set();
        
        cellKeys.forEach(key => {
            const cell = this.grid.get(key);
            if (cell) {
                cell.forEach(entityId => {
                    if (entityId !== excludeEntityId) {
                        nearbyEntities.add(entityId);
                    }
                });
            }
        });
        
        return Array.from(nearbyEntities);
    }
    
    // Lấy entities trong một vùng chữ nhật (AABB query)
    queryRect(minX, minY, maxX, maxY, excludeEntityId = null) {
        const minCol = Math.floor(minX / this.cellSize);
        const minRow = Math.floor(minY / this.cellSize);
        const maxCol = Math.floor(maxX / this.cellSize);
        const maxRow = Math.floor(maxY / this.cellSize);
        
        const entities = new Set();
        
        for (let col = minCol; col <= maxCol; col++) {
            for (let row = minRow; row <= maxRow; row++) {
                if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
                    const key = `${col},${row}`;
                    const cell = this.grid.get(key);
                    if (cell) {
                        cell.forEach(entityId => {
                            if (entityId !== excludeEntityId) {
                                entities.add(entityId);
                            }
                        });
                    }
                }
            }
        }
        
        return Array.from(entities);
    }
    
    // Lấy entities trong cùng cell (rất nhanh)
    queryCell(x, y, excludeEntityId = null) {
        const key = this.getCellKey(x, y);
        const cell = this.grid.get(key);
        
        if (!cell) return [];
        
        return Array.from(cell).filter(id => id !== excludeEntityId);
    }
    
    // ============================================
    // DEBUG & UTILITIES
    // ============================================
    
    clear() {
        this.grid.clear();
        this.entityCells.clear();
    }
    
    getStats() {
        let totalEntities = 0;
        let occupiedCells = 0;
        let maxEntitiesPerCell = 0;
        
        this.grid.forEach(cell => {
            occupiedCells++;
            totalEntities += cell.size;
            maxEntitiesPerCell = Math.max(maxEntitiesPerCell, cell.size);
        });
        
        return {
            totalCells: this.cols * this.rows,
            occupiedCells,
            totalEntities,
            maxEntitiesPerCell,
            averageEntitiesPerCell: occupiedCells > 0 ? (totalEntities / occupiedCells).toFixed(2) : 0
        };
    }
    
    // Vẽ grid để debug
    debugDraw(scene, graphics) {
        if (!graphics) {
            graphics = scene.add.graphics();
        }
        
        graphics.clear();
        graphics.lineStyle(1, 0x00ff00, 0.3);
        
        // Vẽ grid lines
        for (let col = 0; col <= this.cols; col++) {
            const x = col * this.cellSize;
            graphics.lineBetween(x, 0, x, this.worldHeight);
        }
        
        for (let row = 0; row <= this.rows; row++) {
            const y = row * this.cellSize;
            graphics.lineBetween(0, y, this.worldWidth, y);
        }
        
        // Highlight occupied cells
        graphics.fillStyle(0x00ff00, 0.1);
        this.grid.forEach((entities, key) => {
            const { col, row } = this.parseCellKey(key);
            const x = col * this.cellSize;
            const y = row * this.cellSize;
            
            // Màu đậm hơn nếu có nhiều entities
            const alpha = Math.min(0.5, entities.size * 0.05);
            graphics.fillStyle(0x00ff00, alpha);
            graphics.fillRect(x, y, this.cellSize, this.cellSize);
        });
        
        return graphics;
    }
}

