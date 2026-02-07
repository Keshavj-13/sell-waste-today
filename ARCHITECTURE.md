# Sell Waste Today - Architecture Documentation

## System Overview

This is a **Hollow Intelligence System** - an API that functions end-to-end using deterministic placeholders while maintaining clear architectural seams for future AI integration.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                           │
│                POST /api/sell-waste-today                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VALIDATION LAYER                            │
│  ✓ companyId required                                           │
│  ✓ wasteItems non-empty                                         │
│  ✓ enum validation                                              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              LAYER 1: Global Context Intelligence                │
│                services/globalContextAgent.js                    │
│                                                                  │
│  Understands the World:                                         │
│  • Global supply & demand signals                               │
│  • Logistics routes & capacity                                  │
│  • Waste hotspots (overproduction, spoilage, dead stock)        │
│  • Sustainability factors (distance, consolidation)             │
│                                                                  │
│  [TODO: Replace with LLM/Market Intelligence Engine]            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│          LAYER 2: Personalized Decision Intelligence             │
│              services/personalizedDecisionAgent.js               │
│                                                                  │
│  Understands the User:                                          │
│  • Company size                                                 │
│  • Risk appetite (cost/reliability/sustainability)              │
│  • Industry vertical                                            │
│  • Past decision patterns                                       │
│                                                                  │
│  [TODO: Replace with LLM/Personalization Engine]                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│               OPTIMIZATION & POOLING LAYER                       │
│                   services/optimizer.js                          │
│                                                                  │
│  Combines Layer 1 + Layer 2:                                    │
│  • Profit maximization                                          │
│  • Route pooling optimization                                   │
│  • Carrier allocation                                           │
│  • ETA calculation                                              │
│                                                                  │
│  [TODO: Replace with VRP Solver/Optimization Engine]            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      RESPONSE ASSEMBLY                           │
│  • requestId generation                                         │
│  • Message timeline                                             │
│  • Pickup confirmation                                          │
│  • Route details                                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        JSON RESPONSE                             │
│              "Pickup will happen today."                         │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

```
sell-waste-today/
├── server.js                        # Express server entry point
├── package.json                     # Dependencies
├── test.js                          # Standalone test suite
├── test-request.json                # Example request
├── README.md                        # Usage documentation
│
├── routes/
│   └── sellWaste.js                 # POST /api/sell-waste-today handler
│
├── services/
│   ├── globalContextAgent.js        # Layer 1: World understanding
│   ├── personalizedDecisionAgent.js # Layer 2: User understanding
│   └── optimizer.js                 # Optimization & pooling
│
└── utils/
    └── idGenerator.js               # Request/Route ID generation
```

## Data Flow

### 1. Request Input
```json
{
  "companyId": "ACME-001",
  "companySize": "SME",
  "industry": "retail",
  "riskAppetite": "cost",
  "wasteItems": [
    {
      "material": "cardboard",
      "quantity": 350,
      "unit": "kg",
      "location": {
        "lat": 40.7128,
        "lon": -74.0060,
        "address": "450 Broadway, NY"
      }
    }
  ]
}
```

### 2. Layer 1 Output (Current: Static)
```javascript
{
  layer: 'layer1',
  title: 'Layer 1: Global Context Intelligence Agent',
  text: 'Getting layer 1 global context...',
  insights: {
    demandSignal: 'moderate',
    logisticsCapacity: 'available',
    wasteHotspots: ['retail overstock', 'seasonal surplus'],
    sustainabilityScore: 0.75
  }
}
```

### 3. Layer 2 Output (Current: Static)
```javascript
{
  layer: 'layer2',
  title: 'Layer 2: Personalized Decision Agent',
  text: 'Adapting decisions based on company profile...',
  personalizedFactors: {
    companySize: 'SME',
    industry: 'retail',
    riskAppetite: 'cost',
    recommendedStrategy: 'price-optimization',
    confidenceScore: 0.85
  }
}
```

### 4. Optimization Output (Current: Deterministic)
```javascript
{
  layer: 'optimization',
  title: 'Optimization and Pooling',
  text: 'Optimizing for profit and pooling...',
  optimizationMetrics: {
    profitScore: 0.82,
    poolingEfficiency: 0.78,
    routeOptimality: 0.91
  }
}

pickup: {
  scheduled: true,
  date: '2026/02/07',
  route: {
    routeId: 'ROUTE-1770491188785-6bzlkav',
    etaMinutes: 90,
    stops: [...]
  }
}
```

## Extension Strategy

### Phase 1: Current State (Deterministic Placeholders)
- ✅ Full API functionality without intelligence
- ✅ Consistent response structure
- ✅ Validation and error handling
- ✅ Clear architectural boundaries

### Phase 2: LLM Integration
Replace `TODO` markers in each service:

**globalContextAgent.js**
```javascript
// Current:
return staticContext;

// Future:
const llmResponse = await callLLM({
  prompt: `Analyze global waste market context for: ${JSON.stringify(requestData)}`,
  model: 'claude-sonnet-4'
});
return parseContextFromLLM(llmResponse);
```

**personalizedDecisionAgent.js**
```javascript
// Current:
return staticDecision;

// Future:
const llmResponse = await callLLM({
  prompt: `Generate personalized strategy for ${companyProfile}`,
  context: globalContext
});
return parseDecisionFromLLM(llmResponse);
```

### Phase 3: Optimization Engine Integration
**optimizer.js**
```javascript
// Current:
return mockRoute;

// Future:
const solution = await vrpSolver.solve({
  locations: wasteItems.map(i => i.location),
  constraints: {
    maxTime: 180,
    capacity: calculateTotalWeight(wasteItems)
  },
  objective: 'minimize-cost-maximize-pooling'
});
return formatOptimizedRoute(solution);
```

## Design Principles

1. **Determinism First**: Same input → same structure (predictable for testing)
2. **No External Dependencies**: Works offline, no database, no API calls
3. **Clear Seams**: Each `TODO` comment marks an integration point
4. **Layered Architecture**: Separation of concerns enables independent upgrades
5. **JSON In/Out**: Clean contract for API consumers
6. **Always Succeeds**: Never fails due to missing intelligence

## Future Enhancements

- **Real-time Market Data**: Integrate commodity pricing APIs
- **Historical Learning**: Store decisions in database for pattern recognition
- **Multi-objective Optimization**: Balance cost, sustainability, speed
- **Streaming Responses**: Server-sent events for layer-by-layer updates
- **A/B Testing Framework**: Compare deterministic vs AI-powered decisions

## Security Considerations (Future)

- API authentication (JWT tokens)
- Rate limiting per company
- Input sanitization (already basic validation)
- Audit logging of all decisions
- PII handling for location data

---

**Status**: Production-ready hollow system awaiting intelligence integration
