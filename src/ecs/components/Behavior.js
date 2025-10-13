// Component hành vi - Định nghĩa loại hành vi của entity

export class Behavior {
    constructor(type = 'idle', data = {}) {
        this.type = type; // 'idle', 'patrol', 'chase', 'flee', 'wander'
        this.data = data; // Dữ liệu cụ thể cho từng loại hành vi
        this.timer = 0;
        this.state = 'active'; // 'active', 'paused', 'completed'
    }

    setBehavior(type, data = {}) {
        this.type = type;
        this.data = data;
        this.timer = 0;
        this.state = 'active';
    }

    update(deltaTime) {
        if (this.state === 'active') {
            this.timer += deltaTime;
        }
    }

    reset() {
        this.timer = 0;
        this.state = 'active';
    }
}
// System xử lý hành vi của entities

export class BehaviorSystem {
    constructor(scene) {
        this.scene = scene;
    }

    update(deltaTime, entities) {
        for (const [entityId, components] of entities) {
            const behavior = components.get('behavior');
            const position = components.get('position');
            const velocity = components.get('velocity');

            if (behavior && position && velocity) {
                this.processBehavior(entityId, behavior, position, velocity, components, deltaTime);
            }
        }
    }

    processBehavior(entityId, behavior, position, velocity, components, deltaTime) {
        behavior.update(deltaTime);

        switch (behavior.type) {
            case 'idle':
                velocity.x = 0;
                velocity.y = 0;
                break;
            
            // NEW BEHAVIOR for player commands
            case 'moveToTarget':
                const moveTarget = components.get('moveTarget');
                if (moveTarget) {
                    const dx = moveTarget.x - position.x;
                    const dy = moveTarget.y - position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 10) { // Arrived at destination
                        velocity.x = 0;
                        velocity.y = 0;
                        behavior.setBehavior('idle');
                        // Use the world instance to remove the component
                        this.scene.ecsWorld.removeComponent(entityId, 'moveTarget');
                    } else {
                        const ai = components.get('ai');
                        const speed = ai ? ai.config.speed : 100;
                        velocity.x = (dx / distance) * speed;
                        velocity.y = (dy / distance) * speed;
                    }
                } else {
                    // Target was removed or doesn't exist, go back to idle
                    behavior.setBehavior('idle');
                }
                break;
                
            case 'wander':
                 if (behavior.timer < (behavior.data.interval || 2000)) {
                    return; // Not time to change direction yet
                }
                const angle = Phaser.Math.Between(0, 360) * Math.PI / 180;
                const speed = behavior.data.speed || 50;
                velocity.x = Math.cos(angle) * speed;
                velocity.y = Math.sin(angle) * speed;
                behavior.timer = 0;
                break;

            // Other cases like patrol, chase, flee remain similar...
        }
    }
}
