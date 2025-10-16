// src/commands/behaviors/HarvestCommand.js

export class HarvestCommand {
    constructor(scene) {
        this.scene = scene;
    }

    execute(worldPoint) {
        console.log(`🌾 Harvest command: ${this.scene.selectedEntities.size} units to harvest near (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`);
        
        // ⭐ Tìm resource gần nhất trong vùng
        let nearestResourceId = null;
        let nearestDistance = Infinity;
        
        this.scene.ecsWorld.entities.forEach((components, entityId) => {
            if (components.has('resourceNode') && components.has('position')) {
                const resourcePos = components.get('position');
                const dx = resourcePos.x - worldPoint.x;
                const dy = resourcePos.y - worldPoint.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestResourceId = entityId;
                }
            }
        });
        
        if (nearestResourceId) {
            console.log(`🌾 Found nearest resource: ${nearestResourceId} at distance ${nearestDistance.toFixed(0)}`);
            this.executeHarvestResource(nearestResourceId, worldPoint);
            return;
        }
        
        // Nếu không tìm thấy resource, di chuyển đến vị trí click
        this.scene.selectedEntities.forEach(entityId => {
            const entity = this.scene.ecsWorld.entities.get(entityId);
            if (!entity) return;
            
            const harvester = entity.get('harvester');
            if (!harvester) {
                console.log(`  Unit ${entityId}: Not a harvester unit, skipping`);
                return;
            }
            
            const behavior = entity.get('behavior');
            const ai = entity.get('ai');
            const position = entity.get('position');
            
            if (behavior && ai) {
                // Set harvest behavior - unit sẽ tự động tìm tài nguyên gần nhất
                behavior.setBehavior('harvest');
                
                // ⭐ Di chuyển đến vị trí được click trước
                ai.setTarget(worldPoint.x, worldPoint.y);
                
                console.log(`  Unit ${entityId}: MOVING to harvest near (${worldPoint.x.toFixed(0)}, ${worldPoint.y.toFixed(0)})`);
                
                // Clear other components
                this.scene.ecsWorld.removeComponent(entityId, 'moveTarget');
                this.scene.ecsWorld.removeComponent(entityId, 'defencePosition');
            }
        });
    }

    executeHarvestResource(resourceId, worldPoint) {
        console.log(`🌾 Harvest resource command: ${this.scene.selectedEntities.size} units → Resource ${resourceId}`);
        
        // ⭐ Highlight mỏ tài nguyên
        this.scene.currentHarvestTargetId = resourceId;
        this.scene.renderSystem.setCurrentHarvestTarget(resourceId);
        
        this.scene.selectedEntities.forEach(entityId => {
            const entity = this.scene.ecsWorld.entities.get(entityId);
            if (!entity) return;
            
            const harvester = entity.get('harvester');
            if (!harvester) {
                console.log(`  Unit ${entityId}: Not a harvester unit, skipping`);
                return;
            }
            
            const behavior = entity.get('behavior');
            const position = entity.get('position');
            const appearance = entity.get('appearance');
            if (!behavior || !position) return;
            
            // Lấy vị trí của mỏ tài nguyên
            const resourceEntity = this.scene.ecsWorld.entities.get(resourceId);
            if (!resourceEntity) return;
            
            const resourcePos = resourceEntity.get('position');
            const resourceAppearance = resourceEntity.get('appearance');
            if (!resourcePos) return;
            
            // ⭐ Set target resource ID trước khi di chuyển
            harvester.targetResourceId = resourceId;
            
            // Di chuyển đến mỏ tài nguyên và thu hoạch
            const dx = resourcePos.x - position.x;
            const dy = resourcePos.y - position.y;
            const centerDistance = Math.sqrt(dx * dx + dy * dy);
            
            // ⭐ Tính khoảng cách từ MÉP (edge-to-edge)
            const harvesterSize = appearance ? appearance.size : 10;
            const resourceSize = resourceAppearance ? resourceAppearance.size : 10;
            const edgeDistance = centerDistance - harvesterSize - resourceSize;
            
            console.log(`  Unit ${entityId}: Distance - center=${centerDistance.toFixed(0)}, edge=${edgeDistance.toFixed(0)}, range=${harvester.harvestRange}`);
            
            if (edgeDistance <= harvester.harvestRange) {
                // Đã đủ gần, bắt đầu thu hoạch ngay
                harvester.startHarvesting(resourceId);
                behavior.setBehavior('harvest');
                console.log(`  Unit ${entityId}: START HARVESTING resource ${resourceId}`);
            } else {
                // Di chuyển đến gần mỏ tài nguyên
                const ai = entity.get('ai');
                if (ai) {
                    const startGridPos = this.scene.gridManager.worldToGrid(position.x, position.y);
                    const resourceGridPos = this.scene.gridManager.worldToGrid(resourcePos.x, resourcePos.y);
                    
                    // ⭐ Tìm tile gần nhất có thể đi được xung quanh resource
                    const nearestWalkable = this.scene.gridManager.findNearestWalkableTile(resourceGridPos.x, resourceGridPos.y);
                    const endGridPos = new Phaser.Math.Vector2(nearestWalkable.x, nearestWalkable.y);
                    
                    console.log(`  Unit ${entityId}: Finding path from (${startGridPos.x}, ${startGridPos.y}) to (${endGridPos.x}, ${endGridPos.y})`);
                    
                    this.scene.pathfindingManager.findPath(startGridPos, endGridPos, (path) => {
                        if (path) {
                            ai.setPath(path);
                            behavior.setBehavior('followPath', { targetResourceId: resourceId }); // Ghi nhớ mỏ tài nguyên trong behavior
                            console.log(`  Unit ${entityId}: MOVING to resource ${resourceId}`);
                        } else {
                            console.log(`❌ Unit ${entityId}: No path found to resource ${resourceId}, trying direct movement`);
                            // Fallback: di chuyển trực tiếp đến resource
                            ai.setTarget(resourcePos.x, resourcePos.y);
                            behavior.setBehavior('harvest');
                            harvester.targetResourceId = resourceId; // Đảm bảo target được set
                        }
                    });
                }
            }
            
            // Clear other components
            const ai = entity.get('ai');
            if (ai) ai.clearTarget();
            this.scene.ecsWorld.removeComponent(entityId, 'moveTarget');
            this.scene.ecsWorld.removeComponent(entityId, 'defencePosition');
        });
    }
}
