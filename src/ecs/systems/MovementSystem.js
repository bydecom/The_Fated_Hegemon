export class MovementSystem {
    update(deltaTime, entities) {
        // Chuyển deltaTime từ mili giây sang giây để tính toán cho đúng
        const deltaInSeconds = deltaTime / 1000;

        entities.forEach((components, entityId) => {
            const position = components.get('position');
            const velocity = components.get('velocity');

            if (position && velocity) {
                // Cập nhật vị trí dựa trên velocity
                // Vị trí += Vận tốc * Thời gian (giây)
                position.x += velocity.x * deltaInSeconds;
                position.y += velocity.y * deltaInSeconds;

                // ⭐ Orientation giờ được xử lý bởi SteeringSystem (smooth rotation)
                // Không gọi updateOrientation() ở đây nữa để tránh xung đột
            }
        });
    }
}