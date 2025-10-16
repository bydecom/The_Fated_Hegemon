// SpriteSheet Manager - Quản lý sprite sheets và tạo animations
export class SpriteSheetManager {
    constructor(scene) {
        this.scene = scene;
        this.loadedSprites = new Map(); // Cache loaded sprites
    }
    
    // ⭐ Load sprite sheet và tạo animations
    loadAnimalSpriteSheet() {
        const textureKey = 'animal_sprite';
        const config = {
            frameWidth: 64,   // 384 / 6 = 64
            frameHeight: 64,  // 512 / 8 = 64
            startFrame: 0,
            endFrame: 23      // 6 frames x 4 directions - 1
        };
        
        // Load sprite sheet với error handling
        this.scene.load.spritesheet(textureKey, 'assets/sprites/animal.png', config);
        
        // Xử lý khi load thành công
        this.scene.load.once('complete', () => {
            this.createAnimalAnimations();
            console.log(`✅ Animal sprite sheet loaded successfully`);
        });
        
        // Xử lý khi load thất bại
        this.scene.load.once('loaderror', (file) => {
            if (file.key === textureKey) {
                console.warn(`⚠️ Animal sprite sheet not found, using graphics fallback`);
                // Tạo placeholder animations để tránh lỗi
                this.createPlaceholderAnimations();
            }
        });
        
        console.log(`🖼️ Loading animal sprite sheet: 384x512, 6x8 frames`);
        return textureKey;
    }
    
    // ⭐ Tạo animations từ sprite sheet
    createAnimalAnimations() {
        const textureKey = 'animal_sprite';
        
        // Animal idle (sử dụng frame đầu tiên của move_down)
        this.scene.anims.create({
            key: 'animal_idle',
            frames: [{ key: textureKey, frame: 0 }], // Frame đầu tiên của move_down
            frameRate: 1,
            repeat: -1
        });
        
        // Animal move_down (hàng 1: frames 0-5)
        this.scene.anims.create({
            key: 'animal_move_down',
            frames: this.scene.anims.generateFrameNumbers(textureKey, {
                start: 0,
                end: 5
            }),
            frameRate: 8,
            repeat: -1
        });
        
        // Animal move_up (hàng 2: frames 6-11)
        this.scene.anims.create({
            key: 'animal_move_up',
            frames: this.scene.anims.generateFrameNumbers(textureKey, {
                start: 6,
                end: 11
            }),
            frameRate: 8,
            repeat: -1
        });
        
        // Animal move_left (hàng 3: frames 12-17)
        this.scene.anims.create({
            key: 'animal_move_left',
            frames: this.scene.anims.generateFrameNumbers(textureKey, {
                start: 12,
                end: 17
            }),
            frameRate: 8,
            repeat: -1
        });
        
        // Animal move_right (hàng 4: frames 18-23)
        this.scene.anims.create({
            key: 'animal_move_right',
            frames: this.scene.anims.generateFrameNumbers(textureKey, {
                start: 18,
                end: 23
            }),
            frameRate: 8,
            repeat: -1
        });
        
        // Animal die (sử dụng frame cuối của move_down)
        this.scene.anims.create({
            key: 'animal_die',
            frames: [{ key: textureKey, frame: 5 }], // Frame cuối của move_down
            frameRate: 1,
            repeat: 0
        });
        
        console.log(`🎬 Created animal animations from sprite sheet`);
    }
    
    // ⭐ Tạo placeholder animations khi không có sprite sheet
    createPlaceholderAnimations() {
        // Tạo placeholder animations để tránh lỗi
        // Sử dụng graphics thay vì sprite
        
        // Animal idle (placeholder)
        this.scene.anims.create({
            key: 'animal_idle',
            frames: [{ key: '__WHITE', frame: 0 }], // Sử dụng texture trắng
            frameRate: 1,
            repeat: -1
        });
        
        // Animal move animations (placeholder)
        const directions = ['down', 'up', 'left', 'right'];
        directions.forEach(direction => {
            this.scene.anims.create({
                key: `animal_move_${direction}`,
                frames: [{ key: '__WHITE', frame: 0 }],
                frameRate: 8,
                repeat: -1
            });
        });
        
        // Animal die (placeholder)
        this.scene.anims.create({
            key: 'animal_die',
            frames: [{ key: '__WHITE', frame: 0 }],
            frameRate: 1,
            repeat: 0
        });
        
        console.log(`⚠️ Created placeholder animations (no sprite sheet found)`);
    }
    
