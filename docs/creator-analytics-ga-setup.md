# Creator Analytics: GA4 + Stripe Setup (Ryan example)

This project already tracks conversion and revenue from Stripe metadata (`creator_slug`).

## What Stripe gives you today (already in API)
- **Email signups**: counted as unique Stripe customers (fallback to checkout email when customer id is missing).
- **Paid conversions**
- **Revenue**
- **Estimated MRR**
- **Active subscriptions**

## What GA4 adds
GA4 is best for **top-of-funnel page visits** (landing-page traffic before checkout).

## Recommended stack
Use **both**:
1. **GA4** for landing-page visits and session-level traffic volume.
2. **Stripe** for signups, revenue, and subscriptions.

This gives cleaner accuracy than trying to use one tool for every metric.

## Wiring GA4 for Ryan landing pages

### 1) Ensure GA tag is present on Ryan pages
Include your GA4 tag (`G-W9CSNHSLQQ`) on Ryan traffic pages (e.g. `offer-ryan`, `sign-up-ryan`, etc.).

### 2) Set a creator dimension in GA events
On Ryan pages, add an event with creator context:

```html
<script>
  gtag('event', 'creator_page_view', {
    creator_slug: 'ryan',
    page_type: 'offer'
  });
</script>
```

### 3) Create GA4 custom dimensions
In GA4 Admin, create event-scoped custom dimensions:
- `creator_slug`
- `page_type`

### 4) Query GA4 Data API
From backend, call GA4 Data API for:
- metric: `eventCount` or `screenPageViews`
- filters: `eventName = creator_page_view`, `creator_slug = ryan`
- date range: same `days` window as Stripe summary

### 5) Merge into dashboard response
Merge the GA result as:
- `landingPageVisits` (from GA4)
- keep Stripe-based `checkoutVisits` for checkout stage

## Is GA4 accurate?
GA4 is directionally strong for visit trends, but never 100% perfect because of:
- ad blockers
- consent-mode restrictions
- cookie/browser privacy behavior
- cross-device identity gaps

For commercial decisions:
- trust **Stripe** as source of truth for money and customer counts
- trust **GA4** for traffic trend and funnel movement

