// System xử lý AI và ra quyết định

export class AISystem {
    constructor(scene) {
        this.scene = scene;
    }

    update(deltaTime, entities) {
        entities.forEach((components, entityId) => {
            const ai = components.get('ai');
            const behavior = components.get('behavior');
            const position = components.get('position');

            if (ai && behavior && position) {
                this.processAI(ai, behavior, position, entities, deltaTime);
            }
        });
    }

    processAI(ai, behavior, position, allEntities, deltaTime) {
        if (!ai.canMakeDecision(deltaTime)) return;

        switch (ai.aiType) {
            case 'random':
                this.randomBehavior(behavior, ai);
                break;
            case 'patrol':
                this.patrolBehavior(behavior, ai);
                break;
            case 'chase':
                this.chaseBehavior(ai, behavior, position, allEntities);
                break;
            case 'flee':
                this.fleeBehavior(ai, behavior, position, allEntities);
                break;
            case 'wander':
                this.wanderBehavior(behavior, ai);
                break;
        }

        ai.resetDecisionTimer();
    }

    randomBehavior(behavior, ai) {
        const behaviors = ['idle', 'wander'];
        const randomBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
        
        if (randomBehavior === 'wander') {
            behavior.setBehavior('wander', {
                speed: ai.config.speed,
                interval: Phaser.Math.Between(1000, 3000)
            });
        } else {
            behavior.setBehavior('idle');
        }
    }

    patrolBehavior(behavior, ai) {
        const patrolPoints = ai.config.patrolPoints || [];
        if (patrolPoints.length === 0) return;

        behavior.setBehavior('patrol', {
            patrolPoints: patrolPoints,
            currentTarget: 0
        });
    }

    chaseBehavior(ai, behavior, position, allEntities) {
        // Tìm entity gần nhất để đuổi theo
        let closestEntity = null;
        let closestDistance = ai.config.detectionRange;

        allEntities.forEach((components, entityId) => {
            const targetPosition = components.get('position');
            if (!targetPosition) return;

            const dx = targetPosition.x - position.x;
            const dy = targetPosition.y - position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestEntity = components;
            }
        });

        if (closestEntity) {
            ai.setTarget(closestEntity);
            behavior.setBehavior('chase', {
                previousBehavior: behavior.data.previousBehavior || 'idle'
            });
        }
    }

    fleeBehavior(ai, behavior, position, allEntities) {
        // Tìm entity gần nhất để chạy trốn
        let closestEntity = null;
        let closestDistance = ai.config.detectionRange;

        allEntities.forEach((components, entityId) => {
            const targetPosition = components.get('position');
            if (!targetPosition) return;

            const dx = targetPosition.x - position.x;
            const dy = targetPosition.y - position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestEntity = components;
            }
        });

        if (closestEntity) {
            ai.setTarget(closestEntity);
            behavior.setBehavior('flee', {
                previousBehavior: behavior.data.previousBehavior || 'idle'
            });
        }
    }

    wanderBehavior(behavior, ai) {
        behavior.setBehavior('wander', {
            speed: ai.config.speed,
            interval: Phaser.Math.Between(1000, 3000)
        });
    }
}
