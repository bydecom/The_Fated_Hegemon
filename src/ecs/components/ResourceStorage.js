export class ResourceStorage {
    constructor() {
        this.storage = {
            wood: 0,
            meat: 0,
            gold: 0,
            silver: 0,
            stone: 0,
            water: 0
        };
    }

    // Thêm tài nguyên vào kho
    addResource(resourceType, amount) {
        if (this.storage.hasOwnProperty(resourceType)) {
            this.storage[resourceType] += amount;
            return true;
        }
        return false;
    }

    // Lấy tài nguyên ra khỏi kho
    removeResource(resourceType, amount) {
        if (this.storage.hasOwnProperty(resourceType)) {
            const canRemove = Math.min(amount, this.storage[resourceType]);
            this.storage[resourceType] -= canRemove;
            return canRemove;
        }
        return 0;
    }

    // Kiểm tra có đủ tài nguyên không
    hasResource(resourceType, amount) {
        return this.storage[resourceType] >= amount;
    }

    // Lấy số lượng tài nguyên
    getResource(resourceType) {
        return this.storage[resourceType] || 0;
    }

    // Lấy tất cả tài nguyên
    getAllResources() {
        return { ...this.storage };
    }

    // Đặt số lượng tài nguyên
    setResource(resourceType, amount) {
        if (this.storage.hasOwnProperty(resourceType)) {
            this.storage[resourceType] = amount;
            return true;
        }
        return false;
    }
}
