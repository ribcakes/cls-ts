import * as domain from 'domain';
import * as cls from '../../src/cls-ts';

describe('error-handling', () => {
  afterEach(() => {
    cls.reset();
  });

  it('should handle an error thrown in a namespace', done => {
    const namespace = cls.createNamespace('test');
    namespace.run(() => {
      const domain1 = domain.create();
      namespace.set('outer', true);

      domain1.on('error', error => {
        expect(error.message).toEqual('explicitly nonlocal exit');
        expect(namespace.get('outer')).toBeTruthy();
        expect(namespace.get('inner')).toBeFalsy();
        done();
      });

      process.nextTick(
        domain1.bind(() => {
          expect(namespace.get('outer')).toBeTruthy();
          expect(namespace.get('inner')).toBeFalsy();

          namespace.run(() => {
            namespace.set('inner', true);
            throw new Error('explicitly nonlocal exit');
          });
        })
      );
    });
  });

  it('should attach the active context to the thrown exception', () => {
    const namespace = cls.createNamespace('cls@synchronous');
    namespace.run(() => {
      namespace.set('value', 'transaction clear');
      try {
        namespace.run(() => {
          namespace.set('value', 'transaction set');
          throw new Error('cls@synchronous explosion');
        });
      } catch (e) {
        const context = cls.fromException(e);
        expect(context).toBeDefined();
        expect(context.value).toEqual('transaction set');
      }
      expect(namespace.get('value')).toEqual('transaction clear');
    });
  });

  it('should checks if error exists', () => {
    const namespace = cls.createNamespace('cls@synchronous-null-error');
    namespace.run(() => {
      namespace.set('value', 'transaction clear');
      try {
        namespace.run(() => {
          namespace.set('value', 'transaction set');
          // eslint-disable-next-line no-throw-literal
          throw null;
        });
      } catch (e) {
        // as we had a null error, cls couldn't set the new inner value
        expect(namespace.get('value')).toEqual('transaction clear');
      }

      expect(namespace.get('value')).toEqual('transaction clear');
    });
  });

  it('should attach the context in process.nextTick', done => {
    const namespace = cls.createNamespace('cls@nexttick2');

    const domain1 = domain.create();
    domain1.once('error', e => {
      const context = cls.fromException(e);
      expect(context).toBeDefined();
      expect(context.value).toEqual('transaction set');
      done();
    });

    namespace.run(() => {
      namespace.set('value', 'transaction clear');

      process.nextTick(
        domain1.bind(() => {
          namespace.run(() => {
            namespace.set('value', 'transaction set');
            throw new Error('cls@nexttick2 explosion');
          });
        })
      );

      expect(namespace.get('value')).toEqual('transaction clear');
    });
  });

  it('should attach the context in setTimeout', done => {
    const namespace = cls.createNamespace('cls@nexttick3');
    const domain1 = domain.create();

    domain1.once('error', e => {
      const context = cls.fromException(e);
      expect(context).toBeDefined();
      expect(context.value).toEqual('transaction set');
      done();
    });

    namespace.run(() => {
      namespace.set('value', 'transaction clear');

      setTimeout(() =>
        /*
         * jest overrides `process` before the `domain` module can do its modifications to it
         * This causes the correct domain error handling to occur
         * https://github.com/facebook/jest/issues/7247
         */
        process.nextTick(
          domain1.bind(() => {
            namespace.run(() => {
              namespace.set('value', 'transaction set');
              throw new Error('cls@nexttick3 explosion');
            });
          })
        )
      );

      expect(namespace.get('value')).toEqual('transaction clear');
    });
  });
});
