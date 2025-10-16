// System xử lý logic liên quan đến faction (chủng tộc và bộ lạc)

export class FactionSystem {
    constructor(factionManager) {
        this.factionManager = factionManager;
    }
    
    update(deltaTime, entities) {
        // System này không cần update mỗi frame
        // Chủ yếu cung cấp helper methods
    }
    
    // ============================================
    // HELPER METHODS
    // ============================================
    
    // Lấy faction của một entity
    getFaction(entityComponents) {
        return entityComponents.get('faction');
    }
    
    // Kiểm tra xem 2 entities có phải đồng minh không
    areAllies(components1, components2) {
        const faction1 = this.getFaction(components1);
        const faction2 = this.getFaction(components2);
        
        if (!faction1 || !faction2) return false;
        
        return this.factionManager.areAllies(faction1.tribeId, faction2.tribeId);
    }
    
    // Kiểm tra xem 2 entities có phải kẻ thù không
    areEnemies(components1, components2) {
        const faction1 = this.getFaction(components1);
        const faction2 = this.getFaction(components2);
        
        if (!faction1 || !faction2) return false;
        
        return this.factionManager.areEnemies(faction1.tribeId, faction2.tribeId);
    }
    
    // Tìm tất cả enemies trong tầm nhìn
    findEnemiesInRange(entityComponents, allEntities, range, currentPos) {
        const currentFaction = this.getFaction(entityComponents);
        if (!currentFaction) return [];
        
        const enemies = [];
        
        for (const [entityId, components] of allEntities) {
            // Bỏ qua chính mình
            if (components === entityComponents) continue;
            
            const otherFaction = this.getFaction(components);
            if (!otherFaction) continue;
            
            // Kiểm tra xem có phải enemy không
            if (!this.factionManager.areEnemies(currentFaction.tribeId, otherFaction.tribeId)) {
                continue;
            }
            
            // Kiểm tra khoảng cách
            const otherPos = components.get('position');
            if (!otherPos) continue;
            
            const dx = otherPos.x - currentPos.x;
            const dy = otherPos.y - currentPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= range) {
                enemies.push({
                    entityId,
                    components,
                    distance
                });
            }
        }
        
        // Sắp xếp theo khoảng cách (gần nhất trước)
        enemies.sort((a, b) => a.distance - b.distance);
        
        return enemies;
    }
    
    // Tìm tất cả allies trong tầm nhìn
    findAlliesInRange(entityComponents, allEntities, range, currentPos) {
        const currentFaction = this.getFaction(entityComponents);
        if (!currentFaction) return [];
        
        const allies = [];
        
        for (const [entityId, components] of allEntities) {
            // Bỏ qua chính mình
            if (components === entityComponents) continue;
            
            const otherFaction = this.getFaction(components);
            if (!otherFaction) continue;
            
            // Kiểm tra xem có phải ally không
            if (!this.factionManager.areAllies(currentFaction.tribeId, otherFaction.tribeId)) {
                continue;
            }
            
            // Kiểm tra khoảng cách
            const otherPos = components.get('position');
            if (!otherPos) continue;
            
            const dx = otherPos.x - currentPos.x;
            const dy = otherPos.y - currentPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= range) {
                allies.push({
                    entityId,
                    components,
                    distance
                });
            }
        }
        
        allies.sort((a, b) => a.distance - b.distance);
        
        return allies;
    }
    
    // Query tất cả entities theo tribe
    getEntitiesByTribe(allEntities, tribeId) {
        const results = [];
        
        for (const [entityId, components] of allEntities) {
            const faction = this.getFaction(components);
            if (faction && faction.tribeId === tribeId) {
                results.push({ entityId, components });
            }
        }
        
        return results;
    }
    
    // Query tất cả entities theo race
    getEntitiesByRace(allEntities, raceId) {
        const results = [];
        
        for (const [entityId, components] of allEntities) {
            const faction = this.getFaction(components);
            if (faction && faction.raceId === raceId) {
                results.push({ entityId, components });
            }
        }
        
        return results;
    }
}

