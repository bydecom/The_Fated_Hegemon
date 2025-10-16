import { ResourceNode } from '../../../entities/components/resources/ResourceNode.js';
import { Harvester } from '../../../entities/components/units/Harvester.js';
import { ResourceStorage } from '../../../entities/components/resources/ResourceStorage.js';

export class HarvestSystem {
    constructor(scene, resourceManager) {
        this.scene = scene;
        this.resourceManager = resourceManager;
    }

    update(deltaTime, entities) {
        for (const [entityId, components] of entities) {
            // Xử lý thu hoạch cho đơn vị có Harvester
            if (components.has('harvester')) {
                this.processHarvester(entityId, components, entities, deltaTime);
            }

            // Xử lý tài nguyên bị cạn kiệt
            if (components.has('resourceNode')) {
                this.processResourceNode(entityId, components);
            }
        }
    }

    processHarvester(entityId, components, allEntities, deltaTime) {
        const harvester = components.get('harvester');
        const position = components.get('position');
        const behavior = components.get('behavior');
        const appearance = components.get('appearance');

        if (!position || !behavior || !appearance) return;

        // Nếu đang thu hoạch
        if (harvester.isHarvesting && harvester.targetResourceId) {
            const targetEntity = allEntities.get(harvester.targetResourceId);
            if (!targetEntity) {
                harvester.stopHarvesting();
                return;
            }

            const targetComponents = targetEntity;
            const targetPosition = targetComponents.get('position');
            const targetResource = targetComponents.get('resourceNode');

            if (!targetPosition || !targetResource) {
                harvester.stopHarvesting();
                return;
            }

            // Kiểm tra khoảng cách
            const centerDistance = Math.sqrt(
                Math.pow(position.x - targetPosition.x, 2) + 
                Math.pow(position.y - targetPosition.y, 2)
            );
            
            // ⭐ Tính khoảng cách từ MÉP (edge-to-edge)
            const targetAppearance = targetComponents.get('appearance');
            const harvesterSize = appearance ? appearance.size : 10;
            const resourceSize = targetAppearance ? targetAppearance.size : 10;
            const edgeDistance = centerDistance - harvesterSize - resourceSize;

            if (edgeDistance > harvester.harvestRange) {
                // Quá xa, dừng thu hoạch
                harvester.stopHarvesting();
                return;
            }

            // Kiểm tra kho đã đầy chưa
            if (harvester.isFull()) {
                harvester.stopHarvesting();
                behavior.setBehavior('idle');
                return;
            }

            // Kiểm tra tài nguyên còn không
            if (!targetResource.hasResources()) {
                harvester.stopHarvesting();
                return;
            }

            // Thu hoạch
            harvester.harvestTimer += deltaTime;
            if (harvester.harvestTimer >= harvester.harvestInterval) {
                // ⭐ Thu hoạch 1 giây đầy đủ (harvestInterval = 1000ms = 1 giây)
                const harvestDuration = harvester.harvestInterval / 1000; // 1 giây
                const harvested = targetResource.harvest(harvestDuration);
                
                if (harvested > 0) {
                    // ⭐ CỘNG TRỰC TIẾP VÀO RESOURCE MANAGER
                    this.resourceManager.addResource(targetResource.resourceType, harvested);
                    
                    // ⭐ CẬP NHẬT UI
                    if (this.scene.uiScene) {
                        this.scene.uiScene.updateResourceDisplay(this.resourceManager);
                    }
                    
                    // ⭐ HIỂN thị floating text
                    this.showHarvestText(position, targetResource.resourceType, harvested);
                    
                    console.log(`🌾 ${entityId} thu hoạch ${harvested.toFixed(1)} ${targetResource.resourceType}`);
                }
                harvester.harvestTimer = 0;
            }

            // Dừng di chuyển khi thu hoạch
            const velocity = components.get('velocity');
            if (velocity) {
                velocity.x = 0;
                velocity.y = 0;
            }

        } else if (behavior.type === 'harvest') {
            // Tìm tài nguyên gần nhất để thu hoạch (tìm trong phạm vi rộng hơn)
            const searchRange = harvester.harvestRange * 3; // Tìm trong phạm vi 3x harvestRange
            const nearestResource = this.findNearestResource(position, allEntities, searchRange);
            if (nearestResource) {
                harvester.startHarvesting(nearestResource);
                console.log(`🎯 ${entityId} bắt đầu thu hoạch ${nearestResource}`);
            } else {
                console.log(`❌ ${entityId} không tìm thấy tài nguyên trong phạm vi ${searchRange}`);
                behavior.setBehavior('idle');
            }
        }
    }

