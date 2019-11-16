import { Promise } from 'bluebird';
import * as cls from '../../src/cls-ts';

describe('run-promise', () => {
  let namespace: cls.Namespace;
  beforeEach(() => {
    namespace = cls.createNamespace('run-promise');
  });
  afterEach(() => {
    cls.reset();
  });

  it('should pass the context through to a non-native promise and down its chain', done => {
    namespace
      .runPromise((context: cls.Context) => {
        namespace.set('test', 31337);
        return Promise.resolve('resolved!');
      })
      .then((result: string) => {
        expect(result).toEqual('resolved!');
        expect(namespace.get('test')).toEqual(31337);
        done();
      })
      .catch(error => {
        done.fail(error);
      });
  });

  it("should pass the context through to a non-native promise and down its chain, even if it's rejected", done => {
    namespace
      .runPromise((context: cls.Context) => {
        namespace.set('test', 654);
        return Promise.reject(new Error('nope!'));
      })
      .catch((result: Error) => {
        expect(result.message).toEqual('nope!');
        expect(namespace.get('test')).toEqual(654);
        done();
      })
      .catch(error => {
        done.fail(error);
      });
  });

  it("should pass the context through to a non-native promise and down its chain, even if it's rejected with nothing", done => {
    namespace
      .runPromise((context: cls.Context) => {
        namespace.set('test', 654);
        // eslint-disable-next-line prefer-promise-reject-errors
        return Promise.reject(null);
      })
      .catch((result: Error) => {
        expect(result).toBeNull();
        expect(namespace.get('test')).toEqual(654);
        done();
      })
      .catch(error => {
        done.fail(error);
      });
  });

  it("should throw an exception if the function doesn't return a promise like object", () => {
    expect(() =>
      // @ts-ignore
      namespace.runPromise((context: cls.Context) => {
        namespace.set('test', 31337);
        return 7;
      })
    ).toThrowError('function must return a promise');
  });
});
