# Payment Logging System Documentation

## Overview
The Payment Logging System provides comprehensive audit trails for all payment-related activities in the festival application. It tracks payment submissions, verifications, and rejections with detailed information about users, events, amounts, and the administrators who performed the actions.

## Features
- **Complete Audit Trail**: Every payment action is logged with timestamps, user details, and verifier information
- **Security Monitoring**: Track who verified or rejected payments and when
- **MongoDB Storage**: All logs are stored in MongoDB for persistence and scalability
- **Admin API**: Comprehensive API endpoints for viewing and exporting logs
- **CSV Export**: Export logs for external analysis and reporting
- **Security Audit**: Special endpoints for security monitoring

## Database Schema

### PaymentLog Model
```javascript
{
  // Payment details
  paymentId: String,           // Unique payment identifier
  paymentType: String,         // "participant" or "entryPass"
  eventId: ObjectId,          // Reference to Event
  eventName: String,          // Event name for quick reference
  userId: ObjectId,           // Reference to User
  userName: String,           // User name for quick reference
  userEmail: String,          // User email for quick reference
  amount: Number,             // Payment amount
  currency: String,           // Currency (default: "INR")
  paymentProofUrl: String,   // URL to payment proof image
  
  // Verification details
  action: String,             // "submitted", "verified", "rejected"
  verifiedBy: ObjectId,       // Reference to User who verified
  verifiedByName: String,     // Verifier name for quick reference
  verifiedByEmail: String,    // Verifier email for quick reference
  verifiedAt: Date,           // When verification occurred
  rejectionReason: String,     // Reason for rejection (if applicable)
  
  // Additional metadata
  ipAddress: String,          // IP address of the request
  userAgent: String,          // User agent string
  sessionId: String,          // Session identifier
  
  // Status tracking
  status: String,             // "pending", "verified", "rejected", "cancelled"
  
  // Audit trail
  createdAt: Date,             // When log entry was created
  updatedAt: Date             // When log entry was last updated
}
```

## API Endpoints

### Base URL: `/api/payment-logs`

All endpoints require admin authentication.

#### 1. Get All Logs
```
GET /api/payment-logs
Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 100)
- skip: Number of items to skip (default: 0)
```

#### 2. Get Payment-Specific Logs
```
GET /api/payment-logs/payment/:paymentId/:paymentType
Parameters:
- paymentId: Payment identifier
- paymentType: "participant" or "entryPass"
```

#### 3. Get User Logs
```
GET /api/payment-logs/user/:userId
Query Parameters:
- limit: Maximum number of logs (default: 50)
```

#### 4. Get Event Logs
```
GET /api/payment-logs/event/:eventId
Query Parameters:
- limit: Maximum number of logs (default: 100)
```

#### 5. Get Verifier Logs
```
GET /api/payment-logs/verifier/:verifierId
Query Parameters:
- limit: Maximum number of logs (default: 100)
```

#### 6. Get Logs by Status
```
GET /api/payment-logs/status/:status
Parameters:
- status: "pending", "verified", "rejected", "cancelled"
Query Parameters:
- limit: Maximum number of logs (default: 100)
```

#### 7. Get Logs by Action
```
GET /api/payment-logs/action/:action
Parameters:
- action: "submitted", "verified", "rejected"
Query Parameters:
- limit: Maximum number of logs (default: 100)
```

#### 8. Get Logs by Date Range
```
GET /api/payment-logs/date-range
Query Parameters:
- startDate: Start date (ISO string)
- endDate: End date (ISO string)
- limit: Maximum number of logs (default: 1000)
```

#### 9. Get Formatted Logs
```
GET /api/payment-logs/formatted/:paymentId/:paymentType
Returns human-readable log entries for a specific payment.
```

#### 10. Get Logs Summary
```
GET /api/payment-logs/summary
Query Parameters:
- startDate: Start date (ISO string)
- endDate: End date (ISO string)
Returns aggregated statistics for the date range.
```

#### 11. Get Logs Count
```
GET /api/payment-logs/count
Returns total number of log entries.
```

#### 12. Export Logs
```
GET /api/payment-logs/export
Query Parameters:
- startDate: Start date (ISO string)
- endDate: End date (ISO string)
- format: "csv" (default) or "json"
Returns CSV file or JSON data.
```

#### 13. Security Audit Logs
```
GET /api/payment-logs/security-audit
Query Parameters:
- startDate: Start date (ISO string) (optional)
- endDate: End date (ISO string) (optional)
- limit: Maximum number of logs (default: 1000)
Returns security-relevant logs (verifications and rejections).
```

## Log Entry Examples

