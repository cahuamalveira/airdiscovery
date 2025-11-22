# Email Configuration Guide

## Without SES Domain/Production Setup

### 1. Development Mode (No SES)
The mail service automatically detects when SES is not configured and logs email content instead:

```env
# .env - Development (SES disabled)
NODE_ENV=development
# Leave AWS credentials empty to trigger development mode
```

**Output:** Email details logged to console instead of sending real emails.

### 2. SES Sandbox Mode (Testing with Real Emails)
For testing with real email sending but limited recipients:

```env
# .env - SES Sandbox
NODE_ENV=development
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
SES_FROM_EMAIL=your-verified-email@gmail.com
```

**Requirements:**
1. Verify your personal email in AWS SES Console
2. Add test recipient emails in SES Console  
3. Can only send to verified emails (sandbox limitation)

### 3. Quick SES Setup Steps
1. Go to AWS SES Console
2. Click "Verified identities" 
3. "Create identity" → Email address
4. Verify your email address
5. Use that verified email as `SES_FROM_EMAIL`

### 4. Alternative Email Services
For easier development, consider:
- **Mailtrap** (email testing)
- **SendGrid** (easier setup)
- **Nodemailer** with Gmail SMTP

### 5. Current Behavior
```typescript
// Automatically handles missing SES config
if (isDevelopment && !hasValidSESConfig) {
  this.logger.warn('SES não configurado - simulando envio de email');
  this.logEmailContent(booking); // Logs email details
  return; // No actual email sent
}
```

**Recommendation for Development:** Leave SES unconfigured to see email content in logs, or set up one verified email for basic testing.