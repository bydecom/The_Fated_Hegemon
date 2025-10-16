// Component ngoại hình - Màu sắc, kích thước, hình dạng

export class Appearance {
    constructor(color = 0x00ff00, size = 20, shape = 'circle') {
        this.color = color;
        this.size = size;
        this.shape = shape; // 'circle', 'rectangle', 'triangle'
        this.alpha = 1.0;
        
        // ⭐ NEW: Sprite support
        this.spriteKey = null; // Key của sprite texture (ví dụ: 'animal_sprite')
        this.useSprite = false; // Có sử dụng sprite không
        
        // MẶC ĐỊNH: Player Unit (Circle) có vũ khí
        this.weapon = {
            type: 'long_stick', 
            offsetX: 5,        // Khoảng cách nhỏ (margin)
            offsetY: 15        // Dịch chuyển lên/xuống (bên hông)
        };
        // ⭐ NEW: 2 cái tay cho unit
        this.hasArms = true; // Có tay hay không
        this.armSize = 4;    // Kích thước tay
        this.armColor = null; // null = màu tối hơn body
    }

    setColor(color) {
        this.color = color;
    }

    setSize(size) {
        this.size = size;
    }

    setShape(shape) {
        this.shape = shape;
    }

    setAlpha(alpha) {
        this.alpha = Math.max(0, Math.min(1, alpha));
    }

    // NEW: Hàm để dễ dàng set/remove vũ khí (dùng trong EntityFactory)
    setWeapon(weaponData) {
        this.weapon = weaponData;
    }
    
    // ⭐ NEW: Set sprite cho appearance
    setSprite(spriteKey, useSprite = true) {
        this.spriteKey = spriteKey;
        this.useSprite = useSprite;
    }
    
    // ⭐ NEW: Kiểm tra có sử dụng sprite không
    isUsingSprite() {
        return this.useSprite && this.spriteKey !== null;
    }
}
