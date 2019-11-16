/* eslint-disable @typescript-eslint/no-magic-numbers,no-empty-function */
import { exec, ExecException } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as cls from '../../src/cls-ts';

// CONSTANTS
const FILENAME = '__testfile';
const DIRNAME = '__TESTDIR';
const LINKNAME = '__testlink';
const HARDLINKNAME = '__testhardlink';

const createFile = (): void => {
  const contents: Buffer = Buffer.from('UHOH');
  const file: number = fs.openSync(FILENAME, 'w');
  const written: number = fs.writeSync(file, contents, 0, contents.length, 0);
  expect(written).toEqual(contents.length);

  fs.closeSync(file);
  // need this here to avoid dealing with umask complications
  fs.chmodSync(FILENAME, '0666');
};

const deleteFile = (): void => fs.unlinkSync(FILENAME);

const createLink = (): void => {
  createFile();
  fs.symlinkSync(FILENAME, LINKNAME);
  if (fs.lchmodSync) {
    // This function only exists on BSD systems (like OSX)
    fs.lchmodSync(LINKNAME, '0777');
  }
};

const deleteLink = (): void => {
  fs.unlinkSync(LINKNAME);
  return deleteFile();
};

const createDirectory = (): void => {
  fs.mkdirSync(DIRNAME);
  expect(fs.existsSync(DIRNAME)).toBeTruthy();
};

const deleteDirectory = (): void => fs.rmdirSync(DIRNAME);

const mapIds = (username: string, groupname: string, callback: (error: Error, uid?: number, gid?: number) => void): void => {
  if (!callback) {
    throw new Error('mapIds requires callback');
  }
  if (!username) {
    return callback(new Error('mapIds requires username'));
  }
  if (!groupname) {
    return callback(new Error('mapIds requires groupname'));
  }

  exec(`id -u ${username}`, (error: ExecException, stdout: string, stderr: string) => {
    if (error) {
      return callback(error);
    }
    if (stderr) {
      return callback(new Error(stderr));
    }

    const uid = Number(stdout);
    exec(`id -g ${groupname}`, (error2: ExecException, stdout2: string, stderr2: string) => {
      if (error2) {
        return callback(error2);
      }
      if (stderr2) {
        return callback(new Error(stderr2));
      }

      const gid = Number(stdout2);
      callback(null, uid, gid);
    });
  });
};

