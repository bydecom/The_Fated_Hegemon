// src/ecs/systems/RenderSystem.js

const FOG_STATE = { UNSEEN: 0, SEEN: 1, VISIBLE: 2 };

export class RenderSystem {
    constructor(scene, gridManager, fogManager) {
        this.scene = scene;
        this.gridManager = gridManager;
        this.fogManager = fogManager;

        // Đổi sang containers để chứa body + weapon
        this.containers = new Map();
        this.selectionGraphics = this.scene.add.graphics().setDepth(999);
        this.currentSelectionRect = null;
        
        // ⭐ NEW: ID của đơn vị địch đang bị target
        this.attackTargetId = null;
        
        // ⭐ NEW: ID của mỏ tài nguyên đang thu hoạch
        this.harvestTargetId = null;
        
        // ⭐ NEW: Floating damage texts
        this.damageTexts = new Map(); // entityId -> array of damage text objects
        
        // ⭐ NEW: Graphics để vẽ thanh máu (vẽ mỗi frame)
        this.healthBarGraphics = this.scene.add.graphics().setDepth(998);
    }

    setSelectionBox(rect) { this.currentSelectionRect = rect; }
    clearSelectionBox() { this.currentSelectionRect = null; }
    
    // ⭐ NEW: Setter để DemoScene gửi ID mục tiêu
    setCurrentAttackTarget(entityId) {
        this.attackTargetId = entityId;
    }
    
    // ⭐ NEW: Setter để DemoScene gửi ID mỏ tài nguyên đang thu hoạch
    setCurrentHarvestTarget(entityId) {
        this.harvestTargetId = entityId;
    }

    update(deltaTime, entities) {
        this.selectionGraphics.clear();
        this.healthBarGraphics.clear(); // ⭐ Clear thanh máu mỗi frame
        
        // ⭐ Ẩn resource info text nếu không có harvest target
        if (this.resourceInfoText) {
            this.resourceInfoText.setVisible(false);
        }
        
        if (this.currentSelectionRect) {
            this.selectionGraphics.fillStyle(0x00ff00, 0.2);
            this.selectionGraphics.fillRect(this.currentSelectionRect.x, this.currentSelectionRect.y, this.currentSelectionRect.width, this.currentSelectionRect.height);
            this.selectionGraphics.lineStyle(1, 0x00ff00, 1);
            this.selectionGraphics.strokeRect(this.currentSelectionRect.x, this.currentSelectionRect.y, this.currentSelectionRect.width, this.currentSelectionRect.height);
        }

        entities.forEach((components, entityId) => {
            const position = components.get('position');
            const velocity = components.get('velocity');
            const appearance = components.get('appearance');
            if (!position || !appearance) return;

            let container = this.containers.get(entityId);
            if (!container) {
                container = this.createLayeredSprite(position, appearance);
                
                // ⭐ Set depth: Buildings thấp hơn units
                if (components.has('building')) {
                    container.setDepth(5); // Buildings ở dưới
                } else {
                    container.setDepth(10); // Units ở trên
                }
                
                this.containers.set(entityId, container);
            }

            // Cập nhật vị trí container
            container.x = position.x;
            container.y = position.y;

            // Cập nhật rotation theo orientation nếu có velocity
            if (velocity) {
                container.rotation = velocity.orientation || 0;
            }

            const gridPos = this.gridManager.worldToGrid(position.x, position.y);
            // Thêm kiểm tra để đảm bảo gridPos hợp lệ
            if (!this.fogManager.fogGrid[gridPos.y] || this.fogManager.fogGrid[gridPos.y][gridPos.x] === undefined) {
                container.setVisible(false);
                return;
            }
            const fogState = this.fogManager.fogGrid[gridPos.y][gridPos.x];

            let isVisible = false;
            
            if (fogState === FOG_STATE.VISIBLE) {
                isVisible = true;
                // Reset màu gốc cho body
                if (container.body && container.body.fillColor !== undefined) {
                    container.body.fillColor = appearance.color;
                }
            } else if (fogState === FOG_STATE.SEEN) {
                if (components.has('building')) {
                    isVisible = true;
                    if (container.body && container.body.fillColor !== undefined) {
                        container.body.fillColor = 0x808080;
                    }
                }
            }

            container.setVisible(isVisible);

            // ⭐ LOGIC HIGHLIGHT Mục tiêu (Viền Đỏ)
            if (isVisible && entityId === this.attackTargetId) {
                this.selectionGraphics.lineStyle(2, 0xff0000, 1); // Viền đỏ cho mục tiêu tấn công
                this.selectionGraphics.strokeCircle(container.x, container.y, appearance.size + 4);
            }
            
            // ⭐ Vẽ vòng highlight cho mỏ tài nguyên đang thu hoạch (Viền Vàng)
            if (isVisible && entityId === this.harvestTargetId) {
                this.selectionGraphics.lineStyle(3, 0xFFD700, 1); // Viền vàng cho mỏ tài nguyên
                this.selectionGraphics.strokeCircle(container.x, container.y, appearance.size + 6);
            }

            // Vẽ vòng chọn quanh body (cho Player - Viền Xanh)
            if (isVisible && components.has('selected')) {
                this.selectionGraphics.lineStyle(2, 0x00ff00, 1);
                this.selectionGraphics.strokeCircle(container.x, container.y, appearance.size + 4);
            }

            // ⭐ Vẽ info tài nguyên nếu là harvest target
            const resourceNode = components.get('resourceNode');
            if (isVisible && entityId === this.harvestTargetId && resourceNode) {
                this.drawResourceInfo(position, resourceNode, appearance);
            }
            // ⭐ Vẽ thanh máu (theo tọa độ world, không bị xoay)
            else if (isVisible && components.has('health')) {
                const health = components.get('health');
                this.drawHealthBar(position, health, appearance);
            }

            // Cập nhật weapon offset nếu cần
            this.updateWeaponPosition(entityId, appearance);
        });

        // ⭐ Cập nhật damage texts
        this.updateDamageTexts(deltaTime);

        this.containers.forEach((container, entityId) => {
            if (!entities.has(entityId)) {
                container.destroy();
                this.containers.delete(entityId);
            }
        });
    }

