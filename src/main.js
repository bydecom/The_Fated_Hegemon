// src/main.js
import './style.css';
import { DemoScene } from './scenes/DemoScene.js';
import { PauseScene } from './scenes/PauseScene.js'; // ⭐ IMPORT SCENE MỚI
import { UIScene } from './scenes/UIScene.js'; // ⭐ IMPORT SCENE MỚI

// Cấu hình Phaser
const config = {
    type: Phaser.AUTO,
    // ⭐ SỬA LỖI: Để kích thước tự động lấp đầy màn hình
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'app',
    backgroundColor: '#2c3e50',
    scene: [
        DemoScene,
        PauseScene,
        UIScene // ⭐ THÊM VÀO DANH SÁCH
    ],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scale: {
        // ⭐ SỬA LỖI QUAN TRỌNG NHẤT: Chuyển về chế độ RESIZE
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    // ... (input config giữ nguyên)
};

// Khởi chạy game
const game = new Phaser.Game(config);

// ⭐ BƯỚC 2: ĐƠN GIẢN HÓA EVENT LISTENER
// Không cần gọi game.scale.resize() nữa, Phaser sẽ tự động xử lý với chế độ FIT.
// Chúng ta chỉ giữ lại để xử lý logic xoay màn hình trên mobile.
window.addEventListener('resize', () => {
    // Có thể trống hoặc bạn có thể thêm logic UI đặc biệt ở đây nếu cần
});

// Xử lý xoay màn hình trên mobile
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        // Thông báo cho user xoay màn hình nếu cần
        if (isMobile()) {
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;
            const isLandscape = screenWidth > screenHeight;
            
            if (!isLandscape) {
                showOrientationMessage();
            }
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
if (isMobile()) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const isLandscape = screenWidth > screenHeight;
    
    if (!isLandscape) {
        setTimeout(showOrientationMessage, 1000);
    }
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