// Component để phân loại entity: unit, building, resource, etc.
export class EntityType {
    constructor(type) {
        this.type = type; // 'unit', 'building', 'resource', 'animal'
    }
    
    isUnit() {
        return this.type === 'unit';
    }
    
    isBuilding() {
        return this.type === 'building';
    }
    
    isResource() {
        return this.type === 'resource';
    }
    
    isAnimal() {
        return this.type === 'animal';
    }
    
    setType(type) {
        this.type = type;
    }
}
