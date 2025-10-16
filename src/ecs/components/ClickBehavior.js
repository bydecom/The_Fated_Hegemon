// Component để quản lý hành vi click chuột phải của từng loại đơn vị
export class ClickBehavior {
    constructor(behaviors = {}) {
        // Mặc định: chase cho enemy units, move cho empty space
        this.behaviors = {
            // Click vào enemy unit
            enemyUnit: behaviors.enemyUnit || 'chase',
            // Click vào enemy building  
            enemyBuilding: behaviors.enemyBuilding || 'attack',
            // Click vào player building
            playerBuilding: behaviors.playerBuilding || 'fix',
            // Click vào resource node
            resourceNode: behaviors.resourceNode || 'harvest',
            // Click vào animal
            animal: behaviors.animal || 'attack',
            // Click vào empty space
            emptySpace: behaviors.emptySpace || 'move'
        };
    }
    
    // Lấy hành vi cho loại đối tượng được click
    getBehaviorForTarget(targetType) {
        return this.behaviors[targetType] || 'move';
    }
    
    // Cập nhật hành vi cho loại đối tượng cụ thể
    setBehaviorForTarget(targetType, behavior) {
        this.behaviors[targetType] = behavior;
    }
    
    // Kiểm tra xem đơn vị có thể thực hiện hành vi này không
    canPerformBehavior(behavior) {
        const allowedBehaviors = this.getAllowedBehaviors();
        return allowedBehaviors.includes(behavior);
    }
    
    // Lấy danh sách hành vi được phép cho loại đơn vị này
    getAllowedBehaviors() {
        // Mặc định: tất cả các hành vi
        return ['chase', 'attack', 'move', 'harvest', 'fix'];
    }
}

// ⭐ FACTORY cho các loại đơn vị khác nhau
export class ClickBehaviorFactory {
    // Hành vi cho lính (chỉ có attack và chase)
    static createSoldierBehavior() {
        return new ClickBehavior({
            enemyUnit: 'chase',
            enemyBuilding: 'attack', 
            playerBuilding: 'move', // Không thể fix
            resourceNode: 'move',   // Không thể harvest
            animal: 'attack',
            emptySpace: 'move'
        });
    }
    
    // Hành vi cho dân thu hoạch (có thể harvest và fix)
    static createHarvesterBehavior() {
        return new ClickBehavior({
            enemyUnit: 'chase',
            enemyBuilding: 'attack',
            playerBuilding: 'fix',    // Có thể fix nhà
            resourceNode: 'harvest', // Có thể thu hoạch
            animal: 'attack',
            emptySpace: 'move'
        });
    }
    
    // Hành vi cho dân thợ (có thể fix và harvest)
    static createWorkerBehavior() {
        return new ClickBehavior({
            enemyUnit: 'chase',
            enemyBuilding: 'attack',
            playerBuilding: 'fix',    // Có thể fix nhà
            resourceNode: 'harvest', // Có thể thu hoạch
            animal: 'attack',
            emptySpace: 'move'
        });
    }
    
    // Hành vi cho lính địch (chỉ attack)
    static createEnemyBehavior() {
        return new ClickBehavior({
            enemyUnit: 'attack',
            enemyBuilding: 'move',
            playerBuilding: 'attack',
            resourceNode: 'move',
            animal: 'attack',
            emptySpace: 'move'
        });
    }
}
