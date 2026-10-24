# Backend Changes Needed

## 2026-10-24 update: synced with the latest Swagger

### What the frontend now uses from the new Swagger
- **New screens**: Resources (`/api/v1/resources/*`), Wedding Bookings (`/api/v1/wedding-bookings/*`),
  Appointments (`/api/v1/appointments/*`), SMS (`/api/v1/sms/*`), Promo Codes (`/api/promo-codes`),
  Fees (`/api/fees`, `/api/fees/standard`), Portal Links (`/api/v1/portal/*`), Child timeline
  (`/api/v1/child-events/*`, Children > Timeline), Browse Families + Bulk Promote (`/api/families/families*`,
  `/api/families/bulk-promote`), Fathers Bulk Upload (`/api/fathers/bulk-upload`).
- **Payments** now match `payment-controller`: `promoCode` replaces `paymentReference`; `certificateType` is sent to
  `/certificate`, `/certificate/waive` and `/can-issue`; `/quote`, `/receipt/{no}` and generic `POST /api/payments`
  are wired; reports accept all 8 fee types.
- **Children**: `firstNameEn` / `middleNameEn` / `lastNameEn` (required by the API), `placeOfBirth`, `nationality`.
  `email` is no longer sent (not in `ChildCreateRequestDTO`).
- **Fathers**: `placeOfBirth`, `nationality`, `ordination` / `ordinationDate` / `bishopName` / `ordinationPlace`,
  `dioceseId`, `clericalRank`, `monasticismType` are all sent; update supports multipart.
- **Dioceses**: deactivate sends the new required `active` flag; an Activate button was added.
- **Auth**: Forgot-password dialog on the login page (`forgot-password` -> `verify-temporary-password` ->
  `setnewpassword`); token refresh now calls `POST /api/v1/auth/refresh-token` (the old `/api/auth/refresh` is not in
  the Swagger); `PUT /api/v1/auth/Update/profile` helper (with `language`).
- **Certificates** (baptism / wedding / death) now print **bilingually** - Amharic and English labels, wording,
  dates (Ethiopian + Gregorian) and names. English name spellings come from the child record
  (`firstNameEn`, `middleNameEn`, `lastNameEn`).

### Things to confirm / still missing on the backend
1. **Certificate English values**: the certificate DTOs only carry one spelling per field. English is shown for the
   person names (from the child record). Father/mother/god-parent/place/church names have no English field - if you
   want those in English too, add e.g. `fatherNameEn`, `motherNameEn`, `placeOfBirthEn`, `churchEn` to the
   baptism / wedding DTOs and tell the frontend.
2. Password recovery: the exact order of `verify-temporary-password` / `set-password` / `setnewpassword` is not
   documented. The UI calls verify then setnewpassword with the same body.
3. `POST /api/v1/auth/refresh-token` has no request/response schema in the Swagger. The UI sends the refresh token as a
   Bearer header (and in the body) and accepts `access_token` / `accessToken`.
4. Response DTOs for resources-assign, bookings, appointments, child events, promo codes and SMS templates are
   `BaseResponseDTO.data: object` in the Swagger, so list screens read common field names (`status`, `paymentStatus`,
   `usedCount`, `active`, ...). Please add typed response DTOs.
5. `LocalTime` fields (`bookingTime`, `requestedTime`, `eventTime`) are sent as `{hour, minute, second, nano}` per the
   Swagger. If the server prefers `"HH:mm"` strings, tell the frontend.
6. Still not in the Swagger (from earlier notes): `PUT /api/v1/name-prefixes/{id}`,
   `PATCH /api/v1/name-prefixes/{id}/activate`, `PATCH /api/children/{id}/activate`, a father photo field,
   `middleName` on users, `status` in `UserDetailDTO`, children bulk-upload, and the primary configuration page.
7. `DELETE /api/children/{id}` and `DELETE /api/fathers/{id}` are not in the Swagger; the existing Delete buttons
   will fail until they are added (Deactivate works).

---

# Backend Changes Needed

## 2026-09-30 update: name prefixes, photos, ID/certificate photos

Items the frontend now expects but that are **not in the current Swagger**:

### A. Name prefixes (name-prefix-controller)
The Swagger only has `GET /api/v1/name-prefixes`, `POST /api/v1/name-prefixes`,
`GET /api/v1/name-prefixes/for-gender/{gender}` and `PATCH /api/v1/name-prefixes/{id}/deactivate`.
The new **Name Prefixes** menu page is fully wired, but two actions call endpoints that do not exist yet:
- `PUT /api/v1/name-prefixes/{id}` (body = `NamePrefixRequestDTO`) - needed for **Edit**.
- `PATCH /api/v1/name-prefixes/{id}/activate` - needed to **re-activate** a deactivated prefix.
Until these are added, Edit and Activate will return an error toast; Add, list and Deactivate work.

