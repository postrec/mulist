# MuList Firebase Functions

## Create a redeem code

Generate a high-entropy code and its SHA-256 Firestore document ID:

```bash
npm run redeem:generate
```

Keep the printed `code` private. In Firebase Console, create the printed
`redeemCodes/<documentId>` document using the generated fields. The plaintext code is
never stored in Firestore.

- `maxRedemptions`: total allowed uses
- `redemptionCount`: start at `0`
- `expiresAt`: code expiration Timestamp, or `null`
- `entitlementExpiresAt`: granted Premium expiration Timestamp, or `null` for no expiry

The callable Function requires Firebase Authentication, allows five attempts per user
per minute, and atomically records each user redemption with the entitlement grant.
