// src/ui/components/UnitPanel.js

export class UnitPanel {
    constructor(scene) {
        this.scene = scene;
        this.portraitContainer = null;
        this.portraitView = null;
        this.multiUnitContainer = null;
        this.multiUnitView = null;
    }

    create() {
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;
        const panelHeight = 200;
        const panelY = screenHeight - panelHeight;
        const minimapWidth = 190;
        const commandCardWidth = 270;
        const infoX = minimapWidth + 20;

        // Portrait container
        this.portraitContainer = this.scene.add.container(infoX, panelY - 10).setVisible(false);
        const portraitBg = this.scene.add.rectangle(0, 0, 140, panelHeight, 0x1a1a1a).setOrigin(0,0).setStrokeStyle(2, 0x555555);
        this.portraitView = this.scene.add.container(10, 10);
        this.portraitContainer.add([portraitBg, this.portraitView]);

        // Multi-unit container
        this.multiUnitContainer = this.scene.add.container(infoX + 150, panelY - 10).setVisible(false);
        const multiUnitBgWidth = screenWidth - infoX - 150 - commandCardWidth - 20;
        const multiUnitBg = this.scene.add.rectangle(0, 0, multiUnitBgWidth, panelHeight, 0x1a1a1a).setOrigin(0,0).setStrokeStyle(2, 0x555555);
        this.multiUnitView = this.scene.add.container(15, 15);
        this.multiUnitContainer.add([multiUnitBg, this.multiUnitView]);
    }

    updateUI(selectedData) {
        if (selectedData.length === 0) {
            this.portraitContainer.setVisible(false);
            this.multiUnitContainer.setVisible(false);
            return;
        }

        if (selectedData.length === 1) {
            this.multiUnitContainer.setVisible(false);
            this.portraitContainer.setVisible(true);
            this.populatePortraitView(selectedData[0]);
        } else {
            this.portraitContainer.setVisible(false);
            this.multiUnitContainer.setVisible(true);
            this.populateMultiUnitView(selectedData);
        }
    }
    
    populatePortraitView(unitData) {
        this.portraitView.removeAll(true);
        const portraitSize = 120;
        
        // Create clickable portrait frame
        const frame = this.scene.add.rectangle(0, 0, portraitSize, portraitSize, 0x000000)
            .setOrigin(0,0)
            .setStrokeStyle(2, 0xaaaaaa)
            .setInteractive({ useHandCursor: true });

        const avatar = this.scene.add.graphics().fillStyle(unitData.appearance.color).fillCircle(portraitSize/2, portraitSize/2, portraitSize * 0.45);
        
        const healthText = this.scene.add.text(5, portraitSize + 10, `HP: ${unitData.health ? unitData.health.current : 100} / ${unitData.health ? unitData.health.maximum : 100}`, { fontSize: '16px', fill: '#0f0' });
        const manaText = this.scene.add.text(5, portraitSize + 35, `MP: 100 / 100`, { fontSize: '16px', fill: '#0af' });
        
        this.portraitView.add([frame, avatar, healthText, manaText]);

        // Handle portrait click to focus camera
        frame.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            this.scene.scene.get('DemoScene').events.emit('focusOnUnit', unitData.id);
        });
    }
    
    populateMultiUnitView(selectedData) {
        this.multiUnitView.removeAll(true);
        const avatarSize = 45;
        const avatarSpacing = 5;
        const maxCols = 8;

        selectedData.forEach((unitData, index) => {
            const col = index % maxCols;
            const row = Math.floor(index / maxCols);
            const x = col * (avatarSize + avatarSpacing);
            const y = row * (avatarSize + avatarSpacing);

            const avatarContainer = this.scene.add.container(x, y);
            this.multiUnitView.add(avatarContainer);

            // Create frame for hitbox
            const frame = this.scene.add.rectangle(0, 0, avatarSize, avatarSize, 0x000000)
                .setOrigin(0, 0)
                .setStrokeStyle(1, 0x888888);

            // Create avatar graphics
            const avatarGraphics = this.scene.add.graphics();
            const appearance = unitData.appearance;
            avatarGraphics.fillStyle(appearance.color);
            avatarGraphics.fillCircle(avatarSize / 2, avatarSize / 2, avatarSize * 0.4);
            
            avatarContainer.add([frame, avatarGraphics]);

            // Set interactive area using frame
            avatarContainer.setInteractive(frame, Phaser.Geom.Rectangle.Contains);
            
            // Set cursor style
            avatarContainer.on('pointerover', () => this.scene.input.setDefaultCursor('pointer'));
            avatarContainer.on('pointerout', () => this.scene.input.setDefaultCursor('default'));

            // Handle unit selection
            avatarContainer.on('pointerdown', (pointer, localX, localY, event) => {
                event.stopPropagation();
                this.scene.scene.get('DemoScene').events.emit('unitSubselected', unitData.id);
            });
        });
    }

    destroy() {
        if (this.portraitContainer) {
            this.portraitContainer.destroy();
        }
        if (this.multiUnitContainer) {
            this.multiUnitContainer.destroy();
        }
    }
}
