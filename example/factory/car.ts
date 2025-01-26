import type { ServiceContainer, ServiceFactory } from "../../dist";
import { CarImpl } from "../service/impl/car";
import { Driver } from "../service/driver";

export class CarFactory implements ServiceFactory {
  create(container: ServiceContainer): CarImpl {
    const driver: Driver = container.get("driver");
    return new CarImpl(driver);
  }
}
