// src/commands/behaviors/StopCommand.js

export class StopCommand {
    constructor(scene) {
        this.scene = scene;
    }

    execute() {
        console.log(`🛑 Stop command: ${this.scene.selectedEntities.size} units`);
        
        this.scene.selectedEntities.forEach(entityId => {
            const entity = this.scene.ecsWorld.entities.get(entityId);
            if (!entity) return;
            
            const ai = entity.get('ai');
            const behavior = entity.get('behavior');
            const position = entity.get('position');
            
            if (ai && behavior && position) {
                // Stop movement
                const velocity = entity.get('velocity');
                if (velocity) {
                    velocity.x = 0;
                    velocity.y = 0;
                }
                
                // Clear targets
                ai.clearTarget();
                
                // Set to "aggressive stance" - sẽ tự động phản công
                behavior.setBehavior('idle'); // AISystem sẽ tự động tìm enemies gần
                
                // Clear other components
                this.scene.ecsWorld.removeComponent(entityId, 'moveTarget');
                this.scene.ecsWorld.removeComponent(entityId, 'defencePosition');
                
                console.log(`  Unit ${entityId}: STOPPED at (${position.x.toFixed(0)}, ${position.y.toFixed(0)})`);
            }
        });
    }
}
