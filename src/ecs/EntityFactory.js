// Factory để tạo các entity với hành vi khác nhau

import { Position } from './components/Position.js';
import { Velocity } from './components/Velocity.js';
import { Health } from './components/Health.js';
import { Behavior } from './components/Behavior.js';
import { Appearance } from './components/Appearance.js';
import { AI } from './components/AI.js';

export class EntityFactory {
    constructor(ecsWorld) {
        this.ecsWorld = ecsWorld;
    }

    // Tạo entity ngẫu nhiên
    createRandomEntity(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        this.ecsWorld.addComponent(entityId, 'appearance', new Appearance(
            this.getRandomColor(),
            Phaser.Math.Between(15, 30),
            this.getRandomShape()
        ));
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('random', {
            speed: Phaser.Math.Between(30, 80),
            reactionTime: Phaser.Math.Between(500, 1500)
        }));

        return entityId;
    }

    // Tạo entity tuần tra
    createPatrolEntity(x, y, patrolPoints) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        this.ecsWorld.addComponent(entityId, 'appearance', new Appearance(0x0066ff, 20, 'rectangle'));
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('patrol', { patrolPoints }));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('patrol', {
            speed: 60,
            patrolPoints: patrolPoints,
            reactionTime: 1000
        }));

        return entityId;
    }

    // Tạo entity đuổi theo
    createChaserEntity(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        this.ecsWorld.addComponent(entityId, 'appearance', new Appearance(0xff0000, 25, 'triangle'));
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('chase', {
            speed: 100,
            detectionRange: 150,
            reactionTime: 800
        }));

        return entityId;
    }

    // Tạo entity chạy trốn
    createFleeEntity(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        this.ecsWorld.addComponent(entityId, 'appearance', new Appearance(0xffff00, 18, 'circle'));
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('flee', {
            speed: 120,
            detectionRange: 100,
            reactionTime: 600
        }));

        return entityId;
    }

    // Tạo entity lang thang
    createWandererEntity(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        this.ecsWorld.addComponent(entityId, 'appearance', new Appearance(0x00ff00, 22, 'circle'));
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('wander', {
            speed: 50,
            interval: 2000
        }));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('wander', {
            speed: 50,
            reactionTime: 2000
        }));

        return entityId;
    }

    // Tạo entity tĩnh
    createStaticEntity(x, y) {
        const entityId = this.ecsWorld.createEntity();
        
        this.ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        this.ecsWorld.addComponent(entityId, 'velocity', new Velocity());
        this.ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        this.ecsWorld.addComponent(entityId, 'appearance', new Appearance(0x888888, 15, 'rectangle'));
        this.ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
        this.ecsWorld.addComponent(entityId, 'ai', new AI('random', {
            speed: 0,
            reactionTime: 5000
        }));

        return entityId;
    }

    getRandomColor() {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xff6600, 0x6600ff];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getRandomShape() {
        const shapes = ['circle', 'rectangle', 'triangle'];
        return shapes[Math.floor(Math.random() * shapes.length)];
    }
}
