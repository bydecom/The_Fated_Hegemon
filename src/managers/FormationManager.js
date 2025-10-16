// Manager tính toán vị trí formation cho nhóm units

export const FORMATION_TYPE = {
    CIRCLE: 'circle',
    SQUARE: 'square',
    LINE: 'line',
    WEDGE: 'wedge',    // Hình nêm (V-shape)
    COLUMN: 'column'    // Hàng dọc
};

export class FormationManager {
    constructor() {
        this.defaultSpacing = 30; // Khoảng cách giữa các units trong formation
    }
    
    // ============================================
    // PUBLIC API
    // ============================================
    
    /**
     * Tính toán vị trí cho từng unit trong formation
     * @param {Array} unitIds - Danh sách unit IDs
     * @param {number} centerX - Tâm formation (destination)
     * @param {number} centerY - Tâm formation
     * @param {string} formationType - Loại formation (CIRCLE, SQUARE, etc.)
     * @param {number} spacing - Khoảng cách giữa units (optional)
     * @returns {Map<unitId, {x, y}>} - Map của unit positions
     */
    calculateFormationPositions(unitIds, centerX, centerY, formationType = FORMATION_TYPE.CIRCLE, spacing = null) {
        const actualSpacing = spacing || this.defaultSpacing;
        const count = unitIds.length;
        
        if (count === 0) return new Map();
        
        // Nếu chỉ có 1 unit, đặt tại center
        if (count === 1) {
            return new Map([[unitIds[0], { x: centerX, y: centerY }]]);
        }
        
        // Gọi hàm tính toán tương ứng với formation type
        switch (formationType) {
            case FORMATION_TYPE.CIRCLE:
                return this.calculateCircleFormation(unitIds, centerX, centerY, actualSpacing);
            
            case FORMATION_TYPE.SQUARE:
                return this.calculateSquareFormation(unitIds, centerX, centerY, actualSpacing);
            
            case FORMATION_TYPE.LINE:
                return this.calculateLineFormation(unitIds, centerX, centerY, actualSpacing);
            
            case FORMATION_TYPE.WEDGE:
                return this.calculateWedgeFormation(unitIds, centerX, centerY, actualSpacing);
            
            case FORMATION_TYPE.COLUMN:
                return this.calculateColumnFormation(unitIds, centerX, centerY, actualSpacing);
            
            default:
                console.warn(`Unknown formation type: ${formationType}`);
                return this.calculateCircleFormation(unitIds, centerX, centerY, actualSpacing);
        }
    }
    
    // ============================================
    // FORMATION ALGORITHMS
    // ============================================
    
    /**
     * Hình tròn - Units bao quanh center
     */
    calculateCircleFormation(unitIds, centerX, centerY, spacing) {
        const positions = new Map();
        const count = unitIds.length;
        
        // Tính bán kính dựa trên số lượng units
        // Chu vi = count × spacing → radius = (count × spacing) / (2π)
        const radius = (count * spacing) / (2 * Math.PI);
        
        unitIds.forEach((unitId, index) => {
            const angle = (index / count) * 2 * Math.PI;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            positions.set(unitId, { x, y });
        });
        
        return positions;
    }
    
    /**
     * Hình vuông - Units xếp thành lưới
     */
    calculateSquareFormation(unitIds, centerX, centerY, spacing) {
        const positions = new Map();
        const count = unitIds.length;
        
        // Tính số hàng/cột (grid size)
        const gridSize = Math.ceil(Math.sqrt(count));
        
        // Offset để center formation
        const offsetX = -(gridSize - 1) * spacing / 2;
        const offsetY = -(gridSize - 1) * spacing / 2;
        
        unitIds.forEach((unitId, index) => {
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;
            
            const x = centerX + offsetX + col * spacing;
            const y = centerY + offsetY + row * spacing;
            
            positions.set(unitId, { x, y });
        });
        
        return positions;
    }
    
    /**
     * Hàng ngang - Units xếp thành 1 hàng
     */
    calculateLineFormation(unitIds, centerX, centerY, spacing) {
        const positions = new Map();
        const count = unitIds.length;
        
        // Offset để center line
        const offsetX = -(count - 1) * spacing / 2;
        
        unitIds.forEach((unitId, index) => {
            const x = centerX + offsetX + index * spacing;
            const y = centerY;
            
            positions.set(unitId, { x, y });
        });
        
        return positions;
    }
    
