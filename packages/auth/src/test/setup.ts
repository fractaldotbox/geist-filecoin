import { vi } from 'vitest';

// Mock the File API for Node environment
if (typeof File === 'undefined') {
  global.File = class MockFile {
    name: string;
    size: number;
    type: string;
    lastModified: number;

    constructor(bits: any[], name: string, options?: FilePropertyBag) {
      this.name = name;
      this.size = bits.reduce((acc, bit) => acc + bit.length, 0);
      this.type = options?.type || '';
      this.lastModified = options?.lastModified || Date.now();
    }
  } as any;
}

// Mock the environment variables
vi.mock('../storacha/client', async () => {
  const actual = await vi.importActual('../storacha/client');
  return {
    ...actual,
    getEnv: (key: string) => {
      if (key === 'VITE_STORACHA_KEY') return 'test-key';
      if (key === 'VITE_STORACHA_PROOF') return 'test-proof';
      return undefined;
    },
  };
}); 