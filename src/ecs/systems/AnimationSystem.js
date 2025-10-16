// Animation System - Xử lý animations cho tất cả entities
export class AnimationSystem {
    constructor(animationManager) {
        this.animationManager = animationManager;
        this.lastUpdateTime = 0;
        this.updateInterval = 100; // Cập nhật animation mỗi 100ms (10 FPS)
    }
    
    update(deltaTime, entities) {
        this.lastUpdateTime += deltaTime;
        
        // Chỉ cập nhật animation theo interval để tối ưu performance
        if (this.lastUpdateTime < this.updateInterval) return;
        
        this.lastUpdateTime = 0;
        
        entities.forEach((components, entityId) => {
            const animation = components.get('animation');
            const behavior = components.get('behavior');
            const velocity = components.get('velocity');
            const health = components.get('health');
            const appearance = components.get('appearance');
            
            if (!animation) return;
            
            // Cập nhật animation dựa trên behavior và velocity
            this.updateEntityAnimation(entityId, animation, behavior, velocity, health, appearance);
        });
    }
    
    // ⭐ Cập nhật animation cho một entity
    updateEntityAnimation(entityId, animation, behavior, velocity, health, appearance) {
        // Xác định animation cần chạy
        const targetAnimation = this.determineTargetAnimation(behavior, health);
        const targetDirection = this.determineTargetDirection(velocity);
        
        // Kiểm tra có cần thay đổi animation không
        const needsChange = this.shouldChangeAnimation(
            animation, 
            targetAnimation, 
            targetDirection, 
            behavior, 
            velocity
        );
        
        if (needsChange) {
            this.changeAnimation(entityId, animation, targetAnimation, targetDirection);
        }
        
        // Cập nhật trạng thái
        animation.updateState(behavior?.current || 'idle', velocity);
    }
    
    // ⭐ Xác định animation cần chạy dựa trên behavior và health
    determineTargetAnimation(behavior, health) {
        // Nếu chết
        if (health && health.current <= 0) {
            return 'die';
        }
        
        // Dựa trên behavior
        if (!behavior) return 'idle';
        
        switch (behavior.current) {
            case 'idle':
                return 'idle';
            case 'followPath':
            case 'chase':
            case 'wander':
            case 'patrol':
                return 'move';
            case 'attack':
                return 'attack';
            case 'harvest':
                return 'harvest';
            case 'defence':
                return 'idle'; // Defence = đứng yên
            default:
                return 'idle';
        }
    }
    
    // ⭐ Xác định hướng dựa trên velocity
    determineTargetDirection(velocity) {
        if (!velocity || (velocity.x === 0 && velocity.y === 0)) {
            return 'down'; // Mặc định
        }
        
        const absX = Math.abs(velocity.x);
        const absY = Math.abs(velocity.y);
        
        // Ưu tiên hướng có velocity lớn hơn
        if (absX > absY) {
            return velocity.x > 0 ? 'right' : 'left';
        } else {
            return velocity.y > 0 ? 'down' : 'up';
        }
    }
    
    // ⭐ Kiểm tra có cần thay đổi animation không
    shouldChangeAnimation(animation, targetAnimation, targetDirection, behavior, velocity) {
        // Nếu animation hiện tại không thể bị gián đoạn và đang chạy
        if (animation.isPlaying && !animation.canInterrupt()) {
            return false;
        }
        
        // Nếu animation khác nhau
        if (animation.currentAnimation !== targetAnimation) {
            return true;
        }
        
        // Nếu hướng khác nhau (chỉ cho move và attack)
        if (targetAnimation === 'move' || targetAnimation === 'attack') {
            if (animation.currentDirection !== targetDirection) {
                return true;
            }
        }
        
        // Nếu behavior thay đổi
        if (behavior && animation.hasBehaviorChanged(behavior.current)) {
            return true;
        }
        
        // Nếu velocity thay đổi (chỉ cho move)
        if (targetAnimation === 'move' && velocity && animation.hasVelocityChanged(velocity)) {
            return true;
        }
        
        return false;
    }
    
    // ⭐ Thay đổi animation
    changeAnimation(entityId, animation, targetAnimation, targetDirection) {
        // Kiểm tra priority
        if (animation.isPlaying && !animation.hasHigherPriority(targetAnimation)) {
            // Animation hiện tại có priority cao hơn, thêm vào queue
            animation.queueAnimation(targetAnimation, targetDirection);
            return;
        }
        
        // Thay đổi animation
        const success = animation.setAnimation(targetAnimation, targetDirection);
        
        if (success) {
            // Thông báo cho AnimationManager
            this.animationManager.updateAnimation(
                entityId, 
                targetAnimation, 
                { x: 0, y: 0 }, // Velocity sẽ được cập nhật sau
                null // Health sẽ được cập nhật sau
            );
            
            console.log(`🎬 Entity ${entityId}: ${animation.currentAnimation} (${animation.currentDirection})`);
        }
    }
    
    // ⭐ Xử lý animation queue
    processAnimationQueue(entityId, animation) {
        if (animation.animationQueue.length === 0) return;
        
        // Nếu animation hiện tại đã xong, chạy animation tiếp theo
        if (!animation.isPlaying) {
            const nextAnimation = animation.getNextQueuedAnimation();
            if (nextAnimation) {
                this.changeAnimation(
                    entityId, 
                    animation, 
                    nextAnimation.animation, 
                    nextAnimation.direction
                );
            }
        }
    }
    
    // ⭐ Dừng tất cả animations của entity
    stopEntityAnimation(entityId, animation) {
        animation.stopAnimation();
        animation.clearQueue();
        this.animationManager.stopAnimation(entityId);
    }
    
    // ⭐ Force chạy animation (bỏ qua priority)
    forceAnimation(entityId, animation, animationName, direction = 'down') {
        animation.setAnimation(animationName, direction);
        this.animationManager.updateAnimation(entityId, animationName, { x: 0, y: 0 }, null);
        console.log(`🎬 Force animation: ${animationName} (${direction}) for entity ${entityId}`);
    }
    
    // ⭐ Lấy thông tin animation của entity
    getEntityAnimationInfo(entityId) {
        const animation = this.animationManager.getAnimationState(entityId);
        return animation ? animation.getCurrentAnimationInfo() : null;
    }
    
    // ⭐ Kiểm tra animation có đang chạy không
    isAnimationPlaying(entityId, animationName) {
        return this.animationManager.isAnimationPlaying(entityId, animationName);
    }
    
    // ⭐ Cleanup khi entity bị xóa
    cleanupEntity(entityId) {
        this.animationManager.removeAnimationState(entityId);
    }
}
