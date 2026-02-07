/**
 * Sell Waste Today Route Handler
 * 
 * Orchestrates the full decision pipeline:
 * 1. Validates input
 * 2. Calls Layer 1 (Global Context Intelligence Agent)
 * 3. Calls Layer 2 (Personalized Decision Agent)
 * 4. Calls Optimization Layer
 * 5. Assembles and returns response
 */

const express = require('express');
const router = express.Router();

const { generateRequestId } = require('../utils/idGenerator');
const { analyzeGlobalContext } = require('../services/globalContextAgent');
const { generatePersonalizedDecision } = require('../services/personalizedDecisionAgent');
const { optimizePickup } = require('../services/optimizer');
const { normalizeRequest } = require('../utils/requestNormalizer');
const { createRng } = require('../utils/random');

// Validation helper
function validateRequest(body) {
  const errors = [];
  
  // companyId is mandatory
  if (!body.companyId) {
    errors.push('companyId is required');
  }
  
  // wasteItems must exist and not be empty
  if (!body.wasteItems || !Array.isArray(body.wasteItems) || body.wasteItems.length === 0) {
    errors.push('wasteItems must be a non-empty array');
  }
  
  // Validate enum values if present
  if (body.companySize && !['SME', 'enterprise', 'Small', 'Medium', 'Large'].includes(body.companySize)) {
    errors.push('companySize must be either "SME", "enterprise", "Small", "Medium", or "Large"');
  }
  
  if (body.industry && ![
    'retail',
    'pharma',
    'FMCG',
    'manufacturing',
    'other',
    'hospitality',
    'healthcare',
    'food_service',
    'construction',
    'textiles',
    'electronics',
    'automotive'
  ].includes(body.industry)) {
    errors.push('industry must be one of: retail, pharma, FMCG, manufacturing, other, hospitality, healthcare, food_service, construction, textiles, electronics, automotive');
  }
  
  if (body.riskAppetite && !['cost', 'reliability', 'sustainability', 'balanced', 'compliance'].includes(body.riskAppetite)) {
    errors.push('riskAppetite must be one of: cost, reliability, sustainability, balanced, compliance');
  }
  
  return errors;
}

// POST /api/sell-waste-today
router.post('/sell-waste-today', async (req, res) => {
  try {
    // Generate unique request ID
    const requestId = generateRequestId();

    // Seeded RNG for deterministic variability per request
    const rng = createRng(requestId);

    // Normalize request to ensure defaults when fields are missing
    const { request: normalizedRequest, warnings } = normalizeRequest(req.body, requestId);

    // Validate request
    const validationErrors = validateRequest(normalizedRequest);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        reasons: validationErrors
      });
    }
    
    // Execute the decision pipeline in order
    
    // Layer 1: Global Context Intelligence Agent
    const globalContext = await analyzeGlobalContext(normalizedRequest, rng);
    
    // Layer 2: Personalized Decision Agent
    const personalizedDecision = await generatePersonalizedDecision(normalizedRequest, globalContext, rng);
    
    // Optimization Layer
    const { optimization, pickup } = optimizePickup(normalizedRequest, globalContext, personalizedDecision, rng);
    
    // Final confirmation message
    const finalMessage = {
      layer: 'final',
      title: 'Pickup Scheduled',
      text: 'Pickup will happen today.',
      timestamp: new Date().toISOString()
    };
    
    // Assemble messages in strict order
    const messages = [
      globalContext,
      personalizedDecision,
      optimization,
      finalMessage
    ];
    
    // Build response
    const response = {
      requestId,
      status: 'completed',
      messages,
      pickup,
      warnings: warnings.length > 0 ? warnings : undefined
    };
    
    return res.json(response);
    
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
