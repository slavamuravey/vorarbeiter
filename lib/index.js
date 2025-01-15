"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceSpec = exports.ServiceContainer = void 0;
const sharedContext = Object.create(null);
const sharedContextResolver = () => sharedContext;
class ServiceContainer {
    constructor(spec) {
        this.services = new Map();
        this.spec = spec;
    }
    get(name) {
        var _a;
        if (!this.spec.has(name)) {
            throw new Error(`unknown service "${name}".`);
        }
        return (_a = this.retrieveService(name)) !== null && _a !== void 0 ? _a : this.createService(name);
    }
    createService(name) {
        const definition = this.spec.get(name);
        const { factory } = definition;
        const service = typeof factory === "function" ? factory(this) : factory.create(this);
        this.storeService(name, service);
        return service;
    }
    storeService(name, service) {
        const ctx = this.resolveContext(name);
        if (!this.services.has(name)) {
            this.services.set(name, new WeakMap());
        }
        this.services.get(name).set(ctx, service);
    }
    retrieveService(name) {
        var _a;
        const ctx = this.resolveContext(name);
        return (_a = this.services.get(name)) === null || _a === void 0 ? void 0 : _a.get(ctx);
    }
    resolveContext(name) {
        const definition = this.spec.get(name);
        const { contextResolver } = definition;
        return typeof contextResolver === "function" ? contextResolver() : contextResolver.resolveContext();
    }
}
exports.ServiceContainer = ServiceContainer;
class ServiceSpec {
    constructor() {
        this.spec = new Map;
    }
    set(name, factory, contextResolver) {
        this.spec.set(name, {
            factory,
            contextResolver: contextResolver !== null && contextResolver !== void 0 ? contextResolver : sharedContextResolver
        });
    }
    get(name) {
        return this.spec.get(name);
    }
    has(name) {
        return this.spec.has(name);
    }
}
exports.ServiceSpec = ServiceSpec;
