// Animation Manager - Quản lý tất cả animations của game
export class AnimationManager {
    constructor(scene) {
        this.scene = scene;
        this.animations = new Map(); // entityId -> AnimationState
        this.animationConfigs = new Map(); // unitType -> AnimationConfig
        this.loadAnimationConfigs();
    }
    
    // ⭐ Load animation configs từ JSON hoặc hardcode
    loadAnimationConfigs() {
        // Config cho Soldier
        this.animationConfigs.set('soldier', {
            idle: {
                frames: 4,
                frameRate: 8,
                repeat: -1, // Loop vô hạn
                key: 'soldier_idle'
            },
            move: {
                frames: 8,
                frameRate: 12,
                repeat: -1,
                key: 'soldier_move',
                directions: ['up', 'down', 'left', 'right']
            },
            attack: {
                frames: 6,
                frameRate: 15,
                repeat: 0, // Chạy 1 lần
                key: 'soldier_attack',
                directions: ['up', 'down', 'left', 'right']
            },
            die: {
                frames: 5,
                frameRate: 10,
                repeat: 0,
                key: 'soldier_die'
            }
        });
        
        // Config cho Archer
        this.animationConfigs.set('archer', {
            idle: {
                frames: 3,
                frameRate: 6,
                repeat: -1,
                key: 'archer_idle'
            },
            move: {
                frames: 6,
                frameRate: 10,
                repeat: -1,
                key: 'archer_move',
                directions: ['up', 'down', 'left', 'right']
            },
            attack: {
                frames: 8,
                frameRate: 18,
                repeat: 0,
                key: 'archer_attack',
                directions: ['up', 'down', 'left', 'right']
            },
            die: {
                frames: 4,
                frameRate: 8,
                repeat: 0,
                key: 'archer_die'
            }
        });
        
        // Config cho Harvester
        this.animationConfigs.set('harvester', {
            idle: {
                frames: 2,
                frameRate: 4,
                repeat: -1,
                key: 'harvester_idle'
            },
            move: {
                frames: 6,
                frameRate: 10,
                repeat: -1,
                key: 'harvester_move',
                directions: ['up', 'down', 'left', 'right']
            },
            harvest: {
                frames: 4,
                frameRate: 8,
                repeat: -1,
                key: 'harvester_harvest'
            },
            die: {
                frames: 3,
                frameRate: 6,
                repeat: 0,
                key: 'harvester_die'
            }
        });
    }
    
    // ⭐ Tạo animation state cho entity
    createAnimationState(entityId, unitType, appearance) {
        const config = this.animationConfigs.get(unitType);
        if (!config) {
            console.warn(`No animation config found for unit type: ${unitType}`);
            return null;
        }
        
        const animationState = {
            entityId: entityId,
            unitType: unitType,
            currentAnimation: 'idle',
            currentDirection: 'down',
            isPlaying: false,
            config: config,
            appearance: appearance,
            lastBehavior: 'idle',
            lastVelocity: { x: 0, y: 0 }
        };
        
        this.animations.set(entityId, animationState);
        return animationState;
    }
    
    // ⭐ Cập nhật animation dựa trên behavior và velocity
    updateAnimation(entityId, behavior, velocity, health) {
        const animationState = this.animations.get(entityId);
        if (!animationState) return;
        
        // Xác định animation cần chạy
        let targetAnimation = this.determineAnimation(behavior, health);
        let targetDirection = this.determineDirection(velocity);
        
        // Kiểm tra xem có cần thay đổi animation không
        const needsChange = (
            animationState.currentAnimation !== targetAnimation ||
            animationState.currentDirection !== targetDirection ||
            !animationState.isPlaying
        );
        
        if (needsChange) {
            this.playAnimation(entityId, targetAnimation, targetDirection);
        }
        
        // Lưu trạng thái hiện tại
        animationState.lastBehavior = behavior;
        animationState.lastVelocity = velocity ? { x: velocity.x, y: velocity.y } : { x: 0, y: 0 };
    }
    
