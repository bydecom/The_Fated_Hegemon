// Quản lý tài nguyên của người chơi

export class ResourceManager {
    constructor() {
        this.resources = {
            wood: 1000,      // Gỗ
            meat: 500,       // Thịt
            gold: 750,       // Vàng
            silver: 250,     // Bạc
            stone: 600,      // Đá
            water: 300       // Nước
        };
        
        this.maxResources = {
            wood: 10000,
            meat: 5000,
            gold: 5000,
            silver: 5000,
            stone: 10000,
            water: 5000
        };
        
        this.unitCount = 0;
        this.maxUnitCount = 200;
    }

    // Thêm tài nguyên
    addResource(type, amount) {
        if (this.resources[type] !== undefined) {
            this.resources[type] = Math.min(
                this.resources[type] + amount,
                this.maxResources[type]
            );
            return true;
        }
        return false;
    }

    // Trừ tài nguyên
    removeResource(type, amount) {
        if (this.resources[type] !== undefined && this.resources[type] >= amount) {
            this.resources[type] -= amount;
            return true;
        }
        return false;
    }

    // Kiểm tra đủ tài nguyên
    hasResource(type, amount) {
        return this.resources[type] !== undefined && this.resources[type] >= amount;
    }

    // Kiểm tra đủ nhiều loại tài nguyên
    hasResources(costs) {
        for (const [type, amount] of Object.entries(costs)) {
            if (!this.hasResource(type, amount)) {
                return false;
            }
        }
        return true;
    }

    // Trừ nhiều loại tài nguyên
    removeResources(costs) {
        if (!this.hasResources(costs)) {
            return false;
        }
        
        for (const [type, amount] of Object.entries(costs)) {
            this.removeResource(type, amount);
        }
        return true;
    }

    // Lấy số lượng tài nguyên
    getResource(type) {
        return this.resources[type] || 0;
    }

    // Lấy tất cả tài nguyên
    getAllResources() {
        return { ...this.resources };
    }

    // Cập nhật số lượng unit
    setUnitCount(count) {
        this.unitCount = Math.min(count, this.maxUnitCount);
    }

    // Kiểm tra có thể tạo thêm unit không
    canCreateUnit() {
        return this.unitCount < this.maxUnitCount;
    }

    // Thêm unit
    addUnit() {
        if (this.canCreateUnit()) {
            this.unitCount++;
            return true;
        }
        return false;
    }

    // Xóa unit
    removeUnit() {
        if (this.unitCount > 0) {
            this.unitCount--;
            return true;
        }
        return false;
    }
}