    /**
     * Hình nêm (V-shape) - Như Cavalry charge
     */
    calculateWedgeFormation(unitIds, centerX, centerY, spacing) {
        const positions = new Map();
        const count = unitIds.length;
        
        // Leader ở đầu (center)
        positions.set(unitIds[0], { x: centerX, y: centerY });
        
        // Các unit còn lại xếp thành V-shape
        let leftIndex = 1;
        let rightIndex = 2;
        let rowIndex = 1;
        
        for (let i = 1; i < count; i++) {
            const isLeft = (i % 2 === 1);
            const positionInRow = Math.floor((i - 1) / 2);
            
            const offsetY = rowIndex * spacing;
            const offsetX = (positionInRow + 1) * spacing * 0.7; // Góc hơi rộng
            
            let x, y;
            if (isLeft) {
                x = centerX - offsetX;
                y = centerY + offsetY;
            } else {
                x = centerX + offsetX;
                y = centerY + offsetY;
                rowIndex++;
            }
            
            positions.set(unitIds[i], { x, y });
        }
        
        return positions;
    }
    
    /**
     * Hàng dọc (Column) - Như march
     */
    calculateColumnFormation(unitIds, centerX, centerY, spacing) {
        const positions = new Map();
        const count = unitIds.length;
        
        // Tính số units mỗi hàng (2-3 units/hàng)
        const unitsPerRow = Math.min(3, count);
        
        // Offset để center
        const offsetY = -(Math.ceil(count / unitsPerRow) - 1) * spacing / 2;
        const offsetX = -(unitsPerRow - 1) * spacing / 2;
        
        unitIds.forEach((unitId, index) => {
            const row = Math.floor(index / unitsPerRow);
            const col = index % unitsPerRow;
            
            const x = centerX + offsetX + col * spacing;
            const y = centerY + offsetY + row * spacing;
            
            positions.set(unitId, { x, y });
        });
        
        return positions;
    }
    
    // ============================================
    // UTILITY METHODS
    // ============================================
    
    /**
     * Tính center của một nhóm units (average position)
     */
    calculateGroupCenter(units, ecsWorld) {
        if (units.length === 0) return { x: 0, y: 0 };
        
        let sumX = 0;
        let sumY = 0;
        let validCount = 0;
        
        for (const unitId of units) {
            const components = ecsWorld.entities.get(unitId);
            if (components) {
                const pos = components.get('position');
                if (pos) {
                    sumX += pos.x;
                    sumY += pos.y;
                    validCount++;
                }
            }
        }
        
        if (validCount === 0) return { x: 0, y: 0 };
        
        return {
            x: sumX / validCount,
            y: sumY / validCount
        };
    }
    
    /**
     * Rotate formation (xoay formation theo góc)
     */
    rotateFormation(positions, centerX, centerY, angleRadians) {
        const rotated = new Map();
        
        const cos = Math.cos(angleRadians);
        const sin = Math.sin(angleRadians);
        
        positions.forEach((pos, unitId) => {
            // Translate to origin
            const dx = pos.x - centerX;
            const dy = pos.y - centerY;
            
            // Rotate
            const rotatedX = dx * cos - dy * sin;
            const rotatedY = dx * sin + dy * cos;
            
            // Translate back
            rotated.set(unitId, {
                x: rotatedX + centerX,
                y: rotatedY + centerY
            });
        });
        
        return rotated;
    }
    
    /**
     * Tính formation hướng về một điểm (rotate để face target)
     */
    calculateFormationFacingPoint(unitIds, centerX, centerY, targetX, targetY, formationType, spacing) {
        // Tính góc từ center đến target
        const dx = targetX - centerX;
        const dy = targetY - centerY;
        const angle = Math.atan2(dy, dx);
        
        // Tạo formation ban đầu
        const positions = this.calculateFormationPositions(
            unitIds, 
            centerX, 
            centerY, 
            formationType, 
            spacing
        );
        
        // Xoay formation để hướng về target
        // (Mặc định formation hướng về phải, cần xoay thêm angle)
        return this.rotateFormation(positions, centerX, centerY, angle);
    }
}