    // NEW: Tạo Container gồm body + weapon
    createLayeredSprite(position, appearance) {
        const container = this.scene.add.container(position.x, position.y);

        // ⭐ Arms (TAY) - render trước để nằm dưới body
        if (appearance.hasArms) {
            const armSize = appearance.armSize || 4;
            const armColor = appearance.armColor || this.darkenColor(appearance.color, 0.7);
            const bodySize = appearance.size || 10;
            
            // ⭐ Đối xứng theo trục Y (trục dọc)
            const weaponOffsetY = appearance.weapon?.offsetY || 15;
            const armY = weaponOffsetY; // Cùng độ cao với weapon
            const armX = bodySize * 0.6; // Khoảng cách từ tâm ra 2 bên
            
            // Tay trái (bên trái cơ thể)
            const leftArm = this.scene.add.circle(-armX, armY, armSize, armColor);
            container.add(leftArm);
            container.leftArm = leftArm;
            
            // Tay phải (bên phải cơ thể)
            const rightArm = this.scene.add.circle(armX, armY, armSize, armColor);
            container.add(rightArm);
            container.rightArm = rightArm;
        }

        // Body (render sau để nằm trên tay)
        const bodySprite = this.createBodySprite(appearance);
        container.add(bodySprite);

		// Weapon - chỉ tạo nếu có type hợp lệ
		if (appearance.weapon && appearance.weapon.type) {
			const weaponSprite = this.createWeaponSprite(appearance.weapon);
			if (weaponSprite) {
				const radius = appearance.size || 10;
				const offsetX = appearance.weapon.offsetX || 0;
				const offsetY = appearance.weapon.offsetY || 0;
				weaponSprite.x = radius + offsetX;
				weaponSprite.y = offsetY;
				container.add(weaponSprite);
				container.weapon = weaponSprite;
			} else {
				container.weapon = null;
			}
		} else {
			container.weapon = null;
		}

        // Lưu tham chiếu
        container.body = bodySprite;

        return container;
    }

