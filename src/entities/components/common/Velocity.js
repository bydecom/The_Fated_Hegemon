// Component tốc độ - Các mảnh dữ liệu

export class Velocity {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        // NEW: Góc quay tính bằng radian (0 = phải, Math.PI/2 = xuống, v.v.)
        this.orientation = 0;
    }

    setVelocity(x, y) {
        this.x = x;
        this.y = y;
        this.updateOrientation(); // Cập nhật hướng khi vận tốc thay đổi
    }

    addVelocity(x, y) {
        this.x += x;
        this.y += y;
    }

    getSpeed() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    updateOrientation() {
        const speed = this.getSpeed();
        if (speed > 0.1) {
            // Tính toán góc quay từ vận tốc. Math.atan2(dy, dx) trả về radian
            this.orientation = Math.atan2(this.y, this.x);
        }
    }
}
