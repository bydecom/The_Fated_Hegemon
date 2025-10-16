// Quản lý các sự kiện ngoài màn hình

export class EventManager {
    constructor() {
        // TODO: Khởi tạo Event Manager
        this.listeners = new Map();
        this.eventQueue = [];
    }

    // TODO: Quản lý sự kiện ngoài màn hình
    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);
    }

    emit(eventType, data) {
        this.eventQueue.push({ type: eventType, data, timestamp: Date.now() });
    }

    // TODO: Hệ thống event bus
    processEvents() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            const callbacks = this.listeners.get(event.type) || [];
            callbacks.forEach(callback => callback(event.data));
        }
    }

    // TODO: Xử lý sự kiện AI
    emitAIEvent(aiId, eventType, data) {
        this.emit(`ai:${aiId}:${eventType}`, data);
    }
}
