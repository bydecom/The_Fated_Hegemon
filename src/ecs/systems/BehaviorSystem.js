// System xử lý hành vi của entities

export class BehaviorSystem {
    constructor(scene = null) {
        this.scene = scene;
        this.ecsWorld = null; // Sẽ được set từ bên ngoài
        this.worldBounds = null; // Sẽ được khởi tạo trong update
    }

    update(deltaTime, entities) {
        // Khởi tạo worldBounds nếu chưa có
        if (!this.worldBounds && this.scene) {
            this.worldBounds = {
                width: this.scene.scale.gameSize.width,
                height: this.scene.scale.gameSize.height
            };
        }
        
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

            if (behavior && position && velocity) {
                // SỬA LỖI: Truyền entityId và components vào
                this.processBehavior(entityId, components, behavior, position, velocity, deltaTime);
                processed++;
            }
        }
    }

    // SỬA LỖI: Thay đổi tham số để nhận vào components
    processBehavior(entityId, components, behavior, position, velocity, deltaTime) {
        behavior.update(deltaTime);

        switch (behavior.type) {
            // ==================================================
            // ⭐ LOGIC MỚI ĐƯỢC THÊM VÀO
            // ==================================================
            case 'moveToTarget':
                const moveTarget = components.get('moveTarget');
                if (moveTarget) {
                    const dx = moveTarget.x - position.x;
                    const dy = moveTarget.y - position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 10) { // Đã đến nơi
                        velocity.x = 0;
                        velocity.y = 0;
                        behavior.setBehavior('idle');
                        // Dùng world instance để xóa component
                        this.world.removeComponent(entityId, 'moveTarget');
                    } else {
                        const ai = components.get('ai');
                        const speed = ai ? ai.config.speed : 100;
                        velocity.x = (dx / distance) * speed;
                        velocity.y = (dy / distance) * speed;
                    }
                } else {
                    behavior.setBehavior('idle');
                }
                break;
            // ==================================================
            // Giữ lại các logic cũ
            // ==================================================
            case 'idle':
                this.handleIdle(velocity);
                break;
            case 'patrol':
                const patrolAi = components.get('ai');
                this.handlePatrol(behavior, position, velocity, patrolAi, deltaTime);
                break;
            case 'wander':
                this.handleWander(behavior, position, velocity, deltaTime);
                break;
            // ⭐ THÊM CASE MỚI NÀY VÀO
            case 'chase':
                const chaseAi = components.get('ai');
                // Lấy mục tiêu từ component AI
                const targetId = chaseAi.target; 
                
                if (targetId && this.ecsWorld && this.ecsWorld.entities.has(targetId)) {
                    const targetComponents = this.ecsWorld.entities.get(targetId);
                    const targetPosition = targetComponents.get('position');
                    
                    const dx = targetPosition.x - position.x;
                    const dy = targetPosition.y - position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance > 5) { // Đuổi theo nếu chưa quá gần
                        const speed = chaseAi.config.speed;
                        velocity.x = (dx / distance) * speed;
                        velocity.y = (dy / distance) * speed;
                    } else {
                        velocity.x = 0;
                        velocity.y = 0;
                    }
                } else {
                    // Nếu không có mục tiêu, dừng lại
                    velocity.x = 0;
                    velocity.y = 0;
                }
                break;
            case 'flee':
                const fleeAi = components.get('ai');
                this.handleFlee(behavior, position, velocity, fleeAi, deltaTime);
                break;
            // ⭐ THÊM HÀNH VI MỚI: FOLLOW_PATH
            case 'followPath':
                const pathAi = components.get('ai');
                if (!pathAi.hasPath()) {
                    behavior.setBehavior('idle');
                    return;
                }

                // Lấy điểm tiếp theo trên đường đi
                let targetNode = pathAi.getCurrentPathNode();
                const targetWorldPos = this.ecsWorld.scene.gridManager.gridToWorldCenter(targetNode.x, targetNode.y);

                const dx = targetWorldPos.x - position.x;
                const dy = targetWorldPos.y - position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Nếu đã đến gần điểm hiện tại, chuyển sang điểm tiếp theo
                if (distance < this.ecsWorld.scene.gridManager.tileSize / 2) {
                    pathAi.advancePath();
                    // Nếu hết đường đi, dừng lại
                    if (!pathAi.hasPath()) {
                        behavior.setBehavior('idle');
                        velocity.x = 0;
                        velocity.y = 0;
                        return;
                    }
                    // Lấy điểm mới ngay lập tức
                    targetNode = pathAi.getCurrentPathNode();
                    const newTargetWorldPos = this.ecsWorld.scene.gridManager.gridToWorldCenter(targetNode.x, targetNode.y);
                    const newDx = newTargetWorldPos.x - position.x;
                    const newDy = newTargetWorldPos.y - position.y;
                    const newDist = Math.sqrt(newDx*newDx + newDy*newDy);
                    velocity.x = (newDx / newDist) * pathAi.config.speed;
                    velocity.y = (newDy / newDist) * pathAi.config.speed;
                } else {
                    // Di chuyển về phía điểm hiện tại
                    velocity.x = (dx / distance) * pathAi.config.speed;
                    velocity.y = (dy / distance) * pathAi.config.speed;
                }
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
