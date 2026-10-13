/**
 * Client-Side Coach Layout & Berth Evaluator
 * Formats authentic IRCTC coachComposition (bdd) and vacantBerth (vbd)
 * data directly into the schema required by CoachMap, TrainBogieStrip,
 * and VacantBerthsGrid without relying on cloud backends.
 */

export function getCoachClass(coachName) {
  if (!coachName) return '3A';
  const c = String(coachName).toUpperCase().trim();
  if (c.startsWith('H')) return '1A';
  if (c.startsWith('A')) return '2A';
  if (c.startsWith('B')) return '3A';
  if (c.startsWith('M')) return '3E';
  if (c.startsWith('S')) return 'SL';
  if (c.startsWith('D') || c.startsWith('C') || c.startsWith('E')) return '2S';
  return '3A';
}

function get3ABerthInfo(num) {
  const bayNumber = Math.ceil(num / 8);
  const rem = num % 8;
  switch (rem) {
    case 1:
    case 4:
      return { berthType: 'LOWER', bayNumber, position: 'MAIN_LOWER' };
    case 2:
    case 5:
      return { berthType: 'MIDDLE', bayNumber, position: 'MAIN_MIDDLE' };
    case 3:
    case 6:
      return { berthType: 'UPPER', bayNumber, position: 'MAIN_UPPER' };
    case 7:
      return { berthType: 'SIDE_LOWER', bayNumber, position: 'SIDE_LOWER' };
    case 0:
      return { berthType: 'SIDE_UPPER', bayNumber, position: 'SIDE_UPPER' };
    default:
      return { berthType: 'LOWER', bayNumber, position: 'UNKNOWN' };
  }
}

function get2ABerthInfo(num) {
  const bayNumber = Math.ceil(num / 6);
  const rem = num % 6;
  switch (rem) {
    case 1:
    case 3:
      return { berthType: 'LOWER', bayNumber, position: 'MAIN_LOWER' };
    case 2:
    case 4:
      return { berthType: 'UPPER', bayNumber, position: 'MAIN_UPPER' };
    case 5:
      return { berthType: 'SIDE_LOWER', bayNumber, position: 'SIDE_LOWER' };
    case 0:
      return { berthType: 'SIDE_UPPER', bayNumber, position: 'SIDE_UPPER' };
    default:
      return { berthType: 'LOWER', bayNumber, position: 'UNKNOWN' };
  }
}

function get1ABerthInfo(num) {
  if (num >= 1 && num <= 4) {
    return {
      berthType: num % 2 === 1 ? 'LOWER' : 'UPPER',
      bayNumber: 1,
      position: num <= 2 ? 'CABIN_LEFT' : 'CABIN_RIGHT',
      bayLabel: 'Cabin A',
      bayType: 'CABIN',
    };
  }
  if (num >= 5 && num <= 8) {
    return {
      berthType: num % 2 === 1 ? 'LOWER' : 'UPPER',
      bayNumber: 2,
      position: num <= 6 ? 'CABIN_LEFT' : 'CABIN_RIGHT',
      bayLabel: 'Cabin B',
      bayType: 'CABIN',
    };
  }
  if (num >= 9 && num <= 10) {
    return {
      berthType: num === 9 ? 'LOWER' : 'UPPER',
      bayNumber: 3,
      position: 'COUPE_MAIN',
      bayLabel: 'Coupe C',
      bayType: 'COUPE',
    };
  }
  if (num >= 11 && num <= 14) {
    return {
      berthType: num % 2 === 1 ? 'LOWER' : 'UPPER',
      bayNumber: 4,
      position: num <= 12 ? 'CABIN_LEFT' : 'CABIN_RIGHT',
      bayLabel: 'Cabin D',
      bayType: 'CABIN',
    };
  }
  if (num >= 15 && num <= 18) {
    return {
      berthType: num % 2 === 1 ? 'LOWER' : 'UPPER',
      bayNumber: 5,
      position: num <= 16 ? 'CABIN_LEFT' : 'CABIN_RIGHT',
      bayLabel: 'Cabin E',
      bayType: 'CABIN',
    };
  }
  if (num >= 19 && num <= 20) {
    return {
      berthType: num === 19 ? 'LOWER' : 'UPPER',
      bayNumber: 6,
      position: 'COUPE_MAIN',
      bayLabel: 'Coupe F',
      bayType: 'COUPE',
    };
  }
  return {
    berthType: num % 2 === 1 ? 'LOWER' : 'UPPER',
    bayNumber: 7,
    position: 'COUPE_MAIN',
    bayLabel: 'Coupe G',
    bayType: 'COUPE',
  };
}

