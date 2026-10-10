import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (_e) {
  // Ignore in environments where setDefaultResultOrder is unsupported
}
import { env } from '../config/env.js';
import { CACHE_POLICY } from '../cache/cachePolicy.js';
import { getExplainCacheKey } from '../cache/cacheKey.js';
import { cacheStore } from '../cache/memoryStore.js';
import { singleFlight } from '../cache/singleFlight.js';

/**
 * Pure deterministic fallback generator.
 * Executed when Gemini API is unconfigured, rate-limited, timed-out, or unreachable.
 * Ensures zero disruption to user journey discovery.
 *
 * @param {Object} data
 * @returns {{ explanation: string, keyTakeaways: string[] }}
 */
export function generateDeterministicExplanation(data) {
  const {
    trainNumber,
    trainName = '',
    fromStation,
    toStation,
    coverageStatus = 'FULL_JOURNEY',
    coveragePercent = 100,
    allocatedBerths = [],
    cohesion,
    travelClass = '3A',
  } = data;

  const count = allocatedBerths.length || 1;
  const isFullJourney = coverageStatus === 'FULL_JOURNEY' || coveragePercent >= 100;
  const isPartial = !isFullJourney && (coverageStatus === 'PARTIAL_JOURNEY' || (coveragePercent > 0 && coveragePercent < 100));

  let explanation = '';
  const keyTakeaways = [];

  if (isFullJourney) {
    if (count === 1) {
      const b = allocatedBerths[0] || {};
      const berthDesc = b.berthNumber ? `Berth ${b.berthNumber} (${b.berthType || 'Berth'}) in Coach ${b.coach || 'coach'}` : 'This berth';
      explanation = `${berthDesc} is fully vacant for your entire journey on train ${trainNumber} ${trainName} from ${fromStation} to ${toStation}. You have unbroken 100% route coverage without any mid-journey seat shifts.`;
      keyTakeaways.push('Complete 100% route coverage from origin to destination.');
      keyTakeaways.push(`Secured in ${b.coach || 'coach'} (${b.berthType || travelClass} preference).`);
      keyTakeaways.push('Standard IRCTC advance reservation rules apply.');
    } else if (count === 2 && allocatedBerths[0]?.availableTo && allocatedBerths[0].availableTo === allocatedBerths[1]?.availableFrom) {
      const b1 = allocatedBerths[0];
      const b2 = allocatedBerths[1];
      const transit = b1.availableTo;
      explanation = `Continuous end-to-end journey confirmed on train ${trainNumber} from ${fromStation} to ${toStation} by combining 2 vacant legs: Coach ${b1.coach} Berth ${b1.berthNumber} (${fromStation} to ${transit}) and Coach ${b2.coach} Berth ${b2.berthNumber} (${transit} to ${toStation}). Switch seats at ${transit}.`;
      keyTakeaways.push(`100% route coverage from ${fromStation} to ${toStation} with 1 seat change.`);
      keyTakeaways.push(`Leg 1: ${b1.coach}-${b1.berthNumber} (${fromStation} → ${transit}).`);
      keyTakeaways.push(`Leg 2: ${b2.coach}-${b2.berthNumber} (${transit} → ${toStation}).`);
    } else {
      const coach = allocatedBerths[0]?.coach || 'selected coach';
      const cohesionText =
        cohesion === 'SAME_BAY'
          ? 'all seated within the same physical bay'
          : cohesion === 'ADJACENT_BAYS'
          ? 'seated in adjacent bays within the same coach'
          : 'seated in the same coach';

      explanation = `All ${count} passengers have full-journey coverage on train ${trainNumber} in Coach ${coach}, ${cohesionText}. The entire party can travel together between ${fromStation} and ${toStation} with zero seat relocations.`;
      keyTakeaways.push(`${count} passengers confirmed with 100% journey coverage.`);
      keyTakeaways.push(`Group cohesion: ${cohesionText}.`);
      keyTakeaways.push(`Class ${travelClass} coach ${coach}.`);
    }
  } else if (isPartial) {
    const b = allocatedBerths[0] || {};
    const segFrom = data.availableFrom || b.availableFrom || fromStation;
    const segTo = data.availableTo || b.availableTo || toStation;
    explanation = `Notice: This berth provides partial journey coverage (${coveragePercent}%) on train ${trainNumber} from ${segFrom} to ${segTo}. The berth is occupied for the remaining segment, requiring alternative arrangements for that leg.`;
    keyTakeaways.push(`Covers ${coveragePercent}% of your trip (${segFrom} to ${segTo}).`);
    keyTakeaways.push('Berth is occupied for remaining stops; passenger shift required.');
    keyTakeaways.push('Consider searching alternative trains for continuous journey.');
  } else {
    explanation = `Train ${trainNumber} (${fromStation} to ${toStation}) does not have continuous vacant berths in class ${travelClass} for your selected date. Check adjacent dates or alternate trains along this corridor.`;
    keyTakeaways.push('Zero contiguous vacancies detected for this travel segment.');
    keyTakeaways.push('Inspect alternative trains or alternate travel classes.');
  }

  const tip =
    keyTakeaways[keyTakeaways.length - 1] ||
    'Verify final charting status 4 hours prior to scheduled departure.';

  return {
    explanation,
    summary: explanation,
    keyTakeaways,
    highlights: keyTakeaways,
    tip,
  };
}

/**
 * Builds structured prompt for Gemini rewriting
 * @param {Object} data
 * @returns {string}
 */
