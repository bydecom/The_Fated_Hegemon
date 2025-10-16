// src/scenes/UIScene.js

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.activeCommand = null; // 'attack', 'stop', 'defence', 'patrol'
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
        
        // ⭐ Listen for command activation (from hotkeys or button clicks)
        gameScene.events.on('commandActivated', (commandKey) => {
            this.activeCommand = commandKey;
            this.updateCommandButtonHighlight();
        }, this);
    }

    createLayout() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;
        const panelHeight = 200;
        const panelY = screenHeight - panelHeight;

        // ⭐ CREATE RESOURCE PANEL AT TOP
        this.createResourcePanel();

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
        
        // ⭐ Các lệnh RTS chuyên nghiệp
        const commands = [
            { 
                key: 'attack', 
                label: 'A\nAttack',
                hotkey: 'A',
                color: 0xff4444,
                cursor: 'crosshair',
                description: 'Chase và tấn công kẻ địch' 
            },
            { 
                key: 'stop', 
                label: 'S\nStop',
                hotkey: 'S',
                color: 0xffaa44,
                cursor: 'default',
                description: 'Đứng im, tự động phản công' 
            },
            { 
                key: 'defence', 
                label: 'D\nDefence',
                hotkey: 'D',
                color: 0x4444ff,
                cursor: 'help',
                description: 'Thế phòng thủ tại chỗ' 
            },
            { 
                key: 'patrol', 
                label: 'P\nPatrol',
                hotkey: 'P',
                color: 0x44ff44,
                cursor: 'pointer',
                description: 'Tuần tra qua lại' 
            },
            { 
                key: 'harvest', 
                label: 'H\nHarvest',
                hotkey: 'H',
                color: 0xff8800,
                cursor: 'grab',
                description: 'Thu hoạch tài nguyên' 
            }
        ];
        
        commands.forEach((command, index) => {
            const col = index % 4; 
            const row = Math.floor(index / 4);
            const x = col * (buttonSize + buttonSpacing); 
            const y = row * (buttonSize + buttonSpacing);
            
            // Button background
            const bgColor = this.activeCommand === command.key ? command.color : 0x444444;
            const button = this.add.rectangle(x, y, buttonSize, buttonSize, bgColor)
                .setOrigin(0,0)
                .setStrokeStyle(2, this.activeCommand === command.key ? 0xffffff : 0x999999)
                .setInteractive({ useHandCursor: true });
            
            // Button label
            const buttonText = this.add.text(
                x + buttonSize/2, 
                y + buttonSize/2, 
                command.label, 
                { fontSize: '11px', align: 'center' }
            ).setOrigin(0.5);
            
            // ⭐ Click handler
            button.on('pointerdown', (p, lx, ly, e) => { 
                e.stopPropagation(); 
                this.handleCommandClick(command);
            });
            
            // Hover effect
            button.on('pointerover', () => {
                if (this.activeCommand !== command.key) {
                    button.setFillStyle(command.color, 0.5);
                }
            });
            
            button.on('pointerout', () => {
                if (this.activeCommand !== command.key) {
                    button.setFillStyle(0x444444);
                }
            });
            
            this.commandButtonsContainer.add([button, buttonText]);
            
            // Store reference for updating later
            button.commandKey = command.key;
            button.commandColor = command.color;
        });
    }
    
    // ⭐ NEW: Xử lý khi click command button
    handleCommandClick(command) {
        const gameScene = this.scene.get('DemoScene');
        
        // Toggle command
        if (this.activeCommand === command.key) {
            // Cancel command
            this.activeCommand = null;
            gameScene.input.setDefaultCursor('default');
            console.log(`❌ Command cancelled: ${command.key}`);
        } else {
            // Activate command
            this.activeCommand = command.key;
            gameScene.input.setDefaultCursor(command.cursor);
            console.log(`✅ Command activated: ${command.key} (cursor: ${command.cursor})`);
            
            // Emit event để DemoScene biết
            gameScene.events.emit('commandActivated', command.key);
        }
        
        // Update button visual
        this.updateCommandButtonHighlight();
    }
    
    // ⭐ NEW: Update button highlight
    updateCommandButtonHighlight() {
        this.commandButtonsContainer.list.forEach(child => {
            if (child.commandKey) {
                const isActive = this.activeCommand === child.commandKey;
                child.setFillStyle(isActive ? child.commandColor : 0x444444);
                child.setStrokeStyle(2, isActive ? 0xffffff : 0x999999);
            }
        });
    }
    
    // ⭐ NEW: Reset command sau khi sử dụng
    resetCommand() {
        this.activeCommand = null;
        const gameScene = this.scene.get('DemoScene');
        if (gameScene) {
            gameScene.input.setDefaultCursor('default');
        }
        this.updateCommandButtonHighlight();
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
    
    // ⭐ CREATE RESOURCE PANEL AT TOP RIGHT OF SCREEN
    createResourcePanel() {
        const screenWidth = this.scale.width;
        const panelHeight = 32;
        const panelWidth = 480;
        const panelX = screenWidth - panelWidth - 10; // Right side
        
        // Background panel
        this.resourcePanelBg = this.add.rectangle(panelX, 10, panelWidth, panelHeight, 0x1a1a1a, 0.9)
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
            this.add.text(x, y, res.icon, {
                fontSize: '14px',
                fontFamily: 'Arial'
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);
            
            // Value text
            this.resourceTexts[res.key] = this.add.text(x + 20, y, '0', {
                fontSize: '13px',
                fontFamily: 'Arial',
                color: '#' + res.color.toString(16).padStart(6, '0'),
                fontStyle: 'bold'
            }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);
        });
        
        // Unit count (right side)
        const unitX = startX + resources.length * spacing + 5;
        this.add.text(unitX, y, '👥', {
            fontSize: '14px',
            fontFamily: 'Arial'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);
        
        this.unitCountText = this.add.text(unitX + 20, y, '0/200', {
            fontSize: '13px',
            fontFamily: 'Arial',
            color: '#00ff00',
            fontStyle: 'bold'
        }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1001);
    }
    
    // ⭐ UPDATE RESOURCE DISPLAY
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
    
    handleResize() { 
        this.children.removeAll(true); 
        this.createLayout(); 
    }
}