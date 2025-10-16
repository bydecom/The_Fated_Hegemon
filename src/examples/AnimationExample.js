// Ví dụ sử dụng hệ thống Animation
// File này minh họa cách sử dụng AnimationSystem trong thực tế

import { AnimationManager } from '../managers/AnimationManager.js';
import { AnimationSystem } from '../ecs/systems/AnimationSystem.js';
import { Animation } from '../ecs/components/Animation.js';

export class AnimationExample {
    constructor(scene) {
        this.scene = scene;
        this.animationManager = new AnimationManager(scene);
        this.animationSystem = new AnimationSystem(this.animationManager);
    }
    
    // ⭐ Ví dụ 1: Tạo entity với animation
    createAnimatedSoldier(x, y) {
        const entityId = this.scene.ecsWorld.createEntity();
        
        // Thêm các components cơ bản
        this.scene.ecsWorld.addComponent(entityId, 'position', { x, y });
        this.scene.ecsWorld.addComponent(entityId, 'velocity', { x: 0, y: 0 });
        this.scene.ecsWorld.addComponent(entityId, 'behavior', { current: 'idle' });
        this.scene.ecsWorld.addComponent(entityId, 'health', { current: 100, maximum: 100 });
        
        // ⭐ Thêm Animation component
        const animation = new Animation('soldier', 'idle', 'down');
        this.scene.ecsWorld.addComponent(entityId, 'animation', animation);
        
        // Tạo animation state trong manager
        this.animationManager.createAnimationState(entityId, 'soldier', {});
        
        console.log(`🎬 Created animated soldier at (${x}, ${y})`);
        return entityId;
    }
    
    // ⭐ Ví dụ 2: Thay đổi animation thủ công
    makeSoldierAttack(entityId) {
        const animation = this.scene.ecsWorld.entities.get(entityId)?.get('animation');
        if (!animation) return;
        
        // Force animation attack (bỏ qua priority)
        this.animationSystem.forceAnimation(entityId, animation, 'attack', 'right');
        console.log(`⚔️ Soldier ${entityId} is attacking!`);
    }
    
    // ⭐ Ví dụ 3: Di chuyển với animation
    makeSoldierMove(entityId, direction) {
        const animation = this.scene.ecsWorld.entities.get(entityId)?.get('animation');
        const velocity = this.scene.ecsWorld.entities.get(entityId)?.get('velocity');
        
        if (!animation || !velocity) return;
        
        // Set velocity để trigger move animation
        switch (direction) {
            case 'up':
                velocity.x = 0;
                velocity.y = -50;
                break;
            case 'down':
                velocity.x = 0;
                velocity.y = 50;
                break;
            case 'left':
                velocity.x = -50;
                velocity.y = 0;
                break;
            case 'right':
                velocity.x = 50;
                velocity.y = 0;
                break;
        }
        
        // Cập nhật behavior
        const behavior = this.scene.ecsWorld.entities.get(entityId)?.get('behavior');
        if (behavior) {
            behavior.current = 'followPath';
        }
        
        console.log(`🚶 Soldier ${entityId} moving ${direction}`);
    }
    
    // ⭐ Ví dụ 4: Dừng animation
    stopSoldierAnimation(entityId) {
        const animation = this.scene.ecsWorld.entities.get(entityId)?.get('animation');
        if (!animation) return;
        
        this.animationSystem.stopEntityAnimation(entityId, animation);
        console.log(`🛑 Stopped animation for soldier ${entityId}`);
    }
    
    // ⭐ Ví dụ 5: Kiểm tra trạng thái animation
    checkSoldierAnimation(entityId) {
        const animInfo = this.animationSystem.getEntityAnimationInfo(entityId);
        if (animInfo) {
            console.log(`📊 Soldier ${entityId} animation info:`, animInfo);
            return animInfo;
        }
        return null;
    }
    
