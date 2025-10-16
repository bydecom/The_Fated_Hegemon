// Archer Unit - Player
import { Position } from '../../components/common/Position.js';
import { Health } from '../../components/common/Health.js';
import { Appearance } from '../../components/common/Appearance.js';
import { Animation } from '../../components/common/Animation.js';
import { CombatStats } from '../../components/units/CombatStats.js';
import { AI } from '../../components/units/AI.js';
import { Behavior } from '../../components/units/Behavior.js';
import { Faction } from '../../../factions/Faction.js';

export class Archer {
    static create(ecsWorld, x, y, faction = 'human') {
        const entityId = ecsWorld.createEntity();
        
        // Base components
        ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        ecsWorld.addComponent(entityId, 'health', new Health(80, 80));
        ecsWorld.addComponent(entityId, 'appearance', new Appearance(0x9932CC, 10, 'triangle'));
        
        // Unit-specific components
        ecsWorld.addComponent(entityId, 'combatStats', new CombatStats(15, 150, 800)); // 15 damage, 150 range, 800ms cooldown
        ecsWorld.addComponent(entityId, 'ai', new AI('idle', { speed: 130 }));
        ecsWorld.addComponent(entityId, 'behavior', new Behavior('idle'));
        
        // Faction
        ecsWorld.addComponent(entityId, 'faction', new Faction(faction, 'kingdom'));
        
        // Animation
        ecsWorld.addComponent(entityId, 'animation', new Animation('archer', 'idle', 'down'));
        
        console.log(`🏹 Created archer at (${x}, ${y})`);
        return entityId;
    }
    
    // Factory method với config
    static createWithConfig(ecsWorld, x, y, config) {
        const entityId = this.create(ecsWorld, x, y, config.faction);
        
        // Apply custom config
        if (config.stats) {
            const combatStats = ecsWorld.entities.get(entityId).get('combatStats');
            if (combatStats) {
                combatStats.damage = config.stats.damage || combatStats.damage;
                combatStats.attackRange = config.stats.attackRange || combatStats.attackRange;
                combatStats.attackRate = config.stats.attackRate || combatStats.attackRate;
            }
        }
        
        if (config.color) {
            const appearance = ecsWorld.entities.get(entityId).get('appearance');
            if (appearance) {
                appearance.setColor(config.color);
            }
        }
        
        return entityId;
    }
}