    // ⭐ Xác định animation dựa trên behavior
    determineAnimation(behavior, health) {
        // Nếu chết
        if (health && health.current <= 0) {
            return 'die';
        }
        
        // Dựa trên behavior
        switch (behavior) {
            case 'idle':
                return 'idle';
            case 'followPath':
            case 'chase':
            case 'wander':
                return 'move';
            case 'attack':
            case 'chase':
                return 'attack';
            case 'harvest':
                return 'harvest';
            default:
                return 'idle';
        }
    }
    
    // ⭐ Xác định hướng dựa trên velocity
    determineDirection(velocity) {
        if (!velocity || (velocity.x === 0 && velocity.y === 0)) {
            return 'down'; // Mặc định
        }
        
        const absX = Math.abs(velocity.x);
        const absY = Math.abs(velocity.y);
        
        if (absX > absY) {
            return velocity.x > 0 ? 'right' : 'left';
        } else {
            return velocity.y > 0 ? 'down' : 'up';
        }
    }
    
    // ⭐ Chạy animation
    playAnimation(entityId, animationName, direction = 'down') {
        const animationState = this.animations.get(entityId);
        if (!animationState) return;
        
        const config = animationState.config[animationName];
        if (!config) {
            console.warn(`Animation ${animationName} not found for unit type ${animationState.unitType}`);
            return;
        }
        
        // Cập nhật trạng thái
        animationState.currentAnimation = animationName;
        animationState.currentDirection = direction;
        animationState.isPlaying = true;
        
        // Tạo key cho animation (bao gồm direction nếu cần)
        let animationKey = config.key;
        if (config.directions && config.directions.includes(direction)) {
            animationKey += `_${direction}`;
        }
        
        // Tạo animation nếu chưa có
        if (!this.scene.anims.exists(animationKey)) {
            this.createAnimation(animationKey, config, direction);
        }
        
        // Chạy animation trên container
        const container = this.scene.renderSystem?.containers?.get(entityId);
        if (container && container.body) {
            container.body.play(animationKey);
        }
        
        console.log(`🎬 Playing ${animationKey} for entity ${entityId}`);
    }
    
    // ⭐ Tạo animation từ config
    createAnimation(animationKey, config, direction) {
        // Tạo texture key từ animation key
        const textureKey = this.getTextureKey(animationKey);
        
        // Tạo frames từ texture (giả sử có sprite sheet)
        const frames = this.scene.anims.generateFrameNumbers(textureKey, {
            start: 0,
            end: config.frames - 1
        });
        
        // Tạo animation
        this.scene.anims.create({
            key: animationKey,
            frames: frames,
            frameRate: config.frameRate,
            repeat: config.repeat
        });
        
        console.log(`🎞️ Created animation: ${animationKey} (${config.frames} frames, ${config.frameRate} fps)`);
    }
    
    // ⭐ Lấy texture key từ animation key
    getTextureKey(animationKey) {
        // Tạm thời return texture key mặc định
        // Trong thực tế, bạn sẽ load texture từ file
        return 'soldier_sprite'; // Placeholder
    }
    
    // ⭐ Dừng animation
    stopAnimation(entityId) {
        const animationState = this.animations.get(entityId);
        if (!animationState) return;
        
        animationState.isPlaying = false;
        
        const container = this.scene.renderSystem?.containers?.get(entityId);
        if (container && container.body) {
            container.body.stop();
        }
    }
    
    // ⭐ Xóa animation state
    removeAnimationState(entityId) {
        this.stopAnimation(entityId);
        this.animations.delete(entityId);
    }
    
    // ⭐ Lấy animation state
    getAnimationState(entityId) {
        return this.animations.get(entityId);
    }
    
    // ⭐ Kiểm tra animation có đang chạy không
    isAnimationPlaying(entityId, animationName) {
        const state = this.animations.get(entityId);
        return state && state.isPlaying && state.currentAnimation === animationName;
    }
    
    // ⭐ Lấy danh sách tất cả animation configs
    getAllConfigs() {
        return this.animationConfigs;
    }
    
    // ⭐ Thêm animation config mới
    addAnimationConfig(unitType, config) {
        this.animationConfigs.set(unitType, config);
        console.log(`📝 Added animation config for ${unitType}`);
    }
}
