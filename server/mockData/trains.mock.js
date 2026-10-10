/**
 * Verified Indian Railways Trains reference dataset
 */
export const MOCK_TRAINS = [
  {
    number: '18477',
    name: 'Kalinga Utkal Express',
    origin: 'PURI',
    originName: 'Puri',
    destination: 'YNRK',
    destinationName: 'Yog Nagari Rishikesh (via NDLS/NZM)',
    classes: ['1A', '2A', '3A', 'SL'],
    daysOfRun: [0, 1, 2, 3, 4, 5, 6], // Daily
  },
  {
    number: '12819',
    name: 'Odisha Sampark Kranti Express',
    origin: 'BBS',
    originName: 'Bhubaneswar',
    destination: 'NDLS',
    destinationName: 'New Delhi (via Tatanagar)',
    classes: ['1A', '2A', '3A', 'SL'],
    daysOfRun: [0, 3], // Sunday and Wednesday only
  },
  {
    number: '12801',
    name: 'Purushottam Express',
    origin: 'PURI',
    originName: 'Puri',
    destination: 'NDLS',
    destinationName: 'New Delhi',
    classes: ['1A', '2A', '3A', '3E', 'SL'],
    daysOfRun: [0, 1, 2, 3, 4, 5, 6], // Daily
  },
  {
    number: '12815',
    name: 'Nandan Kanan Express',
    origin: 'PURI',
    originName: 'Puri',
    destination: 'ANVT',
    destinationName: 'Anand Vihar Terminal',
    classes: ['1A', '2A', '3A', '3E', 'SL'],
    daysOfRun: [1, 3, 4, 6], // Monday, Wednesday, Thursday, Saturday
  },
  {
    number: '20817',
    name: 'Bhubaneswar - New Delhi Tejas Rajdhani',
    origin: 'BBS',
    originName: 'Bhubaneswar',
    destination: 'NDLS',
    destinationName: 'New Delhi',
    classes: ['1A', '2A', '3A'],
    daysOfRun: [6], // Saturdays
  },
  {
    number: '12951',
    name: 'Mumbai Central - New Delhi Tejas Rajdhani',
    origin: 'MMCT',
    originName: 'Mumbai Central',
    destination: 'NDLS',
    destinationName: 'New Delhi',
    classes: ['1A', '2A', '3A'],
    daysOfRun: [0, 1, 2, 3, 4, 5, 6], // Daily
  },
  {
    number: '12004',
    name: 'New Delhi - Lucknow Shatabdi Express',
    origin: 'NDLS',
    originName: 'New Delhi',
    destination: 'LJN',
    destinationName: 'Lucknow Junction',
    classes: ['EC', 'CC'],
    daysOfRun: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    number: '12875',
    name: 'Neelachal Express',
    origin: 'PURI',
    originName: 'Puri',
    destination: 'ANVT',
    destinationName: 'Anand Vihar Terminal',
    classes: ['1A', '2A', '3A', '3E', 'SL'],
    daysOfRun: [0, 2, 5], // Sunday, Tuesday, Friday
  },
  {
    number: '12301',
    name: 'Howrah - New Delhi Rajdhani Express',
    origin: 'HWH',
    originName: 'Howrah Junction',
    destination: 'NDLS',
    destinationName: 'New Delhi',
    classes: ['1A', '2A', '3A'],
    daysOfRun: [0, 1, 2, 3, 4, 5], // Sun, Mon, Tue, Wed, Thu, Fri
  },
  {
    number: '12302',
    name: 'New Delhi - Howrah Rajdhani Express',
    origin: 'NDLS',
    originName: 'New Delhi',
    destination: 'HWH',
    destinationName: 'Howrah Junction',
    classes: ['1A', '2A', '3A'],
    daysOfRun: [0, 1, 2, 3, 4, 6], // Sun, Mon, Tue, Wed, Thu, Sat
  },
  {
    number: '12821',
    name: 'Dhauli Express',
    origin: 'HWH',
    originName: 'Howrah Junction',
    destination: 'PURI',
    destinationName: 'Puri',
    classes: ['CC', '2S'],
    daysOfRun: [0, 1, 2, 3, 4, 5, 6], // Daily
  },
  {
    number: '12822',
    name: 'Dhauli Express',
    origin: 'PURI',
    originName: 'Puri',
    destination: 'HWH',
    destinationName: 'Howrah Junction',
    classes: ['CC', '2S'],
    daysOfRun: [0, 1, 2, 3, 4, 5, 6], // Daily
  },
  {
    number: '12841',
    name: 'Coromandel Express',
    origin: 'HWH',
    originName: 'Howrah Junction',
    destination: 'MAS',
    destinationName: 'Chennai Central',
    classes: ['1A', '2A', '3A', 'SL'],
    daysOfRun: [0, 1, 2, 3, 4, 5, 6], // Daily
  },
  {
    number: '22436',
    name: 'Vande Bharat Express',
    origin: 'NDLS',
    originName: 'New Delhi',
    destination: 'BSB',
    destinationName: 'Varanasi Junction',
    classes: ['EC', 'CC'],
    daysOfRun: [0, 2, 3, 5, 6], // Tue, Wed, Fri, Sat, Sun
  },
  {
    number: '12417',
    name: 'Prayagraj Express',
    origin: 'PRYJ',
    originName: 'Prayagraj Junction',
    destination: 'NDLS',
    destinationName: 'New Delhi',
    classes: ['1A', '2A', '3A', 'SL'],
    daysOfRun: [0, 1, 2, 3, 4, 5, 6], // Daily
  },
  {
    number: '12418',
    name: 'Prayagraj Express',
    origin: 'NDLS',
    originName: 'New Delhi',
    destination: 'PRYJ',
    destinationName: 'Prayagraj Junction',
    classes: ['1A', '2A', '3A', 'SL'],
    daysOfRun: [0, 1, 2, 3, 4, 5, 6], // Daily
  },
  {
    number: '12816',
    name: 'Nandan Kanan Express',
    origin: 'ANVT',
    originName: 'Anand Vihar Terminal',
    destination: 'PURI',
    destinationName: 'Puri',
    classes: ['1A', '2A', '3A', '3E', 'SL'],
    daysOfRun: [0, 1, 3, 5], // Sun, Mon, Wed, Fri
  },
  {
    number: '12802',
    name: 'Purushottam Express',
    origin: 'NDLS',
    originName: 'New Delhi',
    destination: 'PURI',
    destinationName: 'Puri',
    classes: ['1A', '2A', '3A', '3E', 'SL'],
    daysOfRun: [0, 1, 2, 3, 4, 5, 6], // Daily
  },
  {
    number: '12952',
    name: 'New Delhi - Mumbai Central Tejas Rajdhani',
    origin: 'NDLS',
    originName: 'New Delhi',
    destination: 'MMCT',
    destinationName: 'Mumbai Central',
    classes: ['1A', '2A', '3A'],
    daysOfRun: [0, 1, 2, 3, 4, 5, 6], // Daily
  },
  {
    number: '12393',
    name: 'Sampoorna Kranti Express',
    origin: 'PNBE',
    originName: 'Patna Junction',
    destination: 'NDLS',
    destinationName: 'New Delhi',
    classes: ['1A', '2A', '3A', '3E', 'SL'],
    daysOfRun: [0, 1, 2, 3, 4, 5, 6], // Daily
  },
  {
    number: '12394',
    name: 'Sampoorna Kranti Express',
    origin: 'NDLS',
    originName: 'New Delhi',
    destination: 'PNBE',
    destinationName: 'Patna Junction',
    classes: ['1A', '2A', '3A', '3E', 'SL'],
    daysOfRun: [0, 1, 2, 3, 4, 5, 6], // Daily
  },
  {
    number: '12842',
    name: 'Coromandel Express',
    origin: 'MAS',
    originName: 'Chennai Central',
    destination: 'HWH',
    destinationName: 'Howrah Junction',
    classes: ['1A', '2A', '3A', 'SL'],
    daysOfRun: [0, 1, 2, 3, 4, 5, 6], // Daily
  },
  {
    number: '22435',
    name: 'Vande Bharat Express',
    origin: 'BSB',
    originName: 'Varanasi Junction',
    destination: 'NDLS',
    destinationName: 'New Delhi',
    classes: ['EC', 'CC'],
    daysOfRun: [0, 2, 3, 5, 6], // Tue, Wed, Fri, Sat, Sun
  },
];
