import type { ServiceContainer, ServiceFactory } from "../../dist";
import { CarImpl } from "../service/impl/car";

export class CarFactory implements ServiceFactory {
  create(container: ServiceContainer): CarImpl {
    const driver = container.get("driver");
    return new CarImpl(driver);
  }
}
