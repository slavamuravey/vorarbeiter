import assert from "node:assert";

import { describe, it, test } from "vitest";

import {
  createServiceContainer,
  createServiceSpecBuilder,
  ServiceCircularReferenceError,
  type ServiceContainer,
  type ServiceId,
  type ServiceSpec,
  UnknownServiceError
} from ".";

interface Driver {
  getName(): string;
}

interface Car {
  getDriverName(): string;
}

interface MyService {
  serviceName: string;
}

interface ServiceA {
  serviceName: string;
  serviceB?: { serviceName: string };
  serviceC?: { serviceName: string };
  setServiceB(serviceB: { serviceName: string }): void;
}

interface HeadTail {
  head?: string;
  tail: string;
}

test("service container resolves dependencies", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set<Car>(
    "car",
    (container: ServiceContainer) =>
      new (class CarImpl implements Car {
        constructor(private readonly driver: Driver) {}

        getDriverName(): string {
          return this.driver.getName();
        }
      })(container.get<Driver>("driver"))
  );
  specBuilder.set<Driver>(
    "driver",
    () =>
      new (class implements Driver {
        getName(): string {
          return "Michael Schumacher";
        }
      })()
  );

  const spec: ServiceSpec = specBuilder.getServiceSpec();

  const serviceContainer: ServiceContainer = createServiceContainer(spec);

  assert.strictEqual(serviceContainer.get<Car>("car").getDriverName(), "Michael Schumacher");
});

test("shared service instances are the same", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set<MyService>("myService", () => ({ serviceName: "My service" }));

  const spec: ServiceSpec = specBuilder.getServiceSpec();

  const serviceContainer: ServiceContainer = createServiceContainer(spec);

  const myServiceInstance1 = serviceContainer.get<MyService>("myService");
  const myServiceInstance2 = serviceContainer.get<MyService>("myService");

  assert.strictEqual(myServiceInstance1, myServiceInstance2);
});

describe("scoped service instances", () => {
  const ctx1: object = Object.create(null);
  const ctx2: object = Object.create(null);
  let ctx: object;
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set<MyService>("myScopedService", () => ({ serviceName: "My scoped service" })).scoped(() => ctx);

  const spec: ServiceSpec = specBuilder.getServiceSpec();

  const serviceContainer: ServiceContainer = createServiceContainer(spec);

  it("should be the same within one scope", () => {
    ctx = ctx1;
    const myScopedServiceInstance1 = serviceContainer.get<MyService>("myScopedService");
    const myScopedServiceInstance2 = serviceContainer.get<MyService>("myScopedService");

    assert.strictEqual(myScopedServiceInstance1, myScopedServiceInstance2);
  });

  it("should be different from different scopes", () => {
    ctx = ctx1;
    const myScopedServiceInstance1 = serviceContainer.get<MyService>("myScopedService");
    ctx = ctx2;
    const myScopedServiceInstance2 = serviceContainer.get<MyService>("myScopedService");

    assert.notStrictEqual(myScopedServiceInstance1, myScopedServiceInstance2);
  });
});

test("transient service instances are different", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set<MyService>("myService", () => ({ serviceName: "My service" })).transient();

  const spec: ServiceSpec = specBuilder.getServiceSpec();

  const serviceContainer: ServiceContainer = createServiceContainer(spec);

  const myServiceInstance1 = serviceContainer.get<MyService>("myService");
  const myServiceInstance2 = serviceContainer.get<MyService>("myService");

  assert.notStrictEqual(myServiceInstance1, myServiceInstance2);
});

test("setter and property injection works", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder
    .set<ServiceA>(
      "serviceA",
      () =>
        new (class implements ServiceA {
          serviceName = "My service A";

          serviceB?: { serviceName: string };

          serviceC?: { serviceName: string };

          setServiceB(serviceB: { serviceName: string }): void {
            this.serviceB = serviceB;
          }
        })()
    )
    .withInjector((service, container) => {
      service.setServiceB(container.get<{ serviceName: string }>("serviceB"));
      // eslint-disable-next-line no-param-reassign
      service.serviceC = container.get<{ serviceName: string }>("serviceC");
    });
  specBuilder.set<{ serviceName: string }>("serviceB", () => ({ serviceName: "My service B" }));
  specBuilder.set<{ serviceName: string }>("serviceC", () => ({ serviceName: "My service C" }));

  const spec: ServiceSpec = specBuilder.getServiceSpec();

  const serviceContainer: ServiceContainer = createServiceContainer(spec);

  assert.deepEqual(serviceContainer.get<ServiceA>("serviceA"), {
    serviceName: "My service A",
    serviceB: { serviceName: "My service B" },
    serviceC: { serviceName: "My service C" }
  });
});

test("retrieving of unknown service throws exception", () => {
  const specBuilder = createServiceSpecBuilder();
  specBuilder.set<MyService>("someService", () => ({ serviceName: "Some service" }));

  const spec: ServiceSpec = specBuilder.getServiceSpec();

  const serviceContainer: ServiceContainer = createServiceContainer(spec);

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
  specBuilder.set<{ serviceName: string; serviceB: string }>("serviceA", container => ({
    serviceName: "My service A",
    serviceB: container.get<{ serviceName: string }>("serviceB").serviceName
  }));
  specBuilder.set<{ serviceName: string; serviceB: string }>("serviceB", container => ({
    serviceName: "My service B",
    serviceB: container.get<{ serviceName: string }>("serviceC").serviceName
  }));
  specBuilder.set<{ serviceName: string; serviceB: string }>("serviceC", container => ({
    serviceName: "My service C",
    serviceB: container.get<{ serviceName: string }>("serviceA").serviceName
  }));

  const spec: ServiceSpec = specBuilder.getServiceSpec();

  const serviceContainer: ServiceContainer = createServiceContainer(spec);

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
  specBuilder.set<HeadTail>("head", container => ({ head: "head", tail: container.get<HeadTail>("tail").tail }));
  specBuilder
    .set<HeadTail>("tail", () => ({ head: undefined, tail: "tail" }))
    .withInjector((service, container) => {
      // eslint-disable-next-line no-param-reassign
      service.head = container.get<HeadTail>("head").head;
    });

  const spec: ServiceSpec = specBuilder.getServiceSpec();

  const serviceContainer: ServiceContainer = createServiceContainer(spec);

  assert.deepEqual(serviceContainer.get<HeadTail>("tail"), { head: "head", tail: "tail" });
});

test("symbol service identifiers convert to strings correctly", () => {
  const serviceId: ServiceId = Symbol.for("someService");
  const referenceChain: ServiceId[] = [
    Symbol.for("someService"),
    Symbol.for("someAnotherService"),
    Symbol.for("someService")
  ];
  const serviceCircularReferenceError = new ServiceCircularReferenceError(serviceId, referenceChain);
  const unknownServiceError = new UnknownServiceError(serviceId);

  assert.equal(unknownServiceError.message, 'unknown service "Symbol(someService)"');

  assert.equal(
    serviceCircularReferenceError.message,
    "circular dependency detected: Symbol(someService) -> Symbol(someAnotherService) -> Symbol(someService)"
  );
});
