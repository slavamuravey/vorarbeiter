import { AsyncLocalStorage } from "node:async_hooks";
import { ServiceSpec } from "../lib";
import { CarFactory } from "./factory/car";
import { DriverImpl } from "./service/impl/driver";

const spec: ServiceSpec = new ServiceSpec();

spec.set("car", new CarFactory());
spec.set("driver", () => new DriverImpl());
spec.set("myScopedService", () => ({ serviceName: "Awesome service" }), container => container.get("ctx").getStore());
spec.set("ctx", () => new AsyncLocalStorage<object>())

export { spec };
