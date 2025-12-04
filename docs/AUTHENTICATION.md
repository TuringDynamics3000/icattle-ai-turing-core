# Authentication - Vendor-Agnostic Design

## Overview

The iCattle Dashboard uses a **vendor-agnostic authentication system** that can work with any OAuth 2.0 provider or custom authentication backend.

## Current Implementation

### OAuth 2.0 Flow

The system implements standard OAuth 2.0 authorization code flow:

1. **Authorization Request** - User clicks login, redirected to OAuth provider
2. **Authorization Grant** - User approves, provider redirects back with code
3. **Token Exchange** - Backend exchanges code for access token
4. **User Info** - Backend retrieves user information
5. **Session Creation** - Backend creates JWT session token
6. **Cookie Storage** - Session token stored in HTTP-only cookie

### Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   Browser   │─────▶│   iCattle    │─────▶│  OAuth Provider │
│             │◀─────│   Backend    │◀─────│  (Any provider) │
└─────────────┘      └──────────────┘      └─────────────────┘
     │                      │
     │                      │
     ▼                      ▼
  HTTP-only              PostgreSQL
   Cookie                (Users DB)
```

## Supported OAuth Providers

The system can work with **any OAuth 2.0 compliant provider**:

### Cloud Providers
- ✅ **Auth0** - Enterprise-grade authentication
- ✅ **Clerk** - Modern authentication platform
- ✅ **Supabase Auth** - Open-source authentication
- ✅ **AWS Cognito** - AWS-native authentication
- ✅ **Azure AD** - Microsoft enterprise authentication
- ✅ **Google OAuth** - Google accounts
- ✅ **GitHub OAuth** - GitHub accounts

### Self-Hosted
- ✅ **Keycloak** - Open-source identity management
- ✅ **Ory** - Cloud-native identity platform
- ✅ **Authentik** - Self-hosted SSO
- ✅ **Authelia** - Lightweight authentication

### Custom
- ✅ **Custom OAuth Server** - Your own implementation

## Configuration

### Environment Variables

```bash
# OAuth Provider Configuration
OAUTH_SERVER_URL=https://your-oauth-provider.com
APP_ID=your-app-id
COOKIE_SECRET=your-secret-key

# Optional: Custom OAuth endpoints
OAUTH_AUTHORIZE_PATH=/oauth/authorize
OAUTH_TOKEN_PATH=/oauth/token
OAUTH_USERINFO_PATH=/oauth/userinfo
```

### Provider-Specific Examples

#### Auth0
```bash
OAUTH_SERVER_URL=https://your-tenant.auth0.com
APP_ID=your-auth0-client-id
COOKIE_SECRET=random-secret-key
```

#### Clerk
```bash
OAUTH_SERVER_URL=https://clerk.your-domain.com
APP_ID=your-clerk-app-id
COOKIE_SECRET=random-secret-key
```

#### Keycloak (Self-Hosted)
```bash
OAUTH_SERVER_URL=https://keycloak.your-domain.com/realms/your-realm
APP_ID=your-keycloak-client-id
COOKIE_SECRET=random-secret-key
```

#### AWS Cognito
```bash
OAUTH_SERVER_URL=https://your-user-pool.auth.region.amazoncognito.com
APP_ID=your-cognito-app-client-id
COOKIE_SECRET=random-secret-key
```

## Implementation Details

### Session Management

Sessions are managed using **JWT tokens** signed with HS256:

```typescript
// Session payload
{
  openId: string;      // User unique ID
  appId: string;       // Application ID
  name: string;        // User display name
  exp: number;         // Expiration timestamp
}
```

**Security Features:**
- HTTP-only cookies (XSS protection)
- Secure flag in production (HTTPS only)
- SameSite=Lax (CSRF protection)
- 1-year expiration (configurable)

### User Database

Users are stored in PostgreSQL with minimal information:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  open_id TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  login_method TEXT,
  last_signed_in TIMESTAMP,
  role TEXT DEFAULT 'user'
);
```

**Privacy-First Design:**
- Only essential user information stored
- No passwords stored (OAuth handles authentication)
- Minimal PII (Personally Identifiable Information)

### Authentication Middleware

```typescript
// Authenticate request
const user = await sdk.authenticateRequest(req);

// User object available in tRPC context
const ctx = { user };
```

## Migration from Manus OAuth

### Before (Manus-Specific)
```typescript
import { ManusSDK } from '@manus/sdk';
const sdk = new ManusSDK();
```

### After (Vendor-Agnostic)
```typescript
import { sdk } from './server/_core/sdk';
// Works with any OAuth provider
```

