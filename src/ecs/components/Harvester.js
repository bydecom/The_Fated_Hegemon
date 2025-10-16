export class Harvester {
    constructor(carryCapacity = 100, harvestRange = 100) {
        this.carryCapacity = carryCapacity; // Sức chứa tối đa
        this.currentLoad = 0; // Tải trọng hiện tại
        this.harvestRange = harvestRange; // Tầm thu hoạch (tăng lên 100 pixel)
        this.isHarvesting = false; // Đang thu hoạch
        this.targetResourceId = null; // ID của tài nguyên đang thu hoạch
        this.harvestTimer = 0; // Timer thu hoạch
        this.harvestInterval = 1000; // Khoảng thời gian thu hoạch (ms)
    }

    // Bắt đầu thu hoạch
    startHarvesting(resourceId) {
        this.targetResourceId = resourceId;
        this.isHarvesting = true;
        this.harvestTimer = 0;
    }

    // Dừng thu hoạch
    stopHarvesting() {
        this.isHarvesting = false;
        this.targetResourceId = null;
        this.harvestTimer = 0;
    }

    // Kiểm tra còn chỗ chứa không
    canCarryMore() {
        return this.currentLoad < this.carryCapacity;
    }

    // Thêm tài nguyên vào kho
    addResource(amount) {
        const canAdd = Math.min(amount, this.carryCapacity - this.currentLoad);
        this.currentLoad += canAdd;
        return canAdd;
    }

    // Lấy tài nguyên ra khỏi kho
    takeResource(amount) {
        const canTake = Math.min(amount, this.currentLoad);
        this.currentLoad -= canTake;
        return canTake;
    }

    // Kiểm tra kho đã đầy chưa
    isFull() {
        return this.currentLoad >= this.carryCapacity;
    }

    // Làm trống kho
    emptyLoad() {
        const amount = this.currentLoad;
        this.currentLoad = 0;
        return amount;
    }
}
