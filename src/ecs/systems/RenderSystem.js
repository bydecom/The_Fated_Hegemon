// Logic xử lý dữ liệu - Hệ thống render

export class RenderSystem {
    constructor(scene) {
        this.scene = scene;
        this.sprites = new Map();
    }

    update(deltaTime, entities) {
        // Vẽ sprite từ ECS
        entities.forEach((components, entityId) => {
            const position = components.get('position');
            const health = components.get('health');
            const appearance = components.get('appearance');

            if (position) {
                if (!this.sprites.has(entityId)) {
                    // Tạo sprite mới nếu chưa có
                    this.sprites.set(entityId, this.createSprite(position, health, appearance));
                } else {
                    // Cập nhật vị trí và thuộc tính sprite
                    const sprite = this.sprites.get(entityId);
                    sprite.x = position.x;
                    sprite.y = position.y;
                    
                    if (appearance) {
                        sprite.setAlpha(appearance.alpha);
                    }
                }
            }
        });
        
        // Xóa sprite của entity đã bị xóa
        this.sprites.forEach((sprite, entityId) => {
            if (!entities.has(entityId)) {
                sprite.destroy();
                this.sprites.delete(entityId);
            }
        });
    }

    createSprite(position, health, appearance) {
        const size = appearance ? appearance.size : 20;
        const color = appearance ? appearance.color : 0x00ff00;
        const shape = appearance ? appearance.shape : 'circle';
        const alpha = appearance ? appearance.alpha : 1.0;

        let sprite;
        
        switch (shape) {
            case 'circle':
                sprite = this.scene.add.circle(position.x, position.y, size, color);
                break;
            case 'rectangle':
                sprite = this.scene.add.rectangle(position.x, position.y, size * 2, size * 2, color);
                break;
            case 'triangle':
                sprite = this.scene.add.polygon(position.x, position.y, [
                    0, -size,
                    -size, size,
                    size, size
                ], color);
                break;
            default:
                sprite = this.scene.add.circle(position.x, position.y, size, color);
        }

        sprite.setAlpha(alpha);
        return sprite;
    }
}
