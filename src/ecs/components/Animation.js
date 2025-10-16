// Animation Component - Lưu trữ thông tin animation của entity
export class Animation {
    constructor(unitType = 'soldier', currentAnimation = 'idle', currentDirection = 'down') {
        this.unitType = unitType;           // Loại đơn vị (soldier, archer, harvester, etc.)
        this.currentAnimation = currentAnimation;  // Animation hiện tại
        this.currentDirection = currentDirection;  // Hướng hiện tại
        this.isPlaying = false;             // Có đang chạy animation không
        this.animationSpeed = 1.0;          // Tốc độ animation (1.0 = bình thường)
        this.lastBehavior = 'idle';         // Behavior trước đó (để detect thay đổi)
        this.lastVelocity = { x: 0, y: 0 }; // Velocity trước đó
        
        // Animation states
        this.states = {
            idle: { priority: 1, interruptible: true },
            move: { priority: 2, interruptible: true },
            attack: { priority: 3, interruptible: false },
            harvest: { priority: 2, interruptible: true },
            die: { priority: 4, interruptible: false }
        };
        
        // Animation queue (cho các animation không thể bị gián đoạn)
        this.animationQueue = [];
    }
    
    // ⭐ Set animation mới
    setAnimation(animationName, direction = null) {
        // Nếu animation hiện tại không thể bị gián đoạn, thêm vào queue
        if (this.isPlaying && !this.canInterrupt()) {
            this.animationQueue.push({ animation: animationName, direction: direction });
            return false; // Không thể chạy ngay
        }
        
        this.currentAnimation = animationName;
        if (direction) {
            this.currentDirection = direction;
        }
        this.isPlaying = true;
        return true; // Có thể chạy ngay
    }
    
    // ⭐ Kiểm tra có thể gián đoạn animation hiện tại không
    canInterrupt() {
        const currentState = this.states[this.currentAnimation];
        return currentState ? currentState.interruptible : true;
    }
    
    // ⭐ Dừng animation
    stopAnimation() {
        this.isPlaying = false;
    }
    
    // ⭐ Lấy animation tiếp theo từ queue
    getNextQueuedAnimation() {
        if (this.animationQueue.length > 0) {
            return this.animationQueue.shift();
        }
        return null;
    }
    
    // ⭐ Thêm animation vào queue
    queueAnimation(animationName, direction = null) {
        this.animationQueue.push({ animation: animationName, direction: direction });
    }
    
    // ⭐ Xóa tất cả animation trong queue
    clearQueue() {
        this.animationQueue = [];
    }
    
    // ⭐ Set tốc độ animation
    setAnimationSpeed(speed) {
        this.animationSpeed = Math.max(0.1, Math.min(3.0, speed)); // Giới hạn từ 0.1x đến 3x
    }
    
    // ⭐ Lấy priority của animation
    getPriority(animationName) {
        const state = this.states[animationName];
        return state ? state.priority : 1;
    }
    
    // ⭐ So sánh priority (animation nào quan trọng hơn)
    hasHigherPriority(animationName) {
        return this.getPriority(animationName) > this.getPriority(this.currentAnimation);
    }
    
    // ⭐ Cập nhật behavior và velocity (để detect thay đổi)
    updateState(behavior, velocity) {
        this.lastBehavior = behavior;
        this.lastVelocity = velocity ? { x: velocity.x, y: velocity.y } : { x: 0, y: 0 };
    }
    
    // ⭐ Kiểm tra có thay đổi behavior không
    hasBehaviorChanged(newBehavior) {
        return this.lastBehavior !== newBehavior;
    }
    
    // ⭐ Kiểm tra có thay đổi velocity không
    hasVelocityChanged(newVelocity) {
        if (!newVelocity) return this.lastVelocity.x !== 0 || this.lastVelocity.y !== 0;
        return this.lastVelocity.x !== newVelocity.x || this.lastVelocity.y !== newVelocity.y;
    }
    
    // ⭐ Lấy thông tin animation hiện tại
    getCurrentAnimationInfo() {
        return {
            animation: this.currentAnimation,
            direction: this.currentDirection,
            isPlaying: this.isPlaying,
            speed: this.animationSpeed,
            canInterrupt: this.canInterrupt(),
            queueLength: this.animationQueue.length
        };
    }
    
    // ⭐ Clone animation state (để backup/restore)
    clone() {
        const cloned = new Animation(this.unitType, this.currentAnimation, this.currentDirection);
        cloned.isPlaying = this.isPlaying;
        cloned.animationSpeed = this.animationSpeed;
        cloned.lastBehavior = this.lastBehavior;
        cloned.lastVelocity = { ...this.lastVelocity };
        cloned.animationQueue = [...this.animationQueue];
        return cloned;
    }
}
