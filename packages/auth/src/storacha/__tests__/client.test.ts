import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initStorachaClient,
  createClient,
  authWithEmail,
  listFiles,
  uploadFiles,
  createDelegation,
} from '../client';
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory';
import { create } from '@web3-storage/w3up-client';

// Mock the environment variables
vi.mock('../client', async () => {
  const actual = await vi.importActual('../client');
  return {
    ...actual,
    getEnv: (key: string) => {
      if (key === 'VITE_STORACHA_KEY') return 'test-key';
      if (key === 'VITE_STORACHA_PROOF') return 'test-proof';
      return undefined;
    },
  };
});

describe('Storacha Client', () => {
  let mockClient: any;
  let mockSpace: any;
  const TEST_SPACE_DID = 'did:key:test-space-did' as const;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Mock the client and space
    mockClient = {
      setCurrentSpace: vi.fn(),
      login: vi.fn(),
      capability: {
        upload: {
          list: vi.fn(),
        },
      },
      uploadFile: vi.fn(),
      uploadDirectory: vi.fn(),
      createDelegation: vi.fn(),
    };

    mockSpace = {
      did: () => TEST_SPACE_DID,
    };

    // Mock the create function
    vi.mocked(create).mockResolvedValue(mockClient);
  });

  describe('initStorachaClient', () => {
    it('should initialize the client with provided key and proof', async () => {
      const result = await initStorachaClient({
        keyString: 'test-key',
        proofString: 'test-proof',
      });

      expect(result.client).toBeDefined();
      expect(result.space).toBeDefined();
    });

    it('should throw error if key or proof is missing', async () => {
      await expect(
        initStorachaClient({
          keyString: '',
          proofString: 'test-proof',
        })
      ).rejects.toThrow();
    });
  });

  describe('authWithEmail', () => {
    it('should authenticate with email', async () => {
      const mockAccount = { email: 'test@example.com' };
      mockClient.login.mockResolvedValue(mockAccount);

      const result = await authWithEmail(mockClient, 'test@example.com');
      expect(result).toEqual(mockAccount);
      expect(mockClient.login).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('listFiles', () => {
    it('should list files from the space', async () => {
      const mockFiles = [{ name: 'test.txt' }];
      mockClient.capability.upload.list.mockResolvedValue(mockFiles);

      const result = await listFiles({
        client: mockClient,
        spaceDid: TEST_SPACE_DID,
      });

      expect(result).toEqual(mockFiles);
      expect(mockClient.setCurrentSpace).toHaveBeenCalledWith(TEST_SPACE_DID);
    });
  });

  describe('uploadFiles', () => {
    it('should upload a single file', async () => {
      const mockFile = new File(['test'], 'test.txt');
      const mockLink = { byteLength: 100 };
      mockClient.uploadFile.mockResolvedValue(mockLink);

      const progressCallback = vi.fn();
      const result = await uploadFiles(
        { client: mockClient, spaceDid: TEST_SPACE_DID },
        { files: [mockFile], uploadProgressCallback: progressCallback }
      );

      expect(result).toEqual(mockLink);
      expect(mockClient.uploadFile).toHaveBeenCalledWith(mockFile, {
        onUploadProgress: expect.any(Function),
      });
    });

    it('should upload multiple files', async () => {
      const mockFiles = [
        new File(['test1'], 'test1.txt'),
        new File(['test2'], 'test2.txt'),
      ];
      const mockLink = { byteLength: 200 };
      mockClient.uploadDirectory.mockResolvedValue(mockLink);

      const progressCallback = vi.fn();
      const result = await uploadFiles(
        { client: mockClient, spaceDid: TEST_SPACE_DID },
        { files: mockFiles, uploadProgressCallback: progressCallback }
      );

      expect(result).toEqual(mockLink);
      expect(mockClient.uploadDirectory).toHaveBeenCalledWith(mockFiles, {
        onUploadProgress: expect.any(Function),
      });
    });
  });

  describe('createDelegation', () => {
    it('should create a delegation for a user', async () => {
      const mockDelegation = {
        archive: vi.fn().mockResolvedValue({ ok: true }),
      };
      mockClient.createDelegation.mockResolvedValue(mockDelegation);

      const result = await createDelegation(
        { client: mockClient, spaceDid: TEST_SPACE_DID },
        { userDid: 'did:key:test-user-did' }
      );

      expect(result).toBe(true);
      expect(mockClient.createDelegation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining([
          'space/blob/add',
          'space/index/add',
          'filecoin/offer',
          'upload/add',
        ]),
        expect.objectContaining({
          expiration: expect.any(Number),
        })
      );
    });
  });
}); 