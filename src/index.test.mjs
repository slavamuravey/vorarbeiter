import assert from "node:assert";
import { describe, it, test } from "node:test";

import {
  createServiceContainer,
  createServiceSpecBuilder,
  ServiceCircularReferenceError,
  UnknownServiceError
} from "../dist/index.js";

test("service container resolves dependencies", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set(
    "car",
    container =>
      new (class CarImpl {
        constructor(driver) {
          this.driver = driver;
        }

        getDriverName() {
          return this.driver.getName();
        }
      })(container.get("driver"))
  );
  specBuilder.set(
    "driver",
    () =>
      new (class {
        getName() {
          return "Michael Schumacher";
        }
      })()
  );

  const spec = specBuilder.getServiceSpec();

  const serviceContainer = createServiceContainer(spec);

  assert.strictEqual(serviceContainer.get("car").getDriverName(), "Michael Schumacher");
});

test("shared service instances are the same", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set("myService", () => ({ serviceName: "My service" }));

  const spec = specBuilder.getServiceSpec();

  const serviceContainer = createServiceContainer(spec);

  const myServiceInstance1 = serviceContainer.get("myService");
  const myServiceInstance2 = serviceContainer.get("myService");

  assert.strictEqual(myServiceInstance1, myServiceInstance2);
});

describe("scoped service instances", () => {
  const ctx1 = Object.create(null);
  const ctx2 = Object.create(null);
  let ctx;
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set("myScopedService", () => ({ serviceName: "My scoped service" })).scoped(() => ctx);

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
  specBuilder.set("myService", () => ({ serviceName: "My service" })).transient();

  const spec = specBuilder.getServiceSpec();

  const serviceContainer = createServiceContainer(spec);

  const myServiceInstance1 = serviceContainer.get("myService");
  const myServiceInstance2 = serviceContainer.get("myService");

  assert.notStrictEqual(myServiceInstance1, myServiceInstance2);
});

test("setter and property injection works", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder
    .set(
      "serviceA",
      () =>
        new (class {
          serviceName = "My service A";

          serviceB;

          serviceC;

          setServiceB(serviceB) {
            this.serviceB = serviceB;
          }
        })()
    )
    .withInjector((service, container) => {
      service.setServiceB(container.get("serviceB"));
      // eslint-disable-next-line no-param-reassign
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
      message: 'unknown service "asdf2qwefdsvc23e"'
    }
  );
});

test("circular dependencies detected", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set("serviceA", container => ({
    serviceName: "My service A",
    serviceB: container.get("serviceB").serviceName
  }));
  specBuilder.set("serviceB", container => ({
    serviceName: "My service B",
    serviceB: container.get("serviceC").serviceName
  }));
  specBuilder.set("serviceC", container => ({
    serviceName: "My service C",
    serviceB: container.get("serviceA").serviceName
  }));

  const spec = specBuilder.getServiceSpec();

  const serviceContainer = createServiceContainer(spec);

  assert.throws(
    () => {
      serviceContainer.get("serviceA");
    },
    {
      id: "serviceA",
      name: "ServiceCircularReferenceError",
      message: "circular dependency detected: serviceA -> serviceB -> serviceC -> serviceA"
    }
  );
});

test("circular dependencies can be prevented with setter or property injection", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set("head", container => ({ head: "head", tail: container.get("tail").tail }));
  specBuilder
    .set("tail", () => ({ head: undefined, tail: "tail" }))
    .withInjector((service, container) => {
      // eslint-disable-next-line no-param-reassign
      service.head = container.get("head").head;
    });

  const spec = specBuilder.getServiceSpec();

  const serviceContainer = createServiceContainer(spec);

  assert.deepEqual(serviceContainer.get("tail"), { head: "head", tail: "tail" });
});

test("symbol service identifiers convert to strings correctly", () => {
  const serviceId = Symbol.for("someService");
  const referenceChain = [Symbol.for("someService"), Symbol.for("someAnotherService"), Symbol.for("someService")];
  const serviceCircularReferenceError = new ServiceCircularReferenceError(serviceId, referenceChain);
  const unknownServiceError = new UnknownServiceError(serviceId);

  assert.equal(unknownServiceError.message, 'unknown service "Symbol(someService)"');

  assert.equal(
    serviceCircularReferenceError.message,
    "circular dependency detected: Symbol(someService) -> Symbol(someAnotherService) -> Symbol(someService)"
  );
});

test("middlewares invoke properly", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set("myService", () => ({ serviceName: "My service" }));
  const milestones = [];
  specBuilder.addMiddleware(
    next => {
      return id => {
        milestones.push(1);
        const service = next(id);
        milestones.push(2);
        return service;
      };
    },
    next => {
      return id => {
        milestones.push(3);
        const service = next(id);
        milestones.push(4);
        return service;
      };
    }
  );

  const spec = specBuilder.getServiceSpec();

  const serviceContainer = createServiceContainer(spec);

  serviceContainer.get("myService");

  assert.deepEqual(milestones, [3, 1, 2, 4]);
});
