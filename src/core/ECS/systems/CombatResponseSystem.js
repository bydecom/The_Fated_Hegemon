// System để xử lý phản ứng chiến đấu khi bị tấn công
export class CombatResponseSystem {
    constructor(ecsWorld) {
        this.ecsWorld = ecsWorld;
    }
    
    update(deltaTime, entities) {
        for (const [entityId, components] of entities) {
            const combatResponse = components.get('combatResponse');
            const behavior = components.get('behavior');
            const ai = components.get('ai');
            const position = components.get('position');
            const health = components.get('health');
            
            if (!combatResponse || !behavior || !position) continue;
            
            // Nếu đang bị tấn công
            if (combatResponse.isBeingAttacked) {
                this.handleCombatResponse(entityId, components, combatResponse, behavior, ai, position, health, deltaTime);
            }
        }
        
        // ⭐ Kiểm tra và dừng đánh trả nếu kẻ tấn công đã chết
        this.checkAndStopRetaliation(entities);
    }
    
    // Kiểm tra và dừng đánh trả nếu kẻ tấn công đã chết
    checkAndStopRetaliation(entities) {
        for (const [entityId, components] of entities) {
            const combatResponse = components.get('combatResponse');
            if (!combatResponse || !combatResponse.isBeingAttacked) continue;
            
            const attackerId = combatResponse.attackerId;
            if (!attackerId) {
                combatResponse.stopBeingAttacked();
                continue;
            }
            
            // Kiểm tra xem kẻ tấn công còn sống không
            const attackerEntity = this.ecsWorld.entities.get(attackerId);
            if (!attackerEntity) {
                console.log(`⚔️ Kẻ tấn công ${attackerId} đã chết, dừng đánh trả cho ${entityId}`);
                this.stopRetaliation(entityId);
                continue;
            }
            
            const attackerHealth = attackerEntity.get('health');
            if (attackerHealth && attackerHealth.current <= 0) {
                console.log(`⚔️ Kẻ tấn công ${attackerId} đã chết, dừng đánh trả cho ${entityId}`);
                this.stopRetaliation(entityId);
            }
        }
    }
    
    handleCombatResponse(entityId, components, combatResponse, behavior, ai, position, health, deltaTime) {
        const attackerId = combatResponse.attackerId;
        if (!attackerId) {
            combatResponse.stopBeingAttacked();
            return;
        }
        
        // Lấy thông tin kẻ tấn công
        const attackerEntity = this.ecsWorld.entities.get(attackerId);
        if (!attackerEntity) {
            console.log(`⚔️ Kẻ tấn công ${attackerId} đã chết, dừng đánh trả`);
            combatResponse.stopBeingAttacked();
            this.returnToOriginalBehavior(entityId, combatResponse, behavior, ai);
            return;
        }
        
        const attackerPosition = attackerEntity.get('position');
        const attackerHealth = attackerEntity.get('health');
        
        if (!attackerPosition || (attackerHealth && attackerHealth.current <= 0)) {
            console.log(`⚔️ Kẻ tấn công ${attackerId} đã chết, dừng đánh trả`);
            combatResponse.stopBeingAttacked();
            this.returnToOriginalBehavior(entityId, combatResponse, behavior, ai);
            return;
        }
        
        // ⭐ LOGIC ĐƠN GIẢN: Kiểm tra khoảng cách đến kẻ tấn công
        const distanceToAttacker = combatResponse.getDistance(position, attackerPosition);
        const detectionRange = ai?.config?.detectionRange || 300; // Tầm phát hiện mặc định
        
        // Nếu kẻ tấn công trong tầm phát hiện → CHASE
        if (distanceToAttacker <= detectionRange) {
            console.log(`⚔️ Unit ${entityId} phát hiện kẻ tấn công ${attackerId} ở ${distanceToAttacker.toFixed(0)}px, đuổi theo!`);
            
            // Chuyển sang chase nếu chưa chase
            if (behavior.type !== 'chase' && behavior.type !== 'attack') {
                behavior.setBehavior('chase', { manualAttack: true });
            }
            
            // Set target
            if (ai) {
                ai.setTargetId(attackerId);
            }
        } else {
            // Ra khỏi tầm phát hiện → Dừng đánh trả
            console.log(`⚔️ Kẻ tấn công ${attackerId} ra khỏi tầm phát hiện (${distanceToAttacker.toFixed(0)}px), dừng đánh trả`);
            combatResponse.stopBeingAttacked();
            this.returnToOriginalBehavior(entityId, combatResponse, behavior, ai);
        }
    }
    
