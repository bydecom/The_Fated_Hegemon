// System xử lý các hành vi lái xe (Steering Behaviors) như tránh va chạm
import { Position } from '../components/Position.js';
import { Velocity } from '../components/Velocity.js';
import { Appearance } from '../components/Appearance.js';

const AVOIDANCE_RADIUS = 40; // Bán kính nhường đường
const MIN_DISTANCE = 18; // Khoảng cách tối thiểu giữa các đơn vị
const ROTATION_SMOOTHING = 0.15; // Hệ số làm mượt việc xoay (0.1 = rất mượt, 1.0 = tức thì)
const AVOIDANCE_STRENGTH = 80; // Lực nhường đường nhẹ (không mạnh)
const PUSH_OUT_FORCE = 300; // Lực đẩy ra nếu bị chồng lên nhau

export class SteeringSystem {
    constructor(scene, spatialHashGrid = null) {
        this.scene = scene;
        this.spatialHashGrid = spatialHashGrid; // ⭐ Spatial partitioning để tối ưu
    }

    update(deltaTime, entities) {
        const deltaInSeconds = deltaTime / 1000;
        
        // ⭐ CẬP NHẬT SPATIAL HASH GRID (nếu có)
        if (this.spatialHashGrid) {
            this.spatialHashGrid.clear();
            
            for (const [entityId, components] of entities) {
                // ⭐ SKIP buildings và mỏ tài nguyên tĩnh - không insert vào grid
                if (components.has('building')) continue;
                if (components.has('resourceNode') && !components.has('velocity')) continue;
                
                const position = components.get('position');
                const appearance = components.get('appearance');
                
                if (position && appearance) {
                    const size = appearance.size || 10;
                    this.spatialHashGrid.insert(entityId, position.x, position.y, size);
                }
            }
        }

        for (const [entityId, components] of entities) {
            const position = components.get('position');
            const velocity = components.get('velocity');
            const appearance = components.get('appearance');
            const behavior = components.get('behavior');

            if (position && velocity && appearance) {
                // ⭐ BỎ QUA STEERING CHO ENTITY ĐANG ATTACK hoặc BUILDING (để giữ nguyên animation)
                if (behavior && behavior.type === 'attack') {
                    continue;
                }
                
                // ⭐ BỎ QUA STEERING CHO BUILDING (đứng yên)
                if (components.has('building')) {
                    continue;
                }
                
                // ⭐ Skip mỏ tài nguyên tĩnh (có resourceNode nhưng không có velocity hoặc velocity = 0)
                if (components.has('resourceNode') && !components.has('velocity')) {
                    continue;
                }
                
                // ⭐ LƯU HƯỚNG DỰ ĐỊNH (intended direction) trước khi xử lý collision
                const intendedVelocityX = velocity.x;
                const intendedVelocityY = velocity.y;
                const hasIntendedDirection = Math.sqrt(intendedVelocityX * intendedVelocityX + intendedVelocityY * intendedVelocityY) > 0.5;
                
                // 1. ⭐ Áp dụng AVOIDANCE - nhường đường nhẹ
                // Sử dụng Spatial Hash Grid nếu có, nếu không fall back về method cũ
                if (this.spatialHashGrid) {
                    this.applySoftAvoidanceOptimized(entityId, position, appearance, velocity, entities, deltaInSeconds);
                } else {
                    const steerableEntities = Array.from(entities).filter(([id, components]) => 
                        components.has('position') && components.has('velocity') && components.has('appearance')
                    );
                    this.applySoftAvoidance(entityId, position, appearance, velocity, steerableEntities, deltaInSeconds);
                }
                
                // 2. Giới hạn vận tốc tối đa
                const ai = components.get('ai');
                const maxSpeed = ai ? ai.config.speed * 1.5 : 200;
                this.limitVelocity(velocity, maxSpeed);
                
                // 3. ⭐ Cập nhật orientation dựa trên HƯỚNG DỰ ĐỊNH
                if (hasIntendedDirection) {
                    this.updateSmoothOrientation(velocity, deltaTime, intendedVelocityX, intendedVelocityY);
                }
            }
        }
    }
    
