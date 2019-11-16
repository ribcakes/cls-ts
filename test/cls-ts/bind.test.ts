import { EventEmitter } from 'events';
import * as cls from '../../src/cls-ts';

class Trace {
  public constructor(private readonly tracer: cls.Namespace, private readonly harvester: EventEmitter) {}

  public runHandler(callback: any): void {
    const wrapped = this.tracer.bind(() => {
      callback();
      this.harvester.emit('finished', this.tracer.get('transaction'));
    });
    wrapped();
  }
}

describe('bind', () => {
  let harvester: EventEmitter;
  let tracer: cls.Namespace;
  let trace: Trace;
  beforeEach(() => {
    harvester = new EventEmitter();
    tracer = cls.createNamespace('tracer');
    trace = new Trace(tracer, harvester);
  });

  afterEach(() => {
    cls.reset();
  });

  it('should pass context through a callback', done => {
    const transaction = { status: 'ok' };

    harvester.on('finished', data => {
      expect(data).toEqual(transaction);
      done();
    });

    trace.runHandler(() => {
      expect(tracer.active).not.toBeFalsy();

      tracer.set('transaction', transaction);

      expect(tracer.get('transaction')).toEqual(transaction);
    });
  });

  it('should handle a null exception being thrown', () => {
    const transaction = { status: 'ok' };

    expect(() =>
      trace.runHandler(() => {
        expect(tracer.active).not.toBeFalsy();

        tracer.set('transaction', transaction);

        expect(tracer.get('transaction')).toEqual(transaction);

        // eslint-disable-next-line no-throw-literal
        throw null;
      })
    ).toThrowError();
  });
});
