export { FluxelSignal } from './FluxelSignal.js';
export { FluxelRenderer } from './FluxelRenderer.js';
export { BufferManager } from './BufferManager.js';
export { FluxelButton } from './components/FluxelButton.js';
export { FluxelText } from './components/FluxelText.js';
export { CounterApp } from './apps/CounterApp.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing Counter App...');
        // Import the CounterApp class
        const { CounterApp } = await import('./apps/CounterApp.js');

        // Create an instance of CounterApp
        const app = new CounterApp('fluxel-canvas');
        console.log('Counter App initialized successfully');
    } catch (error) {
        console.error('Error initializing Counter App:', error);
        document.getElementById('debug').textContent = 'Error: ' + error.message;
    }
});