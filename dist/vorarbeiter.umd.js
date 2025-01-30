(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.vorarbeiter = {}));
})(this, (function (exports) { 'use strict';

    exports.ServiceType = void 0;
    (function (ServiceType) {
        ServiceType["Shared"] = "shared";
        ServiceType["Transient"] = "transient";
        ServiceType["Scoped"] = "scoped";
    })(exports.ServiceType || (exports.ServiceType = {}));
    class ServiceContainerImpl {
        constructor(spec) {
            this.spec = spec;
            this.services = new Map();
            this.loading = new Set();
            let resolveService = this.resolveService.bind(this);
            this.spec.middlewares.forEach(mw => {
                resolveService = mw(resolveService);
            });
            this.resolveService = resolveService;
        }
        get(id) {
            return this.resolveService(id);
        }
        resolveService(id) {
            if (!this.spec.services.has(id)) {
                throw new UnknownServiceError(id);
            }
            const definition = this.spec.services.get(id);
            // eslint-disable-next-line default-case
            switch (definition.type.name) {
                case exports.ServiceType.Transient:
                    return this.resolveServiceTransient(id);
                case exports.ServiceType.Scoped:
                    return this.resolveServiceScoped(id);
                case exports.ServiceType.Shared:
                    return this.resolveServiceShared(id);
            }
        }
        resolveServiceShared(id) {
            if (this.services.has(id)) {
                return this.services.get(id);
            }
            const service = this.createService(id);
            this.services.set(id, service);
            this.executeInjection(id, service);
            return service;
        }
        resolveServiceTransient(id) {
            const service = this.createService(id);
            this.executeInjection(id, service);
            return service;
        }
        resolveServiceScoped(id) {
            const ctx = this.resolveContext(id);
            if (!this.services.has(id)) {
                this.services.set(id, new WeakMap());
            }
            const ctxMap = this.services.get(id);
            if (ctxMap.has(ctx)) {
                return ctxMap.get(ctx);
            }
            const service = this.createService(id);
            ctxMap.set(ctx, service);
            this.executeInjection(id, service);
            return service;
        }
        has(id) {
            return this.services.has(id);
        }
        createService(id) {
            if (this.loading.has(id)) {
                throw new ServiceCircularReferenceError(id, [...this.loading.values(), id]);
            }
            const definition = this.spec.services.get(id);
            const { factory } = definition;
            this.loading.add(id);
            const service = typeof factory === "function" ? factory(this) : factory.create(this);
            this.loading.delete(id);
            return service;
        }
        executeInjection(id, service) {
            const definition = this.spec.services.get(id);
            const { injector } = definition;
            if (!injector) {
                return;
            }
            if (typeof injector === "function") {
                injector(service, this);
                return;
            }
            injector.inject(service, this);
        }
        resolveContext(id) {
            const definition = this.spec.services.get(id);
            const { contextResolver } = definition.type;
            return typeof contextResolver === "function" ? contextResolver(this) : contextResolver.resolveContext(this);
        }
    }
    const createServiceContainer = (spec) => new ServiceContainerImpl(spec);
    class ServiceDefinitionBuilderImpl {
        constructor(factory) {
            this.factory = factory;
            this.shared();
        }
        shared() {
            this.type = { name: exports.ServiceType.Shared };
            return this;
        }
        transient() {
            this.type = { name: exports.ServiceType.Transient };
            return this;
        }
        scoped(contextResolver) {
            this.type = { name: exports.ServiceType.Scoped, contextResolver };
            return this;
        }
        withInjector(injector) {
            this.injector = injector;
            return this;
        }
        getServiceDefinition() {
            return {
                type: this.type,
                factory: this.factory,
                injector: this.injector
            };
        }
    }
    class ServiceSpecBuilderImpl {
        constructor() {
            this.defBuilders = new Map();
            this.middlewares = [];
        }
        set(id, factory) {
            const definitionBuilder = new ServiceDefinitionBuilderImpl(factory);
            this.defBuilders.set(id, definitionBuilder);
            return definitionBuilder;
        }
        addMiddleware(...middlewares) {
            this.middlewares.push(...middlewares);
            return this;
        }
        getServiceSpec() {
            const services = new Map();
            this.defBuilders.forEach((definitionBuilder, id) => {
                services.set(id, definitionBuilder.getServiceDefinition());
            });
            return {
                services,
                middlewares: this.middlewares
            };
        }
    }
    const createServiceSpecBuilder = () => new ServiceSpecBuilderImpl();
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
    exports.UnknownServiceError = UnknownServiceError;
    exports.createServiceContainer = createServiceContainer;
    exports.createServiceSpecBuilder = createServiceSpecBuilder;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=vorarbeiter.umd.js.map
