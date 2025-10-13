# Game Design Document: The Fated Hegemon

**Phiên bản:** 1.0
**Ngày tạo:** 14/10/2025
**Tác giả:** [Tên của bạn]

---

## 1. Tầm nhìn & Ý tưởng Cốt lõi (Vision & Core Concept)

### 1.1. Pitch (Giới thiệu ngắn gọn)
"The Fated Hegemon" là một game chiến thuật sinh tồn 4X với yếu tố roguelike, nơi người chơi, trong vai một Lĩnh Chủ bị ném vào thế giới xa lạ, phải xây dựng đế chế của mình dựa vào "nhân phẩm" từ những lượt roll ngẫu nhiên. Người chơi phải cân não để phòng thủ trước những đợt tấn công (Wave) trong một không gian riêng biệt, đồng thời đối mặt với rủi ro bị tấn công ở thế giới chính trong lúc họ đi vắng.

### 1.2. Trải nghiệm Cốt lõi (Core Experience)
* **Sự bất định & Thích nghi:** Người chơi không bao giờ biết mình sẽ nhận được gì tiếp theo, buộc họ phải liên tục ứng biến và sáng tạo ra những chiến thuật độc đáo dựa trên những gì "vận may" mang lại.
* **Căng thẳng & Đánh đổi:** Mỗi Wave là một "Nước cờ Thí" (Gambit). Người chơi phải đưa ra quyết định cân não: mang bao nhiêu quân đi phòng thủ và để lại bao nhiêu để giữ nhà, chấp nhận rủi ro ở một mặt trận để sinh tồn ở mặt trận kia.
* **Cảm giác "Sở hữu" một Thế giới Sống:** Thế giới không chờ đợi người chơi. Các lãnh chúa AI khác tự phát triển, tự tương tác, tạo ra một thế giới luôn biến đổi, khiến mỗi lần chơi lại đều mang đến những câu chuyện mới.

## 2. Vòng lặp Gameplay Cốt lõi (Core Gameplay Loop)

1.  **Khám phá & Mở rộng (Explore & Expand):** Người chơi sử dụng các đơn vị ban đầu để khám phá lãnh thổ xung quanh, tìm kiếm tài nguyên và vị trí chiến lược.
2.  **Khai thác & Xây dựng (Exploit & Build):** Người chơi sử dụng tài nguyên để "Roll", nhận ngẫu nhiên các đơn vị, công trình, hoặc vật phẩm. Họ phải xây dựng và phát triển lãnh địa của mình dựa trên những gì nhận được.
3.  **Chuẩn bị Phòng thủ (Prepare Defense):** Một đồng hồ đếm ngược đến Wave tiếp theo luôn hiển thị. Người chơi phải xây dựng quân đội và công trình phòng thủ trước khi hết giờ.
4.  **Chiến đấu & Sinh tồn (Exterminate & Survive):**
    * Lãnh địa chính bị kéo vào "Không gian U tối". Người chơi trực tiếp điều quân chống lại Wave.
    * Trong lúc đó, các lãnh thổ ngoại vi ở "Thế giới Chính" có thể bị quái vật hoặc lãnh chúa khác tấn công.
5.  **Đối mặt Hậu quả & Lặp lại:** Sau khi Wave kết thúc, người chơi trở về và đối mặt với kết quả (thắng/thua, thiệt hại, lãnh thổ bị chiếm...). Họ thu thập phần thưởng, tiếp tục phát triển và chuẩn bị cho Wave tiếp theo, khó khăn hơn.

## 3. Các Tính năng & Hệ thống Chính (Key Features & Systems)

### 3.1. Hệ thống Tạo thế giới Thủ tục
* Sử dụng thuật toán **Perlin/Simplex Noise** và một **World Seed** để tạo ra các thế giới vô hạn nhưng nhất quán.
* Thế giới được quản lý bằng hệ thống **Chunking (Phân mảnh)**. Chỉ các chunk xung quanh người chơi mới được tải vào bộ nhớ để đảm bảo hiệu năng.

### 3.2. Hệ thống "Roll" Ngẫu nhiên (Gacha/Roguelike)
* Thay thế hoàn toàn cây công nghệ truyền thống.
* Hành động "Roll" tiêu tốn tài nguyên và trả về ngẫu nhiên các kết quả từ một "bể đồ" (Loot Pool) được định sẵn.
* Loot Pool bao gồm: Đơn vị (Nông dân, Lính...), Công trình (Nhà, Mỏ...), Tài nguyên, Buff/Nâng cấp...
* Các vật phẩm có độ hiếm khác nhau (Thường, Hiếm, Sử thi...) với tỷ lệ roll tương ứng.