    chaseAttacker(entityId, components, combatResponse, behavior, ai, position, attackerPosition) {
        // Đặt vị trí bắt đầu đuổi theo
        combatResponse.setChaseStartPosition(position);
        
        // Chuyển sang hành vi chase
        if (behavior.type !== 'chase') {
            console.log(`⚔️ Unit ${entityId} chuyển sang đuổi theo kẻ tấn công`);
            behavior.setBehavior('chase', { manualAttack: true });
        }
        
        // Set target cho AI
        if (ai) {
            ai.setTargetId(combatResponse.attackerId);
        }
    }
    
    returnToOriginalBehavior(entityId, combatResponse, behavior, ai) {
        const originalBehavior = combatResponse.getOriginalBehavior();
        const originalTarget = combatResponse.getOriginalTarget();
        
        if (originalBehavior) {
            console.log(`🔄 Unit ${entityId} quay về hành vi gốc: ${originalBehavior}`);
            behavior.setBehavior(originalBehavior);
            
            // Khôi phục target gốc nếu có
            if (originalTarget && ai) {
                ai.setTargetId(originalTarget);
            } else if (ai) {
                ai.clearTarget();
            }
        } else {
            // Mặc định về idle
            behavior.setBehavior('idle');
            if (ai) ai.clearTarget();
        }
    }
    
    // Phương thức để bắt đầu đánh trả (được gọi từ CombatSystem)
    startRetaliation(victimId, attackerId) {
        const victimEntity = this.ecsWorld.entities.get(victimId);
        if (!victimEntity) return;
        
        const combatResponse = victimEntity.get('combatResponse');
        const behavior = victimEntity.get('behavior');
        const ai = victimEntity.get('ai');
        
        if (!combatResponse || !behavior) return;
        
        // ⭐ CHỈ kích hoạt đánh trả khi đang ở trạng thái idle, defence, hoặc patrol
        const currentBehavior = behavior.type;
        const allowedBehaviors = ['idle', 'defence', 'patrol'];
        
        if (!allowedBehaviors.includes(currentBehavior)) {
            console.log(`⚔️ Unit ${victimId} đang ${currentBehavior}, không kích hoạt đánh trả`);
            return;
        }
        
        // Kiểm tra xem đã đang đánh trả chưa
        if (combatResponse.isBeingAttacked) {
            console.log(`⚔️ Unit ${victimId} đã đang đánh trả, bỏ qua`);
            return;
        }
        
        // Lấy thông tin hành vi hiện tại
        const currentTarget = ai ? ai.targetId : null;
        
        // Bắt đầu đánh trả
        combatResponse.startBeingAttacked(attackerId, currentBehavior, currentTarget);
        
        console.log(`⚔️ Unit ${victimId} bắt đầu đánh trả ${attackerId} (từ ${currentBehavior})`);
    }
    
    // Phương thức để dừng đánh trả (được gọi khi kẻ tấn công chết)
    stopRetaliation(victimId) {
        const victimEntity = this.ecsWorld.entities.get(victimId);
        if (!victimEntity) return;
        
        const combatResponse = victimEntity.get('combatResponse');
        const behavior = victimEntity.get('behavior');
        const ai = victimEntity.get('ai');
        
        if (!combatResponse || !behavior) return;
        
        combatResponse.stopBeingAttacked();
        this.returnToOriginalBehavior(victimId, combatResponse, behavior, ai);
        
        console.log(`⚔️ Unit ${victimId} dừng đánh trả`);
    }
}
