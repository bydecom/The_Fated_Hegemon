// Logic xử lý dữ liệu - Hệ thống di chuyển

export class MovementSystem {
    update(deltaTime, entities) {
        // TODO: Xử lý di chuyển entities
        entities.forEach((components, entityId) => {
            const position = components.get('position');
            const velocity = components.get('velocity');

            if (position && velocity) {
                // Cập nhật vị trí dựa trên velocity
                position.x += velocity.x * deltaTime;
                position.y += velocity.y * deltaTime;
            }
        });
    }
}
