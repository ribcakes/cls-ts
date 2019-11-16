import * as cls from '../../src/cls-ts';

describe('proper-exit', () => {
  afterEach(() => {
    cls.reset();
  });

  it('proper exit on uncaughtException', () => {
    const namespace = cls.createNamespace('x');
    expect(() =>
      namespace.run(() => {
        throw new Error('oops');
      })
    ).toThrowError('oops');
  });
});