describe('fs', () => {
  if (os.platform() === 'win32') {
    return;
  }
  const namespace = cls.createNamespace('fs');

  beforeEach(() => {
    if (fs.existsSync(FILENAME)) {
      deleteFile();
    }
    if (fs.existsSync(LINKNAME)) {
      deleteLink();
    }
    if (fs.existsSync(DIRNAME)) {
      deleteDirectory();
    }
  });

  afterAll(() => {
    cls.reset();
  });

  namespace.run(() => {
    const value = 0xabad1dea;
    namespace.set('test', value);

    it('should persist the context through the fs.rename callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'rename');
        expect(namespace.get('test')).toEqual('rename');

        fs.rename(FILENAME, '__renamed', error => {
          expect(namespace.get('test')).toEqual('rename');
          fs.unlinkSync('__renamed');
          done();
        });
      });
    });

    it('should persist the context through the fs.truncate callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'truncate');
        expect(namespace.get('test')).toEqual('truncate');

        fs.truncate(FILENAME, 0, error => {
          const stats = fs.statSync(FILENAME);
          expect(stats.size).toEqual(0);

          expect(namespace.get('test')).toEqual('truncate');
          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.ftruncate callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'ftruncate');
        expect(namespace.get('test')).toEqual('ftruncate');

        const file = fs.openSync(FILENAME, 'w');
        fs.ftruncate(file, 0, error => {
          fs.closeSync(file);
          const stats = fs.statSync(FILENAME);
          expect(stats.size).toEqual(0);

          expect(namespace.get('test')).toEqual('ftruncate');

          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.chown callback', done => {
      createFile();

      mapIds('daemon', 'daemon', (error, uid, gid) => {
        expect(error).toBeFalsy();
        expect(uid).toBeTruthy();
        expect(gid).toBeTruthy();

        namespace.run(() => {
          namespace.set('test', 'chown');
          expect(namespace.get('test')).toEqual('chown');

          fs.chown(FILENAME, uid, gid, err => {
            expect(namespace.get('test')).toEqual('chown');

            deleteFile();
            done();
          });
        });
      });
    });

    it('should persist the context through the fs.fchown callback', done => {
      createFile();

      mapIds('daemon', 'daemon', (error, uid, gid) => {
        expect(error).toBeFalsy();
        expect(uid).toBeTruthy();
        expect(gid).toBeTruthy();

        namespace.run(() => {
          namespace.set('test', 'fchown');
          expect(namespace.get('test')).toEqual('fchown');

          const file = fs.openSync(FILENAME, 'w');
          fs.fchown(file, uid, gid, err => {
            expect(namespace.get('test')).toEqual('fchown');

            fs.closeSync(file);
            deleteFile();
            done();
          });
        });
      });
    });

    it('should persist the context through the fs.lchown callback', done => {
      createLink();

      mapIds('daemon', 'daemon', (error, uid, gid) => {
        expect(error).toBeFalsy();
        expect(uid).toBeTruthy();
        expect(gid).toBeTruthy();

        namespace.run(() => {
          namespace.set('test', 'lchown');
          expect(namespace.get('test')).toEqual('lchown');

          fs.lchown(LINKNAME, uid, gid, err => {
            expect(namespace.get('test')).toEqual('lchown');

            deleteLink();
            done();
          });
        });
      });
    });

    it('should persist the context through the fs.chmod callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'chmod');
        expect(namespace.get('test')).toEqual('chmod');

        fs.chmod(FILENAME, '0700', error => {
          expect(namespace.get('test')).toEqual('chmod');

          const stats = fs.statSync(FILENAME);
          expect(stats.mode.toString(8)).toEqual('100700');

          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.fchmod callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'fchmod');
        expect(namespace.get('test')).toEqual('fchmod');

        const file = fs.openSync(FILENAME, 'w+');
        fs.fchmod(file, '0700', error => {
          expect(namespace.get('test')).toEqual('fchmod');

          fs.closeSync(file);
          const stats = fs.statSync(FILENAME);
          expect(stats.mode.toString(8)).toEqual('100700');

          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.lchmod callback', done => {
      // this command is only available on macOS per Node documentation
      if (os.platform() !== 'darwin') {
        return done();
      }
      createLink();

      namespace.run(() => {
        namespace.set('test', 'lchmod');
        expect(namespace.get('test')).toEqual('lchmod');

        fs.lchmod(LINKNAME, '0700', error => {
          expect(namespace.get('test')).toEqual('lchmod');

          const stats = fs.lstatSync(LINKNAME);
          expect(stats.mode.toString(8)).toEqual('120700');

          deleteLink();
          done();
        });
      });
    });

    it('should persist the context through the fs.stat callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'stat');
        expect(namespace.get('test')).toEqual('stat');

        fs.stat(FILENAME, (error, stats) => {
          expect(namespace.get('test')).toEqual('stat');

          expect(stats.mode.toString(8)).toEqual('100666');

          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.fstat callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'fstat');
        expect(namespace.get('test')).toEqual('fstat');

        const file = fs.openSync(FILENAME, 'r');
        fs.fstat(file, (error, stats) => {
          expect(namespace.get('test')).toEqual('fstat');

          expect(stats.mode.toString(8)).toEqual('100666');

          fs.closeSync(file);
          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.lstat callback', done => {
      createLink();

      namespace.run(() => {
        namespace.set('test', 'lstat');
        expect(namespace.get('test')).toEqual('lstat');

        fs.lstat(LINKNAME, (error, stats) => {
          expect(namespace.get('test')).toEqual('lstat');

          expect(stats.mode.toString(8)).toEqual('120777');

          deleteLink();
          done();
        });
      });
    });

    it('should persist the context through the fs.link callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'link');
        expect(namespace.get('test')).toEqual('link');

        fs.link(FILENAME, HARDLINKNAME, error => {
          expect(namespace.get('test')).toEqual('link');

          const orig = fs.statSync(FILENAME);
          const linked = fs.statSync(HARDLINKNAME);
          expect(orig.ino).toEqual(linked.ino);

          expect(fs.unlinkSync(HARDLINKNAME)).toBeFalsy();
          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.symlink callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'symlink');
        expect(namespace.get('test')).toEqual('symlink');

        fs.symlink(FILENAME, LINKNAME, error => {
          expect(namespace.get('test')).toEqual('symlink');

          const pointed = fs.readlinkSync(LINKNAME);
          expect(pointed).toEqual(FILENAME);

          expect(fs.unlinkSync(LINKNAME)).toBeFalsy();
          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.readlink callback', done => {
      createLink();

      namespace.run(() => {
        namespace.set('test', 'readlink');
        expect(namespace.get('test')).toEqual('readlink');

        fs.readlink(LINKNAME, (error, pointed) => {
          expect(namespace.get('test')).toEqual('readlink');

          expect(pointed).toEqual(FILENAME);

          deleteLink();
          done();
        });
      });
    });

    it('should persist the context through the fs.unlink callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'unlink');
        expect(namespace.get('test')).toEqual('unlink');

        fs.unlink(FILENAME, error => {
          expect(namespace.get('test')).toEqual('unlink');

          // @ts-ignore
          expect(fs.exists(FILENAME, () => {})).toBeFalsy();
          done();
        });
      });
    });

    it('should persist the context through the fs.realpath callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'realpath');
        expect(namespace.get('test')).toEqual('realpath');

        fs.realpath(FILENAME, (error, real) => {
          expect(namespace.get('test')).toEqual('realpath');

          expect(real).toEqual(path.resolve(FILENAME));

          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.mkdir callback', done => {
      namespace.run(() => {
        namespace.set('test', 'mkdir');
        expect(namespace.get('test')).toEqual('mkdir');

        fs.mkdir(DIRNAME, error => {
          expect(namespace.get('test')).toEqual('mkdir');

          expect(fs.existsSync(DIRNAME)).toBeTruthy();

          fs.rmdirSync(DIRNAME);
          done();
        });
      });
    });

    it('should persist the context through the fs.rmdir callback', done => {
      createDirectory();

      namespace.run(() => {
        namespace.set('test', 'rmdir');
        expect(namespace.get('test')).toEqual('rmdir');

        fs.rmdir(DIRNAME, error => {
          expect(namespace.get('test')).toEqual('rmdir');

          expect(fs.existsSync(DIRNAME)).toBeFalsy();
          done();
        });
      });
    });

    it('should persist the context through the fs.readdir callback', done => {
      createDirectory();

      const file1 = fs.openSync(path.join(DIRNAME, 'file1'), 'w');
      fs.writeSync(file1, 'one');
      fs.closeSync(file1);

      const file2 = fs.openSync(path.join(DIRNAME, 'file2'), 'w');
      fs.writeSync(file2, 'two');
      fs.closeSync(file2);

      const file3 = fs.openSync(path.join(DIRNAME, 'file3'), 'w');
      fs.writeSync(file3, 'three');
      fs.closeSync(file3);

      namespace.run(() => {
        namespace.set('test', 'readdir');
        expect(namespace.get('test')).toEqual('readdir');

        fs.readdir(DIRNAME, (error, contents) => {
          expect(namespace.get('test')).toEqual('readdir');
          expect(contents.length).toEqual(3);

          fs.unlinkSync(path.join(DIRNAME, 'file1'));
          fs.unlinkSync(path.join(DIRNAME, 'file2'));
          fs.unlinkSync(path.join(DIRNAME, 'file3'));
          deleteDirectory();
          done();
        });
      });
    });

    it('should persist the context through the fs.watch callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'watch');
        expect(namespace.get('test')).toEqual('watch');

        const watcher = fs.watch(FILENAME, { persistent: false }, event => {
          expect(namespace.get('test')).toEqual('watch');
          expect(event).toEqual('change');

          watcher.close();
          process.nextTick(() => {
            deleteFile();
            done();
          });
        });

        setTimeout(() => {
          fs.writeFileSync(FILENAME, 'still a test');
        }, 20);
      });
    });

    it('should persist the context through the fs.utimes callback', done => {
      createFile();

      /*
       * utimes(2) takes seconds since the epoch, and Date() deals with
       * milliseconds. I just want a date some time in the past.
       */
      const PASTIME = new Date(Math.floor((Date.now() - 31337) / 1000) * 1000);

      namespace.run(() => {
        namespace.set('test', 'utimes');
        expect(namespace.get('test')).toEqual('utimes');

        const before = fs.statSync(FILENAME);
        expect(before.atime).toBeTruthy();
        expect(before.mtime).toBeTruthy();

        fs.utimes(FILENAME, PASTIME, PASTIME, error => {
          expect(namespace.get('test')).toEqual('utimes');

          const after = fs.statSync(FILENAME);
          expect(after.atime).toEqual(PASTIME);
          expect(after.mtime).toEqual(PASTIME);
          expect(before.atime).not.toEqual(after.atime);
          expect(before.mtime).not.toEqual(after.mtime);

          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.futimes callback', done => {
      createFile();

      /*
       * futimes(2) takes seconds since the epoch, and Date() deals with
       * milliseconds. I just want a date some time in the past.
       */
      const PASTIME = new Date(Math.floor((Date.now() - 0xb33fd) / 1000) * 1000);

      namespace.run(() => {
        namespace.set('test', 'futimes');
        expect(namespace.get('test')).toEqual('futimes');

        const before = fs.statSync(FILENAME);
        expect(before.atime).toBeTruthy();
        expect(before.mtime).toBeTruthy();

        const file = fs.openSync(FILENAME, 'w+');
        fs.futimes(file, PASTIME, PASTIME, error => {
          fs.closeSync(file);
          expect(namespace.get('test')).toEqual('futimes');

          const after = fs.statSync(FILENAME);
          expect(after.atime).toEqual(PASTIME);
          expect(after.mtime).toEqual(PASTIME);
          expect(before.atime).not.toEqual(after.atime);
          expect(before.mtime).not.toEqual(after.mtime);

          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.fsync callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'fsync');
        expect(namespace.get('test')).toEqual('fsync');

        const file = fs.openSync(FILENAME, 'w+');
        fs.fsync(file, error => {
          expect(namespace.get('test')).toEqual('fsync');

          fs.closeSync(file);
          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.open callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'open');
        expect(namespace.get('test')).toEqual('open');

        fs.open(FILENAME, 'r', (error, file) => {
          expect(namespace.get('test')).toEqual('open');

          const contents = Buffer.alloc(4);
          fs.readSync(file, contents, 0, 4, 0);
          expect(contents.toString()).toEqual('UHOH');

          fs.closeSync(file);
          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.close callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'close');
        expect(namespace.get('test')).toEqual('close');

        const file = fs.openSync(FILENAME, 'r');
        fs.close(file, error => {
          expect(namespace.get('test')).toEqual('close');

          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.read callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'read');
        expect(namespace.get('test')).toEqual('read');

        const file = fs.openSync(FILENAME, 'r');
        const contents = Buffer.alloc(4);
        fs.read(file, contents, 0, 4, 0, error => {
          expect(namespace.get('test')).toEqual('read');
          expect(contents.toString()).toEqual('UHOH');

          fs.closeSync(file);
          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.write callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'write');
        expect(namespace.get('test')).toEqual('write');

        const file = fs.openSync(FILENAME, 'w');
        const contents = Buffer.from('yeap');
        fs.write(file, contents, 0, 4, 0, error => {
          expect(namespace.get('test')).toEqual('write');

          fs.closeSync(file);

          const readback = fs.readFileSync(FILENAME);
          expect(readback.toString()).toEqual('yeap');

          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.readFile callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'readFile');
        expect(namespace.get('test')).toEqual('readFile');

        fs.readFile(FILENAME, (error, contents) => {
          expect(namespace.get('test')).toEqual('readFile');
          expect(contents.toString()).toEqual('UHOH');

          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.writeFile callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'writeFile');
        expect(namespace.get('test')).toEqual('writeFile');

        fs.writeFile(FILENAME, 'woopwoop', error => {
          expect(namespace.get('test')).toEqual('writeFile');

          const readback = fs.readFileSync(FILENAME);
          expect(readback.toString()).toEqual('woopwoop');

          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.appendFile callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'appendFile');
        expect(namespace.get('test')).toEqual('appendFile');

        fs.appendFile(FILENAME, '/jk', error => {
          expect(namespace.get('test')).toEqual('appendFile');

          const readback = fs.readFileSync(FILENAME);
          expect(readback.toString()).toEqual('UHOH/jk');

          deleteFile();
          done();
        });
      });
    });

    it('should persist the context through the fs.exists callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'exists');
        expect(namespace.get('test')).toEqual('exists');

        fs.exists(FILENAME, yep => {
          expect(namespace.get('test')).toEqual('exists');

          fs.exists('NOPENOWAY', nope => {
            expect(namespace.get('test')).toEqual('exists');
            expect(nope).toBeFalsy();

            deleteFile();
            done();
          });
        });
      });
    });

    it('should persist the context through the fs.watchFile callback', done => {
      createFile();

      namespace.run(() => {
        namespace.set('test', 'watchFile');
        expect(namespace.get('test')).toEqual('watchFile');

        fs.watchFile(FILENAME, { persistent: true, interval: 1 }, (before, after) => {
          expect(namespace.get('test')).toEqual('watchFile');

          expect(before.ino).toBeTruthy();
          expect(before.ino).toEqual(after.ino);

          fs.unwatchFile(FILENAME);
          process.nextTick(() => {
            deleteFile();
            done();
          }, 10);
        });

        setTimeout(() => {
          fs.appendFileSync(FILENAME, 'still a test');
        }, 10);
      });
    });
  });
});
