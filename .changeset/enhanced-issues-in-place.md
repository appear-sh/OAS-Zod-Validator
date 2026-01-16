---
"@appear.sh/oas-zod-validator": patch
---

Enhanced error properties now included on all ZodError issues automatically.

**No breaking changes** — existing code continues to work. Each issue now includes:
- `errorCode` — standardized code (e.g., "ERR_006")
- `suggestion` — actionable fix guidance
- `specLink` — link to relevant OpenAPI spec section
- `category` — error category ("schema", "format", etc.)
- `severity` — "error" or "warning"

**CLI:** Already displays these ✨

**Programmatic API:** Properties available on each issue:
```typescript
result.errors.issues.forEach(issue => {
  console.log(issue.errorCode);   // "ERR_006"
  console.log(issue.suggestion);  // "Add properties..."
  console.log(issue.specLink);    // "https://appear.sh/..."
});
```

New exported types: `EnhancedZodIssue`, `EnhancedIssueProperties`
