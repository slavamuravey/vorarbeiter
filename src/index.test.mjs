import assert from "node:assert";
import { test, describe, it } from "node:test";
import { ServiceContainer, ServiceSpec } from "../lib/index.js";

test("service container resolves dependencies", () => {
  const spec = new ServiceSpec();
  spec.set("car", container => new class CarImpl {
    constructor(driver) {
      this.driver = driver;
    }

    getDriverName() {
      return this.driver.getName();
    };
  }(container.get("driver")));
  spec.set("driver", () => new class {
    getName() {
      return "Michael Schumacher";
    }
  });

  const serviceContainer = new ServiceContainer(spec);

  assert.strictEqual(serviceContainer.get("car").getDriverName(), "Michael Schumacher");
});

test("shared service instances are the same", () => {
  const spec = new ServiceSpec();
  spec.set("myService", () => ({ serviceName: "My service"}));

  const serviceContainer = new ServiceContainer(spec);

  const myServiceInstance1 = serviceContainer.get("myService");
  const myServiceInstance2 = serviceContainer.get("myService");
  assert.strictEqual(myServiceInstance1, myServiceInstance2);
});

describe("shared service instances", () => {
  const ctx1 = Object.create(null);
  const ctx2 = Object.create(null);
  let ctx;
  const spec = new ServiceSpec();
  spec.set(
    "myScopedService",
    () => ({ serviceName: "My scoped service"}),
    () => ctx
  );
  const serviceContainer = new ServiceContainer(spec);

  it("should be the same within one scope", () => {
    ctx = ctx1;
    const myScopedServiceInstance1 = serviceContainer.get("myScopedService");
    const myScopedServiceInstance2 = serviceContainer.get("myScopedService");
    assert.strictEqual(myScopedServiceInstance1, myScopedServiceInstance2);
  });

  it("should be different from different scopes", () => {
    ctx = ctx1;
    const myScopedServiceInstance1 = serviceContainer.get("myScopedService");
    ctx = ctx2;
    const myScopedServiceInstance2 = serviceContainer.get("myScopedService");
    assert.notStrictEqual(myScopedServiceInstance1, myScopedServiceInstance2);
  });
});
