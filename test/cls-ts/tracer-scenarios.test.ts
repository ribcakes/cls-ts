import { EventEmitter } from 'events';

import * as cls from '../../src/cls-ts';

let nextID = 1;

const runInTransaction = (name: string, fn: () => void): void => {
  const namespace = cls.getNamespace(name);
  expect(namespace).toBeTruthy();

  const context = namespace.createContext();
  context.transaction = ++nextID;
  process.nextTick(namespace.bind(fn, context));
};

describe('tracer-scenarios', () => {
  afterEach(() => {
    cls.reset();
  });

  it('should persist the context across an async transaction with setTimeout', done => {
    const namespace = cls.createNamespace('a');

    const handler = (): void => {
      expect(namespace.get('transaction')).toBeTruthy();
      done();
    };

    expect(namespace.get('transaction')).toBeFalsy();
    runInTransaction('a', () => {
      setTimeout(handler, 100);
    });
  });

  it('should persist the context across an async transaction with setInterval', done => {
    const namespace = cls.createNamespace('b');
    let count = 0;
    let handle: NodeJS.Timeout;

    const handler = (): void => {
      count += 1;
      if (count > 2) {
        clearInterval(handle);
        done();
      } else {
        expect(namespace.get('transaction')).toBeTruthy();
      }
    };

    expect(namespace.get('transaction')).toBeFalsy();
    runInTransaction('b', () => {
      handle = setInterval(handler, 50);
    });
  });

  it('should persist the context across an async transaction with process.nextTick', done => {
    const namespace = cls.createNamespace('c');

    const handler = (): void => {
      expect(namespace.get('transaction')).toBeTruthy();
      done();
    };

    expect(namespace.get('transaction')).toBeFalsy();
    runInTransaction('c', () => {
      process.nextTick(handler);
    });
  });

  it('should persist the context across an async transaction with EventEmitter.emit', done => {
    const namespace = cls.createNamespace('d');
    const eventEmitter = new EventEmitter();

    const handler = (): void => {
      expect(namespace.get('transaction')).toBeTruthy();
      done();
    };

    expect(namespace.get('transaction')).toBeFalsy();
    runInTransaction('d', () => {
      eventEmitter.on('transaction', handler);
      eventEmitter.emit('transaction');
    });
  });

  it('should persist the context across an two overlapping async transactions with setTimeout', done => {
    const namespace = cls.createNamespace('e');
    let first: number;
    let second: number;

    let testCount = 0;
    const handler = (id: number): void => {
      expect(namespace.get('transaction')).toEqual(id);
      testCount++;
      if (2 === testCount) {
        done();
      }
    };

    expect(namespace.get('transaction')).toBeFalsy();
    runInTransaction('e', () => {
      first = namespace.get('transaction');
      setTimeout(handler.bind(null, first), 100);
    });

    setTimeout(() => {
      runInTransaction('e', () => {
        second = namespace.get('transaction');
        expect(first).not.toEqual(second);
        setTimeout(handler.bind(null, second), 100);
      });
    }, 25);
  });

  it('should persist the context across an two overlapping async transactions with setInterval', done => {
    const namespace = cls.createNamespace('f');

    const runInterval = (): void => {
      let count = 0;
      let handle: NodeJS.Timeout;
      let id: number;

      const handler = (): void => {
        count += 1;
        if (count > 2) {
          clearInterval(handle);
          done();
        } else {
          expect(namespace.get('transaction')).toEqual(id);
        }
      };

      const run = (): void => {
        expect(namespace.get('transaction')).toBeTruthy();
        id = namespace.get('transaction');
        handle = setInterval(handler, 50);
      };

      runInTransaction('f', run);
    };

    expect(namespace.get('transaction')).toBeFalsy();
    runInterval();
    runInterval();
  });

  it('should persist the context across an two overlapping async transactions with process.nextTick', done => {
    const namespace = cls.createNamespace('g');
    let first: number;
    let second: number;

    let testCount = 0;
    const handler = (id: number): void => {
      expect(namespace.get('transaction')).toEqual(id);
      testCount++;
      if (2 === testCount) {
        done();
      }
    };

    expect(namespace.get('transaction')).toBeFalsy();
    runInTransaction('g', () => {
      first = namespace.get('transaction');
      process.nextTick(handler.bind(null, first));
    });

    process.nextTick(() => {
      runInTransaction('g', () => {
        second = namespace.get('transaction');
        expect(first).not.toEqual(second);
        process.nextTick(handler.bind(null, second));
      });
    });
  });

  it('should persist the context across an two overlapping async runs with EventEmitter.prototype.emit', done => {
    const namespace = cls.createNamespace('h');
    const eventEmitter = new EventEmitter();

    let testCount = 0;
    const handler = (): void => {
      expect(namespace.get('transaction')).toBeTruthy();
      testCount++;
      if (2 === testCount) {
        done();
      }
    };

    const lifecycle = (): void => {
      eventEmitter.once('transaction', process.nextTick.bind(process, handler));
      eventEmitter.emit('transaction');
    };

    expect(namespace.get('transaction')).toBeFalsy();
    runInTransaction('h', lifecycle);
    runInTransaction('h', lifecycle);
  });

  it('should persist the context across an async transaction with an async sub-call with setTimeout', done => {
    const namespace = cls.createNamespace('i');

    const inner = (callback: () => void): void => {
      setTimeout(() => {
        expect(namespace.get('transaction')).toBeTruthy();
        callback();
      }, 50);
    };

    const outer = (): void => {
      expect(namespace.get('transaction')).toBeTruthy();
      setTimeout(() => {
        expect(namespace.get('transaction')).toBeTruthy();
        inner(() => {
          expect(namespace.get('transaction')).toBeTruthy();
          done();
        });
      }, 50);
    };

    expect(namespace.get('transaction')).toBeFalsy();
    runInTransaction('i', setTimeout.bind(null, outer, 50));
  });

  it('should persist the context across an async transaction with an async sub-call with setInterval', done => {
    const namespace = cls.createNamespace('j');
    let outerHandle: NodeJS.Timeout;
    let innerHandle: NodeJS.Timeout;

    const inner = (callback: () => void): void => {
      innerHandle = setInterval(() => {
        clearInterval(innerHandle);
        expect(namespace.get('transaction')).toBeTruthy();
        callback();
      }, 50);
    };

    const outer = (): void => {
      expect(namespace.get('transaction')).toBeTruthy();
      outerHandle = setInterval(() => {
        clearInterval(outerHandle);
        expect(namespace.get('transaction')).toBeTruthy();
        inner(() => {
          expect(namespace.get('transaction')).toBeTruthy();
          done();
        });
      }, 50);
    };

    expect(namespace.get('transaction')).toBeFalsy();
    runInTransaction('j', outer);
  });

  it('should persist the context across an async transaction with an async call with process.nextTick', done => {
    const namespace = cls.createNamespace('k');

    const inner = (callback: () => void): void => {
      process.nextTick(() => {
        expect(namespace.get('transaction')).toBeTruthy();
        callback();
      });
    };

    const outer = (): void => {
      expect(namespace.get('transaction')).toBeTruthy();
      process.nextTick(() => {
        expect(namespace.get('transaction')).toBeTruthy();
        inner(() => {
          expect(namespace.get('transaction')).toBeTruthy();
          done();
        });
      });
    };

    expect(namespace.get('transaction')).toBeFalsy();
    runInTransaction('k', () => {
      process.nextTick(outer);
    });
  });

  it('should persist the context across an async transaction with an async call with EventEmitter.emit', done => {
    const namespace = cls.createNamespace('l');
    const outer = new EventEmitter();
    const inner = new EventEmitter();

    inner.on('pong', callback => {
      expect(namespace.get('transaction')).toBeTruthy();
      callback();
    });

    const outerCallback = (): void => {
      expect(namespace.get('transaction')).toBeTruthy();
      done();
    };

    outer.on('ping', () => {
      expect(namespace.get('transaction')).toBeTruthy();
      inner.emit('pong', outerCallback);
    });

    expect(namespace.get('transaction')).toBeFalsy();
    runInTransaction('l', outer.emit.bind(outer, 'ping'));
  });
});
