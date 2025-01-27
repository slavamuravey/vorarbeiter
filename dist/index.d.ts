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
export declare class ServiceContainerImpl implements ServiceContainer {
    private readonly spec;
    private services;
    private loading;
    constructor(spec: ServiceSpec);
    get<T>(id: ServiceId): T;
    private resolveService;
    has(id: ServiceId): boolean;
    private createService;
    private storeService;
    private retrieveService;
    private resolveContext;
}
export declare const createServiceContainer: (spec: ServiceSpec) => ServiceContainerImpl;
export interface ServiceDefinitionBuilder<T = unknown> {
    shared(): ServiceDefinitionBuilder<T>;
    transient(): ServiceDefinitionBuilder<T>;
    scoped(contextResolver: ContextResolverDefinition): ServiceDefinitionBuilder<T>;
    withInjector(injector: ServiceInjectorDefinition<T>): ServiceDefinitionBuilder<T>;
    getServiceDefinition(): ServiceDefinition<T>;
}
export declare class ServiceDefinitionBuilderImpl<T> implements ServiceDefinitionBuilder<T> {
    private readonly factory;
    private contextResolver;
    private injector?;
    constructor(factory: ServiceFactoryDefinition<T>);
    shared(): this;
    transient(): this;
    scoped(contextResolver: ContextResolverDefinition): this;
    withInjector(injector: ServiceInjectorDefinition<T>): this;
    getServiceDefinition(): ServiceDefinition<T>;
}
export interface ServiceSpecBuilder {
    set<T>(id: ServiceId, factory: ServiceFactoryDefinition<T>): ServiceDefinitionBuilder<T>;
    addMiddleware(...middlewares: Middleware[]): ServiceSpecBuilder;
    getServiceSpec(): ServiceSpec;
}
export declare class ServiceSpecBuilderImpl implements ServiceSpecBuilder {
    private defBuilders;
    private middlewares;
    set<T>(id: ServiceId, factory: ServiceFactoryDefinition<T>): ServiceDefinitionBuilder<T>;
    addMiddleware(...middlewares: Middleware[]): this;
    getServiceSpec(): ServiceSpec;
}
export declare const createServiceSpecBuilder: () => ServiceSpecBuilderImpl;
export declare class SharedContextResolver implements ContextResolver {
    context: any;
    resolveContext(container: ServiceContainer): Context;
}
export declare class TransientContextResolver implements ContextResolver {
    resolveContext(container: ServiceContainer): Context;
}
export declare class UnknownServiceError extends Error {
    readonly id: ServiceId;
    constructor(id: ServiceId);
}
export declare class ServiceCircularReferenceError extends Error {
    readonly id: ServiceId;
    readonly referenceChain: ServiceId[];
    constructor(id: ServiceId, referenceChain: ServiceId[]);
}
