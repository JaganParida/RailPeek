/**
 * Indian Railways standard coach layout definitions and generators
 */

/**
 * Determine berth type and bay number for standard 3A (72 berths)
 * @param {number} num
 * @returns {{ berthType: string, bayNumber: number, position: string }}
 */
export function get3ABerthInfo(num) {
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

/**
 * Determine berth type and bay number for standard 2A (54 berths)
 * @param {number} num
 * @returns {{ berthType: string, bayNumber: number, position: string }}
 */
export function get2ABerthInfo(num) {
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

/**
 * Determine berth type and bay number for standard 1A AC First Class (24 berths: Cabins & Coupes)
 * @param {number} num
 * @returns {{ berthType: string, bayNumber: number, position: string, bayLabel: string, bayType: string }}
 */
export function get1ABerthInfo(num) {
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
  if (num >= 21 && num <= 22) {
    return {
      berthType: num === 21 ? 'LOWER' : 'UPPER',
      bayNumber: 7,
      position: 'COUPE_MAIN',
      bayLabel: 'Coupe G',
      bayType: 'COUPE',
    };
  }
  if (num >= 23 && num <= 24) {
    return {
      berthType: num === 23 ? 'LOWER' : 'UPPER',
      bayNumber: 8,
      position: 'COUPE_MAIN',
      bayLabel: 'Coupe H',
      bayType: 'COUPE',
    };
  }

  return {
    berthType: 'LOWER',
    bayNumber: Math.ceil(num / 4),
    position: 'UNKNOWN',
    bayLabel: `Bay ${Math.ceil(num / 4)}`,
    bayType: 'CABIN',
  };
}

/**
 * Determine berth type and bay number for standard Sleeper class (72 berths)
 * @param {number} num
 * @returns {{ berthType: string, bayNumber: number, position: string }}
 */
export function getSLBerthInfo(num) {
  return get3ABerthInfo(num);
}

/**
 * Determine seat type and row number for 2S (Second Sitting, 108 seats, 3x3 layout)
 * @param {number} num
 * @returns {{ berthType: string, bayNumber: number, position: string, bayLabel: string, bayType: string }}
 */
export function get2SSeatInfo(num) {
  const rowNumber = Math.ceil(num / 6);
  const rem = num % 6;
  let berthType = 'AISLE';
  let position = 'AISLE';
  if (rem === 1) {
    berthType = 'WINDOW';
    position = 'WINDOW_LEFT';
  } else if (rem === 2) {
    berthType = 'MIDDLE';
    position = 'MIDDLE_LEFT';
  } else if (rem === 3) {
    berthType = 'AISLE';
    position = 'AISLE_LEFT';
  } else if (rem === 4) {
    berthType = 'AISLE';
    position = 'AISLE_RIGHT';
  } else if (rem === 5) {
    berthType = 'MIDDLE';
    position = 'MIDDLE_RIGHT';
  } else {
    berthType = 'WINDOW';
    position = 'WINDOW_RIGHT';
  }
  return {
    berthType,
    bayNumber: rowNumber,
    position,
    bayLabel: `Row ${rowNumber}`,
    bayType: 'SEAT_ROW',
  };
}

/**
 * Determine seat type and row number for CC (AC Chair Car, 78 seats, 3x2 layout)
 * @param {number} num
 * @returns {{ berthType: string, bayNumber: number, position: string, bayLabel: string, bayType: string }}
 */
export function getCCSeatInfo(num) {
  const rowNumber = Math.ceil(num / 5);
  const rem = num % 5;
  let berthType = 'AISLE';
  let position = 'AISLE';
  if (rem === 1) {
    berthType = 'WINDOW';
    position = 'WINDOW_LEFT';
  } else if (rem === 2) {
    berthType = 'MIDDLE';
    position = 'MIDDLE_LEFT';
  } else if (rem === 3) {
    berthType = 'AISLE';
    position = 'AISLE_LEFT';
  } else if (rem === 4) {
    berthType = 'AISLE';
    position = 'AISLE_RIGHT';
  } else {
    berthType = 'WINDOW';
    position = 'WINDOW_RIGHT';
  }
  return {
    berthType,
    bayNumber: rowNumber,
    position,
    bayLabel: `Row ${rowNumber}`,
    bayType: 'SEAT_ROW',
  };
}

/**
 * Infer travel class from coach identifier
 * @param {string} coachName
 * @returns {string}
 */
export function getCoachClass(coachName) {
  const prefix = String(coachName || '').toUpperCase().trim();
  if (prefix.startsWith('H')) return '1A';
  if (prefix.startsWith('A')) return '2A';
  if (prefix.startsWith('B') || prefix.startsWith('M')) return '3A';
  if (prefix.startsWith('S')) return 'SL';
  if (prefix.startsWith('C')) return 'CC';
  if (prefix.startsWith('E')) return 'EC';
  if (prefix.startsWith('D')) return '2S';
  return '3A';
}

/**
 * Available coach list for standard trains
 * @param {string} trainNumber
 * @returns {string[]}
 */
export function getTrainCoaches(trainNumber) {
  const num = String(trainNumber || '').trim();
  switch (num) {
    case '12819':
      return ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'B1', 'B2', 'B3', 'B4', 'B5', 'BE1', 'A2', 'A1', 'H1'];
    case '18477':
      return ['B3', 'B2', 'B1', 'A1', 'H1', 'S1', 'S2', 'S3'];
    case '12801':
      return ['B2', 'B1', 'B3', 'A1', 'H1', 'M1', 'S1', 'S2'];
    case '12815':
      return ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'B1', 'B2', 'B3', 'B4', 'M1', 'A1', 'A2', 'H1'];
    case '20817':
      return ['B1', 'B2', 'B3', 'B4', 'A1', 'A2', 'H1'];
    case '12951':
      return ['B1', 'B2', 'B3', 'A1', 'A2', 'H1'];
    case '12004':
      return ['C1', 'C2', 'C3', 'E1'];
    case '22435':
    case '22436':
      return ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'E1', 'E2'];
    case '12301':
    case '12302':
    case '12952':
      return ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'A1', 'A2', 'H1'];
    case '12821':
    case '12822':
      return ['C1', 'C2', 'D1', 'D2', 'D3', 'D4', 'D5'];
    case '12841':
    case '12842':
    case '12875':
    case '12816':
    case '12802':
    case '12393':
    case '12394':
    case '12417':
    case '12418':
      return ['S1', 'S2', 'S3', 'S4', 'S5', 'B1', 'B2', 'B3', 'A1', 'H1'];
    default:
      return ['B1', 'B2', 'B3', 'A1', 'H1', 'S1'];
  }
}

