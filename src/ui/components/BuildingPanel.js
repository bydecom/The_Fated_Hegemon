// src/ui/components/BuildingPanel.js

export class BuildingPanel {
    constructor(scene) {
        this.scene = scene;
        this.buildingContainer = null;
        this.buildingView = null;
    }

    create() {
        const screenWidth = this.scene.scale.width;
        const screenHeight = this.scene.scale.height;
        const panelHeight = 200;
        const panelY = screenHeight - panelHeight;
        const minimapWidth = 190;
        const commandCardWidth = 270;
        const infoX = minimapWidth + 20;

        // Building container (similar to unit panel but for buildings)
        this.buildingContainer = this.scene.add.container(infoX, panelY - 10).setVisible(false);
        const buildingBg = this.scene.add.rectangle(0, 0, 300, panelHeight, 0x1a1a1a).setOrigin(0,0).setStrokeStyle(2, 0x555555);
        this.buildingView = this.scene.add.container(10, 10);
        this.buildingContainer.add([buildingBg, this.buildingView]);
    }

    updateUI(selectedData) {
        if (selectedData.length === 0) {
            this.buildingContainer.setVisible(false);
            return;
        }

        // Check if any selected entity is a building
        const hasBuilding = selectedData.some(data => data.building);
        
        if (hasBuilding) {
            this.buildingContainer.setVisible(true);
            this.populateBuildingView(selectedData.filter(data => data.building));
        } else {
            this.buildingContainer.setVisible(false);
        }
    }
    
    populateBuildingView(buildingData) {
        this.buildingView.removeAll(true);
        
        buildingData.forEach((building, index) => {
            const y = index * 60;
            
            // Building info container
            const buildingInfo = this.scene.add.container(0, y);
            this.buildingView.add(buildingInfo);

            // Building icon/avatar
            const buildingIcon = this.scene.add.rectangle(30, 30, 50, 50, building.appearance?.color || 0x888888)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0xaaaaaa);

            // Building name
            const buildingName = this.scene.add.text(80, 15, building.building?.type || 'Building', {
                fontSize: '14px',
                fill: '#ffffff'
            });

            // Building health
            const healthText = this.scene.add.text(80, 35, 
                `HP: ${building.health?.current || 100} / ${building.health?.maximum || 100}`, 
                { fontSize: '12px', fill: '#0f0' }
            );

            // Building status
            const statusText = this.scene.add.text(80, 50, 
                `Status: ${building.building?.status || 'Active'}`, 
                { fontSize: '12px', fill: '#0af' }
            );

            buildingInfo.add([buildingIcon, buildingName, healthText, statusText]);

            // Make building clickable
            buildingIcon.setInteractive({ useHandCursor: true });
            buildingIcon.on('pointerdown', (pointer, localX, localY, event) => {
                event.stopPropagation();
                this.scene.scene.get('DemoScene').events.emit('focusOnBuilding', building.id);
            });
        });
    }

    destroy() {
        if (this.buildingContainer) {
            this.buildingContainer.destroy();
        }
    }
}