    // ⭐ Ví dụ 6: Thêm animation vào queue
    queueSoldierAnimations(entityId) {
        const animation = this.scene.ecsWorld.entities.get(entityId)?.get('animation');
        if (!animation) return;
        
        // Thêm nhiều animations vào queue
        animation.queueAnimation('attack', 'right');
        animation.queueAnimation('move', 'down');
        animation.queueAnimation('attack', 'left');
        
        console.log(`📋 Queued 3 animations for soldier ${entityId}`);
        console.log(`Queue length: ${animation.animationQueue.length}`);
    }
    
    // ⭐ Ví dụ 7: Tạo custom animation config
    addCustomAnimationConfig() {
        const customConfig = {
            idle: {
                frames: 2,
                frameRate: 4,
                repeat: -1,
                key: 'custom_idle'
            },
            move: {
                frames: 4,
                frameRate: 8,
                repeat: -1,
                key: 'custom_move',
                directions: ['up', 'down', 'left', 'right']
            },
            special: {
                frames: 10,
                frameRate: 20,
                repeat: 0,
                key: 'custom_special'
            }
        };
        
        this.animationManager.addAnimationConfig('custom', customConfig);
        console.log(`✨ Added custom animation config`);
    }
    
    // ⭐ Ví dụ 8: Demo hoàn chỉnh
    runAnimationDemo() {
        console.log('🎬 Starting Animation Demo...');
        
        // Tạo soldiers
        const soldier1 = this.createAnimatedSoldier(100, 100);
        const soldier2 = this.createAnimatedSoldier(200, 100);
        
        // Demo 1: Idle animation (mặc định)
        console.log('Demo 1: Idle animations');
        this.checkSoldierAnimation(soldier1);
        
        // Demo 2: Move animations
        console.log('Demo 2: Move animations');
        setTimeout(() => {
            this.makeSoldierMove(soldier1, 'right');
            this.makeSoldierMove(soldier2, 'down');
        }, 1000);
        
        // Demo 3: Attack animations
        console.log('Demo 3: Attack animations');
        setTimeout(() => {
            this.makeSoldierAttack(soldier1);
        }, 3000);
        
        // Demo 4: Animation queue
        console.log('Demo 4: Animation queue');
        setTimeout(() => {
            this.queueSoldierAnimations(soldier2);
        }, 5000);
        
        // Demo 5: Stop animations
        console.log('Demo 5: Stop animations');
        setTimeout(() => {
            this.stopSoldierAnimation(soldier1);
            this.stopSoldierAnimation(soldier2);
        }, 8000);
        
        console.log('🎬 Animation Demo completed!');
    }
    
    // ⭐ Ví dụ 9: Tích hợp với ECS World
    integrateWithECS(ecsWorld) {
        // Thêm AnimationSystem vào ECS World
        ecsWorld.addSystem(this.animationSystem);
        
        // Cập nhật animation mỗi frame
        const originalUpdate = ecsWorld.update.bind(ecsWorld);
        ecsWorld.update = (deltaTime) => {
            originalUpdate(deltaTime);
            // AnimationSystem sẽ tự động cập nhật
        };
        
        console.log('🔗 Animation system integrated with ECS World');
    }
    
    // ⭐ Ví dụ 10: Debug animation system
    debugAnimationSystem() {
        console.log('🐛 Animation System Debug Info:');
        
        // Lấy tất cả configs
        const configs = this.animationManager.getAllConfigs();
        console.log('Available animation configs:', Array.from(configs.keys()));
        
        // Lấy tất cả animation states
        const states = this.animationManager.animations;
        console.log('Active animation states:', states.size);
        
        states.forEach((state, entityId) => {
            console.log(`Entity ${entityId}:`, {
                unitType: state.unitType,
                currentAnimation: state.currentAnimation,
                currentDirection: state.currentDirection,
                isPlaying: state.isPlaying
            });
        });
    }
}

// ⭐ Export để sử dụng trong DemoScene
export default AnimationExample;
