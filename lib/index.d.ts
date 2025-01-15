export type ServiceFactoryDefinition = ServiceFactory | ServiceFactoryFunction;
export type ContextResolverDefinition = ContextResolver | ContextResolverFunction;
export interface ServiceDefinition {
    factory: ServiceFactoryDefinition;
    contextResolver: ContextResolverDefinition;
}
export interface ContextResolver {
    resolveContext(): object;
}
export type ContextResolverFunction = () => object;
export interface ServiceFactory {
    create(container: ServiceContainer): any;
}
export type ServiceFactoryFunction = (container: ServiceContainer) => any;
export declare class ServiceContainer {
    private spec;
    private services;
    constructor(spec: ServiceSpec);
    get(name: string): any;
    private createService;
    private storeService;
    private retrieveService;
    private resolveContext;
}
export declare class ServiceSpec {
    private spec;
    set(name: string, factory: ServiceFactoryDefinition, contextResolver?: ContextResolverDefinition): void;
    get(name: string): ServiceDefinition;
    has(name: string): boolean;
}