function get3EBerthInfo(num) {
  const bayNumber = Math.ceil(num / 9);
  const rem = num % 9;
  switch (rem) {
    case 1:
    case 4:
      return { berthType: 'LOWER', bayNumber, position: 'MAIN_LOWER' };
    case 2:
    case 5:
      return { berthType: 'MIDDLE', bayNumber, position: 'MAIN_MIDDLE' };
    case 3:
    case 6:
      return { berthType: 'UPPER', bayNumber, position: 'MAIN_UPPER' };
    case 7:
      return { berthType: 'SIDE_LOWER', bayNumber, position: 'SIDE_LOWER' };
    case 8:
      return { berthType: 'SIDE_MIDDLE', bayNumber, position: 'SIDE_MIDDLE' };
    case 0:
      return { berthType: 'SIDE_UPPER', bayNumber, position: 'SIDE_UPPER' };
    default:
      return { berthType: 'LOWER', bayNumber, position: 'UNKNOWN' };
  }
}

export function generateBaseCoachBerths(coachName, travelClass = '3A', count = 72) {
  const cls = travelClass || getCoachClass(coachName);
  const total = count || (cls === '1A' ? 24 : cls === '2A' ? 54 : cls === '3E' ? 83 : 72);
  const berths = [];

  for (let i = 1; i <= total; i++) {
    let info;
    if (cls === '1A') info = get1ABerthInfo(i);
    else if (cls === '2A') info = get2ABerthInfo(i);
    else if (cls === '3E') info = get3EBerthInfo(i);
    else info = get3ABerthInfo(i);

    berths.push({
      berthNumber: i,
      berthType: info.berthType,
      bayNumber: info.bayNumber,
      bayLabel: info.bayLabel || (cls === '1A' ? `Cabin ${info.bayNumber}` : `Bay ${info.bayNumber}`),
      bayType: info.bayType || 'MAIN_BAY',
      position: info.position,
      coach: coachName,
      class: cls,
      status: 'UNAVAILABLE',
      statusLabel: 'Booked / Occupied',
      coveragePercent: 0,
      occupiedSegments: [],
      availableSegments: [],
      vacantSegments: [],
    });
  }

  return berths;
}

export function groupBerthsIntoBays(berths, travelClass = '3A') {
  const baysMap = new Map();

  for (const berth of berths) {
    const bayNum = berth.bayNumber;
    if (!baysMap.has(bayNum)) {
      baysMap.set(bayNum, {
        bayNumber: bayNum,
        bayLabel: berth.bayLabel || (travelClass === '1A' ? `Cabin ${bayNum}` : `Bay ${bayNum}`),
        bayType: berth.bayType || (travelClass === '1A' ? 'CABIN' : 'MAIN_BAY'),
        mainLeft: [],
        mainRight: [],
        side: [],
        berths: [],
      });
    }

    const bay = baysMap.get(bayNum);
    bay.berths.push(berth);

    if (travelClass === '1A') {
      if (berth.position === 'CABIN_LEFT' || berth.position === 'COUPE_MAIN') {
        bay.mainLeft.push(berth);
      } else {
        bay.mainRight.push(berth);
      }
    } else if (travelClass === '2A') {
      if (berth.berthType === 'SIDE_LOWER' || berth.berthType === 'SIDE_UPPER') {
        bay.side.push(berth);
      } else {
        const rem = berth.berthNumber % 6;
        if (rem === 1 || rem === 2) {
          bay.mainLeft.push(berth);
        } else {
          bay.mainRight.push(berth);
        }
      }
    } else {
      if (berth.berthType === 'SIDE_LOWER' || berth.berthType === 'SIDE_UPPER' || berth.berthType === 'SIDE_MIDDLE') {
        bay.side.push(berth);
      } else {
        const rem = berth.berthNumber % 8;
        if (rem >= 1 && rem <= 3) {
          bay.mainLeft.push(berth);
        } else {
          bay.mainRight.push(berth);
        }
      }
    }
  }

  return Array.from(baysMap.values());
}

