// Component cho Defence mode - Lưu vị trí phòng thủ ban đầu

export class DefencePosition {
    constructor(x, y, radius = 100) {
        this.x = x; // Vị trí ban đầu cần phòng thủ
        this.y = y;
        this.radius = radius; // Bán kính phòng thủ (không rời xa hơn)
        this.isRetreating = false; // Đang chạy về vị trí phòng thủ
    }
    
    // Kiểm tra có nằm trong bán kính phòng thủ không
    isWithinRadius(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= this.radius;
    }
    
    // Tính khoảng cách từ điểm đến vị trí phòng thủ
    getDistanceFromDefencePoint(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Update vị trí phòng thủ mới
    updatePosition(x, y) {
        this.x = x;
        this.y = y;
        this.isRetreating = false;
    }
}

