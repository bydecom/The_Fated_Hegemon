// src/ui/components/MinimapPanel.js

export class MinimapPanel {
    constructor(scene) {
        this.scene = scene;
        this.minimapContainer = null;
        this.minimapTexture = null;
    }

    create() {
        const screenHeight = this.scene.scale.height;
        const panelHeight = 200;
        const panelY = screenHeight - panelHeight;
        const minimapWidth = 190;

        this.minimapContainer = this.scene.add.container(10, panelY - 10);
        const minimapBg = this.scene.add.rectangle(0, 0, minimapWidth, panelHeight, 0x1a1a1a).setOrigin(0,0).setStrokeStyle(2, 0x555555);
        this.minimapTexture = this.scene.add.renderTexture(5, 5, minimapWidth - 10, panelHeight - 10).setOrigin(0,0);
        this.minimapContainer.add([minimapBg, this.minimapTexture]);
    }

    updateMinimap() {
        if (!this.minimapTexture || !this.scene.scene.isActive('DemoScene')) return;
        
        const gameScene = this.scene.scene.get('DemoScene');
        const worldWidth = 3200;
        const worldHeight = 3200;

        // Clear previous frame
        this.minimapTexture.clear();
        this.minimapTexture.fill(0x0a0a0a);

        // Calculate scale between world map and minimap
        const scaleX = this.minimapTexture.width / worldWidth;
        const scaleY = this.minimapTexture.height / worldHeight;

        // Draw unit/ building dots
        gameScene.ecsWorld.entities.forEach(components => {
            if (components.has('position') && components.has('appearance')) {
                const pos = components.get('position');
                const x = pos.x * scaleX;
                const y = pos.y * scaleY;
                
                let color = 0x808080; // Default gray
                let size = 2;

                // Only draw if tile is visible or seen
                const gridPos = gameScene.gridManager.worldToGrid(pos.x, pos.y);
                const fogState = gameScene.fogManager.fogGrid[gridPos.y][gridPos.x];

                if (fogState > 0) { // 1 (SEEN) or 2 (VISIBLE)
                    if (components.has('playerUnit')) {
                        color = 0x00ff00; // Green for player units
                    } else if (components.has('building')) {
                        color = 0xff0000; // Red for enemy buildings
                        size = 5;
                    } else if (!components.has('item')) {
                        color = 0xff8c00; // Orange for enemy units
                    }
                    this.minimapTexture.fill(color, 1, x, y, size, size);
                }
            }
        });
        
        // Draw camera viewport frame
        const cam = gameScene.cameras.main;
        const camRectX = Math.floor(cam.worldView.x * scaleX);
        const camRectY = Math.floor(cam.worldView.y * scaleY);
        const camRectWidth = Math.ceil(cam.worldView.width * scaleX);
        const camRectHeight = Math.ceil(cam.worldView.height * scaleY);
        
        const color = 0xffffff;
        const thickness = 1;

        // Draw camera frame borders
        this.minimapTexture.fill(color, 1, camRectX, camRectY, camRectWidth, thickness);
        this.minimapTexture.fill(color, 1, camRectX, camRectY + camRectHeight - thickness, camRectWidth, thickness);
        this.minimapTexture.fill(color, 1, camRectX, camRectY, thickness, camRectHeight);
        this.minimapTexture.fill(color, 1, camRectX + camRectWidth - thickness, camRectY, thickness, camRectHeight);
    }

    destroy() {
        if (this.minimapContainer) {
            this.minimapContainer.destroy();
        }
    }
}
