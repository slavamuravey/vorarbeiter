import type { ServiceContainer, ServiceFactory } from "../../lib";
import { DriverImpl } from "../service/impl/driver";

export class DriverFactory implements ServiceFactory {
  create(container: ServiceContainer): DriverImpl {
    return new DriverImpl();
  }
}
