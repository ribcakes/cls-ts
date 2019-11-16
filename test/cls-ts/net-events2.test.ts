import * as net from 'net';
import * as cls from '../../src/cls-ts';

describe('cls with net connection 2', () => {
  const DATUM1 = 'Hello';
  const DATUM2 = 'GoodBye';
  const TEST_VALUE = 0x1337;
  const TEST_VALUE2 = 'MONKEY';
  const keyName = 'netTest2';

  afterAll(() => {
    cls.reset();
  });

  it('client server', done => {
    const namespace = cls.createNamespace('net2');

    namespace.run(ctx => {
      namespace.set(keyName, TEST_VALUE);
      expect(namespace.get(keyName)).toEqual(ctx.netTest2);
      const server: net.Server = net.createServer();

      server.on('connection', (socket: net.Socket) => {
        expect(namespace.get(keyName)).toEqual(TEST_VALUE);

        socket.on('data', (buffer: Buffer) => {
          const data = buffer.toString('utf-8');
          expect(data).toEqual(DATUM1);
          expect(namespace.get(keyName)).toEqual(TEST_VALUE);

          socket.end(DATUM2);
          server.close();
        });
      });

      server.listen(() => {
        namespace.run((context: cls.Context) => {
          namespace.set(keyName, TEST_VALUE2);
          expect(namespace.get(keyName)).toEqual(context.netTest2);

          const { port } = server.address() as net.AddressInfo;
          const client: net.Socket = net.connect({ port }, () => {
            expect(namespace.get(keyName)).toEqual(TEST_VALUE2);
            client.on('data', (buffer: Buffer) => {
              const data = buffer.toString('utf-8');
              expect(data).toEqual(DATUM2);
              expect(namespace.get(keyName)).toEqual(TEST_VALUE2);
            });

            client.on('close', () => {
              done();
            });

            client.write(DATUM1);
          });
        });
      });
    });
  });
});
