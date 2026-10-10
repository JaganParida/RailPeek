/**
 * Segment occupancy profiles for mock trains and coaches.
 * Each entry specifies intervals [fromIndex, toIndex] where the berth is reserved/occupied.
 */

// Train 12819 S1 Exact IRCTC Chart Pattern:
// Part-occupied berths (Yellow): 1, 2, 3, 4, 6, 8, 9, 11, 14, 15, 16, 19, 20, 22, 23, 25, 26, 29, 31, 33, 37, 39, 55, 57, 58, 63, 71
// Full-occupied berths (Light Blue): All other berths
// Full Vacant Berths = 0 (Matches IRCTC '0(Berth Details)')
const S1_PARTIAL_BERTHS = new Set([
  1, 2, 3, 4, 6, 8, 9, 11, 14, 15, 16, 19, 20, 22, 23, 25, 26, 29, 31, 33, 37, 39, 55, 57, 58, 63, 71,
]);

const S1_OCCUPANCIES = {};
for (let b = 1; b <= 72; b++) {
  if (S1_PARTIAL_BERTHS.has(b)) {
    S1_OCCUPANCIES[b] = [{ from: 'TATA', to: 'GMO', fromIndex: 4, toIndex: 6 }];
  } else {
    S1_OCCUPANCIES[b] = [{ from: 'BBS', to: 'NDLS', fromIndex: 0, toIndex: 9 }];
  }
}

export const MOCK_BERTH_OCCUPANCIES = {
  // Train 18477 Utkal Express - Coach B3 (3A)
  '18477:B3': {
    21: [],
    22: [],
    23: [],
    24: [],
    25: [{ from: 'PURI', to: 'TATA', fromIndex: 0, toIndex: 5 }],
    26: [{ from: 'PURI', to: 'NDLS', fromIndex: 0, toIndex: 17 }],
    18: [{ from: 'BBS', to: 'VGLJ', fromIndex: 1, toIndex: 12 }],
    7: [{ from: 'BBS', to: 'ROU', fromIndex: 1, toIndex: 6 }],
    8: [],
  },

  // Train 12801 Purushottam Express - Coach B2 (3A)
  '12801:B2': {
    11: [],
    12: [],
    18: [{ from: 'BBS', to: 'CNB', fromIndex: 1, toIndex: 11 }],
    19: [{ from: 'DDU', to: 'NDLS', fromIndex: 9, toIndex: 12 }],
    1: [{ from: 'PURI', to: 'NDLS', fromIndex: 0, toIndex: 12 }],
  },

  // Train 12815 Nandan Kanan Express - Coach S1 (SL) & B2 (3A)
  '12815:S1': {
    11: [],
    12: [],
    13: [],
    14: [],
    15: [],
  },
  '12815:B2': {
    21: [],
    22: [],
    23: [],
  },

  // Train 20817 Tejas Rajdhani - Coach B1 (3A)
  '20817:B1': {
    5: [],
    6: [],
    7: [],
    8: [],
    14: [{ from: 'BBS', to: 'GAYA', fromIndex: 0, toIndex: 6 }],
  },

  // Train 12819 Odisha Sampark Kranti Express - Coach S1 (Exact IRCTC chart parity)
  '12819:S1': S1_OCCUPANCIES,

  // Train 12819 Coach B2 & B3 (3A)
  '12819:B2': {
    1: [{ from: 'BBS', to: 'TATA', fromIndex: 0, toIndex: 4 }],
    2: [{ from: 'BBS', to: 'TATA', fromIndex: 0, toIndex: 4 }],
    3: [{ from: 'BBS', to: 'TATA', fromIndex: 0, toIndex: 4 }],
    9: [{ from: 'BBS', to: 'TATA', fromIndex: 0, toIndex: 4 }],
    10: [{ from: 'BBS', to: 'TATA', fromIndex: 0, toIndex: 4 }],
    17: [{ from: 'BBS', to: 'TATA', fromIndex: 0, toIndex: 4 }],
    18: [{ from: 'BBS', to: 'TATA', fromIndex: 0, toIndex: 4 }],
    21: [],
    22: [],
    23: [],
  },
  '12819:B3': {
    5: [{ from: 'BBS', to: 'TATA', fromIndex: 0, toIndex: 4 }],
    6: [{ from: 'BBS', to: 'TATA', fromIndex: 0, toIndex: 4 }],
    11: [],
    12: [],
    13: [],
    14: [],
    25: [{ from: 'BBS', to: 'CNB', fromIndex: 0, toIndex: 8 }],
  },

  // Train 12821 Dhauli Express - Coach D1 & D2 (2S Second Sitting)
  '12821:D1': {
    15: [], // Full journey vacant
    16: [], // Full journey vacant
    78: [], // Full journey vacant
    79: [], // Full journey vacant (Matching PNR 6839298833 seat 79!)
    80: [], // Full journey vacant
    81: [], // Full journey vacant
    21: [{ from: 'HWH', to: 'KGP', fromIndex: 0, toIndex: 1 }],
    22: [{ from: 'HWH', to: 'BLS', fromIndex: 0, toIndex: 2 }],
  },
  '12821:D2': {
    11: [],
    12: [],
    79: [],
    80: [],
    81: [],
    82: [],
  },
};