    // ⭐ NEW OPTIMIZED: Avoidance sử dụng Spatial Hash Grid (O(N) thay vì O(N²))
    applySoftAvoidanceOptimized(currentId, currentPos, currentAppearance, velocity, allEntities, deltaTime) {
        const currentSize = currentAppearance ? currentAppearance.size : 10;
        const currentSpeed = velocity.getSpeed();
        
        // Nếu đang đứng yên, không bị đẩy
        if (currentSpeed < 0.1) return;
        
        // Vector hướng di chuyển (chuẩn hóa)
        const dirX = velocity.x / currentSpeed;
        const dirY = velocity.y / currentSpeed;
        
        // ⭐ CHỈ LẤY ENTITIES GẦN trong AVOIDANCE_RADIUS (Spatial query)
        const nearbyEntityIds = this.spatialHashGrid.queryRadius(
            currentPos.x, 
            currentPos.y, 
            AVOIDANCE_RADIUS + currentSize,
            currentId // Exclude self
        );
        
        let totalAvoidanceX = 0;
        let totalAvoidanceY = 0;
        
        // ⭐ CHỈ LOOP QUA VÀI CHỤC ENTITIES thay vì toàn bộ map
        for (const otherId of nearbyEntityIds) {
            const otherComponents = allEntities.get(otherId);
            if (!otherComponents) continue;
            
            // ⭐ KHÔNG tránh né building và mỏ tài nguyên tĩnh
            if (otherComponents.has('building')) continue;
            if (otherComponents.has('resourceNode') && !otherComponents.has('velocity')) continue;
            
            const otherPos = otherComponents.get('position');
            const otherAppearance = otherComponents.get('appearance');
            if (!otherPos) continue;
            
            const otherSize = otherAppearance ? otherAppearance.size : 10;
            const combinedSize = currentSize + otherSize;
            const minSafeDistance = Math.max(MIN_DISTANCE, combinedSize);
            
            const dx = otherPos.x - currentPos.x;
            const dy = otherPos.y - currentPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0 && distance < AVOIDANCE_RADIUS) {
                // Kiểm tra xem có đang di chuyển VỀ PHÍA entity khác không
                const dotProduct = dirX * dx + dirY * dy;
                
                // ⭐ CHỈ XỬ LÝ NẾU đang di chuyển về phía entity khác
                if (dotProduct > 0) {
                    const avoidanceFactor = 1.0 - (distance / AVOIDANCE_RADIUS);
                    const normalX = -dx / distance;
                    const normalY = -dy / distance;
                    const pushStrength = avoidanceFactor * avoidanceFactor;
                    
                    totalAvoidanceX += normalX * pushStrength;
                    totalAvoidanceY += normalY * pushStrength;
                }
                
                // ⭐ Nếu bị CHỒNG LÊN NHAU (bug) - đẩy mạnh ra ngoài
                if (distance < combinedSize * 0.9) {
                    const pushX = -dx / distance;
                    const pushY = -dy / distance;
                    velocity.x += pushX * PUSH_OUT_FORCE * deltaTime;
                    velocity.y += pushY * PUSH_OUT_FORCE * deltaTime;
                }
            }
        }
        
