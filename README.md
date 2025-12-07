# raising-the-bar
A website by Raising The Bar, offering custom workout programs and 1-on-1 coaching.

## Stripe Connect rollout

The API now supports onboarding creator partners and automatically splitting subscription revenue using Stripe Connect.

### Environment variables

- `STRIPE_SECRET_KEY`: Platform secret key.
- `STRIPE_WEBHOOK_SECRET`: Signing secret for the `/api/webhook` endpoint.
- `CONNECT_ADMIN_SECRET`: Shared secret required in the `x-connect-admin-secret` header for Connect admin endpoints.
- `CONNECT_ONBOARDING_RETURN_URL` / `CONNECT_ONBOARDING_REFRESH_URL`: Optional override URLs for Express onboarding links (fallbacks to `FRONTEND_URL`).

### Onboard a creator (Express account)

```
POST /api/connect/creators
Headers: x-connect-admin-secret: $CONNECT_ADMIN_SECRET
Body: {
  "slug": "creator-handle",
  "name": "Creator Display Name",
  "email": "creator@email.com",
  "country": "US",          // Stripe country code
  "introFeePercent": 50,      // platform share for the first charge
  "ongoingFeePercent": 30     // platform share for renewals
}
```

The response includes `onboardingLink` for the creator to finish KYC. On subsequent calls, the endpoint updates stored fee splits and returns a fresh onboarding link.

### Creator dashboard link

```
POST /api/connect/creators/:slug/login-link
Headers: x-connect-admin-secret: $CONNECT_ADMIN_SECRET
```

Returns a one-time `loginLink` to the creator’s Stripe Express dashboard.

### Taking payments for a creator

Pass the creator slug from the creator-branded landing page when starting a subscription:

- `POST /api/create-checkout-session` → include `creatorSlug` in the JSON body.
- `POST /api/create-subscription-intent` → include `creatorSlug` in the JSON body.

The platform will route funds to the creator’s connected account, take the configured intro fee on the first invoice, then automatically switch future invoices to the ongoing fee percentage.
