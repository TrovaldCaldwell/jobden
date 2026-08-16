// shared/MessageBus.js — Pub/sub event system
export default class MessageBus {
    constructor() {
        this._listeners = new Map();
    }

    subscribe(event, callback) {
        if (!this._listeners.has(event)) this._listeners.set(event, []);
        this._listeners.get(event).push(callback);
        // Return unsubscribe function
        return () => {
            const arr = this._listeners.get(event);
            const idx = arr.indexOf(callback);
            if (idx > -1) arr.splice(idx, 1);
        };
    }

    publish(event, data) {
        if (!this._listeners.has(event)) return;
        this._listeners.get(event).forEach(cb => cb(data));
    }
}