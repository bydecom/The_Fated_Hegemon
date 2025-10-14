// Component chỉ số chiến đấu

export class CombatStats {
	constructor(damage = 20, attackRange = 100, attackRate = 1000) {
		this.damage = damage; // Sát thương mỗi đòn
		this.attackRange = attackRange; // Phạm vi tấn công (px)
		this.attackRate = attackRate; // Thời gian hồi giữa các đòn (ms)
		this.attackCooldown = 0; // Thời gian hồi còn lại (ms)
	}

	canAttack(deltaTime) {
		// Giảm cooldown theo thời gian trôi qua
		this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
		return this.attackCooldown === 0;
	}

	resetCooldown() {
		this.attackCooldown = this.attackRate;
	}
}


