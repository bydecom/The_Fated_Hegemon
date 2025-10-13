// Component ngoại hình - Màu sắc, kích thước, hình dạng

export class Appearance {
    constructor(color = 0x00ff00, size = 20, shape = 'circle') {
        this.color = color;
        this.size = size;
        this.shape = shape; // 'circle', 'rectangle', 'triangle'
        this.alpha = 1.0;
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
}
