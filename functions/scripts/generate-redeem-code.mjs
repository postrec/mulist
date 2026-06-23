import { createHash, randomBytes } from 'node:crypto';

const raw = process.argv[2] || randomBytes(10).toString('hex').toUpperCase();
const normalized = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
if (normalized.length < 8)
  throw new Error('리딤 코드는 8자 이상이어야 합니다.');
const code = normalized.match(/.{1,4}/g).join('-');
const documentId = createHash('sha256').update(normalized).digest('hex');

console.log(
  JSON.stringify(
    {
      code,
      firestorePath: `redeemCodes/${documentId}`,
      document: {
        active: true,
        plan: 'premium',
        maxRedemptions: 1,
        redemptionCount: 0,
        expiresAt: null,
        entitlementExpiresAt: null,
      },
    },
    null,
    2,
  ),
);
