export type Context = object;

export interface ContextResolver {
  resolveContext(container: ServiceContainer): Context;
}

export type ContextResolverFunction = (container: ServiceContainer) => Context;

export type ContextResolverDefinition = ContextResolver | ContextResolverFunction;

export interface ServiceFactory {
  create(container: ServiceContainer): any;
}

export type ServiceFactoryFunction = (container: ServiceContainer) => any;

export type ServiceFactoryDefinition = ServiceFactory | ServiceFactoryFunction;

export interface ServiceInjector {
  inject(service: any, container: ServiceContainer): void;
}

export type ServiceInjectorFunction = (service: any, container: ServiceContainer) => void;

export type ServiceInjectorDefinition = ServiceInjector | ServiceInjectorFunction;

export interface ServiceDefinition {
  factory: ServiceFactoryDefinition;
  contextResolver: ContextResolverDefinition;
  injector?: ServiceInjectorDefinition;
}

export type ServiceId<T = unknown> = string | symbol;

export interface ServiceSpec {
  get(id: ServiceId): ServiceDefinition | undefined;
  has(id: ServiceId): boolean;
}

export interface ServiceContainer {
  get(id: ServiceId): any;
  has(id: ServiceId): boolean;
}

export class ServiceContainerImpl implements ServiceContainer {
  private services = new Map<ServiceId, WeakMap<Context, any>>();
  private loading = new Set<ServiceId>();

  constructor(private readonly spec: ServiceSpec) {}

  get(id: ServiceId): any {
    if (!this.spec.has(id)) {
      throw new UnknownServiceError(id);
    }

    return this.retrieveService(id) ?? this.createService(id);
  }

  has(id: ServiceId): boolean {
    return this.services.has(id);
  }

  private createService(id: ServiceId) {
    if (this.loading.has(id)) {
      throw new ServiceCircularReferenceError(id, [...this.loading.values(), id]);
    }
    const definition = this.spec.get(id)!;
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

  private storeService(id: ServiceId, service: any) {
    const ctx = this.resolveContext(id);

    if (!this.services.has(id)) {
      this.services.set(id, new WeakMap());
    }

    this.services.get(id)!.set(ctx, service);
  }

  private retrieveService(id: ServiceId) {
    const ctx = this.resolveContext(id);

    return this.services.get(id)?.get(ctx);
  }

  private resolveContext(id: ServiceId) {
    const definition = this.spec.get(id)!;
    const { contextResolver } = definition;

    return typeof contextResolver === "function" ? contextResolver(this) : contextResolver.resolveContext(this);
  }
}

export const createServiceContainer = (spec: ServiceSpec) => new ServiceContainerImpl(spec);

export interface ServiceDefinitionBuilder {
  shared(): ServiceDefinitionBuilder;
  transient(): ServiceDefinitionBuilder;
  scoped(contextResolver: ContextResolverDefinition): ServiceDefinitionBuilder;
  withInjector(injector: ServiceInjectorDefinition): ServiceDefinitionBuilder;
  getServiceDefinition(): ServiceDefinition;
}

export class ServiceDefinitionBuilderImpl implements ServiceDefinitionBuilder {
  private contextResolver: ContextResolverDefinition = new SharedContextResolver();
  private injector?: ServiceInjectorDefinition;

  constructor(private readonly factory: ServiceFactoryDefinition) {}

  shared() {
    this.scoped(new SharedContextResolver());
    return this;
  }

  transient() {
    this.scoped(new TransientContextResolver());
    return this;
  }

  scoped(contextResolver: ContextResolverDefinition) {
    this.contextResolver = contextResolver;
    return this;
  }

  withInjector(injector: ServiceInjectorDefinition) {
    this.injector = injector;
    return this;
  }

  getServiceDefinition(): ServiceDefinition {
    return {
      factory: this.factory,
      contextResolver: this.contextResolver,
      injector: this.injector
    };
  }
}

export interface ServiceSpecBuilder {
  set(id: ServiceId, factory: ServiceFactoryDefinition): void;
  getServiceSpec(): ServiceSpec;
}

export class ServiceSpecBuilderImpl implements ServiceSpecBuilder {
  private defBuilders = new Map<ServiceId, ServiceDefinitionBuilder>();

  set(id: ServiceId, factory: ServiceFactoryDefinition) {
    const definitionBuilder = new ServiceDefinitionBuilderImpl(factory);
    this.defBuilders.set(id, definitionBuilder);

    return definitionBuilder;
  }

  getServiceSpec(): ServiceSpec {
    const spec = new Map<ServiceId, ServiceDefinition>();
    this.defBuilders.forEach((definitionBuilder, id) => {
      spec.set(id, definitionBuilder.getServiceDefinition())
    });

    return spec;
  }
}

export const createServiceSpecBuilder = () => new ServiceSpecBuilderImpl();

export class SharedContextResolver implements ContextResolver {
  context = Object.create(null);

  resolveContext(container: ServiceContainer): Context {
    return this.context;
  }
}

export class TransientContextResolver implements ContextResolver {
  resolveContext(container: ServiceContainer): Context {
    return Object.create(null);
  }
}

export class UnknownServiceError extends Error {
  constructor(public readonly id: ServiceId) {
    super(`unknown service "${String(id)}"`);
    this.name = "UnknownServiceError";
  }
}

export class ServiceCircularReferenceError extends Error {
  constructor(public readonly id: ServiceId, public readonly referenceChain: ServiceId[]) {
    super(`circular dependency detected: ${referenceChain.map(String).join(" -> ")}`);
    this.name = "ServiceCircularReferenceError";
  }
}
