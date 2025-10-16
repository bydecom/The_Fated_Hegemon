// Component cho Attack-Move command (di chuyển + auto-attack enemies trên đường đi)

export class AttackMoveTarget {
    constructor(destinationX, destinationY) {
        this.destinationX = destinationX;
        this.destinationY = destinationY;
        this.isAttackMove = true; // Flag để phân biệt với move command thông thường
        
        // Tracking state
        this.hasEngaged = false; // Đã engage enemy chưa
        this.originalTargetId = null; // ID của enemy đang attack (nếu có)
    }
    
    // Đặt lại về destination ban đầu (sau khi kill enemy)
    resetToDestination() {
        this.hasEngaged = false;
        this.originalTargetId = null;
    }
    
    // Engage một enemy
    engageEnemy(enemyId) {
        this.hasEngaged = true;
        this.originalTargetId = enemyId;
    }
    
    // Kiểm tra đã đến đích chưa
    isAtDestination(x, y, threshold = 10) {
        const dx = this.destinationX - x;
        const dy = this.destinationY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < threshold;
    }
}

