import assert from "node:assert";
import { describe, it, test } from "node:test";
import { createServiceContainer, createServiceSpecBuilder } from "../lib/index.js";

test("service container resolves dependencies", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set("car", container => new class CarImpl {
    constructor(driver) {
      this.driver = driver;
    }

    getDriverName() {
      return this.driver.getName();
    };
  }(container.get("driver")));
  specBuilder.set("driver", () => new class {
    getName() {
      return "Michael Schumacher";
    }
  });

  const spec = specBuilder.getServiceSpec();

  const serviceContainer = createServiceContainer(spec);

  assert.strictEqual(serviceContainer.get("car").getDriverName(), "Michael Schumacher");
});

test("shared service instances are the same", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set("myService", () => ({ serviceName: "My service"}));

  const spec = specBuilder.getServiceSpec();

  const serviceContainer = createServiceContainer(spec);

  const myServiceInstance1 = serviceContainer.get("myService");
  const myServiceInstance2 = serviceContainer.get("myService");

  assert.strictEqual(myServiceInstance1, myServiceInstance2);
});

describe("shared service instances", () => {
  const ctx1 = Object.create(null);
  const ctx2 = Object.create(null);
  let ctx;
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set(
    "myScopedService",
    () => ({ serviceName: "My scoped service"})
  ).scoped(() => ctx);

  const spec = specBuilder.getServiceSpec();

  const serviceContainer = createServiceContainer(spec);

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

test("transient service instances are different", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set("myService", () => ({ serviceName: "My service"})).transient();

  const spec = specBuilder.getServiceSpec();

  const serviceContainer = createServiceContainer(spec);

  const myServiceInstance1 = serviceContainer.get("myService");
  const myServiceInstance2 = serviceContainer.get("myService");

  assert.notStrictEqual(myServiceInstance1, myServiceInstance2);
});

test("setter and property injection works", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set("serviceA", () => (new class {
    serviceName = "My service A";
    serviceB;
    serviceC;
    setServiceB(serviceB) {
      this.serviceB = serviceB;
    }
  })).withInjector((service, container) => {
    service.setServiceB(container.get("serviceB"));
    service.serviceC = container.get("serviceC");
  });
  specBuilder.set("serviceB", () => ({ serviceName: "My service B" }));
  specBuilder.set("serviceC", () => ({ serviceName: "My service C" }));

  const spec = specBuilder.getServiceSpec();

  const serviceContainer = createServiceContainer(spec);

  assert.deepEqual(serviceContainer.get("serviceA"), {
    serviceName: "My service A",
    serviceB: { serviceName: "My service B" },
    serviceC: { serviceName: "My service C" }
  });
});

test("retrieving of unknown service throws exception", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set("someService", () => ({ serviceName: "Some service" }));

  const spec = specBuilder.getServiceSpec();

  const serviceContainer = createServiceContainer(spec);

  assert.throws(
    () => {
      serviceContainer.get("asdf2qwefdsvc23e");
    },
    {
      id: "asdf2qwefdsvc23e",
      name: "UnknownServiceError",
      message: 'unknown service "asdf2qwefdsvc23e"',
    },
  );
});

test("circular dependencies detected", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set("serviceA", container => ({ serviceName: "My service A", serviceB: container.get("serviceB").serviceName}));
  specBuilder.set("serviceB", container => ({ serviceName: "My service B", serviceB: container.get("serviceC").serviceName}));
  specBuilder.set("serviceC", container => ({ serviceName: "My service C", serviceB: container.get("serviceA").serviceName}));

  const spec = specBuilder.getServiceSpec();

  const serviceContainer = createServiceContainer(spec);

  assert.throws(
    () => {
      serviceContainer.get("serviceA");
    },
    {
      id: "serviceA",
      name: "ServiceCircularReferenceError",
      message: "circular dependency detected: serviceA -> serviceB -> serviceC -> serviceA",
    },
  );
});
