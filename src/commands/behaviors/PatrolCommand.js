// src/commands/behaviors/PatrolCommand.js

export class PatrolCommand {
    constructor(scene) {
        this.scene = scene;
    }

    execute(worldPoint) {
        console.log(`🚶 Patrol command: ${this.scene.selectedEntities.size} units from current position to (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`);
        
        // ⭐ TÌM Ô TRỐNG GẦN NHẤT
        const clickedGridPos = this.scene.gridManager.worldToGrid(worldPoint.x, worldPoint.y);
        const nearestWalkable = this.scene.gridManager.findNearestWalkableTile(clickedGridPos.x, clickedGridPos.y);
        const safeWorldPos = this.scene.gridManager.gridToWorldCenter(nearestWalkable.x, nearestWalkable.y);
        
        this.scene.selectedEntities.forEach(entityId => {
            const entity = this.scene.ecsWorld.entities.get(entityId);
            if (!entity) return;
            
            const position = entity.get('position');
            const behavior = entity.get('behavior');
            const ai = entity.get('ai');
            
            if (position && behavior) {
                // Patrol start point = current position, end point = safe position
                const patrolPoints = [
                    { x: position.x, y: position.y },
                    { x: safeWorldPos.x, y: safeWorldPos.y }
                ];
                
                behavior.setBehavior('patrol', { 
                    patrolPoints,
                    currentTarget: 1 // Start by moving to point B (index 1)
                });
                
                console.log(`  Unit ${entityId}: PATROLLING from (${position.x.toFixed(0)}, ${position.y.toFixed(0)}) to (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`);
                
                // Clear other components
                if (ai) ai.clearTarget();
                this.scene.ecsWorld.removeComponent(entityId, 'moveTarget');
                this.scene.ecsWorld.removeComponent(entityId, 'defencePosition');
            }
        });
    }
}
