export interface ServiceFactory {
    create(container: ServiceContainer): any;
}
export type ServiceSpec = Map<string, {
    factory: ServiceFactory;
}>;
export declare class ServiceContainer {
    private spec;
    private services;
    constructor(spec: ServiceSpec);
    get(name: string): any;
}
