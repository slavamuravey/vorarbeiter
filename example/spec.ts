import { AsyncLocalStorage } from "node:async_hooks";

import { Context, ContextResolverDefinition, createServiceSpecBuilder } from "../dist";
import { Next, ServiceId } from "../src";
import { CarFactory } from "./factory/car";
import { HeadTail } from "./service/head-tail";
import { DriverImpl } from "./service/impl/driver";
import { InjectorImpl } from "./service/impl/injector";

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
    // eslint-disable-next-line no-param-reassign
    service.car = container.get(Symbol.for("car"));
    service.setDriver(container.get("driver"));
  });

specBuilder.set("head", container => ({ head: "head", tail: (container.get("tail") as HeadTail).tail }));
specBuilder
  .set("tail", (): HeadTail => ({ head: undefined, tail: "tail" }))
  .withInjector((service, container) => {
    const head: HeadTail = container.get("head");
    // eslint-disable-next-line no-param-reassign
    service.head = head.head;
  });

const spec = specBuilder.getServiceSpec();

export { spec };
