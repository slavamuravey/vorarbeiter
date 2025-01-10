"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceContainer = void 0;
class ServiceContainer {
    constructor(spec) {
        this.services = new Map();
        this.spec = spec;
    }
    get(name) {
        if (this.services.has(name)) {
            return this.services.get(name);
        }
        if (!this.spec.has(name)) {
            throw new Error(`unknown service "${name}".`);
        }
        const service = this.spec.get(name).factory.create(this);
        this.services.set(name, service);
        return service;
    }
}
exports.ServiceContainer = ServiceContainer;
