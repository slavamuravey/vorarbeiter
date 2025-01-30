import { Car } from "../car";
import { Driver } from "../driver";
import { Injector } from "../injector";

export class InjectorImpl implements Injector {
  car!: Car;

  driver!: Driver;

  setDriver(driver: Driver) {
    this.driver = driver;
  }
}
