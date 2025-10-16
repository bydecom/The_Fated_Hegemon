// src/commands/behaviors/MoveCommand.js

export class MoveCommand {
    constructor(scene) {
        this.scene = scene;
    }

    execute(worldPoint) {
        this.scene.currentAttackTargetId = null;
        this.scene.renderSystem.setCurrentAttackTarget(null);
        this.scene.currentHarvestTargetId = null;
        this.scene.renderSystem.setCurrentHarvestTarget(null);
        
        // ⭐ TÌM Ô TRỐNG GẦN NHẤT để tránh click vào building
        const clickedGridPos = this.scene.gridManager.worldToGrid(worldPoint.x, worldPoint.y);
        const nearestWalkable = this.scene.gridManager.findNearestWalkableTile(clickedGridPos.x, clickedGridPos.y);
        const endGridPos = new Phaser.Math.Vector2(nearestWalkable.x, nearestWalkable.y);
        
        // Log để debug
        if (nearestWalkable.x !== clickedGridPos.x || nearestWalkable.y !== clickedGridPos.y) {
            console.log(`🚫 Click vào ô bị chiếm (${clickedGridPos.x}, ${clickedGridPos.y}), chuyển sang ô trống (${nearestWalkable.x}, ${nearestWalkable.y})`);
        }
        
        this.scene.selectedEntities.forEach(entityId => {
            const entity = this.scene.ecsWorld.entities.get(entityId);
            if (!entity) return;
            
            const ai = entity.get('ai');
            if (ai) ai.clearTarget();
            
            const pos = entity.get('position');
            const startGridPos = this.scene.gridManager.worldToGrid(pos.x, pos.y);
            this.scene.pathfindingManager.findPath(startGridPos, endGridPos, (path) => {
                if (path) {
                    ai.setPath(path);
                    entity.get('behavior').setBehavior('followPath');
                }
            });
            
            // Clear defence position
            this.scene.ecsWorld.removeComponent(entityId, 'defencePosition');
        });
    }
}
