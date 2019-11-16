import * as net from 'net';
import * as cls from '../../src/cls-ts';

describe('net-events', () => {
  afterAll(() => {
    cls.reset();
  });

  const namespace = cls.createNamespace('net');
  let capture1: string;
  let capture2: string;
  let capture3: string;
  let capture4: string;
  let server: net.Server;

  beforeAll(done => {
    let serverDone = false;
    let clientDone = false;

    const checkDone = function(): void {
      if (serverDone && clientDone) {
        done();
      }
    };

    namespace.run(() => {
      namespace.set('test', 'originalValue');

      namespace.run(() => {
        namespace.set('test', 'newContextValue');

        server = net.createServer((socket: net.Socket) => {
          capture1 = namespace.get('test');

          socket.on('data', () => {
            capture2 = namespace.get('test');
            namespace.dumpContexts();
            server.close();
            socket.end('GoodBye');

            serverDone = true;
            checkDone();
          });
        });

        server.listen(() => {
          const address: net.AddressInfo = server.address() as net.AddressInfo;
          namespace.run(() => {
            namespace.set('test', 'MONKEY');

            const client: net.Socket = net.connect({ port: address.port }, () => {
              capture3 = namespace.get('test');
              client.write('Hello');

              client.on('data', () => {
                capture4 = namespace.get('test');
                clientDone = true;
                checkDone();
              });
            });
          });
        });
      });
    });
  });

  afterAll(() => {
    cls.reset();
  });

  it('should have captured the first value', () => {
    expect(capture1).toEqual('newContextValue');
  });

  it('should have captured the second value', () => {
    expect(capture2).toEqual('newContextValue');
  });

  it('should have captured the third value', () => {
    expect(capture3).toEqual('MONKEY');
  });

  it('should have captured the fourth value', () => {
    expect(capture4).toEqual('MONKEY');
  });
});
