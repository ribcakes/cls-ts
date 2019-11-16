import { EventEmitter } from 'events';
import * as http from 'http';
import { Readable } from 'stream';
import * as cls from '../../src/cls-ts';

describe('bind-emitter', () => {
  afterEach(() => {
    cls.reset();
  });

  it('should propagate context into event emitter listener functions registered in context', done => {
    const namespace = cls.createNamespace('in');
    const eventEmitter = new EventEmitter();

    namespace.run(() => {
      namespace.set('value', 'hello');
      namespace.bindEmitter(eventEmitter);
      eventEmitter.on('event', () => {
        expect(namespace.get('value')).toEqual('hello');
        done();
      });
    });
    eventEmitter.emit('event');
  });

  it('should propagate context into event emitter listener functions registered  with `once` in context', done => {
    const namespace = cls.createNamespace('inOnce');
    const eventEmitter = new EventEmitter();
    namespace.run(() => {
      namespace.set('value', 'hello');
      namespace.bindEmitter(eventEmitter);
      eventEmitter.once('event', () => {
        expect(namespace.get('value')).toEqual('hello');
        done();
      });
    });
    eventEmitter.emit('event');
  });

  it('should propagate context into event emitter listener functions registered out of context responding to events emitted in context', done => {
    const namespace = cls.createNamespace('out');
    const eventEmitter = new EventEmitter();

    eventEmitter.on('event', () => {
      expect(namespace.get('value')).toEqual('hello');
      done();
    });

    namespace.run(() => {
      namespace.set('value', 'hello');
      namespace.bindEmitter(eventEmitter);
      eventEmitter.emit('event');
    });
  });

  it('should propagate context into event emitter listener functions registered with `once` out of context responding to events emitted in context', done => {
    const namespace = cls.createNamespace('outOnce');
    const eventEmitter = new EventEmitter();
    eventEmitter.once('event', () => {
      expect(namespace.get('value')).toEqual('hello');
      done();
    });

    namespace.run(() => {
      namespace.set('value', 'hello');
      namespace.bindEmitter(eventEmitter);
      eventEmitter.emit('event');
    });
  });

  it('should not have the context value available when the handler is registered out of context, and the event is emitted out of context', done => {
    const namespace = cls.createNamespace('out');
    const eventEmitter = new EventEmitter();

    eventEmitter.on('event', () => {
      expect(namespace.get('value')).toBeFalsy();
      done();
    });

    namespace.run(() => {
      namespace.set('value', 'hello');
      namespace.bindEmitter(eventEmitter);
    });
    eventEmitter.emit('event');
  });

  it('should handle binding to `Readable`s', done => {
    const namespace = cls.createNamespace('outOnceReadable');
    const readable = new Readable();
    // eslint-disable-next-line @typescript-eslint/unbound-method,no-empty-function
    readable._read = () => {};

    readable.once('data', data => {
      expect(namespace.get('value')).toEqual('hello');
      expect(data).toEqual('blah');
      done();
    });

    namespace.run(() => {
      namespace.set('value', 'hello');

      // @ts-ignore
      expect(readable.emit.__wrapped).toBeFalsy();
      // @ts-ignore
      expect(readable.on.__wrapped).toBeFalsy();
      // @ts-ignore
      expect(readable.addListener.__wrapped).toBeFalsy();

      namespace.bindEmitter(readable);

      // @ts-ignore
      expect(readable.emit.__wrapped).toBeDefined();
      // @ts-ignore
      expect(readable.on.__wrapped).toBeDefined();
      // @ts-ignore
      expect(readable.addListener.__wrapped).toBeDefined();

      // @ts-ignore
      expect(typeof readable._events.data).toEqual('function');

      readable.emit('data', 'blah');
    });
  });

  it('should allow a listener to remove itself', done => {
    const namespace = cls.createNamespace('newListener');
    const eventEmitter = new EventEmitter();

    namespace.bindEmitter(eventEmitter);

    const listen = (): void => {
      eventEmitter.on('data', chunk => {
        expect(chunk).toEqual('chunk');
      });
    };

    eventEmitter.on('newListener', function handler(event) {
      if (event !== 'data') {
        return;
      }

      // eslint-disable-next-line no-invalid-this
      this.removeListener('newListener', handler);
      // eslint-disable-next-line no-invalid-this
      expect(this.listeners('newListener').length).toBeFalsy();
      process.nextTick(listen);
    });

    eventEmitter.on('drain', chunk => {
      process.nextTick(() => {
        eventEmitter.emit('data', chunk);
      });
    });

    eventEmitter.on('data', chunk => {
      expect(chunk).toEqual('chunk');
      done();
    });

    eventEmitter.emit('drain', 'chunk');
  });

  it('should provide the correct context when the handler is registered in context on the `Readable`', done => {
    const namespace = cls.createNamespace('outOnReadable');
    const readable = new Readable();

    // eslint-disable-next-line @typescript-eslint/unbound-method,no-empty-function
    readable._read = () => {};

    namespace.run(() => {
      namespace.set('value', 'hello');

      namespace.bindEmitter(readable);

      // @ts-ignore
      expect(readable.emit.__wrapped).toBeDefined();
      // @ts-ignore
      expect(readable.on.__wrapped).toBeDefined();
      // @ts-ignore
      expect(readable.addListener.__wrapped).toBeDefined();

      readable.on('data', data => {
        expect(namespace.get('value')).toEqual('hello');
        expect(data).toEqual('blah');
        done();
      });
    });

    // @ts-ignore
    expect(readable.emit.__wrapped).toBeDefined();
    // @ts-ignore
    expect(readable.on.__wrapped).toBeDefined();
    // @ts-ignore
    expect(readable.addListener.__wrapped).toBeDefined();

    // @ts-ignore
    expect(typeof readable._events.data).toEqual('function');

    readable.emit('data', 'blah');
  });

  it('should not provide a context when a handler is added but used out of context', done => {
    const namespace = cls.createNamespace('none');
    const eventEmitter = new EventEmitter();
    namespace.run(() => {
      namespace.set('value', 'hello');
      namespace.bindEmitter(eventEmitter);
    });

    eventEmitter.on('event', () => {
      expect(namespace.get('value')).toBeFalsy();
      done();
    });

    eventEmitter.emit('event');
  });

  it('should be bound to an http request with no listeners added', done => {
    const namespace = cls.createNamespace('no_listener');

    const server = http.createServer((request, response) => {
      namespace.bindEmitter(request);

      request.emit('event');
      response.writeHead(200, { 'Content-Length': 4 });
      response.end('WORD');
    });
    server.listen(8080);

    http.get('http://localhost:8080/', response => {
      expect(response.statusCode).toEqual(200);

      response.setEncoding('ascii');
      response.on('data', body => {
        expect(body).toEqual('WORD');

        server.close();
        done();
      });
    });
  });

  it('should handle listeners with parameters added, but not bound to context', done => {
    const eventEmitter = new EventEmitter();
    const namespace = cls.createNamespace('param_list');
    const sent = (value: number): void => {
      expect(value).toEqual(3);
      done();
    };

    eventEmitter.on('send', sent);
    namespace.bindEmitter(eventEmitter);
    eventEmitter.emit('send', 3);
  });

  it("listener that throws doesn't leave removeListener wrapped", done => {
    const eventEmitter = new EventEmitter();
    const namespace = cls.createNamespace('kaboom');
    namespace.bindEmitter(eventEmitter);

    const kaboom = (): void => {
      throw new Error('whoops');
    };

    namespace.run(() => {
      eventEmitter.on('bad', kaboom);

      expect(() => {
        eventEmitter.emit('bad');
      }).toThrowError();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(typeof eventEmitter.removeListener).toEqual('function');
      // @ts-ignore
      expect(eventEmitter.removeListener.__wrapped).toBeFalsy();
      // @ts-ignore
      expect(eventEmitter._events.bad).toEqual(kaboom);
      done();
    });
  });

  it('should handle an emitter bound to multiple namespaces', done => {
    const eventEmitter = new EventEmitter();
    const namespace1 = cls.createNamespace('1');
    const namespace2 = cls.createNamespace('2');

    // emulate an incoming data emitter
    setTimeout(() => {
      eventEmitter.emit('data', 'hi');
    }, 10);

    namespace1.bindEmitter(eventEmitter);
    namespace2.bindEmitter(eventEmitter);

    namespace1.run(() => {
      namespace2.run(() => {
        namespace1.set('name', 'tom1');
        namespace2.set('name', 'paul2');

        namespace1.bindEmitter(eventEmitter);
        namespace2.bindEmitter(eventEmitter);

        namespace1.run(() => {
          process.nextTick(() => {
            expect(namespace1.get('name')).toEqual('tom1');
            expect(namespace2.get('name')).toEqual('paul2');

            namespace1.set('name', 'bob');
            namespace2.set('name', 'alice');

            eventEmitter.on('data', () => {
              expect(namespace1.get('name')).toEqual('bob');
              expect(namespace2.get('name')).toEqual('alice');
              done();
            });
          });
        });
      });
    });
  });
});
