// System xử lý sát thương và cái chết

export class CombatSystem {
	constructor(world) {
		this.world = world;
		this.renderSystem = null; // Sẽ được set từ bên ngoài
		this.combatResponseSystem = null; // Sẽ được set từ bên ngoài
	}

	update(deltaTime, entities) {
		// Xóa các entity đã chết
		for (const [entityId, components] of entities) {
			const health = components.get('health');
			if (health && health.isDead && health.isDead()) {
				console.log(`Entity ${entityId} died.`);
				this.world.removeEntity(entityId);
			}
		}
	}

	// Gây sát thương từ attacker lên target
	applyDamage(attackerComponents, targetId) {
		const combatStats = attackerComponents.get('combatStats');
		if (!combatStats) return;

		const targetComponents = this.world.entities.get(targetId);
		if (!targetComponents) return;

		const targetHealth = targetComponents.get('health');
		const targetPosition = targetComponents.get('position');
		
		if (targetHealth && targetHealth.takeDamage) {
			const isDead = targetHealth.takeDamage(combatStats.damage);
			console.log(`Entity ${targetId} took ${combatStats.damage} damage. Remaining HP: ${targetHealth.current}`);
			
			// ⭐ Hiển thị damage text
			if (this.renderSystem && targetPosition) {
				this.renderSystem.createDamageText(targetId, combatStats.damage, targetPosition);
			}
			
			// ⭐ Kích hoạt đánh trả nếu target còn sống và chưa đang đánh trả
			if (!isDead && this.combatResponseSystem) {
				// Kiểm tra xem target có đang đánh trả chưa
				const targetCombatResponse = targetComponents.get('combatResponse');
				if (targetCombatResponse && !targetCombatResponse.isBeingAttacked) {
					// Tìm attacker ID từ attackerComponents
					for (const [entityId, components] of this.world.entities) {
						if (components === attackerComponents) {
							this.combatResponseSystem.startRetaliation(targetId, entityId);
							break;
						}
					}
				}
			}
			
			if (isDead) {
				// Sẽ được xóa trong lượt update kế tiếp
			}
		}
	}
}