/**
 * Generate structural coach layout
 * @param {string} coachName - e.g. "B3", "S1"
 * @param {string} travelClass - e.g. "3A", "2A", "1A", "SL"
 * @param {string|number} [trainNumberOrCount=''] - Train number or explicit count
 * @returns {Array<Object>}
 */
export function generateCoachBerths(coachName, travelClass = '3A', trainNumberOrCount = '') {
  const normClass = travelClass || getCoachClass(coachName);
  const trainStr = String(trainNumberOrCount || '').trim();
  const is63BerthLhb =
    (['12815', '12816', '12875', '12876'].includes(trainStr) || trainNumberOrCount === 63) &&
    (normClass === 'SL' || normClass === '3A' || coachName.startsWith('S') || coachName.startsWith('B'));

  if (is63BerthLhb) {
    const berths = [];
    // Bays 1 to 7: Standard 8 berths each (1..56)
    for (let num = 1; num <= 56; num++) {
      const info = get3ABerthInfo(num);
      berths.push({
        berthNumber: num,
        berthType: info.berthType,
        position: info.position,
        bayNumber: info.bayNumber,
        bayLabel: info.bayLabel || `Bay ${info.bayNumber}`,
        bayType: info.bayType || 'MAIN_BAY',
        coach: coachName,
        class: normClass,
      });
    }
    // Bay 8: Berths 57 to 63 (7 berths: 57 L, 58 M, 59 U, 60 L, 61 M, 62 U, 63 SL)
    const bay8 = [
      { num: 57, berthType: 'LOWER', position: 'MAIN_LOWER' },
      { num: 58, berthType: 'MIDDLE', position: 'MAIN_MIDDLE' },
      { num: 59, berthType: 'UPPER', position: 'MAIN_UPPER' },
      { num: 60, berthType: 'LOWER', position: 'MAIN_LOWER' },
      { num: 61, berthType: 'MIDDLE', position: 'MAIN_MIDDLE' },
      { num: 62, berthType: 'UPPER', position: 'MAIN_UPPER' },
      { num: 63, berthType: 'SIDE_LOWER', position: 'SIDE_LOWER' },
    ];
    for (const b of bay8) {
      berths.push({
        berthNumber: b.num,
        berthType: b.berthType,
        position: b.position,
        bayNumber: 8,
        bayLabel: 'Bay 8',
        bayType: 'MAIN_BAY',
        coach: coachName,
        class: normClass,
      });
    }
    return berths;
  }

  const totalBerths =
    typeof trainNumberOrCount === 'number' && trainNumberOrCount > 0
      ? trainNumberOrCount
      : normClass === '2A'
      ? 54
      : normClass === '1A'
      ? 24
      : normClass === '2S'
      ? 108
      : normClass === 'CC'
      ? 78
      : 72;
  const berths = [];

  for (let num = 1; num <= totalBerths; num++) {
    let info;
    if (normClass === '1A') {
      info = get1ABerthInfo(num);
    } else if (normClass === '2A') {
      info = get2ABerthInfo(num);
    } else if (normClass === '2S') {
      info = get2SSeatInfo(num);
    } else if (normClass === 'CC') {
      info = getCCSeatInfo(num);
    } else {
      info = get3ABerthInfo(num);
    }

    berths.push({
      berthNumber: num,
      berthType: info.berthType,
      position: info.position,
      bayNumber: info.bayNumber,
      bayLabel: info.bayLabel || (normClass === '2S' || normClass === 'CC' ? `Row ${info.bayNumber}` : `Bay ${info.bayNumber}`),
      bayType: info.bayType || (normClass === '2S' || normClass === 'CC' ? 'SEAT_ROW' : 'MAIN_BAY'),
      coach: coachName,
      class: normClass,
    });
  }

  return berths;
}

/**
 * Groups berths into organized physical bays for visualization
 * @param {Array<Object>} berths
 * @param {string} travelClass
 * @returns {Array<Object>}
 */
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
      // 3A and SL (8 per bay)
      if (berth.berthType === 'SIDE_LOWER' || berth.berthType === 'SIDE_UPPER') {
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
