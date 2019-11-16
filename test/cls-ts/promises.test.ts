import * as cls from '../../src/cls-ts';

const asyncFunction = async (): Promise<number> => 7;

describe('promises', () => {
  let namespace: cls.Namespace;
  beforeEach(() => {
    namespace = cls.createNamespace('promises');
  });

  afterEach(() => {
    // namespace.dumpContexts();
    cls.reset();
  });

  it('should persist the context across chained promises', done => {
    namespace.run(() => {
      namespace.set('test', 31337);
      expect(namespace.get('test')).toEqual(31337);

      Promise.resolve()
        .then(() => {
          expect(namespace.get('test')).toEqual(31337);
        })
        .then(() => {
          expect(namespace.get('test')).toEqual(31337);
        })
        .then(() => {
          expect(namespace.get('test')).toEqual(31337);
          done();
        });
    });
  });

  it('should persist the context across chained unwrapped promises', done => {
    namespace.run(() => {
      namespace.set('test', 999);
      expect(namespace.get('test')).toEqual(999);

      Promise.resolve()
        .then(() => {
          expect(namespace.get('test')).toEqual(999);
          return Promise.resolve();
        })
        .then(() => {
          expect(namespace.get('test')).toEqual(999);
          return Promise.resolve();
        })
        .then(() => {
          expect(namespace.get('test')).toEqual(999);
          done();
        });
    });
  });

  it('should persist the context across nested promises', done => {
    namespace.run(() => {
      namespace.set('test', 54321);
      expect(namespace.get('test')).toEqual(54321);

      Promise.resolve().then(() => {
        expect(namespace.get('test')).toEqual(54321);

        Promise.resolve().then(() => {
          expect(namespace.get('test')).toEqual(54321);

          Promise.resolve().then(() => {
            expect(namespace.get('test')).toEqual(54321);
            done();
          });
        });
      });
    });
  });

  it('persist the context across forked promises', done => {
    namespace.run(() => {
      namespace.set('test', 10101);
      expect(namespace.get('test')).toEqual(10101);

      const promise = Promise.resolve();

      promise.then(() => {
        expect(namespace.get('test')).toEqual(10101);
      });
      promise.then(() => {
        expect(namespace.get('test')).toEqual(10101);
      });
      promise.then(() => {
        expect(namespace.get('test')).toEqual(10101);
        done();
      });
    });
  });

  it('should persist the context across async/await', async () => {
    await namespace.runAndReturn(async () => {
      namespace.set('test', 65784);
      await asyncFunction();
      expect(namespace.get('test')).toEqual(65784);
    });
  });
});
