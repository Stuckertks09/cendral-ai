// src/core/events/eventSeverity.js
import OpenAI from 'openai';

let client = null;

function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

/**
 * Derive neutral feature inputs from the raw event.
 * This is intentionally generic: no defense-only logic.
 */
function deriveSeverityInputs(event) {
  const text = (event.rawText || '').toLowerCase();

  // 0–1: how big / disruptive it seems
  let impactMagnitude = 0.4;
  if (/(war|default|collapse|crisis|strike|blockade|massive)/.test(text)) {
    impactMagnitude = 0.7;
  }
  if (/(minor|small|local|routine|limited)/.test(text)) {
    impactMagnitude = 0.2;
  }

  // 0–1: local → global
  let scope = 0.3;
  if (/(global|worldwide|international)/.test(text)) scope = 0.8;
  else if (/(regional|region|bloc|alliance)/.test(text)) scope = 0.6;

  // 0–1: immediate impact vs long-term
  let immediacy = 0.4;
  if (/(today|immediately|sudden|overnight|now)/.test(text)) immediacy = 0.8;
  if (/(plans to|by 2030|over the next decade)/.test(text)) immediacy = 0.2;

  // 0–1: reversibility (1 = reversible, 0 = irreversible)
  let reversibility = 0.6;
  if (/(irreversible|permanent|irreparable)/.test(text)) reversibility = 0.2;
  if (/(temporary|suspension|trial)/.test(text)) reversibility = 0.8;

  // 0–1: novelty; we start neutral and adjust via memory later
  let novelty = 0.5;

  // -1..1: escalation direction
  let escalationFactor = 0;
  if (/(attack|strike|sanction|blockade|crackdown|raid)/.test(text)) {
    escalationFactor += 0.6;
  }
  if (/(ceasefire|truce|withdrawal|peace deal|agreement|de-escalation)/.test(text)) {
    escalationFactor -= 0.6;
  }

  return {
    impactMagnitude,
    scope,
    immediacy,
    reversibility,
    novelty,
    escalationFactor,
  };
}

/**
 * Pure rule-based severity on 0–1 scale using derived inputs + sentiment.
 */
export function calculateRuleBasedSeverity(event) {
  const inputs = deriveSeverityInputs(event);
  const sentiment = event.parsed?.sentiment ?? 0;

  // Base severity primarily from impact & scope
  let base =
    inputs.impactMagnitude * (0.5 + inputs.scope * 0.5); // 0.25–1.0-ish

  // Escalation: only positive escalation increases severity
  if (inputs.escalationFactor > 0) {
    base += inputs.escalationFactor * 0.3;
  }

  // Strongly positive or negative sentiment = more impactful
  const sentimentIntensity = Math.abs(sentiment);
  base *= 0.7 + sentimentIntensity * 0.6; // up to ~1.3x

  // Irreversibility (lower reversibility => more severe)
  const irreversibility = 1 - inputs.reversibility; // 0–1
  base *= 0.8 + irreversibility * 0.4;

  return {
    inputs,
    ruleBasedSeverity: Math.max(0, Math.min(1, base)),
  };
}

/**
 * Ask the LLM to rate severity on 0–1 scale for this event, domain-agnostic.
 * `context` is optional: you can pass worldState summary, metrics, etc.
 */
export async function getLLMSeverity(event, context = null) {
  const c = getClient();

  const contextSnippet = context
    ? JSON.stringify(context, null, 2)
    : 'No additional context provided.';

  const prompt = `
You are an impartial risk analyst.

Event text:
"${event.rawText}"

Type: ${event.type || 'unknown'}
Domain: ${event.domain || 'unknown'}
Topic: ${event.topic || 'none'}

Optional context (JSON):
${contextSnippet}

Rate the *overall impact severity* of this event on a 0–1 scale:

0.0 = routine, minimal impact  
0.3 = notable but manageable  
0.5 = significant, requires active response  
0.7 = crisis-level, high escalation potential  
0.9 = near-systemic or conflict-level threshold  

Consider:
1. Scale of impact (who/how many are affected)
2. Escalation potential
3. Reversibility
4. Novelty / deviation from baseline

Return ONLY a number between 0 and 1, with up to 3 decimal places. No explanation.
  `.trim();

  const resp = await c.responses.create({
    model: 'gpt-4.1-mini',
    input: prompt,
  });

  const text =
    resp.output?.[0]?.content?.[0]?.text ??
    resp.output?.[0]?.content?.[0]?.output_text ??
    '';

  const value = parseFloat(String(text).trim());

  if (Number.isNaN(value)) {
    return 0.5;
  }
  return Math.max(0, Math.min(1, value));
}

/**
 * Dual-mode severity: rule-based + LLM, with novelty weighting if memory exists.
 * memory is optional and only needs a `findSimilar(text, topK)` method.
 */
export async function determineSeverity({
  event,
  context = null,
  memory = null,
}) {
  // 1) Rule-based
  const { inputs, ruleBasedSeverity } = calculateRuleBasedSeverity(event);

  // 2) LLM
  const llmSeverity = await getLLMSeverity(event, context);

  // 3) Novelty via semantic memory (if available)
  let noveltyScore = inputs.novelty;
  if (memory && typeof memory.findSimilar === 'function') {
    const similar = await memory.findSimilar(event.rawText, 5);
    // No similar events → more novel
    noveltyScore = !similar || similar.length === 0 ? 1.0 : 0.3;
  }

  // 4) Blend weights based on novelty
  const llmWeight = 0.3 + noveltyScore * 0.4; // 0.3–0.7
  const ruleWeight = 1 - llmWeight;

  const combined =
    llmSeverity * llmWeight + ruleBasedSeverity * ruleWeight;

  // Direction from escalationFactor
  let direction = 'neutral';
  if (inputs.escalationFactor > 0.15) direction = 'escalatory';
  if (inputs.escalationFactor < -0.15) direction = 'deescalatory';

  const magnitude = Math.max(0, Math.min(1, combined));

  return {
    magnitude,
    inputs,
    breakdown: {
      ruleBasedSeverity,
      llmSeverity,
      llmWeight,
      ruleWeight,
      noveltyScore,
      direction,
      modelVersion: 'severity-v1',
    },
  };
}
