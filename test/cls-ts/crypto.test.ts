import * as crypto from 'crypto';
import * as cls from '../../src/cls-ts';

describe('crypto', () => {
  afterEach(() => {
    cls.reset();
  });

  it('should propagate context through to the callback of crypto.randomBytes', done => {
    const namespace = cls.createNamespace('crypto');
    namespace.run(() => {
      namespace.set('test', 0xabad1dea);

      namespace.run(() => {
        namespace.set('test', 42);
        crypto.randomBytes(100, err => {
          if (err) {
            throw err;
          }
          expect(namespace.get('test')).toEqual(42);
          done();
        });
      });
    });
  });

  it('should propagate context through to the callback of crypto.pseudoRandomBytes', done => {
    const namespace = cls.createNamespace('crypto');
    namespace.run(() => {
      namespace.set('test', 0xabad1dea);

      namespace.run(() => {
        namespace.set('test', 42);
        crypto.pseudoRandomBytes(100, err => {
          if (err) {
            throw err;
          }
          expect(namespace.get('test')).toEqual(42);
          done();
        });
      });
    });
  });

  it('should propagate context through to the callback of crypto.pbkdf2', done => {
    const namespace = cls.createNamespace('crypto');
    namespace.run(() => {
      namespace.set('test', 0xabad1dea);

      namespace.run(() => {
        namespace.set('test', 42);
        crypto.pbkdf2('s3cr3tz', '451243', 10, 40, 'sha512', err => {
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
