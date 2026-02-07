# Quick Start Guide

## Installation & Setup

```bash
# Navigate to project directory
cd sell-waste-today

# Install dependencies
npm install

# Run tests (no server required)
node test.js

# Start the server
npm start
```

## Testing the API

### Option 1: Using the Test Script (Recommended)
```bash
node test.js
```
This runs 4 test cases and shows the complete request/response flow.

### Option 2: Using curl (When Server is Running)

**Start the server:**
```bash
npm start
```

**Make a request:**
```bash
curl -X POST http://localhost:3000/api/sell-waste-today \
  -H "Content-Type: application/json" \
  -d @test-request.json
```

Or with inline JSON:
```bash
curl -X POST http://localhost:3000/api/sell-waste-today \
  -H "Content-Type: application/json" \
  -d '{
    "companyId": "TEST-123",
    "companySize": "SME",
    "industry": "retail",
    "riskAppetite": "cost",
    "wasteItems": [
      {
        "material": "cardboard",
        "quantity": 500,
        "unit": "kg",
        "location": {
          "lat": 40.7128,
          "lon": -74.0060,
          "address": "123 Main St, New York, NY"
        }
      }
    ]
  }'
```

### Option 3: Using Postman/Insomnia

1. Method: `POST`
2. URL: `http://localhost:3000/api/sell-waste-today`
3. Headers: `Content-Type: application/json`
4. Body: Use the JSON from `test-request.json`

## Expected Response

```json
{
  "requestId": "REQ-1770491188784-545ef38",
  "status": "completed",
  "messages": [
    {
      "layer": "layer1",
      "title": "Layer 1: Global Context Intelligence Agent",
      "text": "Getting layer 1 global context. Managing global supply and demand signals, logistics capacity, waste hotspots, and sustainability factors.",
      "timestamp": "2026-02-07T19:06:28.784Z"
    },
    {
      "layer": "layer2",
      "title": "Layer 2: Personalized Decision Agent",
      "text": "Adapting decisions based on company size, risk appetite, industry, and historical behavior.",
      "timestamp": "2026-02-07T19:06:28.785Z"
    },
    {
      "layer": "optimization",
      "title": "Optimization and Pooling",
      "text": "Optimizing for profit and pooling. Generating pickup route and carrier allocation.",
      "timestamp": "2026-02-07T19:06:28.785Z"
    },
    {
      "layer": "final",
      "title": "Pickup Scheduled",
      "text": "Pickup will happen today.",
      "timestamp": "2026-02-07T19:06:28.785Z"
    }
  ],
  "pickup": {
    "scheduled": true,
    "date": "2026/02/07",
    "route": {
      "routeId": "ROUTE-1770491188785-6bzlkav",
      "etaMinutes": 90,
      "stops": [
        {
          "address": "450 Broadway, New York, NY 10013",
          "expectedQuantity": 350
        }
      ]
    }
  }
}
```

## What Happens Behind the Scenes

1. **Validation** - Checks required fields and enums
2. **Layer 1 (Global Context)** - Analyzes world-level factors
3. **Layer 2 (Personalization)** - Adapts to company profile
4. **Optimization** - Generates pickup route
5. **Response** - Returns complete decision pipeline

## Key Features

✅ **Always Works** - Deterministic placeholders ensure 100% uptime  
✅ **Clear Structure** - Every response follows the same format  
✅ **Extensible** - Each layer has clear TODO markers for AI integration  
✅ **No Dependencies** - Works offline, no database required  
✅ **Type Safe** - Strict validation on all inputs  

## Next Steps

1. **Review the code** - Check `services/` for the three layers
2. **Read ARCHITECTURE.md** - Understand the system design
3. **Modify test.js** - Add your own test cases
4. **Plan AI integration** - Look for TODO comments in service files

## Troubleshooting

**Port already in use?**
```bash
PORT=4000 npm start
```

**Dependencies not installing?**
- Check your internet connection
- Try: `npm install --verbose`

**API not responding?**
- Verify server is running: `curl http://localhost:3000/health`
- Check console for error messages

## Contact

For questions about the architecture or integration strategy, refer to ARCHITECTURE.md.
