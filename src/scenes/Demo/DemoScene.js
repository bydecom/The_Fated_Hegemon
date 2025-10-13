// Demo Scene với nhiều entity có hành vi khác nhau
import { ECSWorld } from '../ecs/world.js';
import { MovementSystem } from '../ecs/systems/MovementSystem.js';
import { RenderSystem } from '../ecs/systems/RenderSystem.js';
import { BehaviorSystem } from '../ecs/systems/BehaviorSystem.js';
import { AISystem } from '../ecs/systems/AISystem.js';
import { EntityFactory } from '../ecs/EntityFactory.js';
import { Position } from '../ecs/components/Position.js';
import { Velocity } from '../ecs/components/Velocity.js';
import { Health } from '../ecs/components/Health.js';
import { Behavior } from '../ecs/components/Behavior.js';
import { Appearance } from '../ecs/components/Appearance.js';
import { AI } from '../ecs/components/AI.js';

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
        this.infoText = this.add.text(10, 10, 'Demo ECS - 100 Entity Di Chuyển Liên Tục', {
            fontSize: '16px',
            fill: '#ffffff'
        });
        
        // Tạo text hiển thị số lượng entity
        this.entityCountText = this.add.text(10, 40, '', {
            fontSize: '14px',
            fill: '#ffffff'
        });
        
        // Tạo text hiển thị FPS
        this.fpsText = this.add.text(10, 60, '', {
            fontSize: '12px',
            fill: '#ffff00'
        });
        
        // Tạo text hướng dẫn
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const instructionText = isMobile 
            ? 'Chạm màn hình để tạo entity, double tap để reset'
            : 'Nhấn SPACE để tạo entity ngẫu nhiên, R để reset';
            
        this.instructionText = this.add.text(10, 80, instructionText, {
            fontSize: isMobile ? '14px' : '12px',
            fill: '#cccccc',
            wordWrap: { width: this.scale.gameSize.width - 20 }
        });
        
        // Thiết lập input
        this.setupInput();
    }

    createEntities() {
        // Tạo 100 entity di chuyển liên tục
        const margin = 30;
        const screenWidth = this.scale.gameSize.width;
        const screenHeight = this.scale.gameSize.height;
        
        console.log('Đang tạo 100 entity...');
        
        // Tạo 100 entity ngẫu nhiên với các hành vi khác nhau
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(margin, screenWidth - margin);
            const y = Phaser.Math.Between(margin, screenHeight - margin);
            
            // Phân bố các loại entity
            const entityType = Phaser.Math.Between(1, 100);
            
            if (entityType <= 40) {
                // 40% - Entity lang thang (màu xanh lá)
                this.createWandererEntity(x, y);
            } else if (entityType <= 70) {
                // 30% - Entity ngẫu nhiên (màu sắc ngẫu nhiên)
                this.createRandomEntity(x, y);
            } else if (entityType <= 85) {
                // 15% - Entity đuổi theo (màu đỏ)
                this.createChaserEntity(x, y);
            } else if (entityType <= 95) {
                // 10% - Entity chạy trốn (màu vàng)
                this.createFleeEntity(x, y);
            } else {
                // 5% - Entity tĩnh (màu xám)
                this.createStaticEntity(x, y);
            }
        }
        
        console.log(`Đã tạo ${this.ecsWorld.entities.size} entity`);
    }
    
    createWandererEntity(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        this.ecsWorld.addComponent(entityId, 'appearance', new Appearance(0x00ff00, 8, 'circle'));
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('wander', {
            speed: Phaser.Math.Between(30, 80),
            interval: Phaser.Math.Between(1000, 3000)
        }));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('wander', {
            speed: Phaser.Math.Between(30, 80),
            reactionTime: Phaser.Math.Between(1000, 3000)
        }));
        
        return entityId;
    }
    
    createRandomEntity(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        this.ecsWorld.addComponent(entityId, 'appearance', new Appearance(
            this.getRandomColor(),
            Phaser.Math.Between(6, 12),
            this.getRandomShape()
        ));
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('random', {
            speed: Phaser.Math.Between(20, 60),
            reactionTime: Phaser.Math.Between(500, 2000)
        }));
        
        return entityId;
    }
    
    createChaserEntity(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        this.ecsWorld.addComponent(entityId, 'appearance', new Appearance(0xff0000, 10, 'triangle'));
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('chase', {
            speed: Phaser.Math.Between(60, 120),
            detectionRange: Phaser.Math.Between(80, 150),
            reactionTime: Phaser.Math.Between(300, 800)
        }));
        
        return entityId;
    }
    
    createFleeEntity(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        this.ecsWorld.addComponent(entityId, 'appearance', new Appearance(0xffff00, 8, 'circle'));
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('flee', {
            speed: Phaser.Math.Between(80, 150),
            detectionRange: Phaser.Math.Between(60, 120),
            reactionTime: Phaser.Math.Between(200, 600)
        }));
        
        return entityId;
    }
    
    createStaticEntity(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        this.ecsWorld.addComponent(entityId, 'appearance', new Appearance(0x888888, 6, 'rectangle'));
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('random', {
            speed: 0,
            reactionTime: 5000
        }));
        
        return entityId;
    }
    
    getRandomColor() {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff6600, 0x6600ff, 0xff3366, 0x33ff66];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getRandomShape() {
        const shapes = ['circle', 'rectangle', 'triangle'];
        return shapes[Math.floor(Math.random() * shapes.length)];
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
        
        // Cập nhật text FPS
        const fps = Math.round(1000 / delta);
        this.fpsText.setText(`FPS: ${fps}`);
        
        // Thay đổi màu FPS dựa trên hiệu suất
        if (fps < 30) {
            this.fpsText.setFill('#ff0000'); // Đỏ nếu FPS thấp
        } else if (fps < 45) {
            this.fpsText.setFill('#ffaa00'); // Cam nếu FPS trung bình
        } else {
            this.fpsText.setFill('#00ff00'); // Xanh nếu FPS tốt
        }
    }
}
