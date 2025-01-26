import { AsyncLocalStorage } from "node:async_hooks";
import { Context, ContextResolverDefinition, createServiceSpecBuilder } from "../dist";
import { CarFactory } from "./factory/car";
import { DriverImpl } from "./service/impl/driver";
import { InjectorImpl } from "./service/impl/injector";
import { HeadTail } from "./service/head-tail";

const contextResolver: ContextResolverDefinition = container =>
  (container.get("ctx") as AsyncLocalStorage<Context>).getStore()!;

const specBuilder = createServiceSpecBuilder();

specBuilder.set(Symbol.for("car"), new CarFactory());
specBuilder.set("driver", () => new DriverImpl());
specBuilder.set("myScopedService", () => ({ serviceName: "Awesome service" })).scoped(contextResolver);
specBuilder.set("ctx", () => new AsyncLocalStorage<Context>());
specBuilder
  .set("injectorService", () => new InjectorImpl())
  .withInjector((service, container) => {
    service.car = container.get(Symbol.for("car"));
    service.setDriver(container.get("driver"));
  });

specBuilder.set("head", (container) => ({ head: "head", tail: (container.get("tail") as HeadTail).tail }));
specBuilder
  .set("tail", (): HeadTail => ({ head: undefined, tail: "tail" }))
  .withInjector((service, container) => {
    const head: HeadTail = container.get("head");
    service.head = head.head;
  });

const spec = specBuilder.getServiceSpec();

export { spec };
