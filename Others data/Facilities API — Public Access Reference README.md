# Facilities API — Public Access Reference

**Base URL:** `https://humber-facilities.vercel.app/`

All endpoints listed here are **publicly accessible** — no authentication or API key is required. Responses are JSON. All timestamps are ISO 8601 UTC.

---

## Rooms

### List / Search Rooms

```
GET /api/rooms
```

Returns a paginated list of rooms. All query parameters are optional.

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `q` | string | Search by room number (case-insensitive, partial match) |
| `status` | string | Filter by status: `AVAILABLE`, `OCCUPIED`, `MAINTENANCE` |
| `campusId` | string | Filter by campus ID |
| `buildingId` | string | Filter by building ID |
| `tagId` | string | Filter by tag ID |
| `page` | integer | Page number (default: `1`) |
| `limit` | integer | Results per page (default: `20`, max: `100`) |

**Response**

```json
{
  "data": [
    {
      "id": "cmnhlgr9y001grovs9cam5qc4",
      "roomNumber": "A100",
      "floor": 1,
      "capacity": 30,
      "roomType": "CLASSROOM",
      "description": null,
      "currentStatus": "AVAILABLE",
      "building": {
        "id": "...",
        "name": "Building A",
        "buildingCode": "A",
        "campus": {
          "id": "campus-north",
          "name": "North Campus",
          "address": "205 Humber College Blvd, Toronto, ON M9W 5L7"
        }
      },
      "tags": [],
      "assets": []
    }
  ],
  "total": 365,
  "page": 1,
  "limit": 20,
  "totalPages": 19
}
```

**Status Codes:** `200 OK` · `400 Bad Request` (invalid query params) · `500 Server Error`

---

### Get Room Detail

```
GET /api/rooms/{id}
```

Returns full detail for a single room including building, campus, tags, assets, and active maintenance logs.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | string | Room ID (cuid) |

**Response**

```json
{
  "data": {
    "id": "cmnhlgr9y001grovs9cam5qc4",
    "roomNumber": "A100",
    "floor": 1,
    "capacity": 30,
    "roomType": "CLASSROOM",
    "description": null,
    "currentStatus": "AVAILABLE",
    "archivedAt": null,
    "createdAt": "2026-04-02T10:00:00.000Z",
    "updatedAt": "2026-04-02T10:00:00.000Z",
    "building": {
      "id": "...",
      "name": "Building A",
      "buildingCode": "A",
      "campus": {
        "id": "campus-north",
        "name": "North Campus",
        "address": "205 Humber College Blvd, Toronto, ON M9W 5L7",
        "timezone": "America/Toronto"
      }
    },
    "tags": [
      { "id": "...", "tagName": "#ComputerLab", "colorCode": "#8B5CF6" }
    ],
    "assets": [
      { "id": "...", "itemName": "Projector", "quantity": 1, "isFunctional": true }
    ],
    "maintenanceLogs": []
  }
}
```

**Status Codes:** `200 OK` · `404 Not Found` · `500 Server Error`

---

### Get Room Availability (Right Now)

```
GET /api/rooms/{id}/availability
```

Returns whether the room is available **at this moment**, cross-referencing its current status and live timetable from the Scheduler module.

**Response**

```json
{
  "data": {
    "roomId": "cmnhlgr9y001grovs9cam5qc4",
    "available": false,
    "reason": "OCCUPIED",
    "currentSlot": {
      "courseCode": "COMP1234",
      "courseName": "Introduction to Programming",
      "instructor": "J. Smith",
      "dayOfWeek": "Monday",
      "startTime": "09:00",
      "endTime": "11:00"
    },
    "isFallback": false
  }
}
```

> `isFallback: true` means the Scheduler module was unreachable and the slot data may not be current.

**`reason` values:** `AVAILABLE` · `OCCUPIED` · `MAINTENANCE`

**Status Codes:** `200 OK` · `404 Not Found` · `500 Server Error`

---

### Get Room Timetable

```
GET /api/rooms/{id}/timetable
```

Returns the full weekly schedule for the room from the external Scheduler module.

**Response**

```json
{
  "data": {
    "roomId": "cmnhlgr9y001grovs9cam5qc4",
    "isFallback": false,
    "slots": [
      {
        "courseCode": "COMP1234",
        "courseName": "Introduction to Programming",
        "instructor": "J. Smith",
        "dayOfWeek": "Monday",
        "startTime": "09:00",
        "endTime": "11:00"
      }
    ]
  }
}
```

**Status Codes:** `200 OK` · `404 Not Found` · `500 Server Error`

---

### Get Room Assets

```
GET /api/rooms/{id}/assets
```

Returns the list of physical assets (equipment, furniture, etc.) in the room.

**Response**

```json
{
  "data": [
    {
      "id": "...",
      "roomId": "...",
      "itemName": "Projector",
      "quantity": 1,
      "isFunctional": true,
      "createdAt": "2026-04-02T10:00:00.000Z",
      "updatedAt": "2026-04-02T10:00:00.000Z"
    }
  ]
}
```

**Status Codes:** `200 OK` · `404 Not Found` · `500 Server Error`

---

## Buildings

### List All Buildings

```
GET /api/buildings
```

**Response**

```json
{
  "data": [
    {
      "id": "...",
      "name": "Building A",
      "buildingCode": "A",
      "campusId": "campus-north",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### Get Building Detail

```
GET /api/buildings/{id}
```

**Status Codes:** `200 OK` · `404 Not Found` · `500 Server Error`

---

## Campuses

### List All Campuses

```
GET /api/campuses
```

**Response**

```json
{
  "data": [
    {
      "id": "campus-north",
      "name": "North Campus",
      "address": "205 Humber College Blvd, Toronto, ON M9W 5L7",
      "timezone": "America/Toronto"
    }
  ]
}
```

---

### Get Campus Detail

```
GET /api/campuses/{id}
```

**Status Codes:** `200 OK` · `404 Not Found` · `500 Server Error`

---

## Tags

### List All Tags

```
GET /api/tags
```

Tags are labels applied to rooms (e.g. `#ComputerLab`, `#Projector`). Use the `tagId` from this response to filter rooms.

**Response**

```json
{
  "data": [
    {
      "id": "...",
      "tagName": "#ComputerLab",
      "colorCode": "#8B5CF6",
      "createdAt": "..."
    }
  ]
}
```

---

## Common Error Responses

All error responses follow this shape:

```json
{
  "error": "Room not found"
}
```

| Status | Meaning |
|---|---|
| `400` | Bad request — invalid query parameters or body |
| `404` | Resource not found |
| `500` | Internal server error |

---

## Quick Examples

```bash
# All available rooms at North Campus
GET /api/rooms?campusId=campus-north&status=AVAILABLE

# Search for CTI building rooms
GET /api/rooms?q=CTI

# Get full detail for a room
GET /api/rooms/cmnhlgr9y001grovs9cam5qc4

# Check if room is free right now
GET /api/rooms/cmnhlgr9y001grovs9cam5qc4/availability

# Get this week's timetable for a room
GET /api/rooms/cmnhlgr9y001grovs9cam5qc4/timetable

# Paginate — page 3, 50 rooms per page
GET /api/rooms?page=3&limit=50
```
