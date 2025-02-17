// apps/CounterApp.js
import { FluxelRenderer } from '../FluxelRenderer.js';
import { FluxelSignal } from '../FluxelSignal.js';
import { FluxelButton } from '../components/FluxelButton.js';
import { FluxelText } from '../components/FluxelText.js';

export class CounterApp {
    constructor(canvasId) {
        console.log('CounterApp constructor called with:', canvasId);

        this.renderer = new FluxelRenderer(canvasId);
        this.count = new FluxelSignal(0);

        // Create UI components
        const incrementButton = this.renderer.createComponent(
            'increment',
            new FluxelButton(10, 10, 100, 30, '+', () => {
                console.log('Increment clicked');
                this.count.set(this.count.get() + 1);
            })
        );

        const decrementButton = this.renderer.createComponent(
            'decrement',
            new FluxelButton(10, 50, 100, 30, '-', () => {
                console.log('Decrement clicked');
                this.count.set(this.count.get() - 1);
            })
        );

        // Create counter display
        const counterText = this.renderer.createComponent(
            'counter',
            new FluxelText(120, 25, () => this.count.get())
        );

        // Subscribe to count changes
        this.count.subscribe((newValue) => {
            console.log('Count updated to:', newValue);
            this.renderer.render();
        });

        // Start rendering
        this.renderer.render();

        console.log('CounterApp initialization complete');
    }
}