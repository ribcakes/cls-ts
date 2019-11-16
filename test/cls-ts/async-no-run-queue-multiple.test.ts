/* eslint-disable no-console */
import * as cls from '../../src/cls-ts';

describe('async-no-run-queue-multiple', () => {
  afterAll(() => {
    cls.reset();
  });

  it('should not trigger a failure from patch #0611', done => {
    const namespace = cls.createNamespace('test');

    // console.log is an async call
    console.log('+');
    // when the flaw was in the patch, commenting out this line would fix things:
    process.nextTick(() => console.log('!'));

    expect(namespace.get('state')).toBeFalsy();

    namespace.run(() => {
      namespace.set('state', true);
      expect(namespace.get('state')).not.toBeFalsy();

      process.nextTick(() => {
        expect(namespace.get('state')).not.toBeFalsy();
        done();
      });
    });
  });
});
