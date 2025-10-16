// Component để quản lý phản ứng chiến đấu khi bị tấn công
export class CombatResponse {
    constructor(config = {}) {
        this.autoRetaliate = config.autoRetaliate !== false; // Mặc định bật tự đánh trả
        this.chaseRange = config.chaseRange || 200; // Tầm đuổi theo (pixels)
        this.maxChaseDistance = config.maxChaseDistance || 300; // Khoảng cách tối đa được phép đuổi theo
        this.retreatDistance = config.retreatDistance || 150; // Khoảng cách rút lui cho defence/patrol
        
        // Trạng thái
        this.isBeingAttacked = false;
        this.attackerId = null;
        this.originalBehavior = null; // Lưu hành vi gốc trước khi bị tấn công
        this.originalTarget = null; // Lưu mục tiêu gốc
        this.chaseStartPosition = null; // Vị trí bắt đầu đuổi theo
        this.lastAttackTime = 0;
    }
    
    // Bắt đầu bị tấn công
    startBeingAttacked(attackerId, currentBehavior, currentTarget) {
        if (!this.autoRetaliate) return;
        
        this.isBeingAttacked = true;
        this.attackerId = attackerId;
        this.originalBehavior = currentBehavior;
        this.originalTarget = currentTarget;
        this.lastAttackTime = Date.now();
        
        console.log(`⚔️ Unit bị tấn công bởi ${attackerId}, chuyển sang chế độ đánh trả`);
    }
    
    // Kết thúc bị tấn công
    stopBeingAttacked() {
        this.isBeingAttacked = false;
        this.attackerId = null;
        this.originalBehavior = null;
        this.originalTarget = null;
        this.chaseStartPosition = null;
    }
    
    // Kiểm tra xem có nên tiếp tục đuổi theo không
    shouldContinueChase(currentPosition, attackerPosition, currentBehavior) {
        if (!this.isBeingAttacked || !this.chaseStartPosition) return false;
        
        // Nếu đang ở chế độ defence hoặc patrol, kiểm tra khoảng cách từ vị trí gốc
        if (currentBehavior === 'defence' || currentBehavior === 'patrol') {
            const distanceFromStart = this.getDistance(currentPosition, this.chaseStartPosition);
            if (distanceFromStart > this.retreatDistance) {
                console.log(`🛡️ Unit rời khỏi vị trí quá xa (${distanceFromStart.toFixed(0)}px), dừng đuổi theo`);
                return false;
            }
        }
        
        // Kiểm tra khoảng cách tối đa được phép đuổi theo từ vị trí gốc
        const chaseDistance = this.getDistance(currentPosition, this.chaseStartPosition);
        if (chaseDistance > this.maxChaseDistance) {
            console.log(`🏃 Unit đuổi theo quá xa (${chaseDistance.toFixed(0)}px), dừng đuổi theo`);
            return false;
        }
        
        // ⭐ KHÔNG kiểm tra chaseRange ở đây - để unit có thể đuổi theo từ xa
        // chaseRange sẽ được kiểm tra trong shouldReturnToOriginalBehavior sau khi đã đuổi theo một lúc
        
        return true;
    }
    
    // Kiểm tra xem có nên quay về hành vi gốc không
    shouldReturnToOriginalBehavior(currentPosition, attackerPosition) {
        if (!this.isBeingAttacked) return true;
        
        // Nếu kẻ thù đã chết hoặc biến mất
        if (!attackerPosition) return true;
        
        // ⭐ CHỈ kiểm tra chaseRange sau khi đã đuổi theo một lúc (3 giây)
        // Điều này cho phép unit BẮT ĐẦU đuổi theo kẻ thù từ xa
        const chaseDuration = Date.now() - this.lastAttackTime;
        if (chaseDuration > 3000) {
            // Sau 3 giây, kiểm tra xem kẻ thù có ra khỏi tầm không
            const distanceToAttacker = this.getDistance(currentPosition, attackerPosition);
            if (distanceToAttacker > this.chaseRange) {
                console.log(`🎯 Kẻ thù ra khỏi tầm đuổi theo sau 3s (${distanceToAttacker.toFixed(0)}px), dừng đuổi theo`);
                return true;
            }
        }
        
        // Nếu đã đuổi theo quá lâu (10 giây)
        if (chaseDuration > 10000) {
            console.log(`⏰ Đuổi theo quá lâu (10s), dừng đuổi theo`);
            return true;
        }
        
        return false;
    }
    
    // Tính khoảng cách giữa 2 điểm
    getDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // Cập nhật vị trí bắt đầu đuổi theo
    setChaseStartPosition(position) {
        if (!this.chaseStartPosition) {
            this.chaseStartPosition = { x: position.x, y: position.y };
        }
    }
    
    // Lấy hành vi gốc để quay về
    getOriginalBehavior() {
        return this.originalBehavior;
    }
    
    // Lấy mục tiêu gốc để quay về
    getOriginalTarget() {
        return this.originalTarget;
    }
}
