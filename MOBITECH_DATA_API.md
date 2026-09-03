# Mobitech Diagnostic Data API

These endpoints read and update diagnostic data by `testId`.

## Get Mobitech Data

### Endpoint

```http
POST /get-mobitech-data
```

### Required body

```json
{
  "testId": "TEST_ID"
}
```

`testId` is required. The endpoint returns the diagnostic values using the public keys listed below.

## Update Mobitech Data

### Endpoint

```http
PATCH /update-mobitech-data
```

### Required body

```json
{
  "testId": "TEST_ID",
  "sets": [
    {
      "key": "frontCamera",
      "value": "Working"
    },
    {
      "key": "multiTouch",
      "value": "Passed"
    },
    {
      "key": "isSimCarWorking",
      "value": true
    }
  ]
}
```

Both `testId` and `sets` are required. `sets` must be a non-empty array.

The frontend sends only the public `key`. The server determines the exact database field and inner JSON property from the fixed mapping below.

## Accepted Update Keys

All diagnostic values must have a string `value`. An item with an unknown key or a non-string value is ignored.

| Request key | Database JSON field | Inner JSON property | Value type |
| --- | --- | --- | --- |
| `bluetooth` | `bluetoothTest` | `status` | string |
| `gps` | `gpsTest` | `status` | string |
| `wifi` | `wifiTest` | `status` | string |
| `proximitySensor` | `proximityTest` | `status` | string |
| `multiTouch` | `screenTest` | `multiTouchPassed` | string |
| `screenCalibration` | `screenTest` | `status` | string |
| `speaker` | `speakerTest` | `status` | string |
| `earReceiver` | `earpieceTest` | `status` | string |
| `microphone` | `microphoneTest` | `status` | string |
| `frontCamera` | `cameraTest` | `frontCameraStatus` | string |
| `backCamera` | `cameraTest` | `backCameraStatus` | string |
| `fingerprint` | `fingerprintTest` | `status` | string |
| `chargingPort` | `usbPortTest` | `status` | string |
| `volumeButtons` | `volumeKeysTest` | `status` | string |
| `powerButton` | `powerButtonTest` | `status` | string |
| `screenDiscoloration` | `screenDiscolorationTest` | `status` | string |
| `vibration` | `vibrationTest` | `status` | string |
| `audioJack` | `audioJackTest` | `status` | string |
| `isSimCarWorking` | `isSimCarWorking` | database field itself | boolean |

## Exact Update Examples

### Front camera

Request item:

```json
{
  "key": "frontCamera",
  "value": "Working"
}
```

The server updates the inner property, not a new top-level field:

```json
{
  "cameraTest": {
    "frontCameraStatus": "Working"
  }
}
```

Existing properties inside `cameraTest` are preserved.

### Multi-touch

```json
{
  "key": "multiTouch",
  "value": "Passed"
}
```

The server updates:

```json
{
  "screenTest": {
    "multiTouchPassed": "Passed"
  }
}
```

### SIM card

`isSimCarWorking` is the only update key whose value must be boolean:

```json
{
  "key": "isSimCarWorking",
  "value": true
}
```

This updates the scalar database field `isSimCarWorking`. It is returned by the GET endpoint as `sim`, with `true` represented as `Working` and `false` represented as `Not Working`.

## Successful Response

The PATCH endpoint returns HTTP `200` and the updated diagnostics record:

```json
{
  "success": true,
  "message": "Mobitech data updated successfully.",
  "data": {}
}
```

## Validation Responses

- `400` when `testId` is missing.
- `400` when `sets` is missing, is not an array, or is empty.
- `400` when no item in `sets` has a valid key and the correct value type.
- `404` when no diagnostics record exists for `testId`.
- `500` when an unexpected server error occurs.
