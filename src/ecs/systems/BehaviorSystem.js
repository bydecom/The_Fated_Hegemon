// System xử lý hành vi của entities

export class BehaviorSystem {
    constructor(scene) {
        this.scene = scene;
        this.worldBounds = {
            width: scene.scale.gameSize.width,
            height: scene.scale.gameSize.height
        };
    }

    update(deltaTime, entities) {
        // Xử lý theo batch để tối ưu hiệu suất
        const batchSize = 100; // Xử lý tất cả 100 entity
        let processed = 0;
        
        for (const [entityId, components] of entities) {
            if (processed >= batchSize) {
                // Tạm dừng để tránh block UI
                break;
            }
            
            const behavior = components.get('behavior');
            const position = components.get('position');
            const velocity = components.get('velocity');
            const ai = components.get('ai');

            if (behavior && position && velocity) {
                this.processBehavior(behavior, position, velocity, ai, deltaTime);
                processed++;
            }
        }
    }

    processBehavior(behavior, position, velocity, ai, deltaTime) {
        behavior.update(deltaTime);

        switch (behavior.type) {
            case 'idle':
                this.handleIdle(velocity);
                break;
            case 'patrol':
                this.handlePatrol(behavior, position, velocity, ai, deltaTime);
                break;
            case 'wander':
                this.handleWander(behavior, position, velocity, deltaTime);
                break;
            case 'chase':
                this.handleChase(behavior, position, velocity, ai, deltaTime);
                break;
            case 'flee':
                this.handleFlee(behavior, position, velocity, ai, deltaTime);
                break;
        }
    }

    handleIdle(velocity) {
        velocity.x = 0;
        velocity.y = 0;
    }

    handlePatrol(behavior, position, velocity, ai, deltaTime) {
        if (!ai || !ai.canMakeDecision(deltaTime)) return;

        const patrolPoints = behavior.data.patrolPoints || [];
        if (patrolPoints.length === 0) return;

        const currentTarget = behavior.data.currentTarget || 0;
        const targetPoint = patrolPoints[currentTarget];
        
        if (!targetPoint) return;

        const dx = targetPoint.x - position.x;
        const dy = targetPoint.y - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) {
            // Đã đến điểm patrol, chuyển sang điểm tiếp theo
            behavior.data.currentTarget = (currentTarget + 1) % patrolPoints.length;
            ai.resetDecisionTimer();
        } else {
            // Di chuyển về phía điểm patrol
            const speed = ai.config.speed;
            velocity.x = (dx / distance) * speed;
            velocity.y = (dy / distance) * speed;
        }
    }

    handleWander(behavior, position, velocity, deltaTime) {
        if (behavior.timer < behavior.data.interval || behavior.data.interval === undefined) {
            behavior.data.interval = Phaser.Math.Between(1000, 3000);
            return;
        }

        // Tạo hướng ngẫu nhiên
        const angle = Phaser.Math.Between(0, 360) * Math.PI / 180;
        const speed = behavior.data.speed || 50;
        
        velocity.x = Math.cos(angle) * speed;
        velocity.y = Math.sin(angle) * speed;
        
        behavior.timer = 0;
        behavior.data.interval = Phaser.Math.Between(1000, 3000);
    }

    handleChase(behavior, position, velocity, ai, deltaTime) {
        if (!ai || !ai.target) return;

        const targetPosition = ai.target.get('position');
        if (!targetPosition) return;

        const dx = targetPosition.x - position.x;
        const dy = targetPosition.y - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > ai.config.detectionRange) {
            // Mất mục tiêu, chuyển về hành vi cũ
            behavior.setBehavior(behavior.data.previousBehavior || 'idle');
            return;
        }

        const speed = ai.config.speed;
        velocity.x = (dx / distance) * speed;
        velocity.y = (dy / distance) * speed;
    }

    handleFlee(behavior, position, velocity, ai, deltaTime) {
        if (!ai || !ai.target) return;

        const targetPosition = ai.target.get('position');
        if (!targetPosition) return;

        const dx = position.x - targetPosition.x;
        const dy = position.y - targetPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > ai.config.detectionRange) {
            // An toàn, chuyển về hành vi cũ
            behavior.setBehavior(behavior.data.previousBehavior || 'idle');
            return;
        }

        const speed = ai.config.speed;
        velocity.x = (dx / distance) * speed;
        velocity.y = (dy / distance) * speed;
    }
}
