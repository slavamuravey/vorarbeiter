import { AsyncLocalStorage } from "node:async_hooks";
import { Context, ContextResolverDefinition, createServiceSpecBuilder } from "../lib";
import { CarFactory } from "./factory/car";
import { DriverImpl } from "./service/impl/driver";
import { Car } from "./service/car";
import { Driver } from "./service/driver";

const contextResolver: ContextResolverDefinition = container => container.get("ctx").getStore();

const specBuilder = createServiceSpecBuilder();

specBuilder.set("car", new CarFactory());
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
  service.car = container.get("car");
  service.setDriver(container.get("driver"));
});

const spec = specBuilder.getServiceSpec()

export { spec };
