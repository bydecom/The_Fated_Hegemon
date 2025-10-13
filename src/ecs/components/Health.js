// Component máu - Các mảnh dữ liệu

export class Health {
    constructor(current = 100, maximum = 100) {
        this.current = current;
        this.maximum = maximum;
    }

    takeDamage(amount) {
        this.current = Math.max(0, this.current - amount);
        return this.current <= 0;
    }

    heal(amount) {
        this.current = Math.min(this.maximum, this.current + amount);
    }

    isDead() {
        return this.current <= 0;
    }
}
