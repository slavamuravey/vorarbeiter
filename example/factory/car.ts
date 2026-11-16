import type { ServiceContainer, ServiceFactory } from "../../src";
import { Driver } from "../service/driver";
import { CarImpl } from "../service/impl/car";

export class CarFactory implements ServiceFactory {
  create(container: ServiceContainer): CarImpl {
    const driver: Driver = container.get("driver");
    return new CarImpl(driver);
  }
}