### B. Father photo
`FatherResponseDTO` has no photo field (only `documents[]`). The frontend uploads the photo as a
document with `documentTypes = PROFILE_PHOTO` and displays the newest image document.
Cleaner fix: add `profileImageUrl` to `FatherResponseDTO` and a `profileImage` multipart part to
`POST/PUT /api/fathers` (same as the child endpoints). The frontend already reads `profileImageUrl`
first when it is present, so no frontend change is needed once you add it.

### C. Child activate (still open, from before)
No `PATCH /api/children/{id}/activate`. Activate in the UI still cannot really re-activate.

### D. Other things noticed while testing with your sample data
- `qrLink` comes back as `http://localhost:8080/api/children/{id}` - the backend's public base URL
  setting is wrong for production (and the QR image encodes it).
- `GET /api/children/search` and `GET /api/fathers/search` are GET in the Swagger. The frontend now tries
  GET (query params `name`, `gender`, ...) and falls back to the old POST-with-body if the server answers 404/405.

---

While implementing the requested fixes, the frontend was updated to send the fields below,
matching the naming style already used in your Swagger. None of these fields exist in the
current Swagger spec (`certificate-api.hohitebirhan.com`), so the backend needs to accept
(and where noted, return) them or these updates will have no visible effect until it does.

## 1. User (auth-controller)
- `UserInfoRequestDto` (register) and `UpdateUserDTO` (update) need a `middleName: string` field.
- `UserDetailDTO` (returned by `/api/v1/user/all/paginated`) needs a `status` field so the
  Users table can show/toggle Active vs Blocked. Today the DTO only returns `role`, not `status`,
  even though `UpdateUserDTO` accepts a status on write.
- ~~`/api/v1/auth/change-password` does not exist~~ **RESOLVED (2026-09-24 Swagger update):**
  this endpoint is now present in the Swagger spec and matches the frontend's existing call
  (`{ userId, oldPassword, newPassword }` in `profileService.ts`). No further action needed.

## 2. Father (father-controller)
- `FatherCreateRequestDTO` needs `christianName: string` and `motherName: string`.
- `FatherResponseDTO` needs the same two fields returned, plus each `DocumentResponseDTO`
  ideally tagged with which service-history entry it belongs to (see below).
- Service-history file uploads: the frontend now lets a user attach a document per
  Service History entry during registration, but `ServiceHistoryDTO` has no field to
  associate an uploaded document with a specific entry. Today it's sent as a generic file
  in the `documents` array on `POST /api/fathers` — it will be *stored* against the father
  but not linked to the specific service-history row. If you want that link, `ServiceHistoryDTO`
  needs a `documentId` (or similar) field.

## 3. Child (child-controller)
- `ChildCreateRequestDTO` needs: `prefix: string`, `christianName: string`, `motherName: string`,
  `email: string`, `isPrinted: boolean` (read-only, set by the certificate-print flow).
- The child endpoints already accept `multipart/form-data` with a `profileImage` field per
  Swagger — the frontend was previously calling this as plain JSON and has been fixed to use
  multipart, so image upload should now actually reach the backend correctly.
- **Missing activate endpoint**: Swagger has `PATCH /api/children/{id}/deactivate` but no
  equivalent to reactivate a child. The frontend now has an Activate/Deactivate toggle in the
  UI; deactivate calls the real endpoint, but "Activate" currently falls back to calling
  `PUT /api/children/{id}` with the existing data, which will **not** actually flip the child
  back to active since `ChildCreateRequestDTO` has no `active`/`isActive` field. Please add
  `PATCH /api/children/{id}/activate` (or add `active` to the update DTO) so this works for real.

## 4. Wedding certificate (wedding-certificate-controller)
- No changes needed — `witness1Name`/`witness2Name`/`witness3Name` already exist in
  `WeddingCertificateRequestDTO` and the frontend already used them.

## 5. Baptism certificate (baptism-certificate-controller)
- No changes needed — `church` already exists on `BaptismCertificateRequestDTO` and the
  frontend already used it.

## 6. Death record (death-record-controller)
- No backend change needed. Per your clarification, this is a record, not a certificate —
  the frontend now shows "Successfully recorded" and does not attempt to render/print anything.

## 7. Payments (payment-controller)
- `payMembership` and `payCertificateFee` need an optional `paymentReference` query
  parameter, and `PaymentResponseDTO` needs a `paymentReference` field returned so it can be
  shown in the payment history / reports.

## 8. Bulk upload
- Not implemented — there is no bulk-upload endpoint in the Swagger spec for children,
  fathers, or family members. This needs a new endpoint (e.g.
  `POST /api/children/bulk-upload` accepting a CSV/XLSX file) before the frontend can support it.

## 9. Primary configuration page
- Not implemented — there's no settings/configuration controller in the Swagger spec
  (e.g. for default membership/certificate rates, currency, org details). Needs a backend
  resource before a frontend page can be built against it.

---
None of the above are blockers for the rest of the frontend work — everything else in this
pass only touches endpoints/fields that already exist in your Swagger.