    // ⭐ Tạo sprite từ texture key
    createAnimalSprite(x, y) {
        const textureKey = 'animal_sprite';
        
        // Tạo sprite với frame đầu tiên
        const sprite = this.scene.add.sprite(x, y, textureKey, 0);
        sprite.setOrigin(0.5, 0.5); // Center origin
        sprite.setScale(1.0); // Có thể scale nếu cần
        
        // Play idle animation
        sprite.play('animal_idle');
        
        console.log(`🐗 Created animal sprite at (${x}, ${y})`);
        return sprite;
    }
    
    // ⭐ Cập nhật AnimationManager để sử dụng sprite thay vì graphics
    updateAnimationManager(animationManager) {
        // Override method tạo animation để sử dụng sprite
        const originalCreateAnimation = animationManager.createAnimation.bind(animationManager);
        
        animationManager.createAnimation = (animationKey, config, direction) => {
            // Nếu là animal animation, sử dụng sprite
            if (animationKey.startsWith('animal_')) {
                this.createAnimalAnimations();
                return;
            }
            
            // Các animation khác sử dụng method gốc
            return originalCreateAnimation(animationKey, config, direction);
        };
        
        // Override method getTextureKey
        const originalGetTextureKey = animationManager.getTextureKey.bind(animationManager);
        
        animationManager.getTextureKey = (animationKey) => {
            if (animationKey.startsWith('animal_')) {
                return 'animal_sprite';
            }
            return originalGetTextureKey(animationKey);
        };
        
        console.log(`🔗 Updated AnimationManager for sprite-based animations`);
    }
    
    // ⭐ Load tất cả sprite sheets
    loadAllSpriteSheets() {
        const promises = [];
        
        // Load animal sprite sheet
        const animalPromise = new Promise((resolve) => {
            this.scene.load.once('complete', () => {
                this.createAnimalAnimations();
                resolve();
            });
            this.loadAnimalSpriteSheet();
            this.scene.load.start();
        });
        
        promises.push(animalPromise);
        
        return Promise.all(promises);
    }
    
    // ⭐ Lấy sprite từ entity
    getEntitySprite(entityId) {
        // Tìm sprite trong container của entity
        const container = this.scene.renderSystem?.containers?.get(entityId);
        if (container && container.body) {
            return container.body;
        }
        return null;
    }
    
    // ⭐ Cập nhật sprite animation
    updateSpriteAnimation(entityId, animationKey) {
        const sprite = this.getEntitySprite(entityId);
        if (sprite && sprite.play) {
            sprite.play(animationKey);
            console.log(`🎬 Playing ${animationKey} on entity ${entityId}`);
        }
    }
    
    // ⭐ Dừng sprite animation
    stopSpriteAnimation(entityId) {
        const sprite = this.getEntitySprite(entityId);
        if (sprite && sprite.stop) {
            sprite.stop();
            console.log(`🛑 Stopped animation on entity ${entityId}`);
        }
    }
    
    // ⭐ Kiểm tra animation có tồn tại không
    hasAnimation(animationKey) {
        return this.scene.anims.exists(animationKey);
    }
    
    // ⭐ Lấy danh sách animations
    getAvailableAnimations() {
        const animations = [];
        this.scene.anims.anims.entries.forEach((anim, key) => {
            animations.push(key);
        });
        return animations;
    }
    
    // ⭐ Debug: In thông tin sprite sheet
    debugSpriteSheet(textureKey = 'animal_sprite') {
        const texture = this.scene.textures.get(textureKey);
        if (texture) {
            console.log(`🐛 Sprite Sheet Debug - ${textureKey}:`);
            console.log(`  - Source: ${texture.source[0].src}`);
            console.log(`  - Frame count: ${texture.frameTotal}`);
            console.log(`  - Frame size: ${texture.source[0].width / 6}x${texture.source[0].height / 8}`);
        } else {
            console.log(`❌ Texture ${textureKey} not found`);
        }
    }
}