    // NEW: Body sprite (chỉ còn là hình ở gốc container)
    createBodySprite(appearance) {
        const size = appearance ? appearance.size : 20;
        const color = appearance ? appearance.color : 0x00ff00;
        const shape = appearance ? appearance.shape : 'circle';
        const alpha = appearance ? appearance.alpha : 1.0;
        let sprite;
        
        // ⭐ NEW: Kiểm tra nếu có sprite texture
        if (appearance && appearance.spriteKey && this.scene.textures.exists(appearance.spriteKey)) {
            sprite = this.scene.add.sprite(0, 0, appearance.spriteKey, 0);
            sprite.setOrigin(0.5, 0.5);
            sprite.setScale(size / 32); // Scale dựa trên size (32 là kích thước gốc)
            sprite.setAlpha(alpha);
            return sprite;
        }
        
        // Fallback về graphics shapes
        switch (shape) {
            case 'square':
                sprite = this.scene.add.rectangle(0, 0, size * 2, size * 2, color);
                break;
            case 'rectangle':
                sprite = this.scene.add.rectangle(0, 0, size * 2, size * 2, color);
                break;
            case 'triangle':
                sprite = this.scene.add.polygon(0, 0, [0, -size, -size, size, size, size], color);
                break;
            default:
                sprite = this.scene.add.circle(0, 0, size, color);
        }
        sprite.setAlpha(alpha);
        return sprite;
    }

    // NEW: Weapon sprite
	createWeaponSprite(weaponData) {
		if (!weaponData) return null;
		const { type } = weaponData;
		let sprite = null;
		if (type === 'long_stick') {
			sprite = this.scene.add.rectangle(0, 0, 40, 5, 0x000000);
			sprite.setOrigin(0.5, 0.5);
		} else if (type === 'short_stick') {
			sprite = this.scene.add.rectangle(0, 0, 25, 4, 0x8B4513); // Ngắn hơn, màu nâu
			sprite.setOrigin(0.5, 0.5);
		}
		return sprite;
	}

    // NEW: cập nhật offset weapon
	updateWeaponPosition(entityId, appearance) {
		const container = this.containers.get(entityId);
		if (!container || !container.weapon || !appearance || !appearance.weapon) return;
		// Giữ nguyên vị trí cục bộ đã đặt khi tạo; có thể cập nhật thuộc tính khác ở đây nếu cần
	}
	
	// ⭐ NEW: Vẽ thanh máu (dùng graphics, theo tọa độ world)
	drawHealthBar(position, health, appearance) {
		const barWidth = appearance.size * 2;
		const barHeight = 3;
		const barY = position.y - appearance.size - 8; // ⭐ Phía trên entity (tọa độ world)
		const barX = position.x;
		
		// Tính % HP (⭐ SỬA: health.maximum thay vì health.max)
		const healthPercent = health.current / health.maximum;
		
		// Màu sắc theo % HP
		let healthColor;
		if (healthPercent > 0.5) {
			healthColor = 0x00ff00; // Xanh lá
		} else if (healthPercent > 0.25) {
			healthColor = 0xffaa00; // Vàng cam
		} else {
			healthColor = 0xff0000; // Đỏ
		}
		
		// Vẽ background (đen)
		this.healthBarGraphics.fillStyle(0x000000, 0.8);
		this.healthBarGraphics.fillRect(
			barX - barWidth / 2, 
			barY - barHeight / 2, 
			barWidth, 
			barHeight
		);
		
		// Vẽ health bar (màu theo HP)
		const currentBarWidth = barWidth * healthPercent;
		this.healthBarGraphics.fillStyle(healthColor, 1.0);
		this.healthBarGraphics.fillRect(
			barX - barWidth / 2, 
			barY - barHeight / 2, 
			currentBarWidth, 
			barHeight
		);
	}
	
