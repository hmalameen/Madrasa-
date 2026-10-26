# Security Specification — Ummul Quran Cadet Madrasa Management System

## 1. Data Invariants
1. **Default Deny & Verified Identity**: All operations are denied by default. Any authenticated access requires `request.auth != null` and `request.auth.token.email_verified == true`.
2. **No Self-Assigned Privileged Roles**: Regular users registering their own `/users/{userId}` document can only self-register as `'guardian'` or `'student'` with `status == 'pending'`, UNLESS their verified email matches the bootstrapped super administrator (`hmalameenemob@gmail.com`). Users can never escalate their own `role` or `status` on update.
3. **Guardian Isolation**: Guardians may only read or list student, attendance, exam, invoice, Hifz, or leave records where `resource.data.guardianUid == request.auth.uid`.
4. **Payroll & Finance Isolation**: Only `super_admin`, `muhtamim`, or `accountant` roles (verified via `/users/$(request.auth.uid)`) may access `/payroll/{payrollId}` and `/expenses/{expenseId}`, or mutate `/invoices/{invoiceId}`.
5. **Terminal State Locking**: Once an invoice (`status == 'paid'`) or payroll record (`status == 'paid'`) or residential leave (`status == 'returned'` or `'rejected'`) reaches a terminal state, non-admins cannot mutate it.
6. **Temporal & Identity Integrity**: Every `create` must set `authorId == request.auth.uid` (or `uid == request.auth.uid` for user profiles), `createdAt == request.time`, and `updatedAt == request.time`. Every `update` must preserve `authorId` and `createdAt`, and set `updatedAt == request.time`.

## 2. The "Dirty Dozen" Payloads (Adversarial Test Cases)
1. **Privilege Escalation on Registration**: Authenticated non-admin user creates `/users/{uid}` with `role: "super_admin"`. -> `PERMISSION_DENIED`
2. **Self-Role Update**: Existing guardian updates `/users/{uid}` changing `role` from `"guardian"` to `"accountant"`. -> `PERMISSION_DENIED`
3. **Spoofed Unverified Admin Email**: Token has `email: "hmalameenemob@gmail.com"` but `email_verified: false`. -> `PERMISSION_DENIED`
4. **Shadow Field Injection**: Valid student creation payload plus extra field `isAdminBypass: true`. -> `PERMISSION_DENIED`
5. **Cross-Guardian PII Leak**: Guardian A attempts `get` or `list` on `/students/{studentB}` where `guardianUid != GuardianA.uid`. -> `PERMISSION_DENIED`
6. **Unauthorized Payroll Read**: Teacher or Guardian attempts to read `/payroll/{payrollId}`. -> `PERMISSION_DENIED`
7. **Paid Invoice Tampering (Terminal State Bypass)**: Accountant attempts to modify `amountPaidBdt` on an invoice whose existing `status` is already `'paid'` without admin override. -> `PERMISSION_DENIED`
8. **Author Spoofing on Attendance**: Teacher creates `/attendance/{id}` with `authorId` set to another teacher's UID. -> `PERMISSION_DENIED`
9. **Client Timestamp Forgery**: Client sends a past `createdAt` timestamp (`createdAt != request.time`) when creating a Hifz log. -> `PERMISSION_DENIED`
10. **Immortal Field Mutation**: Admin or teacher updates a student record and modifies `createdAt` or `authorId`. -> `PERMISSION_DENIED`
11. **Oversized String / Denial-of-Wallet Payload**: User submits a `Notice` with a 50,000-character `contentBn` exceeding `maxLength: 1000`. -> `PERMISSION_DENIED`
12. **ID Poisoning Attack**: User attempts to create a document with an invalid document ID containing spaces or special characters violating `^[a-zA-Z0-9_\-]+$`. -> `PERMISSION_DENIED`
