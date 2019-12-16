import * as cls from '../../src/cls-ts';

describe('leaky-promises', () => {
  afterAll(() => {
    cls.reset();
  });

  it('should create a context for an async execution', async () => {
    const wrapAgain = async function<T>(originalFn: () => Promise<T>): Promise<T> {
      return originalFn();
    };

    const generateWrapper = function<T, A extends any[]>(originalFn: (...args: A) => Promise<T> | T): (...args: A) => Promise<T> {
      return async function(...args: A): Promise<T> {
        // eslint-disable-next-line no-invalid-this
        const that = this;
        const namespace = cls.createNamespace('leaky-promises');
        return namespace.runAndReturn(async () =>
          wrapAgain(
            async () =>
              // eslint-disable-next-line no-return-await
              await originalFn.apply(that, args)
          )
        );
      };
    };

    const fakeDecorator = function(): (target: any, name: string, descriptor: PropertyDescriptor) => PropertyDescriptor {
      return function(target: any, methodName: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        const originalFn = descriptor.value;

        descriptor.value = generateWrapper(originalFn);
        return descriptor;
      };
    };
    class Test {
      @fakeDecorator()
      public testFn(): any {
        return { a: { b: 9 }, c: { d: { e: 32 } } };
      }
    }

    await new Test().testFn();
  });

  it('should not still have an active context in the next test', async () => {
    const namespace = cls.getNamespace('leaky-promises');
    expect(namespace.active).toBeUndefined();
  });
});
