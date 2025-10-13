// File trung tâm để khởi tạo và đăng ký các System
// BỘ NÃO CỦA GAME - Toàn bộ logic nằm ở đây

export class ECSWorld {
    constructor() {
        // TODO: Khởi tạo ECS World
        this.entities = new Map();
        this.systems = [];
    }

    // TODO: Đăng ký các System
    addSystem(system) {
        this.systems.push(system);
    }

    // TODO: Quản lý Entity và Component
    createEntity() {
        const id = Math.random().toString(36).substr(2, 9);
        this.entities.set(id, new Map());
        return id;
    }

    addComponent(entityId, componentName, componentData) {
        if (this.entities.has(entityId)) {
            this.entities.get(entityId).set(componentName, componentData);
        }
    }

    update(deltaTime) {
        this.systems.forEach(system => {
            if (system.update) {
                system.update(deltaTime, this.entities);
            }
        });
    }
}
