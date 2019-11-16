import * as cls from '../../src/cls-ts';

/**
 * See https://github.com/othiym23/node-continuation-local-storage/issues/64
 */
describe('promise-context-convention', () => {
  let promise: Promise<void>;
  const namespace: cls.Namespace = cls.createNamespace('PromiseConventionNS');
  let conventionId = 0;

  beforeAll(done => {
    namespace.run(() => {
      namespace.set('test', 2);
      promise = new Promise(resolve => {
        namespace.run(() => {
          namespace.set('test', 1);
          resolve();
        });
      });
    });

    namespace.run(() => {
      namespace.set('test', 3);
      promise.then(() => {
        conventionId = namespace.get('test');
        done();
      });
    });
  });

  afterAll(() => {
    cls.reset();
  });

  it('should be convention 3', () => {
    expect(conventionId).toEqual(3);
  });
});
