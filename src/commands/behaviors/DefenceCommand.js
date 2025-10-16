// src/commands/behaviors/DefenceCommand.js

import { DefencePosition } from '../../entities/components/units/DefencePosition.js';

export class DefenceCommand {
    constructor(scene) {
        this.scene = scene;
    }

    execute(worldPoint) {
        console.log(`🛡️ Defence command: ${this.scene.selectedEntities.size} units at (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`);
        
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
                // Set defence position (sử dụng vị trí an toàn)
                const defenceX = safeWorldPos.x;
                const defenceY = safeWorldPos.y;
                
                const defencePosition = new DefencePosition(defenceX, defenceY, 100);
                this.scene.ecsWorld.addComponent(entityId, 'defencePosition', defencePosition);
                
                // Set behavior to defence
                behavior.setBehavior('defence');
                
                // Clear other components
                if (ai) ai.clearTarget();
                this.scene.ecsWorld.removeComponent(entityId, 'moveTarget');
                
                console.log(`  Unit ${entityId}: DEFENDING at (${defenceX.toFixed(0)}, ${defenceY.toFixed(0)})`);
            }
        });
    }
}
