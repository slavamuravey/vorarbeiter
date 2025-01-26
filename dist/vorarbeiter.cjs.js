'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class ServiceContainerImpl {
    constructor(spec) {
        this.spec = spec;
        this.services = new Map();
        this.loading = new Set();
    }
    get(id) {
        var _a;
        if (!this.spec.has(id)) {
            throw new UnknownServiceError(id);
        }
        return (_a = this.retrieveService(id)) !== null && _a !== void 0 ? _a : this.createService(id);
    }
    has(id) {
        return this.services.has(id);
    }
    createService(id) {
        if (this.loading.has(id)) {
            throw new ServiceCircularReferenceError(id, [...this.loading.values(), id]);
        }
        const definition = this.spec.get(id);
        const { factory, injector } = definition;
        this.loading.add(id);
        const service = typeof factory === "function" ? factory(this) : factory.create(this);
        this.loading.delete(id);
        this.storeService(id, service);
        if (injector) {
            typeof injector === "function" ? injector(service, this) : injector.inject(service, this);
        }
        return service;
    }
    storeService(id, service) {
        const ctx = this.resolveContext(id);
        if (!this.services.has(id)) {
            this.services.set(id, new WeakMap());
        }
        this.services.get(id).set(ctx, service);
    }
    retrieveService(id) {
        var _a;
        const ctx = this.resolveContext(id);
        return (_a = this.services.get(id)) === null || _a === void 0 ? void 0 : _a.get(ctx);
    }
    resolveContext(id) {
        const definition = this.spec.get(id);
        const { contextResolver } = definition;
        return typeof contextResolver === "function" ? contextResolver(this) : contextResolver.resolveContext(this);
    }
}
const createServiceContainer = (spec) => new ServiceContainerImpl(spec);
class ServiceDefinitionBuilderImpl {
    constructor(factory) {
        this.factory = factory;
        this.contextResolver = new SharedContextResolver();
    }
    shared() {
        this.scoped(new SharedContextResolver());
        return this;
    }
    transient() {
        this.scoped(new TransientContextResolver());
        return this;
    }
    scoped(contextResolver) {
        this.contextResolver = contextResolver;
        return this;
    }
    withInjector(injector) {
        this.injector = injector;
        return this;
    }
    getServiceDefinition() {
        return {
            factory: this.factory,
            contextResolver: this.contextResolver,
            injector: this.injector
        };
    }
}
class ServiceSpecBuilderImpl {
    constructor() {
        this.defBuilders = new Map();
    }
    set(id, factory) {
        const definitionBuilder = new ServiceDefinitionBuilderImpl(factory);
        this.defBuilders.set(id, definitionBuilder);
        return definitionBuilder;
    }
    getServiceSpec() {
        const spec = new Map();
        this.defBuilders.forEach((definitionBuilder, id) => {
            spec.set(id, definitionBuilder.getServiceDefinition());
        });
        return spec;
    }
}
const createServiceSpecBuilder = () => new ServiceSpecBuilderImpl();
class SharedContextResolver {
    constructor() {
        this.context = Object.create(null);
    }
    resolveContext(container) {
        return this.context;
    }
}
class TransientContextResolver {
    resolveContext(container) {
        return Object.create(null);
    }
}
class UnknownServiceError extends Error {
    constructor(id) {
        super(`unknown service "${String(id)}"`);
        this.id = id;
        this.name = "UnknownServiceError";
    }
}
class ServiceCircularReferenceError extends Error {
    constructor(id, referenceChain) {
        super(`circular dependency detected: ${referenceChain.map(String).join(" -> ")}`);
        this.id = id;
        this.referenceChain = referenceChain;
        this.name = "ServiceCircularReferenceError";
    }
}

exports.ServiceCircularReferenceError = ServiceCircularReferenceError;
exports.ServiceContainerImpl = ServiceContainerImpl;
exports.ServiceDefinitionBuilderImpl = ServiceDefinitionBuilderImpl;
exports.ServiceSpecBuilderImpl = ServiceSpecBuilderImpl;
exports.SharedContextResolver = SharedContextResolver;
exports.TransientContextResolver = TransientContextResolver;
exports.UnknownServiceError = UnknownServiceError;
exports.createServiceContainer = createServiceContainer;
exports.createServiceSpecBuilder = createServiceSpecBuilder;
//# sourceMappingURL=vorarbeiter.cjs.js.map
