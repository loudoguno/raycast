# Discovering the Claude Usage API Endpoint

## Manual Steps to Find the API

1. Open Chrome/Safari and go to `https://claude.ai/settings/usage`
2. Open DevTools (Cmd+Option+I)
3. Go to the **Network** tab
4. Filter by **XHR/Fetch**
5. Refresh the page
6. Look for requests that return JSON with usage data

## What to Look For

The response should contain something like:
```json
{
  "current_session": {
    "used_percentage": 0,
    "started_at": null
  },
  "weekly": {
    "all_models": {
      "used_percentage": 12,
      "resets_at": "2024-XX-XX 03:00:00"
    },
    "sonnet": {
      "used_percentage": 2,
      "resets_at": "2024-XX-XX 03:00:00"
    }
  }
}
```

## Likely Endpoint Patterns

Based on Claude's API patterns, try looking for:

- `GET /api/organizations/{org_id}/usage`
- `GET /api/account/usage`
- `GET /api/usage`
- `GET /api/billing/usage`
- `GET /api/settings/usage`

## Once Found

Update the `PLAN.md` with:
1. The exact endpoint URL
2. Required headers (especially auth headers)
3. Sample response structure

Then we can attempt direct API calls with proper authentication.

## Request Headers to Note

Copy these from a successful request:
- `Cookie` header (contains session info)
- `Authorization` header (if any)
- `X-*` custom headers
- `User-Agent`
