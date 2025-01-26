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
export declare class ServiceContainerImpl implements ServiceContainer {
    private readonly spec;
    private services;
    private loading;
    constructor(spec: ServiceSpec);
    get(id: ServiceId): any;
    has(id: ServiceId): boolean;
    private createService;
    private storeService;
    private retrieveService;
    private resolveContext;
}
export declare const createServiceContainer: (spec: ServiceSpec) => ServiceContainerImpl;
export interface ServiceDefinitionBuilder {
    shared(): ServiceDefinitionBuilder;
    transient(): ServiceDefinitionBuilder;
    scoped(contextResolver: ContextResolverDefinition): ServiceDefinitionBuilder;
    withInjector(injector: ServiceInjectorDefinition): ServiceDefinitionBuilder;
    getServiceDefinition(): ServiceDefinition;
}
export declare class ServiceDefinitionBuilderImpl implements ServiceDefinitionBuilder {
    private readonly factory;
    private contextResolver;
    private injector?;
    constructor(factory: ServiceFactoryDefinition);
    shared(): this;
    transient(): this;
    scoped(contextResolver: ContextResolverDefinition): this;
    withInjector(injector: ServiceInjectorDefinition): this;
    getServiceDefinition(): ServiceDefinition;
}
export interface ServiceSpecBuilder {
    set(id: ServiceId, factory: ServiceFactoryDefinition): void;
    getServiceSpec(): ServiceSpec;
}
export declare class ServiceSpecBuilderImpl implements ServiceSpecBuilder {
    private defBuilders;
    set(id: ServiceId, factory: ServiceFactoryDefinition): ServiceDefinitionBuilderImpl;
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
