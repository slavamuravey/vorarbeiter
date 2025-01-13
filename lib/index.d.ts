export type ServiceFactory = {
    create(container: ServiceContainer): any;
};
export type ServiceFactoryFunction = (container: ServiceContainer) => any;
export type ServiceSpec = Map<string, ServiceFactory | ServiceFactoryFunction>;
export declare class ServiceContainer {
    private spec;
    private services;
    constructor(spec: ServiceSpec);
    get(name: string): any;
}
