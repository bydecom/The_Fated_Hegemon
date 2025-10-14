// Component AI - Trí tuệ nhân tạo cho entity

export class AI {
    constructor(aiType = 'random', config = {}) {
        this.aiType = aiType; // 'random', 'patrol', 'chase', 'flee', 'wander'
        this.config = {
            speed: 100,
            detectionRange: 200,
            reactionTime: 500,
            ...config
        };
        this.target = null;
        this.targetId = null; // NEW: Lưu ID mục tiêu
        this.lastDecisionTime = 0;
        this.currentPath = [];
        this.pathIndex = 0;
    }

    setTarget(target) {
        this.target = target;
    }

    setTargetId(targetId) {
        this.targetId = targetId;
    }

    clearTarget() {
        this.target = null;
        this.targetId = null;
    }

    canMakeDecision(deltaTime) {
        this.lastDecisionTime += deltaTime;
        return this.lastDecisionTime >= this.config.reactionTime;
    }

    resetDecisionTimer() {
        this.lastDecisionTime = 0;
    }

    setPath(path) {
        // Chuyển đổi path từ easystar (array of objects) thành một array các điểm
        this.currentPath = path.map(p => ({ x: p.x, y: p.y }));
        this.pathIndex = 0;
    }

    hasPath() {
        return this.currentPath && this.pathIndex < this.currentPath.length;
    }

    getCurrentPathNode() {
        if (this.hasPath()) {
            return this.currentPath[this.pathIndex];
        }
        return null;
    }

    advancePath() {
        this.pathIndex++;
    }

    getNextPathPoint() {
        if (this.currentPath.length === 0) return null;
        
        const point = this.currentPath[this.pathIndex];
        this.pathIndex = (this.pathIndex + 1) % this.currentPath.length;
        return point;
    }
}
