const globalWithProcess = globalThis as typeof globalThis & { process?: NodeJS.Process };

export function ensureProcessPolyfill(): void {
  if (!globalWithProcess.process) {
    const polyfilledProcess = {
      ...({} as NodeJS.Process),
      env: {} as NodeJS.ProcessEnv,
      versions: {} as NodeJS.ProcessVersions,
      nextTick: (cb: (...args: any[]) => void, ...args: any[]) => {
        Promise.resolve().then(() => cb(...args));
      },
    };
    globalWithProcess.process = polyfilledProcess;
  } else {
    globalWithProcess.process.env ??= {};
    if (typeof globalWithProcess.process.nextTick !== 'function') {
      globalWithProcess.process.nextTick = (cb: (...args: any[]) => void, ...args: any[]) => {
        Promise.resolve().then(() => cb(...args));
      };
    }
  }
}

ensureProcessPolyfill();

