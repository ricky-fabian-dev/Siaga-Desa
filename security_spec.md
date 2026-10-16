# Security Specification: Siaga Keluarga

## 1. Data Invariants

1. **User Identity Boundary**: A user can only create and update their own document at `/users/{userId}` where `{userId} == request.auth.uid`. A regular user cannot self-assign an elevated role (`relawan`, `perangkat_desa`, `admin`) into the trusted `/admins` collection.
2. **SOS Authenticity**: Only authenticated users with an existing profile can publish an emergency SOS alert. The `userId` within the SOS document must strictly equal `request.auth.uid`.
3. **Immutability of Historical SOS**: Once an alert is created, the original author `userId`, `emergencyType`, and initial creation data cannot be overwritten by other citizens.
4. **Relawan & Admin Resolution Control**: Only authorized emergency responders (listed in `/admins/{uid}`) can change status from `menunggu` to `proses` and `selesai`, or add resolution notes. The original reporter can only cancel their own pending alert (`dibatalkan`).
5. **No Anonymous Exploits**: All write operations require an authenticated user with verified credentials.
6. **Bounded Payloads**: All string lengths, geographic coordinates (latitude between -90 and 90, longitude between -180 and 180), and phone numbers are strictly bounded to eliminate Denial-of-Wallet and storage bloat.

## 2. The "Dirty Dozen" Malicious Test Payloads

1. **Payload 1 (Impersonation Write)**: Warga A attempts to create an SOS report with `userId: "user_B"`. Expected: `PERMISSION_DENIED`.
2. **Payload 2 (Ghost Field Injection)**: An alert submission containing `superAdminOverride: true` or hidden data properties. Expected: `PERMISSION_DENIED`.
3. **Payload 3 (Self-Promotion to Admin)**: Citizen creates `/admins/{auth.uid}` with `{ role: "admin" }`. Expected: `PERMISSION_DENIED`.
4. **Payload 4 (Tampering Handled State)**: Citizen updates an active SOS to `status: "selesai"` without responder credentials. Expected: `PERMISSION_DENIED`.
5. **Payload 5 (Oversized Description Attack)**: An alert containing a 50KB string in `description` or `address`. Expected: `PERMISSION_DENIED`.
6. **Payload 6 (Invalid GPS Coordinates)**: Submission with `latitude: 999.0` or `longitude: "invalid_coordinate"`. Expected: `PERMISSION_DENIED`.
7. **Payload 7 (Unauthenticated Emergency Query)**: Unauthenticated client requests document list from `/sos_alerts`. Expected: `PERMISSION_DENIED`.
8. **Payload 8 (Foreign Profile Overwrite)**: User A attempts to edit User B's `/users/user_B` address or phone number. Expected: `PERMISSION_DENIED`.
9. **Payload 9 (Terminal State Reopening)**: Attempting to edit or change status of an alert marked `selesai` or `dibatalkan` by non-admins. Expected: `PERMISSION_DENIED`.
10. **Payload 10 (Admin Directory Tampering)**: Standard user attempting to delete a village emergency contact or alter `/village_contacts`. Expected: `PERMISSION_DENIED`.
11. **Payload 11 (SQL/Script Injection in CallSign)**: Submitting special malformed strings in identifier keys. Expected: `PERMISSION_DENIED`.
12. **Payload 12 (Blanket Member Scraping)**: Direct listing of user private phone numbers without authentication. Expected: `PERMISSION_DENIED`.