### Changes Made
1. ✅ Renamed `manusTypes.ts` → `authTypes.ts`
2. ✅ Removed Manus-specific references
3. ✅ Generic OAuth 2.0 implementation
4. ✅ Configurable via environment variables
5. ✅ Standard JWT session management

## Switching OAuth Providers

### Step 1: Update Environment Variables

```bash
# Example: Switch from Auth0 to Keycloak
OAUTH_SERVER_URL=https://keycloak.example.com/realms/icattle
APP_ID=icattle-client-id
COOKIE_SECRET=new-random-secret
```

### Step 2: Update OAuth Endpoints (if needed)

If your provider uses non-standard paths, update `sdk.ts`:

```typescript
const EXCHANGE_TOKEN_PATH = `/your/custom/token/path`;
const GET_USER_INFO_PATH = `/your/custom/userinfo/path`;
```

### Step 3: Restart Application

```bash
pnpm dev
```

### Step 4: Test Authentication

```bash
# Visit login page
open http://localhost:3000/login

# Should redirect to new OAuth provider
```

## Custom OAuth Implementation

To implement your own OAuth server:

### Required Endpoints

#### 1. Authorization Endpoint
```
GET /oauth/authorize
  ?client_id={APP_ID}
  &redirect_uri={CALLBACK_URL}
  &response_type=code
  &state={STATE}
  &scope=openid profile email
```

#### 2. Token Exchange Endpoint
```
POST /oauth/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "authorization_code",
  "redirect_uri": "callback_url",
  "client_id": "app_id"
}

Response:
{
  "access_token": "token",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token",
  "scope": "openid profile email",
  "id_token": "jwt_token"
}
```

#### 3. User Info Endpoint
```
POST /oauth/userinfo
Content-Type: application/json

{
  "access_token": "access_token"
}

Response:
{
  "openId": "unique_user_id",
  "projectId": "app_id",
  "name": "User Name",
  "email": "user@example.com",
  "platform": "email",
  "loginMethod": "email"
}
```

## Security Best Practices

### 1. Cookie Security
- ✅ HTTP-only cookies (prevent XSS)
- ✅ Secure flag in production (HTTPS only)
- ✅ SameSite=Lax (CSRF protection)
- ✅ Short-lived sessions (1 year max)

### 2. Token Management
- ✅ JWT signed with HS256
- ✅ Secret key from environment variable
- ✅ Token expiration validation
- ✅ No sensitive data in JWT payload

### 3. User Data
- ✅ Minimal PII stored
- ✅ No passwords stored
- ✅ OAuth provider handles authentication
- ✅ Regular security audits

### 4. HTTPS
- ✅ Always use HTTPS in production
- ✅ Secure cookies only over HTTPS
- ✅ HSTS headers enabled

## Testing

### Local Development

```bash
# Use local OAuth server or Auth0 test tenant
OAUTH_SERVER_URL=http://localhost:4000
APP_ID=test-app-id
COOKIE_SECRET=test-secret

pnpm dev
```

### Integration Tests

```typescript
import { sdk } from './server/_core/sdk';

// Test session creation
const token = await sdk.createSessionToken('test-user-id', {
  name: 'Test User',
});

// Test session verification
const session = await sdk.verifySession(token);
expect(session?.openId).toBe('test-user-id');
```

## Troubleshooting

### Issue: "Invalid session cookie"
**Solution:** Check `COOKIE_SECRET` matches between sessions

### Issue: "OAuth callback failed"
**Solution:** Verify `OAUTH_SERVER_URL` and `APP_ID` are correct

### Issue: "User not found"
**Solution:** User may not have logged in yet, check OAuth flow

### Issue: "CORS errors"
**Solution:** Configure OAuth provider to allow your domain

## Future Enhancements

### Planned Features
- [ ] Multi-factor authentication (MFA)
- [ ] Social login (Google, GitHub, Microsoft)
- [ ] SAML 2.0 support
- [ ] LDAP/Active Directory integration
- [ ] Passwordless authentication
- [ ] Biometric authentication

### Advanced Security
- [ ] Rate limiting
- [ ] IP whitelisting
- [ ] Device fingerprinting
- [ ] Anomaly detection
- [ ] Session replay protection

## Resources

- [OAuth 2.0 Specification](https://oauth.net/2/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Auth0 Documentation](https://auth0.com/docs)
- [Keycloak Documentation](https://www.keycloak.org/documentation)

## Support

For authentication issues:
- Check environment variables
- Review OAuth provider logs
- Test with curl/Postman
- Check browser console for errors
- Review server logs

## Conclusion

The iCattle Dashboard authentication system is **fully vendor-agnostic** and can work with any OAuth 2.0 provider or custom authentication backend. The system prioritizes security, privacy, and flexibility.

🔒 **Secure by default, flexible by design.**
