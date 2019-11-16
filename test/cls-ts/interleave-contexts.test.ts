import * as cls from '../../src/cls-ts';

describe('interleave-contexts', () => {
  afterEach(() => {
    cls.reset();
  });

  it('should not throw an exception when exiting a context different from the active one', done => {
    const namespace = cls.createNamespace('test');
    const context = namespace.createContext();

    namespace.enter(context);
    namespace.run(() => {
      // @ts-ignore
      expect(namespace._stack.length).toEqual(2);
      expect(() => namespace.exit(context)).not.toThrowError();
      done();
    });
  });

  it('show not throw an exception when entering and exiting contexts in a staggered fashion', () => {
    const namespace = cls.createNamespace('test');
    const context1 = namespace.createContext();
    const context2 = namespace.createContext();

    expect(() => namespace.enter(context1)).not.toThrowError();
    expect(() => namespace.enter(context2)).not.toThrowError();
    expect(() => namespace.exit(context1)).not.toThrowError();
    expect(() => namespace.exit(context2)).not.toThrowError();
  });

  it('show not throw an exception when creating, entering and exiting contexts in a staggered fashion', () => {
    const namespace = cls.createNamespace('test');
    const context1 = namespace.createContext();
    expect(() => namespace.enter(context1)).not.toThrowError();

    const context2 = namespace.createContext();
    expect(() => namespace.enter(context2)).not.toThrowError();

    expect(() => namespace.exit(context1)).not.toThrowError();
    expect(() => namespace.exit(context2)).not.toThrowError();
  });
});
