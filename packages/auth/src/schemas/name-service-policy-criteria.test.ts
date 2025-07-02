import { checkNameServiceCriteria } from './name-service-policy-criteria';
import type { AuthInput } from './input';
import { describe, it, expect } from 'vitest';

describe('checkNameServiceCriteria', () => {
  const makeInput = (name: string): AuthInput => ({
    context: { name },
  } as any);

  it('should return true for root domain when isRootDomainOnly is true', async () => {
    const policyConfig = { domain: 'abc.com', isRootDomainOnly: true };
    const input = makeInput('abc.com');
    expect(await checkNameServiceCriteria(policyConfig, input)).toBe(true);
  });

  it('should return false for subdomain when isRootDomainOnly is true', async () => {
    const policyConfig = { domain: 'abc.com', isRootDomainOnly: true };
    const input = makeInput('sub.abc.com');
    expect(await checkNameServiceCriteria(policyConfig, input)).toBe(false);
  });

  it('should return true for subdomain when isRootDomainOnly is false', async () => {
    const policyConfig = { domain: ['abc.com'], isRootDomainOnly: false };
    const input = makeInput('sub.abc.com');
    expect(await checkNameServiceCriteria(policyConfig, input)).toBe(true);
  });

  it('should return false for unrelated domain', async () => {
    const policyConfig = { domain: ['abc.com'], isRootDomainOnly: false };
    const input = makeInput('xyz.com');
    expect(await checkNameServiceCriteria(policyConfig, input)).toBe(false);
  });

  it('should return false for root domain when isRootDomainOnly is false and domain is different', async () => {
    const policyConfig = { domain: ['abc.com'], isRootDomainOnly: false };
    const input = makeInput('def.com');
    expect(await checkNameServiceCriteria(policyConfig, input)).toBe(false);
  });

  it('should return true for multiple domains in array', async () => {
    const policyConfig = { domain: ['abc.com', 'def.com'], isRootDomainOnly: false };
    const input = makeInput('sub.def.com');
    expect(await checkNameServiceCriteria(policyConfig, input)).toBe(true);
  });

  it('should return true if name is exactly the domain but isRootDomainOnly is false', async () => {
    const policyConfig = { domain: ['abc.com'], isRootDomainOnly: false };
    const input = makeInput('abc.com');
    expect(await checkNameServiceCriteria(policyConfig, input)).toBe(true);
  });
}); 