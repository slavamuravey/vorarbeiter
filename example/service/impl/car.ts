import { Car } from "../car";
import { Driver } from "../driver";

export class CarImpl implements Car {
  constructor(private readonly driver: Driver) {}

  getDriverName() {
    return this.driver.getName();
  }
}
