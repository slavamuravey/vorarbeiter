<p align="center">
  <img
      alt="Vorarbeiter"
      src="https://private-user-images.githubusercontent.com/3774019/404690571-c04c706f-067b-4ddd-be18-7274f90d5158.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MzczNTY2OTUsIm5iZiI6MTczNzM1NjM5NSwicGF0aCI6Ii8zNzc0MDE5LzQwNDY5MDU3MS1jMDRjNzA2Zi0wNjdiLTRkZGQtYmUxOC03Mjc0ZjkwZDUxNTgucG5nP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MDEyMCUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTAxMjBUMDY1OTU1WiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9YjcxNDA3OTk3OWNhYmRlYjE0ZDFiNGFkYzZjMGVlODIyOWY5MDlkZWE2ZGMyMWZlZTRmZWY2OTAyMzE0ZDQxNSZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.SWxsSe1GN2gpRxVDlMQmD4uKJzKLLVOGr1SKPJ4rsog"
  />
</p>

## A simple service container

### Basic usage

1. Create some services:
```typescript
interface Car {
  getDriverName(): string;
}

class CarImpl implements Car {
  constructor(private readonly driver: Driver) {}
  getDriverName() {
    return this.driver.getName();
  }
}

interface Driver {
  getName(): string;
}

class DriverImpl implements Driver {
  getName() {
    return "Michael Schumacher";
  }
}
```

2. Explain to _Service Container_ how to create services, use factories for this:
```typescript
class CarFactory implements ServiceFactory {
  create(container: ServiceContainer): CarImpl {
    const driver = container.get("driver");
    return new CarImpl(driver);
  }
}
```

3. Create _Service Specification_:

```typescript
import { createServiceSpecBuilder } from "vorarbeiter";

const specBuilder = createServiceSpecBuilder();

spec.set("car", new CarFactory());
spec.set("driver", () => new DriverImpl());

const spec = specBuilder.getServiceSpec();
```
If creating a service is trivial, as for `driver`, we can simply pass a function as a factory.
As for class based factory we can pass `ServiceContainer` as a function parameter.

4. Create _Service Container_ with this _Service Specification_:

```typescript
import { createServiceContainer } from "vorarbeiter";

const serviceContainer = createServiceContainer(spec);
```

5. Get some service and call its method:
```typescript
const car: Car = serviceContainer.get("car");

console.log(car.getDriverName());
```

6. Get string "Michael Schumacher".

### Service scope

#### Shared

By default, services have global scope. It means that the same service will be shared across whole application.

Example:
```typescript
let serviceInstance1;
let serviceInstance2;
// In some part of our application we get a service
serviceInstance1 = serviceContainer.get("myService");
// In some another part of our application we get a service again
serviceInstance2 = serviceContainer.get("myService");

console.log(serviceInstance1 === serviceInstance2); // true
```

#### Scoped

Sometimes we need to have service uniqueness within a specific scope, for example, within one user request.
To do that we should specify the _Context Resolver_ when configure _Service Specification_. Resolving result of the _Context Resolver_ should be **any object**.
To imitate situation when we have two different contexts we can use AsyncLocalStorage from "node:async_hooks" package.

Example:
```typescript
const asyncLocalStorage = new AsyncLocalStorage<object>();
specBuilder
  .set("myScopedService", () => ({ serviceName: "Awesome service" }))
  .scoped(() => asyncLocalStorage.getStore());

let scopedService1;
{
  let scopedService2;

  asyncLocalStorage.run({}, () => {
    scopedService1 = serviceContainer.get("myScopedService");
    scopedService2 = serviceContainer.get("myScopedService");
  });
  console.log(scopedService1 === scopedService2);
}

{
  let scopedService3;
  let scopedService4;
  asyncLocalStorage.run({}, () => {
    scopedService3 = serviceContainer.get("myScopedService");
    scopedService4 = serviceContainer.get("myScopedService");
  });
  console.log(scopedService1 === scopedService3);
  console.log(scopedService3 === scopedService4);
}

// Output:
// true
// false
// true
```

#### Injection after service creation

The most common type of injection is constructor injection. 
This type of injection occurs when creating service.
But sometimes we want to inject after the service has been created.
For this we can specify _Service Injector_ for the service:
```typescript
specBuilder.set("injectorService", () => {
  return new class {
    car!: Car;
    driver!: Driver;
    setDriver(driver: Driver) {
      this.driver = driver;
    }
  };
}).withInjector((service, container) => {
  service.car = container.get("car");
  service.setDriver(container.get("driver"));
});
```
This way we can perform property and setter injection.
