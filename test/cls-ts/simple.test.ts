import { EventEmitter } from 'events';

import * as cls from '../../src/cls-ts';

describe('simple', () => {
  afterAll(() => {
    cls.reset();
  });

  const tracer = cls.createNamespace('tracer');
  class Trace {
    public constructor(private readonly harvester: EventEmitter) {}
    public runHandler(handler: (context: cls.Context) => void): void {
      const trace = tracer.run(handler);
      this.harvester.emit('finished', trace.transaction);
    }
  }

  it('should be able to set and retrieve context values', () => {
    const harvester = new EventEmitter();
    const trace = new Trace(harvester);

    harvester.on('finished', transaction => {
      expect(transaction).toBeTruthy();
      expect(transaction.status).toEqual('ok');
    });

    trace.runHandler(() => {
      expect(tracer.active).toBeTruthy();
      tracer.set('transaction', { status: 'ok' });
      expect(tracer.get('transaction')).toBeTruthy();
      // @ts-ignore
      expect(tracer.get('transaction').status).toEqual('ok');
    });
  });
});
