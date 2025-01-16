export type ServiceFactoryDefinition = ServiceFactory | ServiceFactoryFunction;
export type ContextResolverDefinition = ContextResolver | ContextResolverFunction;

export interface ServiceDefinition {
  factory: ServiceFactoryDefinition;
  contextResolver: ContextResolverDefinition;
}

export interface ContextResolver {
  resolveContext(container: ServiceContainer): object;
}

export type ContextResolverFunction = (container: ServiceContainer) => object;

export interface ServiceFactory {
  create(container: ServiceContainer): any;
}

export type ServiceFactoryFunction = (container: ServiceContainer) => any;

const sharedContext = Object.create(null);
const sharedContextResolver = () => sharedContext;

export class ServiceContainer {
  private spec: ServiceSpec;
  private services = new Map<string, any>();

  constructor(spec: ServiceSpec) {
    this.spec = spec;
  }

  get(name: string): any {
    if (!this.spec.has(name)) {
      throw new Error(`unknown service "${name}".`);
    }

    return this.retrieveService(name) ?? this.createService(name);
  }

  private createService(name: string) {
    const definition = this.spec.get(name);
    const { factory } = definition;
    const service = typeof factory === "function" ? factory(this) : factory.create(this);

    this.storeService(name, service);

    return service;
  }

  private storeService(name: string, service: any) {
    const ctx = this.resolveContext(name);

    if (!this.services.has(name)) {
      this.services.set(name, new WeakMap());
    }

    this.services.get(name).set(ctx, service);
  }

  private retrieveService(name: string) {
    const ctx = this.resolveContext(name);

    return this.services.get(name)?.get(ctx);
  }

  private resolveContext(name: string) {
    const definition = this.spec.get(name);
    const { contextResolver } = definition;

    return typeof contextResolver === "function" ? contextResolver(this) : contextResolver.resolveContext(this);
  }
}

export class ServiceSpec {
  private spec = new Map<string, ServiceDefinition>;

  set(name: string, factory: ServiceFactoryDefinition, contextResolver?: ContextResolverDefinition) {
    this.spec.set(name, {
      factory,
      contextResolver: contextResolver ?? sharedContextResolver
    });
  }

  get(name: string) {
    return this.spec.get(name);
  }

  has(name: string) {
    return this.spec.has(name);
  }
}
