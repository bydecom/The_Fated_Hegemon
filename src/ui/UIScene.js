// src/ui/UIScene.js

import { 
    ResourcePanel, 
    UnitPanel, 
    CommandPanel, 
    MinimapPanel, 
    BuildingPanel 
} from './components/index.js';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.resourcePanel = null;
        this.unitPanel = null;
        this.commandPanel = null;
        this.minimapPanel = null;
        this.buildingPanel = null;
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
            this.commandPanel.onCommandActivated(commandKey);
        }, this);
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

        // Initialize UI components
        this.resourcePanel = new ResourcePanel(this);
        this.resourcePanel.create();

        this.minimapPanel = new MinimapPanel(this);
        this.minimapPanel.create();

        this.commandPanel = new CommandPanel(this);
        this.commandPanel.create();

        this.unitPanel = new UnitPanel(this);
        this.unitPanel.create();

        this.buildingPanel = new BuildingPanel(this);
        this.buildingPanel.create();

        // Emit event to notify that UIScene is ready
        this.events.emit('uiSceneReady');
    }

    updateUI(selectedData) {
        if (this.commandPanel) this.commandPanel.updateUI(selectedData);
        if (this.unitPanel) this.unitPanel.updateUI(selectedData);
        if (this.buildingPanel) this.buildingPanel.updateUI(selectedData);
    }

    updateMinimap() {
        if (this.minimapPanel) this.minimapPanel.updateMinimap();
    }
    
    // ⭐ UPDATE RESOURCE DISPLAY
    updateResourceDisplay(resourceManager) {
        if (this.resourcePanel) {
            this.resourcePanel.updateResourceDisplay(resourceManager);
        }
    }

    // ⭐ RESET COMMAND (called from DemoScene)
    resetCommand() {
        if (this.commandPanel) {
            this.commandPanel.resetCommand();
        }
    }
    
    handleResize() { 
        // Destroy existing components
        if (this.resourcePanel) this.resourcePanel.destroy();
        if (this.unitPanel) this.unitPanel.destroy();
        if (this.commandPanel) this.commandPanel.destroy();
        if (this.minimapPanel) this.minimapPanel.destroy();
        if (this.buildingPanel) this.buildingPanel.destroy();
        
        // Recreate layout
        this.createLayout(); 
    }
}