/**
 * Parses IRCTC coachComposition (bdd) into complete CoachMap data
 */
export function buildCoachLayoutFromBdd({
  bddList = [],
  trainNo,
  coachName,
  cls,
  journeyDate,
  fromStation,
  toStation,
  trainName = '',
  availableCoaches = [],
}) {
  const safeBddList = Array.isArray(bddList) ? bddList : [];
  const normClass = cls || getCoachClass(coachName);
  const totalBerths = safeBddList.length > 0 ? safeBddList.length : (normClass === '1A' ? 24 : normClass === '2A' ? 54 : 72);
  const baseBerths = generateBaseCoachBerths(coachName, normClass, totalBerths);

  // Map of berthNo -> IRCTC bdd record
  const bddMap = new Map();
  for (const item of safeBddList) {
    if (item.berthNo) {
      bddMap.set(Number(item.berthNo), item);
    }
  }

  let fullJourneyCount = 0;
  let partialCount = 0;
  let unavailableCount = 0;

  const evaluatedBerths = baseBerths.map((b) => {
    const rawBdd = bddMap.get(b.berthNumber);
    if (!rawBdd) {
      unavailableCount++;
      return b;
    }

    const bsd = Array.isArray(rawBdd.bsd) ? rawBdd.bsd : [];
    if (bsd.length === 0) {
      // No split data; fallback to enabled state
      if (rawBdd.enable === false) {
        unavailableCount++;
        return b;
      }
      fullJourneyCount++;
      return {
        ...b,
        status: 'FULL_JOURNEY',
        statusLabel: 'Vacant (Available)',
        coveragePercent: 100,
        isVacant: true,
        vacant: true,
        available: true,
        suitabilityReason: 'Vacant for complete journey.',
      };
    }

    // Check splits for vacant status (occupancy === false means VACANT)
    const vacantSplits = bsd.filter((s) => s.occupancy === false);
    const occupiedSplits = bsd.filter((s) => s.occupancy === true);

    if (vacantSplits.length === 0) {
      unavailableCount++;
      return {
        ...b,
        status: 'UNAVAILABLE',
        statusLabel: 'Booked / Occupied',
        coveragePercent: 0,
        isVacant: false,
        vacant: false,
        available: false,
        occupiedSegments: occupiedSplits.map((s) => ({ from: s.from, to: s.to })),
        suitabilityReason: 'Reserved/Occupied by passengers.',
      };
    }

    const isFull = occupiedSplits.length === 0;
    const firstVac = vacantSplits[0];
    const lastVac = vacantSplits[vacantSplits.length - 1];
    const availFrom = firstVac.from;
    const availTo = lastVac.to;
    const coveragePercent = isFull ? 100 : Math.round((vacantSplits.length / bsd.length) * 100);

    if (isFull) fullJourneyCount++;
    else partialCount++;

    const availSegs = vacantSplits.map((s) => ({
      from: s.from,
      to: s.to,
      splitNo: s.splitNo,
    }));
    const segText = availSegs.map((s) => `${s.from} ➔ ${s.to}`).join(', ');

    return {
      ...b,
      status: isFull ? 'FULL_JOURNEY' : 'PARTIAL_JOURNEY',
      statusLabel: isFull ? 'Vacant (Available)' : `Vacant (${availFrom} ➔ ${availTo})`,
      coveragePercent,
      availableFrom: availFrom,
      availableTo: availTo,
      isVacant: true,
      vacant: true,
      available: true,
      availableSegments: availSegs,
      vacantSegments: availSegs,
      occupiedSegments: occupiedSplits.map((s) => ({ from: s.from, to: s.to })),
      suitabilityReason: isFull
        ? `Fully vacant across your entire travel route.`
        : `Vacant on segments: ${segText} (${coveragePercent}% journey).`,
    };
  });

  const bays = groupBerthsIntoBays(evaluatedBerths, normClass);
  const availableTotal = fullJourneyCount + partialCount;
  const vacancyRate = totalBerths > 0 ? Math.round((availableTotal / totalBerths) * 100) : 0;

  return {
    trainNumber: String(trainNo),
    trainName: trainName || `Train ${trainNo}`,
    journeyDate,
    fromStation,
    toStation,
    coachId: coachName,
    travelClass: normClass,
    totalBerths,
    totalBays: bays.length,
    isChartPrepared: true,
    isLiveChart: true,
    chartStatus: 'CHART_PREPARED',
    source: 'irctc_live_browser',
    summary: {
      totalBerths,
      fullJourneyCount,
      partialCount,
      unavailableCount,
      availableTotal,
      vacancyRate,
      byType: {
        '1A': { fullJourney: normClass === '1A' ? fullJourneyCount : 0 },
        '2A': { fullJourney: normClass === '2A' ? fullJourneyCount : 0 },
        '3A': { fullJourney: normClass === '3A' ? fullJourneyCount : 0 },
        'SL': { fullJourney: normClass === 'SL' ? fullJourneyCount : 0 },
      },
    },
    bays,
    berths: evaluatedBerths,
    availableCoaches: availableCoaches.length > 0 ? availableCoaches : [coachName],
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Transforms IRCTC vacantBerth (vbd) list into VacantBerthsGrid format
 */
export function mapIrctcVacantBerths(vbdList = [], fromStation = '', toStation = '') {
  if (!Array.isArray(vbdList)) return [];
  const normUserFrom = (fromStation || '').toUpperCase().trim();
  const normUserTo = (toStation || '').toUpperCase().trim();

  return vbdList.map((vb) => {
    const coach = vb.coachName || vb.coach || '';
    const berthNumber = Number(vb.berthNumber || vb.berthNo);
    const rawType = (vb.berthCode || vb.berthType || '').toUpperCase().trim();

    let berthType = 'LOWER';
    if (rawType === 'L') berthType = 'LOWER';
    else if (rawType === 'M') berthType = 'MIDDLE';
    else if (rawType === 'U') berthType = 'UPPER';
    else if (rawType === 'SL') berthType = 'SIDE_LOWER';
    else if (rawType === 'SU') berthType = 'SIDE_UPPER';
    else if (rawType === 'SM') berthType = 'SIDE_MIDDLE';
    else if (rawType === 'WS') berthType = 'WINDOW';
    else if (rawType === 'AS') berthType = 'AISLE';
    else if (rawType) berthType = rawType;

    const availableFrom = (vb.from || '').toUpperCase().trim();
    const availableTo = (vb.to || '').toUpperCase().trim();
    const isFull = normUserFrom && normUserTo && availableFrom === normUserFrom && availableTo === normUserTo;

    return {
      coach,
      coachName: coach,
      berthNumber,
      berthNo: berthNumber,
      berthType,
      berthCode: vb.berthCode || rawType,
      availableFrom,
      availableTo,
      from: availableFrom,
      to: availableTo,
      splitNo: vb.splitNo,
      status: isFull ? 'FULL_JOURNEY' : 'PARTIAL_JOURNEY',
      coveragePercent: isFull ? 100 : 50,
      isVacant: true,
      vacant: true,
      available: true,
      source: 'irctc_live_browser',
    };
  });
}
