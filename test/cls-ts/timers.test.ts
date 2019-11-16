import * as cls from '../../src/cls-ts';

describe('timers', () => {
  afterAll(() => {
    cls.reset();
  });

  const namespace = cls.createNamespace('timers');
  namespace.run(() => {
    namespace.set('test', 0xabad1dea);

    it('should persist the context across process.nextTick', done => {
      namespace.run(() => {
        namespace.set('test', 31337);
        expect(namespace.get('test')).toEqual(31337);

        process.nextTick(() => {
          expect(namespace.get('test')).toEqual(31337);

          done();
        });
      });
    });

    it('should persist the context across setImmediate', done => {
      namespace.run(() => {
        namespace.set('test', 999);
        expect(namespace.get('test')).toEqual(999);

        setImmediate(() => {
          expect(namespace.get('test')).toEqual(999);

          done();
        });
      });
    });

    it('should persist the context across setTimeout', done => {
      namespace.run(() => {
        namespace.set('test', 54321);
        expect(namespace.get('test')).toEqual(54321);

        setTimeout(() => {
          expect(namespace.get('test')).toEqual(54321);

          done();
        }, 10);
      });
    });

    it('should persist the context across setInterval', done => {
      namespace.run(() => {
        namespace.set('test', 10101);
        expect(namespace.get('test')).toEqual(10101);

        const ref = setInterval(() => {
          expect(namespace.get('test')).toEqual(10101);

          clearInterval(ref);
          done();
        }, 20);
      });
    });
  });
});
