// Boar Animal - Neutral
import { Position } from '../../components/common/Position.js';
import { Health } from '../../components/common/Health.js';
import { Appearance } from '../../components/common/Appearance.js';
import { Animation } from '../../components/common/Animation.js';
import { ResourceNode } from '../../components/resources/ResourceNode.js';
import { Behavior } from '../../components/units/Behavior.js';
import { AI } from '../../components/units/AI.js';

export class Boar {
    static create(ecsWorld, x, y, meatAmount = 200) {
        const entityId = ecsWorld.createEntity();
        
        // Base components
        ecsWorld.addComponent(entityId, 'position', new Position(x, y));
        ecsWorld.addComponent(entityId, 'health', new Health(100, 100));
        ecsWorld.addComponent(entityId, 'appearance', new Appearance(0x2F2F2F, 32, 'circle'));
        
        // Animal-specific components
        ecsWorld.addComponent(entityId, 'resourceNode', new ResourceNode('meat', meatAmount, 1));
        ecsWorld.addComponent(entityId, 'behavior', new Behavior('wander', { speed: 30, interval: 2000 }));
        ecsWorld.addComponent(entityId, 'ai', new AI('wander'));
        
        // Animation
        ecsWorld.addComponent(entityId, 'animation', new Animation('boar', 'idle', 'down'));
        
        console.log(`🐗 Created boar at (${x}, ${y}) with ${meatAmount} meat`);
        return entityId;
    }
    
    // Factory method với config
    static createWithConfig(ecsWorld, x, y, config) {
        const entityId = this.create(ecsWorld, x, y, config.meatAmount || 200);
        
        // Apply custom config
        if (config.health) {
            const health = ecsWorld.entities.get(entityId).get('health');
            if (health) {
                health.current = config.health;
                health.maximum = config.health;
            }
        }
        
        if (config.speed) {
            const behavior = ecsWorld.entities.get(entityId).get('behavior');
            if (behavior) {
                behavior.params.speed = config.speed;
            }
        }
        
        return entityId;
    }
}
