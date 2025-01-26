import { Car } from "./car";
import { Driver } from "./driver";

export interface Injector {
  car: Car;
  driver: Driver;
  setDriver(driver: Driver): void;
}
