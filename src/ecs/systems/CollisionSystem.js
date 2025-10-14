// src/ecs/systems/CollisionSystem.js

export class CollisionSystem {
    update(deltaTime, entities) {
        const units = [];
        for (const [id, components] of entities) {
            if (components.has('position') && components.has('appearance')) {
                units.push(components);
            }
        }

        for (let i = 0; i < units.length; i++) {
            for (let j = i + 1; j < units.length; j++) {
                const compsA = units[i];
                const compsB = units[j];

                const posA = compsA.get('position');
                const posB = compsB.get('position');
                const appearanceA = compsA.get('appearance');
                const appearanceB = compsB.get('appearance');

                const dx = posA.x - posB.x;
                const dy = posA.y - posB.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                const minDistance = appearanceA.size + appearanceB.size;

                if (distance < minDistance && distance > 0) {
                    // ⭐ BẮT ĐẦU SỬA LỖI
                    const isABuilding = compsA.has('building');
                    const isBBuilding = compsB.has('building');
                    
                    const overlap = minDistance - distance;
                    const pushX = (dx / distance) * overlap;
                    const pushY = (dy / distance) * overlap;

                    if (isABuilding && isBBuilding) {
                        // Hai công trình va vào nhau -> không làm gì cả
                        continue;
                    } else if (isABuilding) {
                        // A là nhà, B là lính -> Chỉ đẩy lính B
                        posB.x -= pushX;
                        posB.y -= pushY;
                    } else if (isBBuilding) {
                        // B là nhà, A là lính -> Chỉ đẩy lính A
                        posA.x += pushX;
                        posA.y += pushY;
                    } else {
                        // Cả hai đều là lính -> Đẩy cả hai ra
                        const pushFactor = 0.5;
                        posA.x += pushX * pushFactor;
                        posA.y += pushY * pushFactor;
                        posB.x -= pushX * pushFactor;
                        posB.y -= pushY * pushFactor;
                    }
                    // ⭐ KẾT THÚC SỬA LỖI
                }
            }
        }
    }
}