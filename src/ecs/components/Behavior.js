// Component hành vi - Định nghĩa loại hành vi của entity

export class Behavior {
    constructor(type = 'idle', data = {}) {
        this.type = type; // 'idle', 'patrol', 'chase', 'flee', 'wander', 'moveToTarget'
        this.data = data; // Dữ liệu cụ thể cho từng loại hành vi
        this.timer = 0;
        this.state = 'active'; // 'active', 'paused', 'completed'
    }

    setBehavior(type, data = {}) {
        this.type = type;
        // ⭐ DEEP COPY để tránh share data giữa các entities
        this.data = JSON.parse(JSON.stringify(data));
        this.timer = 0;
        this.state = 'active';
    }

    update(deltaTime) {
        if (this.state === 'active') {
            this.timer += deltaTime;
        }
    }

    reset() {
        this.timer = 0;
        this.state = 'active';
    }
}
