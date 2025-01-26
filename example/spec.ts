import { AsyncLocalStorage } from "node:async_hooks";
import { Context, ContextResolverDefinition, createServiceSpecBuilder } from "../dist";
import { CarFactory } from "./factory/car";
import { DriverImpl } from "./service/impl/driver";
import { Car } from "./service/car";
import { Driver } from "./service/driver";

const contextResolver: ContextResolverDefinition = container => container.get("ctx").getStore();

const specBuilder = createServiceSpecBuilder();

specBuilder.set(Symbol.for("car"), new CarFactory());
specBuilder.set("driver", () => new DriverImpl());
specBuilder.set("myScopedService", () => ({ serviceName: "Awesome service" })).scoped(contextResolver);
specBuilder.set("ctx", () => new AsyncLocalStorage<Context>());
specBuilder.set("injectorService", () => {
  return new class {
    car!: Car;
    driver!: Driver;
    setDriver(driver: Driver) {
      this.driver = driver;
    }
  };
}).withInjector((service, container) => {
  service.car = container.get(Symbol.for("car"));
  service.setDriver(container.get("driver"));
});

specBuilder.set("head", (container) => ({ head: "head", tail: container.get("tail").tail }));
specBuilder.set("tail", () => ({ head: undefined, tail: "tail" })).withInjector((service, container) => {
  service.head = container.get("head").head;
});

const spec = specBuilder.getServiceSpec();

export { spec };
