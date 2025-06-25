import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest'
import { createDelegation, type StorachaConfig } from './storacha'
import * as DID from '@ipld/dag-ucan/did'
import type { Client } from '@web3-storage/w3up-client/types'

// Mock the DID module
vi.mock('@ipld/dag-ucan/did', () => ({
  parse: vi.fn()
}))

describe('createDelegation', () => {
  let mockConfig: StorachaConfig
  let mockClient: Client
  let mockAudience: { did: () => string }
  let mockDelegation: { archive: () => Promise<{ ok: any }> }
  
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Mock the audience object
    mockAudience = {
      did: vi.fn().mockReturnValue('did:key:test-audience')
    }
    
    // Mock the delegation object
    mockDelegation = {
      archive: vi.fn().mockResolvedValue({ ok: 'delegation-archive-data' })
    }
    
    // Mock the client
    mockClient = {
      createDelegation: vi.fn().mockResolvedValue(mockDelegation)
    } as any
    
    // Mock config
    mockConfig = {
      client: mockClient,
      spaceDid: 'did:key:test-space' as any
    }
    
    // Mock DID.parse
    ;(DID.parse as MockedFunction<typeof DID.parse>).mockReturnValue(mockAudience as any)
    
    // Mock console.log to avoid cluttering test output
    vi.spyOn(console, 'log').mockImplementation(() => {})
    
    // Mock Date.now for consistent expiration times
    vi.spyOn(Date, 'now').mockReturnValue(1000000 * 1000) // Mock timestamp
  })
  
  it('should create a delegation with correct parameters', async () => {
    const userDid = 'did:key:test-user'
    
    const result = await createDelegation(mockConfig, { userDid })
    
    // Verify DID.parse was called with the correct userDid
    expect(DID.parse).toHaveBeenCalledWith(userDid)
    
    // Verify client.createDelegation was called with correct parameters
    expect(mockClient.createDelegation).toHaveBeenCalledWith(
      mockAudience,
      ['space/blob/add', 'space/index/add', 'filecoin/offer', 'upload/add'],
      {
        expiration: Math.floor(1000000 + 60 * 60 * 24) // 24 hours from mocked timestamp
      }
    )
    
    // Verify delegation.archive was called
    expect(mockDelegation.archive).toHaveBeenCalled()
    
    // Verify the result is the archived delegation
    expect(result).toBe('delegation-archive-data')
  })
  
  it('should log the audience DID', async () => {
    const userDid = 'did:key:test-user'
    
    await createDelegation(mockConfig, { userDid })
    
    expect(console.log).toHaveBeenCalledWith('create delegation', 'did:key:test-audience')
  })
  
  it('should handle DID parsing errors', async () => {
    const userDid = 'invalid-did'
    const parseError = new Error('Invalid DID format')
    
    ;(DID.parse as MockedFunction<typeof DID.parse>).mockImplementation(() => {
      throw parseError
    })
    
    await expect(createDelegation(mockConfig, { userDid })).rejects.toThrow('Invalid DID format')
  })
  
  it('should handle client delegation creation errors', async () => {
    const userDid = 'did:key:test-user'
    const delegationError = new Error('Failed to create delegation')
    
    ;(mockClient.createDelegation as any).mockRejectedValue(delegationError)
    
    await expect(createDelegation(mockConfig, { userDid })).rejects.toThrow('Failed to create delegation')
  })
  
  it('should handle delegation archive errors', async () => {
    const userDid = 'did:key:test-user'
    const archiveError = new Error('Failed to archive delegation')
    
    mockDelegation.archive = vi.fn().mockRejectedValue(archiveError)
    
    await expect(createDelegation(mockConfig, { userDid })).rejects.toThrow('Failed to archive delegation')
  })
  
  it('should use correct abilities and expiration time', async () => {
    const userDid = 'did:key:test-user'
    const mockTimestamp = 1234567890000
    
    vi.spyOn(Date, 'now').mockReturnValue(mockTimestamp)
    
    await createDelegation(mockConfig, { userDid })
    
    const expectedExpiration = Math.floor(mockTimestamp / 1000) + 60 * 60 * 24
    
    expect(mockClient.createDelegation).toHaveBeenCalledWith(
      mockAudience,
      ['space/blob/add', 'space/index/add', 'filecoin/offer', 'upload/add'],
      {
        expiration: expectedExpiration
      }
    )
  })
  
  it('should return the ok property from archived delegation', async () => {
    const userDid = 'did:key:test-user'
    const expectedArchiveData = { some: 'archive', data: 'here' }
    
    mockDelegation.archive = vi.fn().mockResolvedValue({ ok: expectedArchiveData })
    
    const result = await createDelegation(mockConfig, { userDid })
    
    expect(result).toEqual(expectedArchiveData)
  })
}) 