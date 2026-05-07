# React Security Best Practices

## XSS Prevention

### Never Use `dangerouslySetInnerHTML`
- Avoid rendering raw HTML from user input or API responses
- If absolutely necessary, sanitize with DOMPurify first:
  ```typescript
  import DOMPurify from 'dompurify';
  const clean = DOMPurify.sanitize(dirtyHtml);
  ```

### Escape User Input
- React automatically escapes JSX expressions — use `{}` not `innerHTML`
- Never construct HTML strings from user data
- Validate and sanitize all form inputs before submission

---

## Authentication Token Handling

### Token Storage
- **Access tokens**: Store in memory (React state/context) — never localStorage
- **Refresh tokens**: httpOnly cookies only (set by backend)
- **Never** store tokens in localStorage or sessionStorage (XSS vulnerable)

### Auth State
```typescript
// Use context for auth state, not localStorage
const AuthContext = createContext<AuthState>({ user: null, isAuthenticated: false });
```

### API Interceptors
- Always include `withCredentials: true` for cookie-based auth
- Handle 401 responses with automatic token refresh (single retry)
- Clear auth state on refresh failure — redirect to login

---

## Sensitive Data

### Environment Variables
- Only `VITE_` prefixed variables are exposed to the browser
- Never put secrets in `VITE_` variables — they are in the client bundle
- API keys that must be secret should go through your backend

### Form Data
- Never log form data containing passwords or tokens
- Clear password fields after submission
- Use `autocomplete="new-password"` for password change forms

---

## URL and Navigation Safety

### External Links
- Always use `rel="noopener noreferrer"` on external links
- Validate URLs before navigation — reject `javascript:` protocol
- Use `target="_blank"` only when necessary

### Route Guards
- Validate user roles/permissions before rendering protected routes
- Use `ProtectedRoute` wrapper with `requiredRole` check
- Never rely solely on hiding UI — always validate on the backend

---

## API Request Safety

### Input Validation
- Validate all user input with Zod schemas before sending to API
- Sanitize file uploads — check MIME type, size, and extension
- Rate-limit sensitive operations (login, registration) on the frontend

### CSRF Protection
- Use `SameSite=Strict` cookies (configured by backend)
- Include CSRF tokens if backend requires them
- Never use GET requests for state-changing operations

---

## Dependencies

### Package Security
- Audit dependencies regularly: `npm audit`
- Pin dependency versions in production
- Review new dependencies before installing — check download counts, maintenance status

---

## Checklist

- [ ] No `dangerouslySetInnerHTML` without DOMPurify
- [ ] Tokens in memory/cookies, not localStorage
- [ ] `withCredentials: true` on API calls
- [ ] No secrets in `VITE_` environment variables
- [ ] `rel="noopener noreferrer"` on external links
- [ ] Zod validation on all form inputs
- [ ] Route guards on protected pages
- [ ] No sensitive data in console.log
