import https from 'https';

/**
 * In-memory cache for Route Trains (Trains Between Stations)
 * Key: `${from}:${to}` -> { timestamp, trains }
 */
const routeCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Parse delimited string from erail.in/rail/getTrains.aspx
 * @param {string} rawData
 * @param {string} fromCode
 * @param {string} toCode
 * @param {string} [dateStr]
 * @returns {Array<Object>}
 */
export function parseErailTrains(rawData, fromCode, toCode, dateStr) {
  if (!rawData || typeof rawData !== 'string') return [];

  const lines = rawData.split('^').filter(Boolean);
  const trains = [];

  let dayOfWeekIdx = null;
  if (dateStr) {
    try {
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0])) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        if (!isNaN(d.getTime())) {
          // JS getDay(): 0 = Sun, 1 = Mon ... 6 = Sat
          // erail bitmask: index 0 = Mon, index 1 = Tue ... index 6 = Sun
          dayOfWeekIdx = (d.getDay() + 6) % 7;
        }
      }
    } catch (_e) {
      // ignore parse error
    }
  }

  for (const line of lines) {
    const f = line.split('~');
    const trainNo = (f[0] || '').trim();
    // Validate train number (4 to 5 digits)
    if (!trainNo || !/^\d{4,5}$/.test(trainNo)) continue;

    const trainName = (f[1] || '').trim();
    const originName = (f[2] || '').trim();
    const originCode = (f[3] || '').trim().toUpperCase();
    const destName = (f[4] || '').trim();
    const destCode = (f[5] || '').trim().toUpperCase();
    const fromStnName = (f[6] || '').trim();
    const fromStn = (f[7] || fromCode).trim().toUpperCase();
    const toStnName = (f[8] || '').trim();
    const toStn = (f[9] || toCode).trim().toUpperCase();

    const depRaw = (f[10] || '').trim();
    const arrRaw = (f[11] || '').trim();
    const depTime = depRaw.replace('.', ':');
    const arrTime = arrRaw.replace('.', ':');

    // f[13] is the days running mask at boarding station (0-indexed Mon-Sun)
    const daysBoarding = (f[13] && f[13].length === 7) ? f[13].trim() : '1111111';
    const daysSrc = (f[29] && f[29].length === 7) ? f[29].trim() : daysBoarding;
    const distKm = parseInt(f[39], 10) || 0;

    // Parse classes from f[62] (e.g., '1A:8::4::::::::|2A:16:24:8:8::::1:::|SL:60:144:24:42:2:6:::::4|')
    const classesRaw = f[62] || '';
    const classSet = new Set();
    if (classesRaw) {
      const parts = classesRaw.split('|').filter(Boolean);
      for (const p of parts) {
        const clsName = p.split(':')[0]?.trim().toUpperCase();
        if (clsName && ['1A', '2A', '3A', '3E', 'SL', 'CC', '2S', 'EC', 'EA'].includes(clsName)) {
          classSet.add(clsName);
        }
      }
    }
    const classes = classSet.size > 0 ? Array.from(classSet) : ['2S'];

    // Map daysOfRun to 0-6 JS days (0=Sun, 1=Mon ... 6=Sat)
    const daysOfRun = [];
    for (let i = 0; i < 7; i++) {
      if (daysBoarding[i] === '1') {
        const jsDay = (i + 1) % 7; // i=0(Mon)->1, i=6(Sun)->0
        daysOfRun.push(jsDay);
      }
    }

    const operatesOnDate = dayOfWeekIdx !== null ? daysBoarding[dayOfWeekIdx] === '1' : true;

    trains.push({
      trainNumber: trainNo,
      number: trainNo,
      trainName,
      name: trainName,
      origin: originCode || fromStn,
      originName,
      destination: destCode || toStn,
      destName,
      fromStation: fromStn,
      fromStationName: fromStnName,
      toStation: toStn,
      toStationName: toStnName,
      departureTime: depTime || '00:00',
      arrivalTime: arrTime || '00:00',
      distanceKm: distKm,
      classes,
      daysOfRun,
      daysBoardingMask: daysBoarding,
      daysSrcMask: daysSrc,
      operatesOnDate,
      source: 'live',
      isDemo: false,
    });
  }

  return trains;
}

/**
 * Fetch Live Trains Between Stations across India
 * @param {string} from Station code (e.g., 'JER')
 * @param {string} to Station code (e.g., 'PURI')
 * @param {string} [date] Journey date (YYYY-MM-DD)
 * @returns {Promise<Array<Object>>}
 */
export async function fetchLiveTrainsBetweenStations(from, to, date) {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return [];
  }

  const fromCode = (from || '').trim().toUpperCase();
  const toCode = (to || '').trim().toUpperCase();
  if (!fromCode || !toCode || fromCode === toCode) return [];

  const cacheKey = `${fromCode}:${toCode}`;
  const now = Date.now();
  const cached = routeCache.get(cacheKey);

  let allTrains = null;

  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    allTrains = cached.trains;
  } else {
    try {
      const url = `https://erail.in/rail/getTrains.aspx?Station_From=${encodeURIComponent(fromCode)}&Station_To=${encodeURIComponent(toCode)}`;
      const rawData = await new Promise((resolve, reject) => {
        const req = https.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/plain, */*',
            'Referer': 'https://erail.in/',
          },
          timeout: 6000,
        }, (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => resolve(body));
        });

        req.on('timeout', () => {
          req.destroy(new Error('erail request timed out'));
        });
        req.on('error', (err) => reject(err));
      });

      allTrains = parseErailTrains(rawData, fromCode, toCode, null);
      if (allTrains.length > 0) {
        routeCache.set(cacheKey, { timestamp: now, trains: allTrains });
      }
    } catch (err) {
      console.warn(`[RailPeek TBS] Live train discovery failed for ${fromCode} -> ${toCode}: ${err.message}`);
      return [];
    }
  }

  if (!allTrains || allTrains.length === 0) return [];

  // If date is provided, recalculate operatesOnDate for the specific date
  if (date) {
    let dayOfWeekIdx = null;
    try {
      const parts = date.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0])) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        if (!isNaN(d.getTime())) {
          dayOfWeekIdx = (d.getDay() + 6) % 7;
        }
      }
    } catch (_e) {
      // ignore
    }

    return allTrains.map((t) => {
      const operatesOnDate = dayOfWeekIdx !== null && t.daysBoardingMask
        ? t.daysBoardingMask[dayOfWeekIdx] === '1'
        : true;
      return {
        ...t,
        journeyDate: date,
        operatesOnDate,
      };
    });
  }

  return allTrains;
}
