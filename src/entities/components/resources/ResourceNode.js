export class ResourceNode {
    constructor(resourceType, amount, harvestRate = 1) {
        this.resourceType = resourceType; // 'wood', 'meat', 'gold', 'silver', 'stone', 'water'
        this.amount = amount; // Số lượng tài nguyên còn lại
        this.maxAmount = amount; // Số lượng tài nguyên ban đầu
        this.harvestRate = harvestRate; // Tốc độ thu hoạch (tài nguyên/giây)
        this.isDepleted = false; // Đã cạn kiệt chưa
    }

    // Thu hoạch tài nguyên
    harvest(deltaTime) {
        if (this.isDepleted) return 0;
        
        const harvested = Math.min(this.harvestRate * deltaTime, this.amount);
        this.amount -= harvested;
        
        if (this.amount <= 0) {
            this.amount = 0;
            this.isDepleted = true;
        }
        
        return harvested;
    }

    // Kiểm tra còn tài nguyên không
    hasResources() {
        return this.amount > 0;
    }

    // Lấy tỷ lệ tài nguyên còn lại (0-1)
    getResourceRatio() {
        return this.amount / this.maxAmount;
    }
}
