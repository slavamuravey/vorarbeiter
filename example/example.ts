import { spec } from "./spec";
import { ServiceContainer } from "../lib";
import { Car } from "./service/car";

const serviceContainer = new ServiceContainer(spec);

const car: Car = serviceContainer.get("car");

console.log(car.getDriverName());
