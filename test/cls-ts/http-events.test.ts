import * as http from 'http';
import * as cls from '../../src/cls-ts';

const DATUM1 = 'Hello';
const DATUM2 = 'GoodBye';
const TEST_VALUE = 0x1337;
const PORT = 55667;

describe('http-events', () => {
  describe('client server', () => {
    const namespace = cls.createNamespace('http');

    const requestCapture = jest.fn();
    const requestDataCapture = jest.fn();
    const responseCapture = jest.fn();
    const responseDataCapture = jest.fn();
    let finalContextValue: string;

    beforeAll(done => {
      namespace.run(() => {
        namespace.set('test', TEST_VALUE);
        const server = http.createServer();

        server.on('request', (request: http.IncomingMessage, response: http.ServerResponse) => {
          requestCapture(namespace.get('test'));

          request.on('data', (data: any) => {
            requestDataCapture(data.toString('utf-8'), namespace.get('test'));
            server.close();
            response.end(DATUM2);
          });
        });

        server.listen(PORT, () => {
          namespace.run(() => {
            namespace.set('test', 'MONKEY');

            const request = http.request({ host: 'localhost', port: PORT, method: 'POST' }, res => {
              responseCapture(namespace.get('test'));

              res.on('data', responseData => {
                responseDataCapture(responseData.toString('utf-8'), namespace.get('test'));
                done();
              });
            });
            request.write(DATUM1);
          });
        });

        finalContextValue = namespace.get('test');
      });
    });

    afterAll(() => {
      cls.reset();
    });

    it('should have captured a request', () => {
      expect(requestCapture).toHaveBeenCalledWith(TEST_VALUE);
    });

    it('should have captured request data', () => {
      expect(requestDataCapture).toHaveBeenCalledWith(DATUM1, TEST_VALUE);
    });

    it('should have captured a response', () => {
      expect(responseCapture).toHaveBeenCalled();
    });

    it('should have captured data', () => {
      expect(responseDataCapture).toHaveBeenCalledWith(DATUM2, 'MONKEY');
    });

    it(`should have a final context value of ${TEST_VALUE}`, () => {
      expect(finalContextValue).toEqual(TEST_VALUE);
    });
  });
});
