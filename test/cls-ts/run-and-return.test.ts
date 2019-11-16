import { EventEmitter } from 'events';

import * as cls from '../../src/cls-ts';

describe('run-and-return', () => {
  afterEach(() => {
    cls.reset();
  });

  it('simple tracer built on contexts', () => {
    const tracer = cls.createNamespace('tracer');
    const harvester = new EventEmitter();

    harvester.on('finished', transaction => {
      expect(transaction).toBeTruthy();
      expect(transaction.status).toEqual('ok');
    });

    const expected = {};
    const actual = tracer.runAndReturn(context => {
      expect(tracer.active).toBeTruthy();
      tracer.set('transaction', { status: 'ok' });
      expect(tracer.get('transaction')).toBeTruthy();
      // @ts-ignore
      expect(tracer.get('transaction').status).toEqual('ok');

      harvester.emit('finished', context.transaction);

      return expected;
    });

    expect(actual).toEqual(expected);
  });
});
