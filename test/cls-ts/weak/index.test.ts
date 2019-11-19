import { EventEmitter } from 'events';
import { Namespace } from '../../../src/cls-ts';

describe('weak/index', () => {
  beforeAll(() => {
    jest.mock('weak-napi', () => {
      throw new Error('nope!');
    });
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("should operate normally if `weak-napi` isn't present", done => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires
    const cls = require('../../../src/cls-ts');
    const namespace: Namespace = cls.createNamespace('weak/index');
    const eventEmitter = new EventEmitter();

    namespace.run(() => {
      namespace.set('value', 'hello');
      namespace.bindEmitter(eventEmitter);
      eventEmitter.on('event', () => {
        expect(namespace.get('value')).toEqual('hello');

        cls.destroyNamespace('weak/index');
        cls.reset();

        done();
      });
    });
    eventEmitter.emit('event');
  });
});
