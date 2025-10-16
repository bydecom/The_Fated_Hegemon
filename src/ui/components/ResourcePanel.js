// src/ui/components/ResourcePanel.js

export class ResourcePanel {
    constructor(scene) {
        this.scene = scene;
        this.resourceTexts = {};
        this.unitCountText = null;
        this.resourcePanelBg = null;
    }

    create() {
        const screenWidth = this.scene.scale.width;
        const panelHeight = 32;
        const panelWidth = 480;
        const panelX = screenWidth - panelWidth - 10; // Right side
        
        // Background panel
        this.resourcePanelBg = this.scene.add.rectangle(panelX, 10, panelWidth, panelHeight, 0x1a1a1a, 0.9)
            .setOrigin(0, 0)
            .setStrokeStyle(2, 0x444444)
            .setScrollFactor(0)
            .setDepth(1000);
        
        // Resource icons và text (1 hàng ngang)
        const resources = [
            { key: 'wood', icon: '🌲', color: 0x8B4513 },
            { key: 'meat', icon: '🍖', color: 0xD2691E },
            { key: 'gold', icon: '💰', color: 0xFFD700 },
            { key: 'silver', icon: '⚪', color: 0xC0C0C0 },
            { key: 'stone', icon: '🧱', color: 0x808080 },
            { key: 'water', icon: '💧', color: 0x1E90FF }
        ];
        
        this.resourceTexts = {};
        const spacing = 65;
        const startX = panelX + 8;
        const y = 26;
        
        resources.forEach((res, index) => {
            const x = startX + index * spacing;
            
            // Icon
            this.scene.add.text(x, y, res.icon, {
                fontSize: '14px',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);
            
            // Value text
            this.resourceTexts[res.key] = this.scene.add.text(x + 20, y, '0', {
                fontSize: '13px',
                fontFamily: 'Arial',
                color: '#' + res.color.toString(16).padStart(6, '0'),
                fontStyle: 'bold'
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);
        });
        
        // Unit count (right side)
        const unitX = startX + resources.length * spacing + 5;
        this.scene.add.text(unitX, y, '👥', {
            fontSize: '14px',
            fontFamily: 'Arial'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);
        
        this.unitCountText = this.scene.add.text(unitX + 20, y, '0/200', {
            fontSize: '13px',
            fontFamily: 'Arial',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);
    }

    updateResourceDisplay(resourceManager) {
        if (!this.resourceTexts) return;
        
        const resources = resourceManager.getAllResources();
        
        for (const [key, value] of Object.entries(resources)) {
            if (this.resourceTexts[key]) {
                this.resourceTexts[key].setText(value.toString());
            }
        }
        
        if (this.unitCountText) {
            this.unitCountText.setText(`${resourceManager.unitCount}/${resourceManager.maxUnitCount}`);
        }
    }

    destroy() {
        if (this.resourcePanelBg) {
            this.resourcePanelBg.destroy();
        }
        
        Object.values(this.resourceTexts).forEach(text => {
            if (text) text.destroy();
        });
        
        if (this.unitCountText) {
            this.unitCountText.destroy();
        }
    }
}
