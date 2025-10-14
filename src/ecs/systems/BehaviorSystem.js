// System xử lý hành vi của entities

export class BehaviorSystem {
    constructor(scene = null) {
        this.scene = scene;
        this.ecsWorld = null; // Sẽ được set từ bên ngoài
        this.worldBounds = null; // Sẽ được khởi tạo trong update
        this.combatSystem = null; // NEW: Tham chiếu CombatSystem nếu cần
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

                    if (distance < 10) { // Đã đến đích (Ngưỡng 10 pixel)
                        velocity.x = 0;
                        velocity.y = 0;
                        behavior.setBehavior('idle');
                        // Sử dụng world instance để xóa component nếu có
                        if (this.world) {
                            this.world.removeComponent(entityId, 'moveTarget');
                        }
                    } else {
                        // Tính toán vận tốc VỀ PHÍA MỤC TIÊU, làm mượt theo tốc độ AI
                        const ai = components.get('ai');
                        const speed = ai ? ai.config.speed : 100;

                        const directionX = dx / distance;
                        const directionY = dy / distance;

                        const targetVelocityX = directionX * speed;
                        const targetVelocityY = directionY * speed;

                        const currentVelocityX = velocity.x;
                        const currentVelocityY = velocity.y;
                        const LERP_FACTOR = 0.1; // Làm mượt

                        velocity.x = currentVelocityX + (targetVelocityX - currentVelocityX) * LERP_FACTOR;
                        velocity.y = currentVelocityY + (targetVelocityY - currentVelocityY) * LERP_FACTOR;
                    }
                } else {
                    // Mục tiêu không tồn tại
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
                this.handleChase(entityId, components, behavior, position, velocity, chaseAi, deltaTime);
                break;
            case 'attack':
                this.handleAttack(entityId, components, behavior, position, velocity, deltaTime);
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

    handleChase(entityId, components, behavior, position, velocity, ai, deltaTime) {
        const combat = components.get('combatStats');
        
        // ⭐ DEBUG: Kiểm tra AI component
        if (!ai) {
            console.error(`⚠️ ${entityId} has NO AI component!`);
            behavior.setBehavior('idle');
            return;
        }
        
        // ⭐ CHỈ DÙNG targetId (không dùng ai.target vì đó là object)
        const targetId = ai.targetId;
        
        // ⭐ DEBUG: Log chi tiết
        if (!targetId) {
            console.warn(`⚠️ ${entityId} ai.targetId is NULL/UNDEFINED → NO TARGET!`);
            behavior.setBehavior('idle');
            return;
        }
        
        if (!this.ecsWorld || !this.ecsWorld.entities.has(targetId)) {
            console.warn(`⚠️ ${entityId} Target ${targetId} NOT FOUND in entities → switching to IDLE`);
            ai.clearTarget(); // Xóa target không tồn tại
            behavior.setBehavior('idle');
            return;
        }

        const targetComponents = this.ecsWorld.entities.get(targetId);
        const targetPosition = targetComponents.get('position');
        if (!targetPosition) return;

        // ⭐ TÍNH KHOẢNG CÁCH TỪ MÉP ĐẾN MÉP (không phải tâm đến tâm)
        const dx = targetPosition.x - position.x;
        const dy = targetPosition.y - position.y;
        const centerDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Lấy size của attacker và target
        const attackerSize = components.get('appearance')?.size || 10;
        const targetSize = targetComponents.get('appearance')?.size || 10;
        
        // Khoảng cách thực tế = khoảng cách tâm - bán kính 2 entity
        const edgeDistance = centerDistance - attackerSize - targetSize;
        
        // ⭐ Nếu trong tầm đánh (tính từ mép), DỪNG LẠI và phát động tấn công
        if (combat && edgeDistance <= combat.attackRange) {
            velocity.x = 0; // Dừng lại
            velocity.y = 0;
            // Giữ lại flag manualAttack khi chuyển sang attack
            const isManualAttack = behavior.data.manualAttack === true;
            behavior.setBehavior('attack', { targetId, manualAttack: isManualAttack, hasDealtDamage: false });
            return;
        }

        // ⭐ Nếu quá xa tầm phát hiện, quay về hành vi cũ
        // NHƯNG: Bỏ qua check này nếu là manual attack (người chơi chủ động ra lệnh)
        const isManualAttack = behavior.data.manualAttack === true;
        if (!isManualAttack && centerDistance > (ai?.config?.detectionRange ?? Infinity)) {
            behavior.setBehavior('idle');
            return;
        }

        // Đuổi theo mục tiêu
        const speed = ai?.config?.speed ?? 100;
        velocity.x = (dx / centerDistance) * speed;
        velocity.y = (dy / centerDistance) * speed;
    }

    // NEW: Xử lý tấn công (HIT AND RUN - giống AOE)
    handleAttack(entityId, components, behavior, position, velocity, deltaTime) {
        const ai = components.get('ai');
        const combat = components.get('combatStats');
        const targetId = ai ? ai.targetId : null; // CHỈ DÙNG targetId
        
        // Nếu target không tồn tại, quay về idle
        if (!targetId || !combat || !this.ecsWorld || !this.ecsWorld.entities.has(targetId)) {
            if (ai) ai.clearTarget();
            behavior.setBehavior('idle');
            return;
        }

        const targetComponents = this.ecsWorld.entities.get(targetId);
        const targetPos = targetComponents.get('position');
        if (!targetPos) {
            behavior.setBehavior('idle');
            return;
        }
        
        // ⭐ Khởi tạo flag nếu chưa có (lần attack đầu tiên)
        if (behavior.data.hasDealtDamage === undefined) {
            behavior.data.hasDealtDamage = false;
        }
        
        // ⭐ TÍNH KHOẢNG CÁCH TỪ MÉP ĐẾN MÉP
        const dx = targetPos.x - position.x;
        const dy = targetPos.y - position.y;
        const centerDistance = Math.sqrt(dx * dx + dy * dy);
        
        const attackerSize = components.get('appearance')?.size || 10;
        const targetSize = targetComponents.get('appearance')?.size || 10;
        const edgeDistance = centerDistance - attackerSize - targetSize;

        // ⭐ LUÔN ĐỨNG YÊN khi đang attack (không chase trong lúc đánh)
        velocity.x = 0;
        velocity.y = 0;

        // Xoay theo target + vung tay
        const angleToTarget = Math.atan2(dy, dx);
        const MAX_SWING = 30 * (Math.PI / 180);
        
        // ⭐ Thời gian animation = 30% của attack cooldown (phụ thuộc vào tốc độ đánh)
        const SWING_DURATION = combat.attackRate * 0.3;
        
        // ⭐ PHASE 1: Đang thực hiện animation vung tay
        if (behavior.timer < SWING_DURATION) {
            const progress = behavior.timer / SWING_DURATION;
            const swingAngle = Math.sin(progress * Math.PI) * MAX_SWING;
            velocity.orientation = angleToTarget + swingAngle;
        } 
        // ⭐ PHASE 2: Animation vừa kết thúc → GÂY SÁT THƯƠNG NGAY (1 lần duy nhất)
        else if (behavior.timer >= SWING_DURATION && !behavior.data.hasDealtDamage) {
            // Đánh dấu đã gây sát thương trong đợt attack này
            behavior.data.hasDealtDamage = true;
            
            // ⭐ KIỂM TRA: Mục tiêu còn trong tầm không? (HIT OR MISS) - dùng edgeDistance
            if (edgeDistance <= combat.attackRange) {
                // ✅ HIT - Gây sát thương
                const combatSystem = this.ecsWorld.systems.find(s => s.constructor && s.constructor.name === 'CombatSystem');
                if (combatSystem) {
                    combatSystem.applyDamage(components, targetId);
                }
            }
            
            velocity.orientation = angleToTarget; // Giữ hướng
        }
        // ⭐ PHASE 3: Cooldown - chờ đủ thời gian để đánh lại
        else if (behavior.timer >= combat.attackRate) {
            // Reset để chuẩn bị đợt attack tiếp theo
            behavior.timer = 0;
            behavior.data.hasDealtDamage = false; // Reset flag
            
            // ⭐ SAU KHI COOLDOWN: Kiểm tra xem có tiếp tục đánh hay chase
            if (edgeDistance > combat.attackRange) {
                // Nếu ra khỏi tầm → Chuyển sang chase
                const isManualAttack = behavior.data.manualAttack === true;
                behavior.setBehavior('chase', { manualAttack: isManualAttack });
            }
            // Nếu còn trong tầm, giữ nguyên trạng thái attack để đánh tiếp
        }
        // ⭐ PHASE 4: Đang trong thời gian cooldown sau khi đã gây sát thương
        else {
            velocity.orientation = angleToTarget;
            
            // ⭐ Nếu đối thủ chạy quá xa trong lúc cooldown, chase lại
            if (edgeDistance > combat.attackRange * 1) {
                const isManualAttack = behavior.data.manualAttack === true;
                behavior.setBehavior('chase', { manualAttack: isManualAttack });
            }
        }
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
