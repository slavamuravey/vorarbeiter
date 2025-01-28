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

export enum ServiceType {
  Shared = "shared",
  Transient = "transient",
  Scoped = "scoped"
}

export interface ServiceTypeDefinitionShared {
  name: ServiceType.Shared;
}

export interface ServiceTypeDefinitionTransient {
  name: ServiceType.Transient;
}

export interface ServiceTypeDefinitionScoped {
  name: ServiceType.Scoped;
  contextResolver: ContextResolverDefinition;
}

export type ServiceTypeDefinition =
  | ServiceTypeDefinitionShared
  | ServiceTypeDefinitionTransient
  | ServiceTypeDefinitionScoped;

export interface ServiceDefinition<T = unknown> {
  type: ServiceTypeDefinition;
  factory: ServiceFactoryDefinition<T>;
  injector?: ServiceInjectorDefinition<T>;
}

export type ServiceId = string | symbol;

export type Next<T = unknown> = <T>(id: ServiceId) => T;

export type Middleware = <T = unknown>(arg: Next<T>) => Next<T>;

export interface ServiceSpec {
  services: Map<ServiceId, ServiceDefinition>;
  middlewares: Middleware[];
}

export interface ServiceContainer {
  get<T>(id: ServiceId): T;
  has(id: ServiceId): boolean;
}

export class ServiceContainerImpl implements ServiceContainer {
  private services = new Map<ServiceId, WeakMap<Context, unknown> | unknown>();
  private loading = new Set<ServiceId>();

  constructor(private readonly spec: ServiceSpec) {
    let resolveService = this.resolveService.bind(this);
    this.spec.middlewares.forEach(mw => {
      resolveService = mw(resolveService);
    });
    this.resolveService = resolveService;
  }

  get<T>(id: ServiceId): T {
    return this.resolveService(id);
  }

  private resolveService<T>(id: ServiceId): T {
    if (!this.spec.services.has(id)) {
      throw new UnknownServiceError(id);
    }

    const definition = this.spec.services.get(id) as ServiceDefinition<T>;
    switch (definition.type.name) {
      case ServiceType.Transient:
        return this.resolveServiceTransient(id);
      case ServiceType.Scoped:
        return this.resolveServiceScoped(id);
      case ServiceType.Shared:
        return this.resolveServiceShared(id);
    }
  }

  private resolveServiceShared<T>(id: ServiceId): T {
    if (this.services.has(id)) {
      return this.services.get(id) as T;
    }

    const service = this.createService<T>(id);
    this.services.set(id, service);
    this.executeInjection(id, service);

    return service;
  }

  private resolveServiceTransient<T>(id: ServiceId): T {
    const service = this.createService<T>(id);
    this.executeInjection(id, service);

    return service;
  }

  private resolveServiceScoped<T>(id: ServiceId): T {
    const ctx = this.resolveContext(id);
    if (!this.services.has(id)) {
      this.services.set(id, new WeakMap());
    }

    const ctxMap = this.services.get(id) as WeakMap<Context, T>;
    if (ctxMap.has(ctx)) {
      return ctxMap.get(ctx)!;
    }

    const service = this.createService<T>(id);
    ctxMap.set(ctx, service);
    this.executeInjection(id, service);

    return service;
  }

  has(id: ServiceId): boolean {
    return this.services.has(id);
  }

  private createService<T>(id: ServiceId): T {
    if (this.loading.has(id)) {
      throw new ServiceCircularReferenceError(id, [...this.loading.values(), id]);
    }
    const definition = this.spec.services.get(id) as ServiceDefinition<T>;
    const { factory } = definition;

    this.loading.add(id);
    const service = typeof factory === "function" ? factory(this) : factory.create(this);
    this.loading.delete(id);

    return service;
  }

  private executeInjection<T>(id: ServiceId, service: T) {
    const definition = this.spec.services.get(id) as ServiceDefinition<T>;
    const { injector } = definition;
    if (injector) {
      typeof injector === "function" ? injector(service, this) : injector.inject(service, this);
    }
  }

  private resolveContext(id: ServiceId): Context {
    const definition = this.spec.services.get(id)!;
    const { contextResolver } = definition.type as ServiceTypeDefinitionScoped;

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
  private type!: ServiceTypeDefinition;
  private injector?: ServiceInjectorDefinition<T>;

  constructor(private readonly factory: ServiceFactoryDefinition<T>) {
    this.shared();
  }

  shared() {
    this.type = { name: ServiceType.Shared };
    return this;
  }

  transient() {
    this.type = { name: ServiceType.Transient };
    return this;
  }

  scoped(contextResolver: ContextResolverDefinition) {
    this.type = { name: ServiceType.Scoped, contextResolver };
    return this;
  }

  withInjector(injector: ServiceInjectorDefinition<T>) {
    this.injector = injector;
    return this;
  }

  getServiceDefinition(): ServiceDefinition<T> {
    return {
      type: this.type,
      factory: this.factory,
      injector: this.injector
    };
  }
}

export interface ServiceSpecBuilder {
  set<T>(id: ServiceId, factory: ServiceFactoryDefinition<T>): ServiceDefinitionBuilder<T>;
  addMiddleware(...middlewares: Middleware[]): ServiceSpecBuilder;
  getServiceSpec(): ServiceSpec;
}

export class ServiceSpecBuilderImpl implements ServiceSpecBuilder {
  private defBuilders = new Map<ServiceId, ServiceDefinitionBuilder>();
  private middlewares: Middleware[] = [];

  set<T>(id: ServiceId, factory: ServiceFactoryDefinition<T>): ServiceDefinitionBuilder<T> {
    const definitionBuilder = new ServiceDefinitionBuilderImpl<T>(factory);
    this.defBuilders.set(id, definitionBuilder as ServiceDefinitionBuilder);

    return definitionBuilder;
  }

  addMiddleware(...middlewares: Middleware[]) {
    this.middlewares.push(...middlewares);
    return this;
  }

  getServiceSpec(): ServiceSpec {
    const services = new Map<ServiceId, ServiceDefinition>();
    this.defBuilders.forEach((definitionBuilder, id) => {
      services.set(id, definitionBuilder.getServiceDefinition())
    });

    return {
      services,
      middlewares: this.middlewares
    };
  }
}

export const createServiceSpecBuilder = () => new ServiceSpecBuilderImpl();

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
