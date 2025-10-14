// src/scenes/UIScene.js

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        this.createLayout();

        const gameScene = this.scene.get('DemoScene');
        if (!gameScene) return;

        // Forward outside clicks to DemoScene
        this.input.on('pointerdownoutside', (pointer) => {
            gameScene.input.emit('pointerdown', pointer);
        });

        this.input.on('pointermoveoutside', (pointer) => {
            gameScene.input.emit('pointermove', pointer);
        });

        this.input.on('pointerupoutside', (pointer) => {
            gameScene.input.emit('pointerup', pointer);
        });
        
        // Listen for game events
        gameScene.events.on('selectionChanged', (selectedData) => {
            this.updateUI(selectedData);
        });
        gameScene.events.on('update', this.updateMinimap, this);
    }

    createLayout() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;
        const panelHeight = 200;
        const panelY = screenHeight - panelHeight;

        // Create UI shield to capture input events
        const uiShield = this.add.rectangle(0, panelY, screenWidth, panelHeight, 0xff0000, 0)
            .setOrigin(0, 0)
            .setInteractive();
        
        const minimapWidth = 190;
        this.minimapContainer = this.add.container(10, panelY - 10);
        const minimapBg = this.add.rectangle(0, 0, minimapWidth, panelHeight, 0x1a1a1a).setOrigin(0,0).setStrokeStyle(2, 0x555555);
        this.minimapTexture = this.add.renderTexture(5, 5, minimapWidth - 10, panelHeight - 10).setOrigin(0,0);
        this.minimapContainer.add([minimapBg, this.minimapTexture]);

        const commandCardWidth = 270;
        this.commandCardContainer = this.add.container(screenWidth - commandCardWidth - 10, panelY - 10).setVisible(false);
        const commandBg = this.add.rectangle(0, 0, commandCardWidth, panelHeight, 0x1a1a1a).setOrigin(0,0).setStrokeStyle(2, 0x555555);
        this.commandButtonsContainer = this.add.container(10, 10);
        this.commandCardContainer.add([commandBg, this.commandButtonsContainer]);

        const infoX = minimapWidth + 20;
        
        this.portraitContainer = this.add.container(infoX, panelY - 10).setVisible(false);
        const portraitBg = this.add.rectangle(0, 0, 140, panelHeight, 0x1a1a1a).setOrigin(0,0).setStrokeStyle(2, 0x555555);
        this.portraitView = this.add.container(10, 10);
        this.portraitContainer.add([portraitBg, this.portraitView]);

        this.multiUnitContainer = this.add.container(infoX + 150, panelY - 10).setVisible(false);
        const multiUnitBgWidth = screenWidth - infoX - 150 - commandCardWidth - 20;
        const multiUnitBg = this.add.rectangle(0, 0, multiUnitBgWidth, panelHeight, 0x1a1a1a).setOrigin(0,0).setStrokeStyle(2, 0x555555);
        this.multiUnitView = this.add.container(15, 15);
        this.multiUnitContainer.add([multiUnitBg, this.multiUnitView]);
    }

    updateUI(selectedData) {
        if (selectedData.length === 0) {
            this.portraitContainer.setVisible(false);
            this.multiUnitContainer.setVisible(false);
            this.commandCardContainer.setVisible(false);
            return;
        }

        this.commandCardContainer.setVisible(true);
        this.populateCommandCard(selectedData);

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
        const frame = this.add.rectangle(0, 0, portraitSize, portraitSize, 0x000000)
            .setOrigin(0,0)
            .setStrokeStyle(2, 0xaaaaaa)
            .setInteractive({ useHandCursor: true });

        const avatar = this.add.graphics().fillStyle(unitData.appearance.color).fillCircle(portraitSize/2, portraitSize/2, portraitSize * 0.45);
        
        const healthText = this.add.text(5, portraitSize + 10, `HP: ${unitData.health ? unitData.health.current : 100} / ${unitData.health ? unitData.health.maximum : 100}`, { fontSize: '16px', fill: '#0f0' });
        const manaText = this.add.text(5, portraitSize + 35, `MP: 100 / 100`, { fontSize: '16px', fill: '#0af' });
        
        this.portraitView.add([frame, avatar, healthText, manaText]);

        // Handle portrait click to focus camera
        frame.on('pointerdown', (pointer, localX, localY, event) => {
            event.stopPropagation();
            this.scene.get('DemoScene').events.emit('focusOnUnit', unitData.id);
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

            const avatarContainer = this.add.container(x, y);
            this.multiUnitView.add(avatarContainer);

            // Create frame for hitbox
            const frame = this.add.rectangle(0, 0, avatarSize, avatarSize, 0x000000)
                .setOrigin(0, 0)
                .setStrokeStyle(1, 0x888888);

            // Create avatar graphics
            const avatarGraphics = this.add.graphics();
            const appearance = unitData.appearance;
            avatarGraphics.fillStyle(appearance.color);
            avatarGraphics.fillCircle(avatarSize / 2, avatarSize / 2, avatarSize * 0.4);
            
            avatarContainer.add([frame, avatarGraphics]);

            // Set interactive area using frame
            avatarContainer.setInteractive(frame, Phaser.Geom.Rectangle.Contains);
            
            // Set cursor style
            avatarContainer.on('pointerover', () => this.input.setDefaultCursor('pointer'));
            avatarContainer.on('pointerout', () => this.input.setDefaultCursor('default'));

            // Handle unit selection
            avatarContainer.on('pointerdown', (pointer, localX, localY, event) => {
                event.stopPropagation();
                this.scene.get('DemoScene').events.emit('unitSubselected', unitData.id);
            });
        });
    }

    populateCommandCard(selectedData) {
        this.commandButtonsContainer.removeAll(true);
        const buttonSize = 55; 
        const buttonSpacing = 5;
        const commands = [{ name: 'Move' }, { name: 'Stop' }, { name: 'Attack' }];
        
        commands.forEach((command, index) => {
            const col = index % 4; 
            const row = Math.floor(index / 4);
            const x = col * (buttonSize + buttonSpacing); 
            const y = row * (buttonSize + buttonSpacing);
            
            const button = this.add.rectangle(x, y, buttonSize, buttonSize, 0x444444)
                .setOrigin(0,0)
                .setStrokeStyle(1, 0x999999)
                .setInteractive({ useHandCursor: true });
            const buttonText = this.add.text(x + buttonSize/2, y + buttonSize/2, command.name, { fontSize: '12px' })
                .setOrigin(0.5);
            
            button.on('pointerdown', (p,lx,ly,e) => { 
                e.stopPropagation(); 
                console.log(`Command: ${command.name}`); 
            });
            
            this.commandButtonsContainer.add([button, buttonText]);
        });
    }

    updateMinimap() {
        if (!this.minimapTexture || !this.scene.isActive('DemoScene')) return;
        
        const gameScene = this.scene.get('DemoScene');
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
    
    handleResize() { 
        this.children.removeAll(true); 
        this.createLayout(); 
    }
}