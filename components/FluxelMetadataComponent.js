import {FluxelComponent} from "./FluxelComponent.js";

export class FluxelMetadataComponent extends FluxelComponent {
    constructor(x, y, width, height, metadataConfig = {}) {
        super(x, y, width, height);
        this.metadataConfig = metadataConfig;
        this.structuredData = metadataConfig.structuredData || null;
    }

    updateMetadata() {
        if (!this.renderer?.metadata) return;

        const metadata = this.renderer.metadata;

        // Update any component-specific metadata
        if (this.metadataConfig.title) {
            metadata.setMeta('title', this.metadataConfig.title);
        }

        if (this.metadataConfig.description) {
            metadata.setMeta('description', this.metadataConfig.description);
        }

        // Update structured data if provided
        if (this.structuredData) {
            metadata.updateStructuredData(this.structuredData);
        }
    }
}