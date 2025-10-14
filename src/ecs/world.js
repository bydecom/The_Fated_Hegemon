// File trung tâm để khởi tạo và đăng ký các System
// BỘ NÃO CỦA GAME - Toàn bộ logic nằm ở đây

export class ECSWorld {
    constructor(scene) {
        this.entities = new Map();
        this.systems = [];
        this.scene = scene;
        // NEW: Query cache for performance
        this.queryCache = new Map();
    }

    addSystem(system) {
        this.systems.push(system);
        // Pass the world instance and scene to the system
        system.world = this;
        system.scene = this.scene;
    }

    createEntity() {
        const id = Math.random().toString(36).substr(2, 9);
        this.entities.set(id, new Map());
        return id;
    }

    addComponent(entityId, componentName, componentData) {
        if (this.entities.has(entityId)) {
            this.entities.get(entityId).set(componentName, componentData);
            // Invalidate cache when components change
            this.queryCache.clear();
        }
    }
    
    removeComponent(entityId, componentName) {
        if (this.entities.has(entityId)) {
            this.entities.get(entityId).delete(componentName);
            this.queryCache.clear();
        }
    }

    update(deltaTime) {
        this.systems.forEach(system => {
            if (system.update) {
                // Pass all entities to the system
                system.update(deltaTime, this.entities);
            }
        });
    }

    removeEntity(entityId) {
        if (this.entities.has(entityId)) {
            this.entities.delete(entityId);
            this.queryCache.clear();
        }
    }

    // NEW: Powerful query system
    query = {
        all: (...componentClasses) => {
            const key = componentClasses.map(c => c.name).join(',');
            if (this.queryCache.has(key)) {
                return this.queryCache.get(key);
            }

            const componentNames = componentClasses.map(c => {
                // simple name mapping for now
                const name = c.name.charAt(0).toLowerCase() + c.name.slice(1);
                return name;
            });
            
            const results = [];
            for (const [id, components] of this.entities.entries()) {
                const hasAll = componentNames.every(name => components.has(name));
                if (hasAll) {
                    // Create a simple entity-like object for convenience
                    results.push({
                        id,
                        get: (componentClass) => components.get(componentClass.name.charAt(0).toLowerCase() + componentClass.name.slice(1)),
                        has: (componentClass) => components.has(componentClass.name.charAt(0).toLowerCase() + componentClass.name.slice(1)),
                    });
                }
            }
            this.queryCache.set(key, { get: () => results });
            return { get: () => results };
        }
    }
}