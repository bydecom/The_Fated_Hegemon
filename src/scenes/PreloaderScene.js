// Scene đầu tiên, dùng để tải assets

export class PreloaderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloaderScene' });
    }

    preload() {
        // TODO: Tải tất cả assets cần thiết
        this.load.on('progress', (value) => {
            console.log('Loading progress:', value);
        });

        // TODO: Tải sprites, âm thanh, fonts...
        // this.load.image('player', 'assets/images/player.png');
        // this.load.audio('backgroundMusic', 'assets/audio/background.mp3');
    }

    create() {
        // TODO: Khởi tạo sau khi tải xong
        console.log('Assets loaded successfully');
        
        // TODO: Chuyển sang GameScene
        this.scene.start('GameScene');
    }
}
