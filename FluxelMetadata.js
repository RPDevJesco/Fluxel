export class FluxelMetadata {
    constructor() {
        this.metaTags = new Map();
        this.jsonLD = null;
        this.initializeJSONLD();
    }

    initializeJSONLD() {
        this.jsonLD = document.createElement('script');
        this.jsonLD.type = 'application/ld+json';
        document.head.appendChild(this.jsonLD);
    }

    setMeta(key, content) {
        if (!this.metaTags.has(key)) {
            const meta = document.createElement('meta');
            meta.name = key;
            document.head.appendChild(meta);
            this.metaTags.set(key, meta);
        }
        this.metaTags.get(key).content = content;
    }

    updateStructuredData(data) {
        this.jsonLD.textContent = JSON.stringify(data);
    }
}