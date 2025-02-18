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
export declare enum ServiceType {
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
export type ServiceTypeDefinition = ServiceTypeDefinitionShared | ServiceTypeDefinitionTransient | ServiceTypeDefinitionScoped;
export interface ServiceDefinition<T = unknown> {
    type: ServiceTypeDefinition;
    factory: ServiceFactoryDefinition<T>;
    injector?: ServiceInjectorDefinition<T>;
}
export type ServiceId = string | symbol;
export interface ServiceSpec {
    services: Map<ServiceId, ServiceDefinition>;
}
export interface ServiceContainer {
    get<T>(id: ServiceId): T;
    has(id: ServiceId): boolean;
}
export declare class ServiceContainerImpl implements ServiceContainer {
    private readonly spec;
    private readonly services;
    private readonly loading;
    constructor(spec: ServiceSpec);
    get<T>(id: ServiceId): T;
    private resolveServiceShared;
    private resolveServiceTransient;
    private resolveServiceScoped;
    has(id: ServiceId): boolean;
    private createService;
    private executeInjection;
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
    private type;
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
    getServiceSpec(): ServiceSpec;
}
export declare class ServiceSpecBuilderImpl implements ServiceSpecBuilder {
    private readonly defBuilders;
    set<T>(id: ServiceId, factory: ServiceFactoryDefinition<T>): ServiceDefinitionBuilder<T>;
    getServiceSpec(): ServiceSpec;
}
export declare const createServiceSpecBuilder: () => ServiceSpecBuilderImpl;
export declare class UnknownServiceError extends Error {
    readonly id: ServiceId;
    constructor(id: ServiceId);
}
export declare class ServiceCircularReferenceError extends Error {
    readonly id: ServiceId;
    readonly referenceChain: ServiceId[];
    constructor(id: ServiceId, referenceChain: ServiceId[]);
}
