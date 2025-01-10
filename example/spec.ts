import type { ServiceSpec } from "../lib";
import { CarFactory } from "./factory/car";
import { DriverFactory } from "./factory/driver";

const spec: ServiceSpec = new Map();

spec.set("car", {
  factory: new CarFactory()
});

spec.set("driver", {
  factory: new DriverFactory()
});

export { spec };