    processResourceNode(entityId, components) {
        const resourceNode = components.get('resourceNode');
        const appearance = components.get('appearance');

        if (!resourceNode || !appearance) return;

        // Nếu tài nguyên cạn kiệt, ẩn hoặc xóa
        if (resourceNode.isDepleted) {
            // Có thể thay đổi màu sắc hoặc ẩn
            if (appearance.color) {
                appearance.color = 0x666666; // Màu xám khi cạn kiệt
            }
            appearance.alpha = 0.3; // Làm mờ
        }
    }

    findNearestResource(position, allEntities, maxRange) {
        let nearestId = null;
        let nearestDistance = maxRange;

        for (const [entityId, components] of allEntities) {
            if (!components.has('resourceNode')) continue;

            const targetPosition = components.get('position');
            if (!targetPosition) continue;

            const distance = Math.sqrt(
                Math.pow(position.x - targetPosition.x, 2) + 
                Math.pow(position.y - targetPosition.y, 2)
            );

            if (distance < nearestDistance) {
                const resourceNode = components.get('resourceNode');
                if (resourceNode && resourceNode.hasResources()) {
                    nearestId = entityId;
                    nearestDistance = distance;
                }
            }
        }

        return nearestId;
    }

    // Lệnh thu hoạch cho đơn vị
    commandHarvest(entityId, entities) {
        const components = entities.get(entityId);
        if (!components) return false;

        const behavior = components.get('behavior');
        const harvester = components.get('harvester');

        if (!behavior || !harvester) return false;

        behavior.setBehavior('harvest');
        return true;
    }

    // Lệnh giao nộp tài nguyên
    commandDeposit(entityId, entities) {
        const components = entities.get(entityId);
        if (!components) return false;

        const harvester = components.get('harvester');
        if (!harvester || harvester.currentLoad === 0) return false;

        // Giao nộp tài nguyên vào ResourceManager
        const resources = this.getCarriedResources(harvester);
        for (const [resourceType, amount] of Object.entries(resources)) {
            this.resourceManager.addResource(resourceType, amount);
        }

        // Làm trống kho
        harvester.emptyLoad();
        console.log(`📦 ${entityId} giao nộp tài nguyên:`, resources);
        return true;
    }

    getCarriedResources(harvester) {
        // Tạm thời trả về tài nguyên mặc định
        // Trong thực tế cần lưu loại tài nguyên đang mang
        return {
            wood: harvester.currentLoad
        };
    }

    // ⭐ Hiển thị floating text khi thu hoạch
    showHarvestText(position, resourceType, amount) {
        if (!this.scene) return;

        // Màu sắc tùy theo loại tài nguyên
        const resourceColors = {
            'wood': '#8B4513',   // Nâu
            'gold': '#FFD700',   // Vàng
            'silver': '#C0C0C0', // Xám bạc
            'stone': '#808080',  // Xám đá
            'water': '#1E90FF',  // Xanh nước
            'meat': '#D2691E'    // Nâu đỏ
        };

        const color = resourceColors[resourceType] || '#00ff00';
        const text = `+${Math.round(amount)}`;

        // Tạo text object
        const floatingText = this.scene.add.text(position.x, position.y - 30, text, {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: color,
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
        floatingText.setDepth(1001);
        floatingText.setOrigin(0.5, 0.5);

        // Animation: bay lên và mờ dần
        this.scene.tweens.add({
            targets: floatingText,
            y: position.y - 60,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                floatingText.destroy();
            }
        });
    }
}
