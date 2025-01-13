export type ServiceFactory = {
  create(container: ServiceContainer): any;
};
export type ServiceFactoryFunction = (container: ServiceContainer) => any;
export type ServiceSpec = Map<string, ServiceFactory | ServiceFactoryFunction>;

export class ServiceContainer {
  private spec: ServiceSpec;
  private services = new Map<string, any>();

  constructor(spec: ServiceSpec) {
    this.spec = spec;
  }

  get(name: string): any {
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    if (!this.spec.has(name)) {
      throw new Error(`unknown service "${name}".`);
    }

    const factory = this.spec.get(name)!;
    const service = typeof factory === "function" ? factory(this) : factory.create(this);

    this.services.set(name, service);

    return service;
  }
}
