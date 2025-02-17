export class FluxelSignal {
    constructor(initialValue) {
        this.value = initialValue;
        this.subscribers = new Set();
    }

    get() {
        return this.value;
    }

    set(newValue) {
        if (this.value !== newValue) {
            this.value = newValue;
            this.notify();
        }
    }

    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    notify() {
        this.subscribers.forEach(callback => callback(this.value));
    }
}