import * as cls from '../../src/cls-ts';

describe('async-context', () => {
  afterEach(() => {
    cls.reset();
  });

  it('should set state and retrieve it', done => {
    const namespace = cls.createNamespace('async-context');

    const value = 'some string';
    namespace.run(() => {
      namespace.set('test', value);
      expect(namespace.get('test')).toEqual(value);
      done();
    });
  });
});
