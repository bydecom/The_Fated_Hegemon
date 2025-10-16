// src/ui/components/CommandPanel.js

export class CommandPanel {
    constructor(scene) {
        this.scene = scene;
        this.commandCardContainer = null;
        this.commandButtonsContainer = null;
        this.activeCommand = null;
    }

    create() {
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;
        const panelHeight = 200;
        const panelY = screenHeight - panelHeight;
        const commandCardWidth = 270;

        this.commandCardContainer = this.scene.add.container(screenWidth - commandCardWidth - 10, panelY - 10).setVisible(false);
        const commandBg = this.scene.add.rectangle(0, 0, commandCardWidth, panelHeight, 0x1a1a1a).setOrigin(0,0).setStrokeStyle(2, 0x555555);
        this.commandButtonsContainer = this.scene.add.container(10, 10);
        this.commandCardContainer.add([commandBg, this.commandButtonsContainer]);
    }

    updateUI(selectedData) {
        if (selectedData.length === 0) {
            this.commandCardContainer.setVisible(false);
            return;
        }

        this.commandCardContainer.setVisible(true);
        this.populateCommandCard(selectedData);
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
            const button = this.scene.add.rectangle(x, y, buttonSize, buttonSize, bgColor)
                .setOrigin(0,0)
                .setStrokeStyle(2, this.activeCommand === command.key ? 0xffffff : 0x999999)
                .setInteractive({ useHandCursor: true });
            
            // Button label
            const buttonText = this.scene.add.text(
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
    
    // ⭐ Xử lý khi click command button
    handleCommandClick(command) {
        const gameScene = this.scene.scene.get('DemoScene');
        
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
    
    // ⭐ Update button highlight
    updateCommandButtonHighlight() {
        this.commandButtonsContainer.list.forEach(child => {
            if (child.commandKey) {
                const isActive = this.activeCommand === child.commandKey;
                child.setFillStyle(isActive ? child.commandColor : 0x444444);
                child.setStrokeStyle(2, isActive ? 0xffffff : 0x999999);
            }
        });
    }
    
    // ⭐ Reset command sau khi sử dụng
    resetCommand() {
        this.activeCommand = null;
        const gameScene = this.scene.scene.get('DemoScene');
        if (gameScene) {
            gameScene.input.setDefaultCursor('default');
        }
        this.updateCommandButtonHighlight();
    }

    // ⭐ Listen for command activation (from hotkeys or button clicks)
    onCommandActivated(commandKey) {
        this.activeCommand = commandKey;
        this.updateCommandButtonHighlight();
    }

    destroy() {
        if (this.commandCardContainer) {
            this.commandCardContainer.destroy();
        }
    }
}
