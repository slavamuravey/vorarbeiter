export type Context = object;

export interface ContextResolver {
  resolveContext(container: ServiceContainer): Context;
}

export type ContextResolverFunction = (container: ServiceContainer) => Context;

export type ContextResolverDefinition = ContextResolver | ContextResolverFunction;

export interface ServiceFactory<T = unknown> {
  create(container: ServiceContainer): T;
}

export type ServiceFactoryFunction<T = unknown> = (container: ServiceContainer) => T;

export type ServiceFactoryDefinition<T = unknown> = ServiceFactory<T> | ServiceFactoryFunction<T>;

export interface ServiceInjector<T = unknown> {
  inject(service: T, container: ServiceContainer): void;
}

export type ServiceInjectorFunction<T = unknown> = (service: T, container: ServiceContainer) => void;

export type ServiceInjectorDefinition<T = unknown> = ServiceInjector<T> | ServiceInjectorFunction<T>;

export interface ServiceDefinition<T = unknown> {
  factory: ServiceFactoryDefinition<T>;
  contextResolver: ContextResolverDefinition;
  injector?: ServiceInjectorDefinition<T>;
}

export type ServiceId = string | symbol;

export interface ServiceSpec {
  get(id: ServiceId): ServiceDefinition | undefined;
  has(id: ServiceId): boolean;
}

export interface ServiceContainer {
  get<T>(id: ServiceId): T;
  has(id: ServiceId): boolean;
}

export class ServiceContainerImpl implements ServiceContainer {
  private services = new Map<ServiceId, WeakMap<Context, unknown>>();
  private loading = new Set<ServiceId>();

  constructor(private readonly spec: ServiceSpec) {}

  get<T>(id: ServiceId): T {
    if (!this.spec.has(id)) {
      throw new UnknownServiceError(id);
    }

    return this.retrieveService<T>(id) ?? this.createService<T>(id);
  }

  has(id: ServiceId): boolean {
    return this.services.has(id);
  }

  private createService<T>(id: ServiceId): T {
    if (this.loading.has(id)) {
      throw new ServiceCircularReferenceError(id, [...this.loading.values(), id]);
    }
    const definition = this.spec.get(id) as ServiceDefinition<T>;
    const { factory, injector } = definition;

    this.loading.add(id);
    const service = typeof factory === "function" ? factory(this) : factory.create(this);
    this.loading.delete(id);

    this.storeService<T>(id, service);

    if (injector) {
      typeof injector === "function" ? injector(service, this) : injector.inject(service, this);
    }

    return service;
  }

  private storeService<T>(id: ServiceId, service: T) {
    const ctx = this.resolveContext(id);

    if (!this.services.has(id)) {
      this.services.set(id, new WeakMap());
    }

    this.services.get(id)!.set(ctx, service);
  }

  private retrieveService<T>(id: ServiceId): T | undefined {
    const ctx = this.resolveContext(id);

    return (this.services.get(id) as WeakMap<Context, T>)?.get(ctx);
  }

  private resolveContext(id: ServiceId): Context {
    const definition = this.spec.get(id)!;
    const { contextResolver } = definition;

    return typeof contextResolver === "function" ? contextResolver(this) : contextResolver.resolveContext(this);
  }
}

export const createServiceContainer = (spec: ServiceSpec) => new ServiceContainerImpl(spec);

export interface ServiceDefinitionBuilder<T = unknown> {
  shared(): ServiceDefinitionBuilder<T>;
  transient(): ServiceDefinitionBuilder<T>;
  scoped(contextResolver: ContextResolverDefinition): ServiceDefinitionBuilder<T>;
  withInjector(injector: ServiceInjectorDefinition<T>): ServiceDefinitionBuilder<T>;
  getServiceDefinition(): ServiceDefinition<T>;
}

export class ServiceDefinitionBuilderImpl<T> implements ServiceDefinitionBuilder<T> {
  private contextResolver: ContextResolverDefinition = new SharedContextResolver();
  private injector?: ServiceInjectorDefinition<T>;

  constructor(private readonly factory: ServiceFactoryDefinition<T>) {}

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

  withInjector(injector: ServiceInjectorDefinition<T>) {
    this.injector = injector;
    return this;
  }

  getServiceDefinition(): ServiceDefinition<T> {
    return {
      factory: this.factory,
      contextResolver: this.contextResolver,
      injector: this.injector
    };
  }
}

export interface ServiceSpecBuilder {
  set<T>(id: ServiceId, factory: ServiceFactoryDefinition<T>): ServiceDefinitionBuilder<T>;
  getServiceSpec(): ServiceSpec;
}

export class ServiceSpecBuilderImpl implements ServiceSpecBuilder {
  private defBuilders = new Map<ServiceId, ServiceDefinitionBuilder>();

  set<T>(id: ServiceId, factory: ServiceFactoryDefinition<T>): ServiceDefinitionBuilder<T> {
    const definitionBuilder = new ServiceDefinitionBuilderImpl<T>(factory);
    this.defBuilders.set(id, definitionBuilder as ServiceDefinitionBuilder);

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
