// Demo Scene với nhiều entity có hành vi khác nhau
import { ECSWorld } from '../ecs/world.js';
import { MovementSystem } from '../ecs/systems/MovementSystem.js';
import { RenderSystem } from '../ecs/systems/RenderSystem.js';
import { BehaviorSystem } from '../ecs/systems/BehaviorSystem.js';
import { AISystem } from '../ecs/systems/AISystem.js';
import { EntityFactory } from '../ecs/EntityFactory.js';

export class DemoScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DemoScene' });
    }

    create() {
        console.log('DemoScene created');
        
        // Khởi tạo ECS World
        this.ecsWorld = new ECSWorld();
        
        // Đăng ký các system
        this.ecsWorld.addSystem(new MovementSystem());
        this.ecsWorld.addSystem(new RenderSystem(this));
        this.ecsWorld.addSystem(new BehaviorSystem(this));
        this.ecsWorld.addSystem(new AISystem(this));
        
        // Tạo EntityFactory
        this.entityFactory = new EntityFactory(this.ecsWorld);
        
        // Tạo các entity với hành vi khác nhau
        this.createEntities();
        
        // Tạo text hiển thị thông tin
        this.infoText = this.add.text(10, 10, 'Demo ECS - Nhiều entity với hành vi khác nhau', {
            fontSize: '16px',
            fill: '#ffffff'
        });
        
        // Tạo text hiển thị số lượng entity
        this.entityCountText = this.add.text(10, 40, '', {
            fontSize: '14px',
            fill: '#ffffff'
        });
        
        // Tạo text hướng dẫn
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const instructionText = isMobile 
            ? 'Chạm màn hình để tạo entity, double tap để reset'
            : 'Nhấn SPACE để tạo entity ngẫu nhiên, R để reset';
            
        this.instructionText = this.add.text(10, 70, instructionText, {
            fontSize: isMobile ? '14px' : '12px',
            fill: '#cccccc',
            wordWrap: { width: this.scale.gameSize.width - 20 }
        });
        
        // Thiết lập input
        this.setupInput();
    }

    createEntities() {
        // Tạo các entity với hành vi khác nhau
        const centerX = this.scale.gameSize.width / 2;
        const centerY = this.scale.gameSize.height / 2;
        const margin = 50;
        
        // Entity tuần tra - tối ưu cho màn hình ngang
        const patrolPoints = [
            { x: margin, y: margin },
            { x: this.scale.gameSize.width - margin, y: margin },
            { x: this.scale.gameSize.width - margin, y: this.scale.gameSize.height - margin },
            { x: margin, y: this.scale.gameSize.height - margin }
        ];
        this.entityFactory.createPatrolEntity(margin, margin, patrolPoints);
        
        // Entity đuổi theo
        this.entityFactory.createChaserEntity(centerX + 50, centerY);
        
        // Entity chạy trốn
        this.entityFactory.createFleeEntity(centerX - 50, centerY);
        
        // Entity lang thang
        this.entityFactory.createWandererEntity(centerX, centerY + 50);
        
        // Entity tĩnh
        this.entityFactory.createStaticEntity(centerX, centerY - 50);
        
        // Một vài entity ngẫu nhiên
        for (let i = 0; i < 3; i++) {
            const x = Phaser.Math.Between(margin, this.scale.gameSize.width - margin);
            const y = Phaser.Math.Between(margin, this.scale.gameSize.height - margin);
            this.entityFactory.createRandomEntity(x, y);
        }
    }

    setupInput() {
        // Nhấn SPACE để tạo entity ngẫu nhiên
        this.input.keyboard.on('keydown-SPACE', () => {
            this.createRandomEntity();
        });
        
        // Nhấn R để reset
        this.input.keyboard.on('keydown-R', () => {
            this.resetEntities();
        });
        
        // Hỗ trợ touch cho mobile
        this.input.on('pointerdown', (pointer) => {
            // Tạo entity mới tại vị trí chạm
            this.entityFactory.createRandomEntity(pointer.x, pointer.y);
            console.log('Tạo entity ngẫu nhiên mới tại vị trí chạm');
        });
        
        // Double tap để reset
        this.input.on('pointerdown', (pointer) => {
            if (pointer.downDuration < 200) { // Double tap nhanh
                this.resetEntities();
            }
        });
    }
    
    createRandomEntity() {
        const margin = 50;
        const x = Phaser.Math.Between(margin, this.scale.gameSize.width - margin);
        const y = Phaser.Math.Between(margin, this.scale.gameSize.height - margin);
        this.entityFactory.createRandomEntity(x, y);
        console.log('Tạo entity ngẫu nhiên mới');
    }
    
    resetEntities() {
        this.ecsWorld.entities.clear();
        this.createEntities();
        console.log('Reset tất cả entity');
    }

    update(time, delta) {
        // Cập nhật ECS World
        this.ecsWorld.update(delta);
        
        // Cập nhật text số lượng entity
        this.entityCountText.setText(`Số lượng entity: ${this.ecsWorld.entities.size}`);
    }
}
