// Scene gameplay chính
import { ECSWorld } from '../ecs/world.js';
import { WorldManager } from '../managers/WorldManager.js';
import { EventManager } from '../managers/EventManager.js';
import { MovementSystem } from '../ecs/systems/MovementSystem.js';
import { RenderSystem } from '../ecs/systems/RenderSystem.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // TODO: Khởi tạo game world
        console.log('GameScene created');
        
        // TODO: Tạo ECS World
        this.ecsWorld = new ECSWorld();
        
        // TODO: Khởi tạo các manager
        this.worldManager = new WorldManager();
        this.eventManager = new EventManager();
        
        // TODO: Đăng ký các systems
        this.ecsWorld.addSystem(new MovementSystem());
        this.ecsWorld.addSystem(new RenderSystem());
        
        // TODO: Tạo player entity
        this.playerId = this.ecsWorld.createEntity();
        this.ecsWorld.addComponent(this.playerId, 'position', { x: 100, y: 100 });
        this.ecsWorld.addComponent(this.playerId, 'velocity', { x: 0, y: 0 });
        this.ecsWorld.addComponent(this.playerId, 'health', { current: 100, maximum: 100 });
    }

    update(time, delta) {
        // TODO: Game loop chính
        // TODO: Cập nhật ECS systems
        this.ecsWorld.update(delta);
        this.eventManager.processEvents();
    }
}