        // Áp dụng lực nhường đường (nhẹ nhàng)
        if (totalAvoidanceX !== 0 || totalAvoidanceY !== 0) {
            velocity.x += totalAvoidanceX * AVOIDANCE_STRENGTH * deltaTime;
            velocity.y += totalAvoidanceY * AVOIDANCE_STRENGTH * deltaTime;
        }
    }
    
    // ⭐ OLD: Áp dụng soft avoidance - đẩy nhẹ để nhường đường (Fallback O(N²))
    // CHỈ đẩy entity đang DI CHUYỂN VỀ PHÍA entity khác, không đẩy entity đang đứng yên
    applySoftAvoidance(currentId, currentPos, currentAppearance, velocity, allEntities, deltaTime) {
        const currentSize = currentAppearance ? currentAppearance.size : 10;
        const currentSpeed = velocity.getSpeed();
        
        // Nếu đang đứng yên, không bị đẩy
        if (currentSpeed < 0.1) return;
        
        // Vector hướng di chuyển (chuẩn hóa)
        const dirX = velocity.x / currentSpeed;
        const dirY = velocity.y / currentSpeed;
        
        let totalAvoidanceX = 0;
        let totalAvoidanceY = 0;

        for (const [otherId, otherComponents] of allEntities) {
            if (currentId === otherId) continue;

            // ⭐ KHÔNG tránh né building và mỏ tài nguyên tĩnh
            if (otherComponents.has('building')) continue;
            if (otherComponents.has('resourceNode') && !otherComponents.has('velocity')) continue;

            const otherPos = otherComponents.get('position');
            const otherAppearance = otherComponents.get('appearance');
            const otherVelocity = otherComponents.get('velocity');
            if (!otherPos) continue;
            
            const otherSize = otherAppearance ? otherAppearance.size : 10;
            const combinedSize = currentSize + otherSize;
            const minSafeDistance = Math.max(MIN_DISTANCE, combinedSize);
            
            const dx = otherPos.x - currentPos.x;
            const dy = otherPos.y - currentPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0 && distance < AVOIDANCE_RADIUS) {
                // Kiểm tra xem có đang di chuyển VỀ PHÍA entity khác không
                const dotProduct = dirX * dx + dirY * dy; // Tích vô hướng
                
                // ⭐ CHỈ XỬ LÝ NẾU đang di chuyển về phía entity khác
                if (dotProduct > 0) {
                    // Tính lực đẩy dựa trên khoảng cách (càng gần càng mạnh)
                    const avoidanceFactor = 1.0 - (distance / AVOIDANCE_RADIUS);
                    
                    // Vector đẩy ra (vuông góc hoặc lệch một chút so với hướng di chuyển)
                    // Tìm vector vuông góc với hướng đến entity khác
                    const normalX = -dx / distance;
                    const normalY = -dy / distance;
                    
                    // Lực đẩy tăng theo bình phương khi càng gần
                    const pushStrength = avoidanceFactor * avoidanceFactor;
                    
                    totalAvoidanceX += normalX * pushStrength;
                    totalAvoidanceY += normalY * pushStrength;
                }
                
                // ⭐ Nếu bị CHỒNG LÊN NHAU (bug) - đẩy mạnh ra ngoài
                if (distance < combinedSize * 0.9) {
                    const pushX = -dx / distance;
                    const pushY = -dy / distance;
                    velocity.x += pushX * PUSH_OUT_FORCE * deltaTime;
                    velocity.y += pushY * PUSH_OUT_FORCE * deltaTime;
                }
            }
        }
        
        // Áp dụng lực nhường đường (nhẹ nhàng)
        if (totalAvoidanceX !== 0 || totalAvoidanceY !== 0) {
            velocity.x += totalAvoidanceX * AVOIDANCE_STRENGTH * deltaTime;
            velocity.y += totalAvoidanceY * AVOIDANCE_STRENGTH * deltaTime;
        }
    }
    
    limitVelocity(velocity, maxSpeed) {
        const speed = velocity.getSpeed(); // Sử dụng method getSpeed từ Velocity.js
        if (speed > maxSpeed) {
            const ratio = maxSpeed / speed;
            velocity.x *= ratio;
            velocity.y *= ratio;
        }
    }
    
    // ⭐ NEW: Cập nhật orientation một cách mượt mà theo hướng di chuyển
    // intendedVx, intendedVy: Hướng dự định TRƯỚC KHI áp dụng separation (tránh bị lệch hướng)
    updateSmoothOrientation(velocity, deltaTime, intendedVx = null, intendedVy = null) {
        const speed = velocity.getSpeed();
        
        // Chỉ cập nhật orientation khi entity đang di chuyển
        if (speed > 0.5) {
            // ⭐ Tính góc mục tiêu dựa trên HƯỚNG DỰ ĐỊNH (không bị ảnh hưởng bởi separation)
            let targetAngle;
            if (intendedVx !== null && intendedVy !== null) {
                // Sử dụng hướng dự định (trước khi separation)
                targetAngle = Math.atan2(intendedVy, intendedVx);
            } else {
                // Fallback: sử dụng velocity hiện tại
                targetAngle = Math.atan2(velocity.y, velocity.x);
            }
            
            // Lấy góc hiện tại
            const currentAngle = velocity.orientation || 0;
            
            // Tính góc chênh lệch ngắn nhất (xử lý vòng tròn 2π)
            let angleDiff = targetAngle - currentAngle;
            
            // Chuẩn hóa góc về khoảng [-π, π]
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            // Làm mượt việc xoay (lerp)
            const smoothingFactor = Math.min(1.0, ROTATION_SMOOTHING * (deltaTime / 16)); // Chuẩn hóa theo 60fps
            velocity.orientation = currentAngle + angleDiff * smoothingFactor;
            
            // Chuẩn hóa orientation về khoảng [0, 2π]
            if (velocity.orientation < 0) velocity.orientation += 2 * Math.PI;
            if (velocity.orientation > 2 * Math.PI) velocity.orientation -= 2 * Math.PI;
        }
    }
}


