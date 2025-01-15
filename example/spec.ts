import { ServiceSpec } from "../lib";
import { CarFactory } from "./factory/car";
import { DriverImpl } from "./service/impl/driver";
import { asyncLocalStorage } from "./context";

const spec: ServiceSpec = new ServiceSpec();

spec.set("car", new CarFactory());
spec.set("driver", () => new DriverImpl());
spec.set("myScopedService", () => ({ serviceName: "Awesome service" }), () => asyncLocalStorage.getStore());

export { spec, asyncLocalStorage };
