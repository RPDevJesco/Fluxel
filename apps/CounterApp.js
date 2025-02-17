import { FluxelRenderer } from '../FluxelRenderer.js';
import { FluxelSignal } from '../FluxelSignal.js';
import { FluxelButton } from '../components/FluxelButton.js';
import { FluxelText } from '../components/FluxelText.js';

export class CounterApp {
    constructor(canvasId) {
        console.log('Initializing CounterApp...');

        // Initialize renderer
        this.renderer = new FluxelRenderer(canvasId);

        // Create signal for counter value
        this.count = new FluxelSignal(0);

        // Create UI components with proper spacing and sizes
        this.createComponents();

        // Start the render loop
        console.log('Starting render loop...');
        this.renderer.render();
    }

    createComponents() {
        // Define layout constants
        const BUTTON_WIDTH = 80;
        const BUTTON_HEIGHT = 40;
        const PADDING = 20;
        const START_X = PADDING;
        const START_Y = PADDING;

        console.log('Creating components with dimensions:', {
            buttonWidth: BUTTON_WIDTH,
            buttonHeight: BUTTON_HEIGHT,
            startX: START_X,
            startY: START_Y
        });

        // Create decrement button
        const decrementButton = this.renderer.createComponent(
            'decrement',
            new FluxelButton(
                START_X,
                START_Y,
                BUTTON_WIDTH,
                BUTTON_HEIGHT,
                '-',
                () => {
                    console.log('Decrement clicked');
                    this.count.set(this.count.get() - 1);
                }
            )
        );

        // Create counter display
        const counterText = this.renderer.createComponent(
            'counter',
            new FluxelText(
                START_X + BUTTON_WIDTH + PADDING,
                START_Y,
                () => this.count.get().toString(),
                {
                    width: 100,
                    height: BUTTON_HEIGHT,
                    fontSize: 32,
                    fontWeight: 'bold',
                    textColor: [0.2, 0.2, 0.8, 1.0],
                    align: 'center'
                }
            )
        );

        // Create increment button
        const incrementButton = this.renderer.createComponent(
            'increment',
            new FluxelButton(
                START_X + BUTTON_WIDTH + PADDING + 100 + PADDING,
                START_Y,
                BUTTON_WIDTH,
                BUTTON_HEIGHT,
                '+',
                () => {
                    console.log('Increment clicked');
                    this.count.set(this.count.get() + 1);
                }
            )
        );

        // Set button colors
        decrementButton.setColors(
            [0.8, 0.2, 0.2, 1.0],  // Base color
            [0.9, 0.3, 0.3, 1.0],  // Hover
            [0.7, 0.15, 0.15, 1.0] // Active
        );

        incrementButton.setColors(
            [0.2, 0.8, 0.2, 1.0],  // Base color
            [0.3, 0.9, 0.3, 1.0],  // Hover
            [0.15, 0.7, 0.15, 1.0] // Active
        );

        // Subscribe to count changes
        this.count.subscribe((newValue) => {
            console.log('Count updated to:', newValue);
            counterText.needsUpdate = true;
        });

        console.log('Components created successfully');
    }
}