	// ⭐ NEW: Vẽ info tài nguyên (icon + số lượng)
	drawResourceInfo(position, resourceNode, appearance) {
		const icons = {
			'wood': '🌲',
			'gold': '💰',
			'silver': '⚪',
			'stone': '🧱',
			'water': '💧',
			'meat': '🍖'
		};
		
		const icon = icons[resourceNode.resourceType] || '📦';
		const amount = Math.round(resourceNode.amount);
		const infoY = position.y - appearance.size - 20;
		
		// Vẽ background
		const bgWidth = 60;
		const bgHeight = 20;
		this.healthBarGraphics.fillStyle(0x000000, 0.8);
		this.healthBarGraphics.fillRect(
			position.x - bgWidth / 2,
			infoY - bgHeight / 2,
			bgWidth,
			bgHeight
		);
		
		// Vẽ viền vàng
		this.healthBarGraphics.lineStyle(2, 0xFFD700, 1);
		this.healthBarGraphics.strokeRect(
			position.x - bgWidth / 2,
			infoY - bgHeight / 2,
			bgWidth,
			bgHeight
		);
		
		// Tạo text hiển thị icon + số lượng (sử dụng scene.add.text tạm thời)
		if (!this.resourceInfoText) {
			this.resourceInfoText = this.scene.add.text(0, 0, '', {
				fontSize: '12px',
				fontFamily: 'Arial',
				color: '#FFD700',
				fontStyle: 'bold'
			});
			this.resourceInfoText.setDepth(999);
			this.resourceInfoText.setOrigin(0.5, 0.5);
		}
		
		this.resourceInfoText.setText(`${icon} ${amount}`);
		this.resourceInfoText.setPosition(position.x, infoY);
		this.resourceInfoText.setVisible(true);
	}
	
	// ⭐ NEW: Tạo damage text khi entity bị đánh
	createDamageText(entityId, damage, position) {
		const text = this.scene.add.text(position.x, position.y - 20, `-${damage}`, {
			fontSize: '12px',
			fontStyle: 'bold',
			color: '#ff0000',
			stroke: '#000000',
			strokeThickness: 2
		});
		text.setOrigin(0.5, 0.5);
		text.setDepth(1000);
		
		const damageObj = {
			text: text,
			timer: 0,
			duration: 1000, // 1 giây
			startY: position.y - 20,
			velocityY: -30 // Bay lên
		};
		
		if (!this.damageTexts.has(entityId)) {
			this.damageTexts.set(entityId, []);
		}
		this.damageTexts.get(entityId).push(damageObj);
	}
	
	// ⭐ NEW: Cập nhật damage texts (floating effect)
	updateDamageTexts(deltaTime) {
		for (const [entityId, textArray] of this.damageTexts.entries()) {
			for (let i = textArray.length - 1; i >= 0; i--) {
				const damageObj = textArray[i];
				damageObj.timer += deltaTime;
				
				// Bay lên và fade out
				const progress = damageObj.timer / damageObj.duration;
				damageObj.text.y = damageObj.startY + damageObj.velocityY * progress;
				damageObj.text.setAlpha(1 - progress);
				
				// Xóa khi hết thời gian
				if (damageObj.timer >= damageObj.duration) {
					damageObj.text.destroy();
					textArray.splice(i, 1);
				}
			}
			
			// Xóa entity khỏi map nếu không còn damage text nào
			if (textArray.length === 0) {
				this.damageTexts.delete(entityId);
			}
		}
	}
	
	// ⭐ NEW: Làm tối màu cho tay
	darkenColor(color, factor = 0.7) {
		// Chuyển hex color sang RGB
		const r = (color >> 16) & 0xFF;
		const g = (color >> 8) & 0xFF;
		const b = color & 0xFF;
		
		// Làm tối
		const newR = Math.floor(r * factor);
		const newG = Math.floor(g * factor);
		const newB = Math.floor(b * factor);
		
		// Chuyển về hex
		return (newR << 16) | (newG << 8) | newB;
	}
}