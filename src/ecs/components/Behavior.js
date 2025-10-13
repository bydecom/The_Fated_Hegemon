// Component hành vi - Định nghĩa loại hành vi của entity

export class Behavior {
    constructor(type = 'idle', data = {}) {
        this.type = type; // 'idle', 'patrol', 'chase', 'flee', 'wander'
        this.data = data; // Dữ liệu cụ thể cho từng loại hành vi
        this.timer = 0;
        this.state = 'active'; // 'active', 'paused', 'completed'
    }

    setBehavior(type, data = {}) {
        this.type = type;
        this.data = data;
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
