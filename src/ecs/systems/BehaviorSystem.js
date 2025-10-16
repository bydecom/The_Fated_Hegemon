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
                this.handlePatrol(entityId, behavior, position, velocity, patrolAi, deltaTime);
                break;
            case 'harvest':
                this.handleHarvest(entityId, components, behavior, position, velocity, deltaTime);
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
            // ⭐ NEW: Defence behavior
            case 'defence':
                this.handleDefence(entityId, components, behavior, position, velocity, deltaTime);
                break;
            // ⭐ THÊM HÀNH VI MỚI: FOLLOW_PATH
            case 'followPath':
                const pathAi = components.get('ai');
                if (!pathAi.hasPath()) {
                    behavior.setBehavior('idle');
                    return;
                }

                // ⭐ AUTO-ATTACK ENEMIES DURING ATTACK-MOVE
                if (behavior.data.manualAttack) {
                    const nearestEnemy = this.findNearestEnemy(entityId, components, pathAi.config.detectionRange);
                    if (nearestEnemy) {
                        pathAi.setTargetId(nearestEnemy);
                        behavior.setBehavior('chase', { manualAttack: true });
                        return;
                    }
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
                        // ⭐ Kiểm tra xem có đang di chuyển đến mỏ tài nguyên không
                        if (behavior.data.targetResourceId) {
                            const harvester = components.get('harvester');
                            if (harvester) {
                                harvester.startHarvesting(behavior.data.targetResourceId);
                                behavior.setBehavior('harvest');
                                console.log(`  Unit ${entityId}: Arrived at resource, starting harvest`);
                            } else {
                                behavior.setBehavior('idle');
                            }
                        } else {
                            behavior.setBehavior('idle');
                        }
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

    handlePatrol(entityId, behavior, position, velocity, ai, deltaTime) {
        if (!ai || !ai.canMakeDecision(deltaTime)) return;

        const patrolPoints = behavior.data.patrolPoints || [];
        if (patrolPoints.length === 0) return;

        const currentTarget = behavior.data.currentTarget || 0;
        const targetPoint = patrolPoints[currentTarget];
        
        if (!targetPoint) return;

        const dx = targetPoint.x - position.x;
        const dy = targetPoint.y - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // ⭐ TĂNG NGƯỠNG ĐỂ TRÁNH OSCILLATION
        const ARRIVAL_THRESHOLD = 50;
        const WAIT_TIME = 300; // Đợi 300ms tại patrol point
        
        // ⭐ CHẾ ĐỘ WAITING TẠI PATROL POINT
        if (behavior.data.isWaitingAtPoint) {
            velocity.x = 0;
            velocity.y = 0;
            
            // Đợi đủ thời gian rồi mới bắt đầu di chuyển lại
            if (behavior.data.waitTimer >= WAIT_TIME) {
                behavior.data.isWaitingAtPoint = false;
                behavior.data.waitTimer = 0;
            } else {
                behavior.data.waitTimer = (behavior.data.waitTimer || 0) + deltaTime;
            }
            return;
        }
        
        if (distance < ARRIVAL_THRESHOLD) {
            // ⭐ ĐẾN PATROL POINT → SWITCH TARGET VÀ BẮT ĐẦU WAITING
            if (!behavior.data.hasReachedPoint) {
                const newTarget = (currentTarget + 1) % patrolPoints.length;
                behavior.data.currentTarget = newTarget;
                behavior.data.hasReachedPoint = true;
                behavior.data.isWaitingAtPoint = true;
                behavior.data.waitTimer = 0;
                
                // console.log(`🚶 Unit ${entityId}: Reached patrol point ${currentTarget}, switching to point ${newTarget}`);
                // console.log(`   Points: [${patrolPoints[0].x.toFixed(0)}, ${patrolPoints[0].y.toFixed(0)}] ↔ [${patrolPoints[1].x.toFixed(0)}, ${patrolPoints[1].y.toFixed(0)}]`);
                // console.log(`   Current pos: [${position.x.toFixed(0)}, ${position.y.toFixed(0)}]`);
                
                ai.resetDecisionTimer();
            }
            
            // Dừng lại
            velocity.x = 0;
            velocity.y = 0;
        } else {
            // Di chuyển về phía điểm patrol
            behavior.data.hasReachedPoint = false;
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
        
        // ⭐ ATTACK-MOVE MODE: Nếu không có target, follow path và tự động tìm enemies
        if (!targetId) {
            // Nếu có path, follow path
            if (ai.path && ai.path.length > 0) {
                behavior.setBehavior('followPath');
                return;
            }
            
            // Nếu không có path, idle (chỉ log 1 lần để tránh spam)
            if (!behavior.data.hasLoggedNoTarget) {
                console.warn(`⚠️ ${entityId} ai.targetId is NULL/UNDEFINED → NO TARGET!`);
                behavior.data.hasLoggedNoTarget = true;
            }
            behavior.setBehavior('idle');
            return;
        }
        
        // Reset flag khi có target
        behavior.data.hasLoggedNoTarget = false;
        
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
        
        // Nếu target không tồn tại hoặc đã chết, quay về behavior thích hợp
        if (!targetId || !combat || !this.ecsWorld || !this.ecsWorld.entities.has(targetId)) {
            if (ai) ai.clearTarget();
            
            // ⭐ Nếu đang defence counter-attack, quay về defence mode
            const defencePosition = components.get('defencePosition');
            if (defencePosition && behavior.data.isDefenceCounterAttack) {
                behavior.setBehavior('defence');
            } else {
                behavior.setBehavior('idle');
            }
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
    
    // ⭐ NEW: Xử lý Defence behavior
    handleDefence(entityId, components, behavior, position, velocity, deltaTime) {
        const defencePosition = components.get('defencePosition');
        const ai = components.get('ai');
        const combat = components.get('combatStats');
        
        if (!defencePosition) {
            // Không có defence position, chuyển về idle
            behavior.setBehavior('idle');
            return;
        }
        
        // ⭐ PRIORITY 1: Tìm kẻ địch trong tầm attack
        let nearestEnemy = null;
        let minDistance = Infinity;
        
        for (const [otherId, otherComponents] of this.ecsWorld.entities) {
            if (otherId === entityId) continue;
            
            // Chỉ tấn công kẻ địch (không phải playerUnit)
            if (otherComponents.has('playerUnit')) continue;
            if (!otherComponents.has('health')) continue;
            
            const otherPos = otherComponents.get('position');
            if (!otherPos) continue;
            
            const dx = otherPos.x - position.x;
            const dy = otherPos.y - position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Chỉ tấn công enemy trong defence radius
            const detectionRange = ai?.config?.detectionRange || 200;
            if (distance < detectionRange && distance < minDistance) {
                nearestEnemy = { id: otherId, distance };
                minDistance = distance;
            }
        }
        
        // ⭐ PHASE 1: Nếu có enemy trong tầm và trong defence radius → PHẢN CÔNG
        if (nearestEnemy && defencePosition.isWithinRadius(position.x, position.y)) {
            ai.setTargetId(nearestEnemy.id);
            behavior.setBehavior('chase', { 
                manualAttack: true,
                isDefenceCounterAttack: true // Flag để biết là phản công
            });
            defencePosition.isRetreating = false;
            return;
        }
        
        // ⭐ PHASE 2: Nếu đã rời xa vị trí phòng thủ → CHẠY VỀ
        const distanceFromDefence = defencePosition.getDistanceFromDefencePoint(position.x, position.y);
        
        if (distanceFromDefence > defencePosition.radius * 0.5) {
            // Chạy về vị trí phòng thủ
            defencePosition.isRetreating = true;
            
            const dx = defencePosition.x - position.x;
            const dy = defencePosition.y - position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 10) {
                // Đã về đến vị trí phòng thủ
                velocity.x = 0;
                velocity.y = 0;
                defencePosition.isRetreating = false;
            } else {
                // Di chuyển về
                const speed = ai?.config?.speed || 100;
                velocity.x = (dx / distance) * speed;
                velocity.y = (dy / distance) * speed;
            }
        } else {
            // Ở trong bán kính phòng thủ, đứng yên
            velocity.x = 0;
            velocity.y = 0;
            defencePosition.isRetreating = false;
        }
    }
    
    // ⭐ HELPER: Tìm enemy gần nhất trong tầm detection range
    findNearestEnemy(entityId, components, detectionRange) {
        const position = components.get('position');
        if (!position) return null;
        
        const isPlayerUnit = components.has('playerUnit');
        
        let nearestEnemyId = null;
        let minDistance = detectionRange;
        
        for (const [otherId, otherComponents] of this.ecsWorld.entities) {
            if (otherId === entityId) continue;
            
            // Player units tấn công non-player units (enemies/buildings)
            // Non-player units tấn công player units
            if (isPlayerUnit) {
                if (otherComponents.has('playerUnit')) continue; // Skip allies
            } else {
                if (!otherComponents.has('playerUnit')) continue; // Skip allies
            }
            
            if (!otherComponents.has('health')) continue;
            
            const otherPos = otherComponents.get('position');
            if (!otherPos) continue;
            
            const dx = otherPos.x - position.x;
            const dy = otherPos.y - position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                nearestEnemyId = otherId;
                minDistance = distance;
            }
        }
        
        return nearestEnemyId;
    }

    // ⭐ HANDLE HARVEST BEHAVIOR
    handleHarvest(entityId, components, behavior, position, velocity, deltaTime) {
        const harvester = components.get('harvester');
        if (!harvester) {
            behavior.setBehavior('idle');
            return;
        }

        // Nếu đang thu hoạch, dừng di chuyển
        if (harvester.isHarvesting) {
            velocity.x = 0;
            velocity.y = 0;
            return;
        }

        // Nếu kho đã đầy, dừng thu hoạch
        if (harvester.isFull()) {
            behavior.setBehavior('idle');
            console.log(`📦 ${entityId}: Storage full, stopping harvest`);
            return;
        }

        // ⭐ Ưu tiên targetResourceId nếu đã được chỉ định (từ click chuột phải)
        let targetResource = harvester.targetResourceId;
        
        // Nếu chưa có target hoặc target không còn resource, tìm resource gần nhất
        if (targetResource) {
            const targetEntity = this.ecsWorld.entities.get(targetResource);
            const targetResourceNode = targetEntity?.get('resourceNode');
            if (!targetResourceNode || !targetResourceNode.hasResources()) {
                targetResource = null;
                harvester.targetResourceId = null;
            }
        }
        
        if (!targetResource) {
            targetResource = this.findNearestResource(position, harvester.harvestRange * 2); // Tăng gấp đôi range khi tìm
            if (!targetResource) {
                behavior.setBehavior('idle');
                console.log(`🔍 ${entityId}: No resources found, stopping harvest`);
                return;
            }
        }

        // Di chuyển đến tài nguyên
        const targetEntity = this.ecsWorld.entities.get(targetResource);
        const targetPos = targetEntity?.get('position');
        const targetAppearance = targetEntity?.get('appearance');
        
        if (!targetPos) {
            behavior.setBehavior('idle');
            return;
        }

        const dx = targetPos.x - position.x;
        const dy = targetPos.y - position.y;
        const centerDistance = Math.sqrt(dx * dx + dy * dy);
        
        // ⭐ Tính khoảng cách từ MÉP (edge-to-edge)
        const harvesterSize = appearance.size || 10;
        const resourceSize = targetAppearance ? targetAppearance.size : 10;
        const edgeDistance = centerDistance - harvesterSize - resourceSize;

        console.log(`📏 ${entityId}: Distance to resource - center=${centerDistance.toFixed(0)}, edge=${edgeDistance.toFixed(0)}, range=${harvester.harvestRange}`);

        if (edgeDistance <= harvester.harvestRange) {
            // Đã đến tài nguyên, bắt đầu thu hoạch
            harvester.startHarvesting(targetResource);
            velocity.x = 0;
            velocity.y = 0;
            console.log(`🌾 ${entityId}: Started harvesting resource ${targetResource}`);
        } else {
            // Di chuyển đến tài nguyên
            const speed = 120; // Tốc độ di chuyển
            velocity.x = (dx / centerDistance) * speed;
            velocity.y = (dy / centerDistance) * speed;
        }
    }

    // Tìm tài nguyên gần nhất
    findNearestResource(position, maxRange) {
        let nearestId = null;
        let nearestDistance = maxRange;

        for (const [entityId, components] of this.ecsWorld.entities) {
            if (!components.has('resourceNode')) continue;

            const targetPosition = components.get('position');
            if (!targetPosition) continue;

            const resourceNode = components.get('resourceNode');
            if (!resourceNode || !resourceNode.hasResources()) continue;

            const distance = Math.sqrt(
                Math.pow(position.x - targetPosition.x, 2) + 
                Math.pow(position.y - targetPosition.y, 2)
            );

            if (distance < nearestDistance) {
                nearestId = entityId;
                nearestDistance = distance;
            }
        }

        return nearestId;
    }
}
