// src/scenes/PauseScene.js

export class PauseScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PauseScene' });
    }

    create() {
        // Tạo một lớp phủ mờ
        this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.5)
            .setOrigin(0, 0);

        // Tạo dòng chữ "PAUSED"
        this.add.text(
            this.scale.width / 2, 
            this.scale.height / 2, 
            'PAUSED', 
            { fontSize: '64px', fill: '#fff', fontStyle: 'bold' }
        ).setOrigin(0.5);

        // Lắng nghe sự kiện nhấn phím để resume
        this.input.keyboard.on('keydown', (event) => {
            if (event.code === 'KeyP' || event.code === 'Escape') {
                this.unpauseGame();
            }
        });
    }

    unpauseGame() {
        // Đánh thức DemoScene dậy
        this.scene.resume('DemoScene');
        // Tắt chính scene này đi
        this.scene.stop();
    }
}
