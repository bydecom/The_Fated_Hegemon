// System xử lý AI và ra quyết định

export class AISystem {
    constructor(scene = null) {
        this.scene = scene;
    }

    update(deltaTime, entities) {
        for (const [entityId, components] of entities) {
            const ai = components.get('ai');
            if (ai && ai.canMakeDecision(deltaTime)) {
                // Chỉ xử lý AI cho các đơn vị có hành vi 'chase'
                if (ai.aiType === 'chase') {
                    this.processChaseAI(entityId, components, entities);
                }
                ai.resetDecisionTimer();
            }
        }
    }

    // ⭐ THAY THẾ HÀM processAI CŨ BẰNG HÀM NÀY
    processChaseAI(chaserId, chaserComponents, allEntities) {
        const ai = chaserComponents.get('ai');
        const position = chaserComponents.get('position');
        const behavior = chaserComponents.get('behavior');
        
        let closestTarget = null;
        let minDistance = ai.config.detectionRange;

        // Tìm kiếm đơn vị người chơi gần nhất
        for (const [entityId, components] of allEntities) {
            // Chỉ nhắm vào đơn vị của người chơi (playerUnit)
            if (components.has('playerUnit')) {
                const targetPos = components.get('position');
                const distance = Phaser.Math.Distance.Between(position.x, position.y, targetPos.x, targetPos.y);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestTarget = entityId;
                }
            }
        }
        
        // Cập nhật trạng thái AI và hành vi
        if (closestTarget) {
            // Tìm thấy mục tiêu trong tầm -> Đuổi theo
            ai.target = closestTarget; // Lưu ID của mục tiêu
            behavior.setBehavior('chase');
        } else {
            // Không có mục tiêu trong tầm -> Quay về lang thang
            ai.target = null;
            if (behavior.type === 'chase') { // Chỉ chuyển nếu đang đuổi
                behavior.setBehavior('wander');
            }
        }
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