### 3.3. Hệ thống Wave Phòng thủ & Không gian Song song
* Khi Wave bắt đầu, **GameScene** (Thế giới Chính) và **WaveDefenseScene** (Không gian U tối) sẽ chạy song song.
* Người chơi chỉ có thể tương tác với `WaveDefenseScene`.
* Logic trong `GameScene` vẫn tiếp tục chạy, Lực lượng Đồn trú phải tự chiến đấu dựa trên AI của chúng.
* Đây là cơ chế chiến thuật cốt lõi, tạo ra sự căng thẳng và tính độc đáo cho game.

### 3.4. Hệ thống Mô phỏng Trừu tượng & Sự kiện Ngoài màn hình
* Các lãnh địa AI và hang ổ quái vật ở xa (chưa được tải) sẽ được mô phỏng bằng các chỉ số cấp cao (tài nguyên, sức mạnh quân đội...).
* Hệ thống sẽ chạy một vòng lặp `WorldSimulator` rất chậm (ví dụ: 1 lần/phút) để cập nhật các chỉ số này.
* Khi người chơi đến gần, một phép tính "Bắt kịp" (Catch-up) sẽ được thực hiện để mô phỏng sự phát triển trong thời gian người chơi đi vắng.
* Các AI ở xa có thể tạo ra các **Sự kiện** (ví dụ: cử lính trinh sát, đoàn buôn). Các sự kiện này sẽ chỉ được kích hoạt (spawn đơn vị) khi đến đúng thời gian và địa điểm ở rìa tầm nhìn của người chơi.

### 3.5. Hệ thống AI
* **AI Hành vi (Agent AI):** Sử dụng **Behavior Trees** để các đơn vị tự thực hiện các nhiệm vụ phức tạp (khai thác, xây dựng, chiến đấu, tự bảo vệ).
* **AI Chiến lược (Faction AI):** Sử dụng các mô hình như **Goal-Oriented Action Planning (GOAP)** để các Lãnh chúa AI đối thủ có thể đưa ra quyết định dài hạn (phát triển kinh tế, xây quân, tuyên chiến...).
* **AI Thích ứng (Adaptive AI):** AI có khả năng phân tích lối chơi của người chơi (ví dụ: người chơi hay dùng cung thủ) và thay đổi chiến thuật để đối phó (ví dụ: ưu tiên roll ra các đơn vị giáp kháng tên).

### 3.6. Hệ thống Tùy biến Trang bị (Layered Sprites)
* Mỗi đơn vị được tạo thành từ nhiều lớp hình ảnh (thân, áo giáp, vũ khí, mũ...).
* Cho phép thay đổi trang bị và tùy biến ngoại hình cho các đơn vị.
* Sử dụng kỹ thuật **Render Texture** để tối ưu hóa hiệu năng, gộp nhiều lớp thành một hình ảnh duy nhất khi render.

## 4. Đặc tả Kỹ thuật

* **Engine:** Phaser 3
* **Ngôn ngữ:** TypeScript
* **Kiến trúc Logic:** Entity Component System (ECS) với thư viện `gecs`
* **Công cụ Build:** Vite
* **Nền tảng:** Web (HTML5 Canvas)
* **Lưu trữ Dữ liệu:** IndexedDB (cho phép chơi offline và lưu game trên trình duyệt)

## 5. Định hướng Hình ảnh & Âm thanh

* **Phong cách Đồ họa:** [Ví dụ: 2.5D Isometric, Low-poly Stylized] - Một phong cách đơn giản nhưng rõ ràng, dễ nhìn, cho phép hiển thị hàng trăm đơn vị trên màn hình mà không gây rối mắt.
* **Âm nhạc:** Nhạc nền thay đổi theo ngữ cảnh (giai điệu du dương khi xây dựng, dồn dập khi chiến đấu).
* **Hiệu ứng Âm thanh (SFX):** Các âm thanh phải rõ ràng và thỏa mãn (tiếng thu thập tài nguyên, tiếng vũ khí va chạm, tiếng xây dựng hoàn thành...).

## 6. Phạm vi Sản phẩm Khả dụng Tối thiểu (MVP Scope)

Mục tiêu là tạo ra một phiên bản chơi được nhanh nhất có thể để kiểm chứng vòng lặp gameplay cốt lõi. MVP sẽ bao gồm:

1.  **Chế độ Chơi:** Chỉ có 1 người chơi.
2.  **Bản đồ:** Một bản đồ tĩnh, chưa cần tạo thủ tục.
3.  **Hệ thống "Roll":** Chỉ có 3-4 loại đơn vị/công trình cơ bản có thể roll ra.
4.  **Kẻ thù:** Chỉ có các Wave tấn công theo kịch bản, chưa có Lãnh chúa AI đối thủ.
5.  **Mục tiêu:** Sống sót qua 5 Wave đầu tiên.