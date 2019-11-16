import * as cls from '../../src/cls-ts';

describe('namespaces', () => {
  let namespace: cls.Namespace;
  beforeEach(() => {
    namespace = cls.createNamespace('namespaces');
  });
  afterEach(() => {
    cls.reset();
  });

  it('should require a name', () => {
    // @ts-ignore
    expect(() => cls.createNamespace()).toThrowError();
  });

  it('should return the namespace upon creation', () => {
    expect(namespace).toBeInstanceOf(cls.Namespace);
  });

  it('should be able to lookup an existing namespace', () => {
    const actual = cls.getNamespace('namespaces');
    expect(actual).toBeInstanceOf(cls.Namespace);
    expect(actual).toEqual(namespace);
  });

  it('should delete all namespaces when reset', () => {
    cls.reset();
    const actual = cls.getNamespace('namespaces');
    expect(actual).toBeUndefined();
  });

  it('should destroy the specified namespace', () => {
    const name = 'another';
    cls.createNamespace(name);
    expect(cls.getNamespace(name)).toBeTruthy();

    cls.destroyNamespace(name);
    const actual = cls.getNamespace(name);
    expect(actual).toBeUndefined();
  });

  it('should throw an exception when trying to set a value with no active namespace', () => {
    expect(() => namespace.set('key', 'value')).toThrowError('No context available. ns.run() or ns.bind() must be called first.');
  });
});
