import * as cls from '../../src/cls-ts';

describe('nesting', () => {
  afterEach(() => {
    cls.reset();
  });

  test('should keep nested contexts separate in a single namespace', () => {
    const namespace = cls.createNamespace('nesting');
    namespace.run(() => {
      namespace.set('value', 1);

      expect(namespace.get('value')).toEqual(1);

      namespace.run(() => {
        expect(namespace.get('value')).toEqual(1);
        namespace.set('value', 2);
        expect(namespace.get('value')).toEqual(2);

        namespace.run(() => {
          expect(namespace.get('value')).toEqual(2);
          namespace.set('value', 3);
          expect(namespace.get('value')).toEqual(3);
        });

        expect(namespace.get('value')).toEqual(2);
      });

      expect(namespace.get('value')).toEqual(1);
    });
  });

  test('should run the example from the docs correctly', done => {
    const namespace = cls.createNamespace('writer');
    namespace.run(() => {
      namespace.set('value', 0);

      expect(namespace.get('value')).toEqual(0);
      const requestHandler = (): void => {
        namespace.run(outer => {
          expect(namespace.active).toEqual(outer);

          namespace.set('value', 1);
          expect(namespace.get('value')).toEqual(1);
          expect(outer.value).toEqual(1);

          process.nextTick(() => {
            expect(namespace.active).toEqual(outer);
            expect(namespace.get('value')).toEqual(1);
            namespace.run(inner => {
              expect(namespace.active).toEqual(inner);

              namespace.set('value', 2);
              expect(outer.value).toEqual(1);
              expect(inner.value).toEqual(2);
              expect(namespace.get('value')).toEqual(2);
            });
          });
        });

        setTimeout(() => {
          expect(namespace.get('value')).toEqual(0);
          done();
        }, 100);
      };

      requestHandler();
    });
  });
});