function buildGeminiPrompt(data) {
  const {
    trainNumber,
    trainName = '',
    fromStation,
    toStation,
    journeyDate = '',
    travelClass = '3A',
    coverageStatus = 'FULL_JOURNEY',
    coveragePercent = 100,
    allocatedBerths = [],
    cohesion = '',
    departureTime = '',
    arrivalTime = '',
  } = data;

  const berthsSummary = allocatedBerths
    .map((b) => `Coach ${b.coach} Berth ${b.berthNumber} (${b.berthType || 'Berth'})`)
    .join('; ');

  return `You are RailPeek's railway journey advisor. Summarize the following verified Indian Railways availability data into a concise, polite, natural language explanation for the passenger.

CRITICAL RULES:
1. Never contradict the verified data. Never say a berth is free if coverage is partial or occupied.
2. Keep the summary concise: strictly 2 to 3 sentences.
3. Do NOT use emojis.
4. Highlight practical passenger convenience (e.g. unbroken travel, family sitting together, or specific partial segment warnings).

DATA:
- Train: ${trainNumber} ${trainName}
- Route: ${fromStation} to ${toStation}
- Journey Date: ${journeyDate || 'Scheduled date'}
- Timings: Departure ${departureTime || 'Scheduled'}, Arrival ${arrivalTime || 'Scheduled'}
- Class: ${travelClass}
- Coverage Status: ${coverageStatus} (${coveragePercent}% coverage)
- Group Cohesion: ${cohesion || 'Single passenger'}
- Allocated Berths: ${berthsSummary || 'None'}

Please provide your response in valid JSON format with exactly two keys:
{
  "explanation": "2-3 sentence conversational summary without emojis",
  "keyTakeaways": ["concise tip 1", "concise tip 2", "concise tip 3"]
}`;
}

/**
 * Cleans potential markdown fencing from Gemini JSON outputs
 * @param {string} text
 * @returns {string}
 */
function cleanJsonOutput(text) {
  if (!text) return '';
  return text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

/**
 * Generates an AI-assisted explanation for a journey option or berth.
 * Gracefully falls back to deterministic rules if Gemini is unavailable.
 *
 * @param {Object} queryData
 * @returns {Promise<Object>}
 */
export async function explainJourneyOption(queryData) {
  const cacheKey = getExplainCacheKey({
    trainNumber: queryData.trainNumber,
    from: queryData.fromStation,
    to: queryData.toStation,
    date: queryData.journeyDate,
    travelClass: queryData.travelClass,
    allocatedBerths: queryData.allocatedBerths,
  });

  // 1. Check in-memory/MongoDB cache first
  const cached = await cacheStore.get(cacheKey);
  if (cached && cached.data && !cached.isStale) {
    return {
      ...cached.data,
      cached: true,
    };
  }

  // 2. SingleFlight Coalescing
  const { data: result } = await singleFlight.do(cacheKey, async () => {
    // If no Gemini API key configured, use deterministic fallback directly
    if (!env.GEMINI_API_KEY) {
      const fallback = generateDeterministicExplanation(queryData);
      const res = {
        summary: fallback.explanation,
        explanation: fallback.explanation,
        highlights: fallback.keyTakeaways,
        keyTakeaways: fallback.keyTakeaways,
        tip: fallback.tip,
        isAiGenerated: false,
        source: 'deterministic_fallback',
        model: 'deterministic-rules',
        generatedAt: new Date().toISOString(),
      };
      await cacheStore.set(cacheKey, res, CACHE_POLICY.aiExplanation.ttlSeconds);
      return res;
    }

    const candidateModels = [env.GEMINI_MODEL, 'gemini-flash-latest'].filter(
      (m, i, arr) => Boolean(m) && arr.indexOf(m) === i
    );

    let parsed = null;
    let successfulModel = null;

    for (const model of candidateModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000); // 9s timeout for thinking model

        const prompt = buildGeminiPrompt(queryData);
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1500,
              topP: 0.8,
              responseMimeType: 'application/json',
            },
          }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`[RailPeek Gemini] Model ${model} responded with HTTP ${response.status}.`);
          continue;
        }

        const responseJson = await response.json();
        const rawText = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawText) {
          parsed = JSON.parse(cleanJsonOutput(rawText));
          successfulModel = model;
          break;
        }
      } catch (err) {
        console.warn(`[RailPeek Gemini] Error with model ${model}: ${err.message}`);
      }
    }

    const fallback = generateDeterministicExplanation(queryData);

    if (parsed && successfulModel) {
      const explanationText =
        parsed.summary || parsed.explanation || fallback.explanation;
      const takeaways =
        (Array.isArray(parsed.highlights) && parsed.highlights.length > 0)
          ? parsed.highlights
          : (Array.isArray(parsed.keyTakeaways) && parsed.keyTakeaways.length > 0)
          ? parsed.keyTakeaways
          : fallback.keyTakeaways;
      const travelTip =
        parsed.tip || takeaways[takeaways.length - 1] || fallback.tip;

      const res = {
        summary: explanationText,
        explanation: explanationText,
        highlights: takeaways,
        keyTakeaways: takeaways,
        tip: travelTip,
        isAiGenerated: true,
        source: 'gemini',
        model: successfulModel,
        generatedAt: new Date().toISOString(),
      };

      await cacheStore.set(cacheKey, res, CACHE_POLICY.aiExplanation.ttlSeconds);
      return res;
    }

    // Deterministic fallback if Gemini unreached or parsing failed
    console.warn('[RailPeek Gemini] Using deterministic fallback.');
    const res = {
      summary: fallback.explanation,
      explanation: fallback.explanation,
      highlights: fallback.keyTakeaways,
      keyTakeaways: fallback.keyTakeaways,
      tip: fallback.tip,
      isAiGenerated: false,
      source: 'deterministic_fallback',
      model: 'deterministic-rules',
      generatedAt: new Date().toISOString(),
    };

    await cacheStore.set(cacheKey, res, CACHE_POLICY.aiExplanation.ttlSeconds);
    return res;
  });

  return result;
}
