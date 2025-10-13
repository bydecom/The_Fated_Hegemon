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
        this.lastDecisionTime = 0;
        this.currentPath = [];
        this.pathIndex = 0;
    }

    setTarget(target) {
        this.target = target;
    }

    clearTarget() {
        this.target = null;
    }

    canMakeDecision(deltaTime) {
        this.lastDecisionTime += deltaTime;
        return this.lastDecisionTime >= this.config.reactionTime;
    }

    resetDecisionTimer() {
        this.lastDecisionTime = 0;
    }

    setPath(path) {
        this.currentPath = path;
        this.pathIndex = 0;
    }

    getNextPathPoint() {
        if (this.currentPath.length === 0) return null;
        
        const point = this.currentPath[this.pathIndex];
        this.pathIndex = (this.pathIndex + 1) % this.currentPath.length;
        return point;
    }
}
