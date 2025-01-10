### A simple service container

1. Create some services:
```
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

2. Explain to Service Container how to create services, use factories for this:
```
class CarFactory implements ServiceFactory {
  create(container: ServiceContainer): CarImpl {
    const driver = container.get("driver")
    return new CarImpl(driver);
  }
}

class DriverFactory implements ServiceFactory {
  create(container: ServiceContainer): DriverImpl {
    return new DriverImpl();
  }
}
```

3. Create services Specification:

```
const spec = new Map();

spec.set("car", {
    factory: new CarFactory()
});

spec.set("driver", {
    factory: new DriverFactory()
});
```

4. Create Service Container with this Specification:

```
const serviceContainer = new ServiceContainer(spec);
```

5. Get some service and call its method:

```
const car: Car = serviceContainer.get("car");

console.log(car.getDriverName());
```

6. Get string "Michael Schumacher".
