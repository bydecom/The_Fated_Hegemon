// Điểm khởi đầu, cấu hình và khởi chạy game Phaser
import './style.css';
import { DemoScene } from './scenes/Demo/RTS_Demoscene.js';

// Hàm kiểm tra thiết bị di động
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Hàm lấy kích thước màn hình tối ưu
function getOptimalSize() {
    const isMobileDevice = isMobile();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    if (isMobileDevice) {
        // Trên mobile, ưu tiên màn hình ngang
        const isLandscape = screenWidth > screenHeight;
        
        if (isLandscape) {
            // Đã ở màn hình ngang, sử dụng toàn bộ màn hình
            return {
                width: screenWidth,
                height: screenHeight,
                orientation: 'landscape'
            };
        } else {
            // Ở màn hình dọc, xoay để hiển thị màn hình ngang
            return {
                width: screenHeight,
                height: screenWidth,
                orientation: 'portrait'
            };
        }
    } else {
        // Trên desktop, sử dụng kích thước màn hình hiện tại
        return {
            width: screenWidth,
            height: screenHeight,
            orientation: screenWidth > screenHeight ? 'landscape' : 'portrait'
        };
    }
}

// Lấy kích thước tối ưu
const optimalSize = getOptimalSize();

// Cấu hình Phaser
const config = {
    type: Phaser.AUTO,
    width: optimalSize.width,
    height: optimalSize.height,
    parent: 'app',
    backgroundColor: '#2c3e50',
    scene: [
        DemoScene
    ],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 320,
            height: 240
        },
        max: {
            width: optimalSize.width,
            height: optimalSize.height
        }
    },
    input: {
        activePointers: 3 // Hỗ trợ đa chạm
    }
};

// Khởi chạy game
const game = new Phaser.Game(config);

// Xử lý xoay màn hình và resize
window.addEventListener('resize', () => {
    const newSize = getOptimalSize();
    game.scale.resize(newSize.width, newSize.height);
});

// Xử lý xoay màn hình trên mobile
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        const newSize = getOptimalSize();
        game.scale.resize(newSize.width, newSize.height);
        
        // Thông báo cho user xoay màn hình nếu cần
        if (isMobile() && newSize.orientation === 'portrait') {
            showOrientationMessage();
        }
    }, 100);
});

// Hàm hiển thị thông báo xoay màn hình
function showOrientationMessage() {
    // Tạo overlay thông báo
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        color: white;
        font-family: Arial, sans-serif;
        text-align: center;
    `;
    
    overlay.innerHTML = `
        <div>
            <h2>🔄 Xoay màn hình</h2>
            <p>Vui lòng xoay điện thoại sang chế độ ngang để chơi game tốt nhất</p>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="padding: 10px 20px; margin-top: 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Đã xoay màn hình
            </button>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Tự động ẩn sau 5 giây
    setTimeout(() => {
        if (overlay.parentElement) {
            overlay.remove();
        }
    }, 5000);
}

// Kiểm tra và hiển thị thông báo xoay màn hình khi khởi động
if (isMobile() && optimalSize.orientation === 'portrait') {
    setTimeout(showOrientationMessage, 1000);
}

// Hàm yêu cầu full screen
function requestFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

// Thêm nút full screen cho mobile
if (isMobile()) {
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.innerHTML = '⛶';
    fullscreenBtn.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        width: 40px;
        height: 40px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
        z-index: 1000;
    `;
    fullscreenBtn.onclick = requestFullscreen;
    document.body.appendChild(fullscreenBtn);
}

// Export để có thể truy cập từ console
window.game = game;