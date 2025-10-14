// Component ngoại hình - Màu sắc, kích thước, hình dạng

export class Appearance {
    constructor(color = 0x00ff00, size = 20, shape = 'circle') {
        this.color = color;
        this.size = size;
        this.shape = shape; // 'circle', 'rectangle', 'triangle'
        this.alpha = 1.0;
        // MẶC ĐỊNH: Player Unit (Circle) có vũ khí
        this.weapon = {
            type: 'long_stick', 
            offsetX: 5,        // Khoảng cách nhỏ (margin)
            offsetY: 15        // Dịch chuyển lên/xuống (bên hông)
        };
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
}
