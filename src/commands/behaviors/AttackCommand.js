// src/commands/behaviors/AttackCommand.js

export class AttackCommand {
    constructor(scene) {
        this.scene = scene;
    }

    execute(targetId, worldPoint) {
        console.log(`⚔️ Attack command: ${this.scene.selectedEntities.size} units → Target ${targetId}`);
        
        this.scene.currentAttackTargetId = targetId;
        this.scene.renderSystem.setCurrentAttackTarget(targetId);
        
        this.scene.selectedEntities.forEach(entityId => {
            const entity = this.scene.ecsWorld.entities.get(entityId);
            if (!entity) return;
            
            const ai = entity.get('ai');
            const behavior = entity.get('behavior');
            
            if (ai && behavior) {
                console.log(`  Unit ${entityId}: Setting target ${targetId} and chase behavior`);
                ai.setTargetId(targetId);
                behavior.setBehavior('chase', { manualAttack: true });
                
                // Clear other command components
                this.scene.ecsWorld.removeComponent(entityId, 'moveTarget');
                this.scene.ecsWorld.removeComponent(entityId, 'defencePosition');
            } else {
                console.log(`❌ Unit ${entityId}: Missing AI or Behavior component`);
            }
        });
    }

    executeAttackMove(worldPoint) {
        console.log(`⚔️🚶 Attack-Move command: ${this.scene.selectedEntities.size} units → (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`);
        
        // ⭐ TÌM Ô TRỐNG GẦN NHẤT
        const clickedGridPos = this.scene.gridManager.worldToGrid(worldPoint.x, worldPoint.y);
        const nearestWalkable = this.scene.gridManager.findNearestWalkableTile(clickedGridPos.x, clickedGridPos.y);
        const endGridPos = new Phaser.Math.Vector2(nearestWalkable.x, nearestWalkable.y);
        
        this.scene.selectedEntities.forEach(entityId => {
            const entity = this.scene.ecsWorld.entities.get(entityId);
            if (!entity) return;
            
            const ai = entity.get('ai');
            const behavior = entity.get('behavior');
            const pos = entity.get('position');
            
            if (ai && behavior && pos) {
                // Clear any previous target
                ai.clearTarget();
                
                // Set pathfinding to destination
                const startGridPos = this.scene.gridManager.worldToGrid(pos.x, pos.y);
                this.scene.pathfindingManager.findPath(startGridPos, endGridPos, (path) => {
                    if (path) {
                        ai.setPath(path);
                        // Set followPath behavior with manualAttack flag (auto-attack enemies on the way)
                        behavior.setBehavior('followPath', { manualAttack: true });
                    }
                });
                
                // Clear other command components
                this.scene.ecsWorld.removeComponent(entityId, 'moveTarget');
                this.scene.ecsWorld.removeComponent(entityId, 'defencePosition');
                
                console.log(`  Unit ${entityId}: ATTACK-MOVING to (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`);
            }
        });
    }
}
