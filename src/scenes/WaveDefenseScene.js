// Scene cho các trận chiến chống Wave

export class WaveDefenseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WaveDefenseScene' });
    }

    create() {
        // TODO: Khởi tạo wave defense
        console.log('WaveDefenseScene created');
        
        // TODO: Tạo không gian chiến đấu riêng
        this.defenseArea = {
            x: 0,
            y: 0,
            width: 800,
            height: 600
        };
        
        // TODO: Quản lý wave system
        this.currentWave = 1;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
    }

    update(time, delta) {
        // TODO: Logic wave defense
        this.updateWave(delta);
        
        // TODO: Xử lý combat
        this.updateCombat(delta);
    }

    updateWave(delta) {
        // TODO: Logic spawn enemies
        // TODO: Kiểm tra điều kiện kết thúc wave
    }

    updateCombat(delta) {
        // TODO: Xử lý combat giữa player và enemies
        // TODO: Cập nhật health, damage...
    }
}
