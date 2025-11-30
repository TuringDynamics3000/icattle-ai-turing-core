# API Documentation

This document provides detailed documentation for the iCattle.ai API, including endpoint descriptions, request/response formats, and usage examples.

---

## 1. Base URL

The API is hosted at: `http://localhost:8001`

---

## 2. Authentication & Headers

All API requests must include the **Turing Protocol Context Headers**. These headers provide critical metadata for security, traceability, and multi-tenancy.

| Header            | Type   | Description                                                                                             |
| ----------------- |
| `X-Tenant-ID`     | String | **Required**. The unique identifier for the tenant (e.g., the organization or farm ).                     |
| `X-Request-ID`    | String | **Required**. A unique ID for each request, used for tracing and idempotency (e.g., `req-12345`).         |
| `X-User-ID`       | String | **Required**. The ID of the user making the request.                                                    |
| `X-Device-ID`     | String | *Optional*. The ID of the device from which the request originated.                                     |
| `X-Geo-Location`  | String | *Optional*. The geographical location (latitude, longitude) where the request was made.                 |

---

## 3. Endpoints

### POST /api/v1/agritech/image_capture

Registers a new animal by capturing its muzzle print and creating an `AnimalImageCaptured` event.

#### Request Body

-   `image_data` (string, base64-encoded): The base64-encoded image of the animal's muzzle print.

#### Success Response (200 OK)

If the command is dispatched successfully, the API will return a JSON object with the `aggregate_id` (the Muzzle Hash) and the `event_id` from the database.

#### Error Responses

-   **400 Bad Request**: If any of the required Turing Protocol headers are missing.
-   **500 Internal Server Error**: If there is an infrastructure error (e.g., cannot connect to the database or Kafka).

---

*This document is maintained by TuringDynamics.*
