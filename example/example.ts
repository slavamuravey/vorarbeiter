import { AsyncLocalStorage } from "node:async_hooks";
import { spec } from "./spec";
import { createServiceContainer } from "../dist";
import { Car } from "./service/car";

const serviceContainer = createServiceContainer(spec);

const car: Car = serviceContainer.get("car");
const ctx: AsyncLocalStorage<any> = serviceContainer.get("ctx");

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

console.log("Get driver name from property set with property injection:", serviceContainer.get("injectorService").car.getDriverName());
console.log("Get driver name from property set with setter injection:", serviceContainer.get("injectorService").driver.getName());

console.log(serviceContainer.get("tail"));