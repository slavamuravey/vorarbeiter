import type { ServiceSpec } from "../lib";
import { CarFactory } from "./factory/car";
import { DriverImpl } from "./service/impl/driver";

const spec: ServiceSpec = new Map();

spec.set("car", new CarFactory());
spec.set("driver", () => new DriverImpl());

export { spec };
