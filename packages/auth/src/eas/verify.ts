import type { Attestation } from '@ethereum-attestation-service/eas-sdk';
import type { Provider } from 'ethers';

export interface VerifyAttestationResult {
  isValid: boolean;
  error?: string;
}

export async function verifyAttestation(
  attestation: Attestation,
  provider: Provider
): Promise<VerifyAttestationResult> {
  try {
    // Verify the attestation signature
    const isValid = await attestation.verify(provider);
    
    if (!isValid) {
      return {
        isValid: false,
        error: 'Invalid attestation signature'
      };
    }

    // Verify the attestation hasn't expired
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (attestation.expirationTime && attestation.expirationTime < currentTimestamp) {
      return {
        isValid: false,
        error: 'Attestation has expired'
      };
    }

    return {
      isValid: true
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during verification'
    };
  }
}
