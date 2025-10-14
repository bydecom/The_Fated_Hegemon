// Fog of War Manager - Handles visibility and fog rendering

const FOG_STATE = {
    UNSEEN: 0,
    SEEN: 1,
    VISIBLE: 2
};

export class FogOfWarManager {
    constructor(scene, worldWidth, worldHeight, tileSize) {
        this.scene = scene;
        this.camera = scene.cameras.main;
        this.tileSize = tileSize;

        // Initialize data layer
        this.gridWidth = Math.floor(worldWidth / tileSize);
        this.gridHeight = Math.floor(worldHeight / tileSize);
        this.fogGrid = [];
        this.initializeGrid();

        // Initialize visual layer (main fog overlay)
        this.fogTexture = this.scene.add.renderTexture(0, 0, this.camera.width, this.camera.height)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(100);

        // Listen for resize events
        this.scene.scale.on('resize', this.handleResize, this);
    }

    initializeGrid() {
        for (let y = 0; y < this.gridHeight; y++) {
            this.fogGrid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.fogGrid[y][x] = FOG_STATE.UNSEEN;
            }
        }
    }

    handleResize(gameSize) {
        if (this.fogTexture) this.fogTexture.destroy();
        this.fogTexture = this.scene.add.renderTexture(0, 0, gameSize.width, gameSize.height)
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(100);
    }

    // Called every frame in Scene
    update(entities) {
        // Phase 1: Update data layer
        // Convert all VISIBLE tiles to SEEN
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.fogGrid[y][x] === FOG_STATE.VISIBLE) {
                    this.fogGrid[y][x] = FOG_STATE.SEEN;
                }
            }
        }

        // Mark tiles around player units as VISIBLE
        const sightRadius = 8; // Sight range = 4 tiles
        for (const [entityId, components] of entities) {
            if (components.has('playerUnit') && components.has('position')) {
                const pos = components.get('position');
                const gridX = Math.floor(pos.x / this.tileSize);
                const gridY = Math.floor(pos.y / this.tileSize);

                // Check tiles within sight radius
                for (let y = gridY - sightRadius; y <= gridY + sightRadius; y++) {
                    for (let x = gridX - sightRadius; x <= gridX + sightRadius; x++) {
                        if (y >= 0 && y < this.gridHeight && x >= 0 && x < this.gridWidth) {
                            const distance = Phaser.Math.Distance.Between(gridX, gridY, x, y);
                            if (distance <= sightRadius) {
                                this.fogGrid[y][x] = FOG_STATE.VISIBLE;
                            }
                        }
                    }
                }
            }
        }

        // Phase 2: Redraw visual layer
        this.drawFog();
    }
    
    drawFog() {
        // Clear previous fog layer
        this.fogTexture.clear();

        // Get camera view bounds
        const cameraBounds = this.camera.worldView;
        const startX = Math.floor(cameraBounds.x / this.tileSize);
        const startY = Math.floor(cameraBounds.y / this.tileSize);
        const endX = Math.ceil((cameraBounds.x + cameraBounds.width) / this.tileSize);
        const endY = Math.ceil((cameraBounds.y + cameraBounds.height) / this.tileSize);
        
        // Create graphics object for drawing
        const graphics = this.scene.add.graphics();
        
        // Only draw fog tiles within camera view
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                if (y < 0 || y >= this.gridHeight || x < 0 || x >= this.gridWidth) continue;

                const state = this.fogGrid[y][x];
                if (state === FOG_STATE.VISIBLE) continue; // Skip, leave transparent

                // Convert world coordinates to screen coordinates
                const screenX = (x * this.tileSize - cameraBounds.x) * this.camera.zoom;
                const screenY = (y * this.tileSize - cameraBounds.y) * this.camera.zoom;
                const size = this.tileSize * this.camera.zoom;
                
                // Choose color and alpha based on state
                const alpha = (state === FOG_STATE.UNSEEN) ? 1.0 : 0.5; // Solid black or semi-transparent
                
                // Draw rectangle
                graphics.fillStyle(0x000000, alpha);
                graphics.fillRect(screenX, screenY, size, size);
            }
        }
        
        // Draw graphics to RenderTexture
        this.fogTexture.draw(graphics);
        
        // Destroy graphics object to save memory
        graphics.destroy();
    }
}