import { FluxelRenderer } from '../FluxelRenderer.js';
import { FluxelSignal } from '../FluxelSignal.js';
import { FluxelButton } from '../components/FluxelButton.js';
import { FluxelText } from '../components/FluxelText.js';
import { FluxelContainer } from '../components/FluxelContainer.js';

export class CounterApp {
    constructor(canvasId) {
        console.log('Initializing Counter App...');

        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            throw new Error(`Canvas with id ${canvasId} not found`);
        }

        // Set initial canvas size
        canvas.width = 400;
        canvas.height = 300;
        canvas.style.backgroundColor = '#fff';

        // Initialize renderer
        this.renderer = new FluxelRenderer(canvasId);

        // Initialize counter state
        this.count = new FluxelSignal(0);

        // Create UI components
        this.createComponents();

        // Start rendering
        this.renderer.render();
    }

    createComponents() {
        // Create main container
        const mainContainer = new FluxelContainer(20, 20, 300, 40, {
            layout: 'flex',
            direction: 'row',
            padding: 8,
            gap: 10,
            align: 'center',
            backgroundColor: [0.92, 0.92, 0.92, 1.0]
        });

        // Register container
        this.renderer.createComponent('mainContainer', mainContainer);

        // Create text components with measured widths
        const titleText = new FluxelText(0, 0,
            () => 'Counter: ',
            {
                width: 120,  // Initial width, will be adjusted based on measurement
                height: 30,
                fontSize: 24,
                fontWeight: 'normal',
                textColor: [0, 0, 0, 1.0],
                align: 'left'
            }
        );

        // Measure the text width
        titleText.width = titleText.measureTextWidth('Counter: ');

        const counterText = new FluxelText(0, 0,
            () => this.count.get().toString(),
            {
                width: 45,
                height: 30,
                fontSize: 24,
                fontWeight: 'normal',
                textColor: [0, 0, 0, 1.0],
                align: 'right'
            }
        );

        // Create buttons with fixed square dimensions
        const incrementButton = new FluxelButton(0, 0, 32, 32, '+', () => {
            this.count.set(this.count.get() + 1);
        });

        const decrementButton = new FluxelButton(0, 0, 32, 32, '-', () => {
            this.count.set(this.count.get() - 1);
        });

        // Style buttons
        incrementButton.setColors(
            [0.4, 0.8, 0.4, 1.0],  // Base (green)
            [0.5, 0.9, 0.5, 1.0],  // Hover
            [0.3, 0.7, 0.3, 1.0]   // Active
        );

        decrementButton.setColors(
            [0.9, 0.3, 0.3, 1.0],  // Base (red)
            [1.0, 0.4, 0.4, 1.0],  // Hover
            [0.8, 0.2, 0.2, 1.0]   // Active
        );

        // Mark components as fixed size
        titleText.originalWidth = 100;
        titleText.originalHeight = 30;
        counterText.originalWidth = 40;
        counterText.originalHeight = 30;
        incrementButton.originalWidth = 32;
        incrementButton.originalHeight = 32;
        decrementButton.originalWidth = 32;
        decrementButton.originalHeight = 32;

        // Add components to container
        mainContainer.addChild('title', titleText);
        mainContainer.addChild('counter', counterText);
        mainContainer.addChild('increment', incrementButton);
        mainContainer.addChild('decrement', decrementButton);

        // Register components
        this.renderer.registerContainerComponents('mainContainer', mainContainer);

        // Subscribe to count changes
        this.count.subscribe((newValue) => {
            console.log('Count updated to:', newValue);
            counterText.needsUpdate = true;
            this.renderer.requestBatchUpdate(counterText);
        });
    }
}