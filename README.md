
## Roommate matching

The optional Roommates flow is available through Home and Profile. New users can opt in after personalization. Mutual likes create connects; roommate acceptance makes both profiles private. Contacts require separate, revocable mutual consent.

Deploy the updated backend and provision its Mongo indexes before releasing these screens. See the backend's docs/roommate-matching.md for transaction, Redis, and verification requirements. Apartment listings and external provider links are deferred.

After updating .tmp-openapi.json from the local backend, run yarn api:roommates to regenerate the new roommate/block DTOs from schemas while preserving other API contracts. The older full generator infers response types from examples and can narrow existing ticket/community unions.
