import * as cls from '../../src/cls-ts';

describe('namespace-multiple-values', () => {
  afterAll(() => {
    cls.reset();
  });

  let capture1: string;
  let capture2: string;
  let capture3: string;
  let capture4: string;

  const namespace1 = cls.createNamespace('ONE');
  const namespace2 = cls.createNamespace('TWO');

  beforeAll(done => {
    namespace1.run(() => {
      namespace2.run(() => {
        namespace1.set('name', 'tom1');
        namespace2.set('name', 'paul2');

        setTimeout(() => {
          namespace1.run(() => {
            process.nextTick(() => {
              capture1 = namespace1.get('name');
              capture2 = namespace2.get('name');

              namespace1.set('name', 'bob');
              namespace2.set('name', 'alice');

              setTimeout(() => {
                capture3 = namespace1.get('name');
                capture4 = namespace2.get('name');
                done();
              });
            });
          });
        });
      });
    });
  });

  it('should have tom1 as the first value', () => {
    expect(capture1).toEqual('tom1');
  });

  it('should have paul2 as the second value', () => {
    expect(capture2).toEqual('paul2');
  });

  it('should have bob as the third value', () => {
    expect(capture3).toEqual('bob');
  });

  it('should have alic as the fourth value', () => {
    expect(capture4).toEqual('alice');
  });
});