### Payment Submission Log
```json
{
  "paymentId": "64a1b2c3d4e5f6789012345",
  "paymentType": "participant",
  "eventId": "64a1b2c3d4e5f6789012346",
  "eventName": "TechFest 2024",
  "userId": "64a1b2c3d4e5f6789012347",
  "userName": "John Doe",
  "userEmail": "john@example.com",
  "amount": 500,
  "currency": "INR",
  "paymentProofUrl": "https://cloudinary.com/image.jpg",
  "action": "submitted",
  "status": "pending",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "sess_123456789",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### Payment Verification Log
```json
{
  "paymentId": "64a1b2c3d4e5f6789012345",
  "paymentType": "participant",
  "eventId": "64a1b2c3d4e5f6789012346",
  "eventName": "TechFest 2024",
  "userId": "64a1b2c3d4e5f6789012347",
  "userName": "John Doe",
  "userEmail": "john@example.com",
  "amount": 500,
  "currency": "INR",
  "paymentProofUrl": "https://cloudinary.com/image.jpg",
  "action": "verified",
  "verifiedBy": "64a1b2c3d4e5f6789012348",
  "verifiedByName": "Admin User",
  "verifiedByEmail": "admin@example.com",
  "verifiedAt": "2024-01-15T11:00:00.000Z",
  "status": "verified",
  "ipAddress": "192.168.1.2",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "sess_987654321",
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

### Payment Rejection Log
```json
{
  "paymentId": "64a1b2c3d4e5f6789012345",
  "paymentType": "participant",
  "eventId": "64a1b2c3d4e5f6789012346",
  "eventName": "TechFest 2024",
  "userId": "64a1b2c3d4e5f6789012347",
  "userName": "John Doe",
  "userEmail": "john@example.com",
  "amount": 500,
  "currency": "INR",
  "paymentProofUrl": "https://cloudinary.com/image.jpg",
  "action": "rejected",
  "verifiedBy": "64a1b2c3d4e5f6789012348",
  "verifiedByName": "Admin User",
  "verifiedByEmail": "admin@example.com",
  "verifiedAt": "2024-01-15T11:30:00.000Z",
  "rejectionReason": "Payment proof is unclear",
  "status": "rejected",
  "ipAddress": "192.168.1.2",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "sess_987654321",
  "createdAt": "2024-01-15T11:30:00.000Z"
}
```

## Formatted Log Output

The system provides human-readable log entries in the following format:

```
[2024-01-15T11:00:00.000Z] VERIFIED - User: John Doe (john@example.com), Event: TechFest 2024 (64a1b2c3d4e5f6789012346), Amount: 500 INR, Payment ID: 64a1b2c3d4e5f6789012345 by Admin User (admin@example.com)
```

## Security Features

1. **Admin Authentication**: All log access requires admin authentication
2. **IP Tracking**: Every log entry includes IP address and user agent
3. **Session Tracking**: Session IDs are logged for additional security
4. **Audit Trail**: Complete trail of who did what and when
5. **Data Integrity**: Logs are created before processing to ensure nothing is missed

## Usage Examples

### Get All Recent Logs
```bash
curl -H "Authorization: Bearer <admin-token>" \
  "https://your-api.com/api/payment-logs?limit=50"
```

### Get Logs for Specific Payment
```bash
curl -H "Authorization: Bearer <admin-token>" \
  "https://your-api.com/api/payment-logs/payment/64a1b2c3d4e5f6789012345/participant"
```

### Export Logs as CSV
```bash
curl -H "Authorization: Bearer <admin-token>" \
  "https://your-api.com/api/payment-logs/export?startDate=2024-01-01&endDate=2024-01-31" \
  -o payment-logs.csv
```

### Get Security Audit Logs
```bash
curl -H "Authorization: Bearer <admin-token>" \
  "https://your-api.com/api/payment-logs/security-audit?startDate=2024-01-01&endDate=2024-01-31"
```

## Integration with Existing System

The payment logging system is automatically integrated with:
- Payment submission (when users upload payment proofs)
- Payment verification (when admins approve payments)
- Payment rejection (when admins reject payments)

No changes are required to existing frontend code - logging happens automatically in the background.

## Monitoring and Alerts

Consider setting up monitoring for:
- High rejection rates
- Unusual verification patterns
- Failed log creation attempts
- Large payment amounts

## Database Indexes

The system includes optimized indexes for:
- Payment ID and type lookups
- User-based queries
- Event-based queries
- Date range queries
- Status and action filtering

## Performance Considerations

- Logs are created asynchronously to avoid impacting payment processing
- Database indexes are optimized for common query patterns
- Pagination is supported for large datasets
- Export functionality handles large date ranges efficiently
