import * as cls from '../../src/cls-ts';
import * as dns from 'dns';

describe('dns', () => {
  afterAll(() => {
    cls.reset();
  });

  const namespace = cls.createNamespace('dns');
  namespace.run(() => {
    namespace.set('test', 0xabad1dea);

    it('should propagate context through to the callback of dns.lookup', done => {
      namespace.run(() => {
        namespace.set('test', 808);
        expect(namespace.get('test')).toEqual(808);

        dns.lookup('www.newrelic.com', 4, (err, addresses) => {
          expect(err).toBeNull();
          expect(addresses.length).toBeGreaterThan(0);

          expect(namespace.get('test')).toEqual(808);
          done();
        });
      });
    });

    it('should propagate context through to the callback of dns.resolve', done => {
      namespace.run(() => {
        namespace.set('test', 909);
        expect(namespace.get('test')).toEqual(909);

        dns.resolve('newrelic.com', 'NS', (err, addresses) => {
          expect(err).toBeNull();
          expect(addresses.length).toBeGreaterThan(0);

          expect(namespace.get('test')).toEqual(909);
          done();
        });
      });
    });

    it('should propagate context through to the callback of dns.resolveCname', done => {
      namespace.run(() => {
        namespace.set('test', 212);
        expect(namespace.get('test')).toEqual(212);

        dns.resolveCname('images.google.com', (err, addresses) => {
          expect(err).toBeNull();
          expect(addresses.length).toBeGreaterThan(0);

          expect(namespace.get('test')).toEqual(212);
          done();
        });
      });
    });

    it('should propagate context through to the callback of dns.resolveMx', done => {
      namespace.run(() => {
        namespace.set('test', 707);
        expect(namespace.get('test')).toEqual(707);

        dns.resolveMx('newrelic.com', (err, addresses) => {
          expect(err).toBeNull();
          expect(addresses.length).toBeGreaterThan(0);

          expect(namespace.get('test')).toEqual(707);
          done();
        });
      });
    });

    it('should propagate context through to the callback of dns.resolveNs', done => {
      namespace.run(() => {
        namespace.set('test', 717);
        expect(namespace.get('test')).toEqual(717);

        dns.resolveNs('newrelic.com', (err, addresses) => {
          expect(err).toBeNull();
          expect(addresses.length).toBeGreaterThan(0);

          expect(namespace.get('test')).toEqual(717);
          done();
        });
      });
    });

    it('should propagate context through to the callback of dns.resolveTxt', done => {
      namespace.run(() => {
        namespace.set('test', 2020);
        expect(namespace.get('test')).toEqual(2020);

        dns.resolveTxt('newrelic.com', (err, addresses) => {
          expect(err).toBeNull();
          expect(addresses.length).toBeGreaterThan(0);

          expect(namespace.get('test')).toEqual(2020);
          done();
        });
      });
    });

    it('should propagate context through to the callback of dns.resolveSrv', done => {
      namespace.run(() => {
        namespace.set('test', 9000);
        expect(namespace.get('test')).toEqual(9000);

        dns.resolveSrv('_xmpp-server._tcp.google.com', (err, addresses) => {
          expect(err).toBeNull();
          expect(addresses.length).toBeGreaterThan(0);

          expect(namespace.get('test')).toEqual(9000);
          done();
        });
      });
    });

    it('should propagate context through to the callback of dns.resolveNaptr', done => {
      namespace.run(() => {
        namespace.set('test', 'Polysix');
        expect(namespace.get('test')).toEqual('Polysix');

        dns.resolveNaptr('columbia.edu', (err, addresses) => {
          expect(err).toBeNull();
          expect(addresses.length).toBeGreaterThan(0);

          expect(namespace.get('test')).toEqual('Polysix');
          done();
        });
      });
    });

    it('should propagate context through to the callback of dns.reverse', done => {
      namespace.run(() => {
        namespace.set('test', 1000);
        expect(namespace.get('test')).toEqual(1000);

        dns.reverse('204.93.223.144', (err, addresses) => {
          expect(err).toBeNull();
          expect(addresses.length).toBeGreaterThan(0);

          expect(namespace.get('test')).toEqual(1000);
          done();
        });
      });
    });
  });
});
