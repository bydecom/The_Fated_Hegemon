// Component tốc độ - Các mảnh dữ liệu

export class Velocity {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    setVelocity(x, y) {
        this.x = x;
        this.y = y;
    }

    addVelocity(x, y) {
        this.x += x;
        this.y += y;
    }

    getSpeed() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}
