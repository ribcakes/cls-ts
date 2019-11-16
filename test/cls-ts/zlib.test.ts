import * as cls from '../../src/cls-ts';
import * as zlib from 'zlib';

describe('zlib', () => {
  afterAll(() => {
    cls.reset();
  });

  const namespace = cls.createNamespace('zlib');
  namespace.run(() => {
    namespace.set('test', 0xabad1dea);

    it('should persist the context across a deflate callback', done => {
      namespace.run(() => {
        namespace.set('test', 42);
        zlib.deflate(Buffer.from('Goodbye World'), err => {
          if (err) {
            throw err;
          }
          expect(namespace.get('test')).toEqual(42);
          done();
        });
      });
    });
  });
});
