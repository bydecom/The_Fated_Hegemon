// src/ecs/systems/RenderSystem.js

const FOG_STATE = { UNSEEN: 0, SEEN: 1, VISIBLE: 2 };

export class RenderSystem {
    constructor(scene, gridManager, fogManager) {
        this.scene = scene;
        this.gridManager = gridManager;
        this.fogManager = fogManager;

        this.sprites = new Map();
        this.selectionGraphics = this.scene.add.graphics().setDepth(999);
        this.currentSelectionRect = null;
    }

    setSelectionBox(rect) { this.currentSelectionRect = rect; }
    clearSelectionBox() { this.currentSelectionRect = null; }

    update(deltaTime, entities) {
        this.selectionGraphics.clear();
        if (this.currentSelectionRect) {
            this.selectionGraphics.fillStyle(0x00ff00, 0.2);
            this.selectionGraphics.fillRect(this.currentSelectionRect.x, this.currentSelectionRect.y, this.currentSelectionRect.width, this.currentSelectionRect.height);
            this.selectionGraphics.lineStyle(1, 0x00ff00, 1);
            this.selectionGraphics.strokeRect(this.currentSelectionRect.x, this.currentSelectionRect.y, this.currentSelectionRect.width, this.currentSelectionRect.height);
        }

        entities.forEach((components, entityId) => {
            const position = components.get('position');
            const appearance = components.get('appearance');
            if (!position || !appearance) return;

            let sprite = this.sprites.get(entityId);
            if (!sprite) {
                sprite = this.createSprite(position, appearance);
                this.sprites.set(entityId, sprite);
            }

            sprite.x = position.x;
            sprite.y = position.y;

            const gridPos = this.gridManager.worldToGrid(position.x, position.y);
            // Thêm kiểm tra để đảm bảo gridPos hợp lệ
            if (!this.fogManager.fogGrid[gridPos.y] || this.fogManager.fogGrid[gridPos.y][gridPos.x] === undefined) {
                sprite.setVisible(false);
                return;
            }
            const fogState = this.fogManager.fogGrid[gridPos.y][gridPos.x];

            let isVisible = false;
            
            if (fogState === FOG_STATE.VISIBLE) {
                isVisible = true;
                // ⭐ SỬA LỖI: Quay về màu gốc
                sprite.fillColor = appearance.color; 
            } else if (fogState === FOG_STATE.SEEN) {
                if (components.has('building')) {
                    isVisible = true;
                    // ⭐ SỬA LỖI: Thay đổi màu fill, không dùng setTint
                    sprite.fillColor = 0x808080; 
                }
            }

            sprite.setVisible(isVisible);
            
            if (isVisible && components.has('selected')) {
                this.selectionGraphics.lineStyle(2, 0x00ff00, 1);
                this.selectionGraphics.strokeCircle(sprite.x, sprite.y, sprite.width / 2 + 4);
            }
        });

        this.sprites.forEach((sprite, entityId) => {
            if (!entities.has(entityId)) {
                sprite.destroy();
                this.sprites.delete(entityId);
            }
        });
    }

    createSprite(position, appearance) {
        const size = appearance ? appearance.size : 20;
        const color = appearance ? appearance.color : 0x00ff00;
        const shape = appearance ? appearance.shape : 'circle';
        const alpha = appearance ? appearance.alpha : 1.0;
        let sprite;
        switch (shape) {
            case 'rectangle':
                sprite = this.scene.add.rectangle(position.x, position.y, size * 2, size * 2, color);
                break;
            case 'triangle':
                sprite = this.scene.add.polygon(position.x, position.y, [0, -size, -size, size, size, size], color);
                break;
            default:
                sprite = this.scene.add.circle(position.x, position.y, size, color);
        }
        sprite.setAlpha(alpha);
        return sprite;
    }
}