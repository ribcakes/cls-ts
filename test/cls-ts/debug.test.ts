import * as cls from '../../src/cls-ts';

describe('namespaces', () => {
  let debugSpy: jest.SpyInstance;
  beforeEach(() => {
    process.env.DEBUG_CLS_TS = 'true';
    // @ts-ignore
    // eslint-disable-next-line no-empty-function
    debugSpy = jest.spyOn(process, '_rawDebug').mockImplementation(() => {});
  });
  afterEach(() => {
    process.env.DEBUG_CLS_TS = 'false';
    cls.reset();
  });

  it('should print debug information', () => {
    cls.createNamespace('test');
    expect(debugSpy).toBeCalledTimes(1);
  });
});
