import { AsyncLocalStorage } from "node:async_hooks";
import { spec } from "./spec";
import { Context, createServiceContainer } from "../dist";
import { Car } from "./service/car";
import { Injector } from "./service/injector";

const serviceContainer = createServiceContainer(spec);

const car: Car = serviceContainer.get(Symbol.for("car"));
const ctx: AsyncLocalStorage<Context> = serviceContainer.get("ctx");

console.log(car.getDriverName());

let scopedService1;
{
  let scopedService2;

  ctx.run({}, () => {
    scopedService1 = serviceContainer.get("myScopedService");
    scopedService2 = serviceContainer.get("myScopedService");
  });
  console.log(scopedService1, scopedService2, scopedService1 === scopedService2);
}

{
  let scopedService3;
  let scopedService4;
  ctx.run({}, () => {
    scopedService3 = serviceContainer.get("myScopedService");
    scopedService4 = serviceContainer.get("myScopedService");
  });
  console.log(scopedService1, scopedService3, scopedService1 === scopedService3);
  console.log(scopedService3, scopedService4, scopedService3 === scopedService4);
}

const injectorService: Injector = serviceContainer.get("injectorService");
console.log("Get driver name from property set with property injection:", injectorService.car.getDriverName());
console.log("Get driver name from property set with setter injection:", injectorService.driver.getName());

console.log(serviceContainer.get("tail"));