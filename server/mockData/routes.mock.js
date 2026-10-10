/**
 * Ordered route sequences with verified stop indices for mock trains
 */
export const MOCK_ROUTES = {
  // 18477: Kalinga Utkal Express (Puri -> New Delhi segment)
  '18477': [
    { stationCode: 'PURI', stationName: 'Puri', stopIndex: 0, arrival: '--:--', departure: '20:45', distanceKm: 0, dayCount: 1 },
    { stationCode: 'BBS', stationName: 'Bhubaneswar', stopIndex: 1, arrival: '21:55', departure: '22:00', distanceKm: 63, dayCount: 1 },
    { stationCode: 'CTC', stationName: 'Cuttack Junction', stopIndex: 2, arrival: '22:30', departure: '22:35', distanceKm: 91, dayCount: 1 },
    { stationCode: 'BLS', stationName: 'Baleshwar', stopIndex: 3, arrival: '01:23', departure: '01:28', distanceKm: 269, dayCount: 2 },
    { stationCode: 'JER', stationName: 'Jaleswar', stopIndex: 4, arrival: '02:08', departure: '02:10', distanceKm: 316, dayCount: 2 },
    { stationCode: 'HIJ', stationName: 'Hijli (Kharagpur)', stopIndex: 5, arrival: '03:00', departure: '03:10', distanceKm: 381, dayCount: 2 },
    { stationCode: 'TATA', stationName: 'Tatanagar Junction', stopIndex: 6, arrival: '05:47', departure: '05:52', distanceKm: 515, dayCount: 2 },
    { stationCode: 'ROU', stationName: 'Rourkela Junction', stopIndex: 7, arrival: '08:35', departure: '08:45', distanceKm: 678, dayCount: 2 },
    { stationCode: 'JSG', stationName: 'Jharsuguda Junction', stopIndex: 8, arrival: '10:38', departure: '10:40', distanceKm: 779, dayCount: 2 },
    { stationCode: 'RIG', stationName: 'Raigarh', stopIndex: 9, arrival: '11:43', departure: '11:48', distanceKm: 851, dayCount: 2 },
    { stationCode: 'BSP', stationName: 'Bilaspur Junction', stopIndex: 10, arrival: '14:40', departure: '14:55', distanceKm: 983, dayCount: 2 },
    { stationCode: 'KTE', stationName: 'Katni Murwara', stopIndex: 11, arrival: '22:10', departure: '22:20', distanceKm: 1301, dayCount: 2 },
    { stationCode: 'SGO', stationName: 'Saugor', stopIndex: 12, arrival: '01:10', departure: '01:15', distanceKm: 1488, dayCount: 3 },
    { stationCode: 'VGLJ', stationName: 'VGL Jhansi Junction', stopIndex: 13, arrival: '05:20', departure: '05:28', distanceKm: 1711, dayCount: 3 },
    { stationCode: 'GWL', stationName: 'Gwalior Junction', stopIndex: 14, arrival: '06:38', departure: '06:40', distanceKm: 1808, dayCount: 3 },
    { stationCode: 'AGC', stationName: 'Agra Cantt', stopIndex: 15, arrival: '09:20', departure: '09:25', distanceKm: 1927, dayCount: 3 },
    { stationCode: 'MTJ', stationName: 'Mathura Junction', stopIndex: 16, arrival: '10:20', departure: '10:25', distanceKm: 1980, dayCount: 3 },
    { stationCode: 'NZM', stationName: 'Hazrat Nizamuddin', stopIndex: 17, arrival: '13:00', departure: '13:20', distanceKm: 2114, dayCount: 3 },
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 18, arrival: '13:45', departure: '--:--', distanceKm: 2121, dayCount: 3 },
  ],

  // 12801: Purushottam Express (Puri -> New Delhi)
  '12801': [
    { stationCode: 'PURI', stationName: 'Puri', stopIndex: 0, arrival: '--:--', departure: '21:55', distanceKm: 0, dayCount: 1 },
    { stationCode: 'BBS', stationName: 'Bhubaneswar', stopIndex: 1, arrival: '22:55', departure: '23:00', distanceKm: 63, dayCount: 1 },
    { stationCode: 'CTC', stationName: 'Cuttack Junction', stopIndex: 2, arrival: '23:35', departure: '23:40', distanceKm: 91, dayCount: 1 },
    { stationCode: 'BLS', stationName: 'Baleshwar', stopIndex: 3, arrival: '02:00', departure: '02:05', distanceKm: 269, dayCount: 2 },
    { stationCode: 'HIJ', stationName: 'Hijli', stopIndex: 4, arrival: '03:40', departure: '03:45', distanceKm: 381, dayCount: 2 },
    { stationCode: 'TATA', stationName: 'Tatanagar Junction', stopIndex: 5, arrival: '06:22', departure: '06:32', distanceKm: 515, dayCount: 2 },
    { stationCode: 'BKSC', stationName: 'Bokaro Steel City', stopIndex: 6, arrival: '09:40', departure: '09:45', distanceKm: 665, dayCount: 2 },
    { stationCode: 'GMO', stationName: 'NSCB Gomoh Junction', stopIndex: 7, arrival: '10:50', departure: '10:55', distanceKm: 697, dayCount: 2 },
    { stationCode: 'GAYA', stationName: 'Gaya Junction', stopIndex: 8, arrival: '13:43', departure: '13:48', distanceKm: 868, dayCount: 2 },
    { stationCode: 'DDU', stationName: 'Pt. Deen Dayal Upadhyaya Jn', stopIndex: 9, arrival: '16:50', departure: '17:00', distanceKm: 1073, dayCount: 2 },
    { stationCode: 'PRYJ', stationName: 'Prayagraj Junction', stopIndex: 10, arrival: '19:20', departure: '19:30', distanceKm: 1226, dayCount: 2 },
    { stationCode: 'CNB', stationName: 'Kanpur Central', stopIndex: 11, arrival: '21:55', departure: '22:00', distanceKm: 1420, dayCount: 2 },
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 12, arrival: '04:00', departure: '--:--', distanceKm: 1860, dayCount: 3 },
  ],

  // 12815: Nandan Kanan Express (Puri -> Anand Vihar Terminal)
  '12815': [
    { stationCode: 'PURI', stationName: 'Puri', stopIndex: 0, arrival: '--:--', departure: '11:00', distanceKm: 0, dayCount: 1 },
    { stationCode: 'BBS', stationName: 'Bhubaneswar', stopIndex: 1, arrival: '12:15', departure: '12:20', distanceKm: 63, dayCount: 1 },
    { stationCode: 'CTC', stationName: 'Cuttack Junction', stopIndex: 2, arrival: '12:49', departure: '12:54', distanceKm: 91, dayCount: 1 },
    { stationCode: 'JJKR', stationName: 'Jajpur Keonjhar Road', stopIndex: 3, arrival: '13:44', departure: '13:46', distanceKm: 163, dayCount: 1 },
    { stationCode: 'BHC', stationName: 'Bhadrak', stopIndex: 4, arrival: '14:37', departure: '14:39', distanceKm: 206, dayCount: 1 },
    { stationCode: 'BLS', stationName: 'Baleshwar', stopIndex: 5, arrival: '15:23', departure: '15:28', distanceKm: 268, dayCount: 1 },
    { stationCode: 'JER', stationName: 'Jaleswar', stopIndex: 6, arrival: '16:14', departure: '16:16', distanceKm: 316, dayCount: 1 },
    { stationCode: 'HIJ', stationName: 'Hijli', stopIndex: 7, arrival: '16:57', departure: '17:05', distanceKm: 380, dayCount: 1 },
    { stationCode: 'MDN', stationName: 'Midnapore', stopIndex: 8, arrival: '17:38', departure: '17:40', distanceKm: 402, dayCount: 1 },
    { stationCode: 'VSU', stationName: 'Bishnupur', stopIndex: 9, arrival: '18:32', departure: '18:34', distanceKm: 475, dayCount: 1 },
    { stationCode: 'BQA', stationName: 'Bankura', stopIndex: 10, arrival: '18:58', departure: '19:00', distanceKm: 505, dayCount: 1 },
    { stationCode: 'ADRA', stationName: 'Adra Junction', stopIndex: 11, arrival: '19:45', departure: '19:50', distanceKm: 558, dayCount: 1 },
    { stationCode: 'GMO', stationName: 'NSCB Gomoh Junction', stopIndex: 12, arrival: '23:05', departure: '23:10', distanceKm: 639, dayCount: 1 },
    { stationCode: 'GAYA', stationName: 'Gaya Junction', stopIndex: 13, arrival: '01:45', departure: '01:50', distanceKm: 809, dayCount: 2 },
    { stationCode: 'DOS', stationName: 'Dehri On Sone', stopIndex: 14, arrival: '02:50', departure: '02:52', distanceKm: 894, dayCount: 2 },
    { stationCode: 'DDU', stationName: 'Pt. Deen Dayal Upadhyaya Jn', stopIndex: 15, arrival: '04:28', departure: '04:35', distanceKm: 1012, dayCount: 2 },
    { stationCode: 'MZP', stationName: 'Mirzapur', stopIndex: 16, arrival: '05:30', departure: '05:32', distanceKm: 1075, dayCount: 2 },
    { stationCode: 'PRYJ', stationName: 'Prayagraj Junction', stopIndex: 17, arrival: '06:40', departure: '06:45', distanceKm: 1164, dayCount: 2 },
    { stationCode: 'FTP', stationName: 'Fatehpur', stopIndex: 18, arrival: '07:58', departure: '08:00', distanceKm: 1281, dayCount: 2 },
    { stationCode: 'CNB', stationName: 'Kanpur Central', stopIndex: 19, arrival: '09:10', departure: '09:15', distanceKm: 1359, dayCount: 2 },
    { stationCode: 'TDL', stationName: 'Tundla Junction', stopIndex: 20, arrival: '11:45', departure: '11:47', distanceKm: 1589, dayCount: 2 },
    { stationCode: 'ALJN', stationName: 'Aligarh Junction', stopIndex: 21, arrival: '12:38', departure: '12:40', distanceKm: 1668, dayCount: 2 },
    { stationCode: 'ANVT', stationName: 'Anand Vihar Terminal', stopIndex: 22, arrival: '15:10', departure: '--:--', distanceKm: 1785, dayCount: 2 },
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 23, arrival: '15:40', departure: '--:--', distanceKm: 1795, dayCount: 2 },
  ],

  // 12819: Odisha Sampark Kranti Express (Bhubaneswar -> New Delhi via Tatanagar)
  '12819': [
    { stationCode: 'BBS', stationName: 'Bhubaneswar', stopIndex: 0, arrival: '--:--', departure: '16:15', distanceKm: 0, dayCount: 1 },
    { stationCode: 'CTC', stationName: 'Cuttack Junction', stopIndex: 1, arrival: '16:45', departure: '16:50', distanceKm: 28, dayCount: 1 },
    { stationCode: 'BLS', stationName: 'Baleshwar', stopIndex: 2, arrival: '19:10', departure: '19:12', distanceKm: 206, dayCount: 1 },
    { stationCode: 'JER', stationName: 'Jaleswar', stopIndex: 3, arrival: '19:48', departure: '19:50', distanceKm: 253, dayCount: 1 },
    { stationCode: 'HIJ', stationName: 'Hijli', stopIndex: 4, arrival: '20:37', departure: '20:42', distanceKm: 318, dayCount: 1 },
    { stationCode: 'TATA', stationName: 'Tatanagar Junction', stopIndex: 5, arrival: '22:25', departure: '22:30', distanceKm: 452, dayCount: 1 },
    { stationCode: 'BKSC', stationName: 'Bokaro Steel City', stopIndex: 6, arrival: '00:50', departure: '00:55', distanceKm: 602, dayCount: 2 },
    { stationCode: 'GMO', stationName: 'NSCB Gomoh Junction', stopIndex: 7, arrival: '01:40', departure: '01:45', distanceKm: 634, dayCount: 2 },
    { stationCode: 'DDU', stationName: 'Pt. Deen Dayal Upadhyaya Jn', stopIndex: 8, arrival: '06:15', departure: '06:25', distanceKm: 1010, dayCount: 2 },
    { stationCode: 'CNB', stationName: 'Kanpur Central', stopIndex: 9, arrival: '11:15', departure: '11:20', distanceKm: 1357, dayCount: 2 },
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 10, arrival: '19:35', departure: '--:--', distanceKm: 1797, dayCount: 2 },
  ],

  // 20817: Bhubaneswar - New Delhi Tejas Rajdhani Express
  '20817': [
    { stationCode: 'BBS', stationName: 'Bhubaneswar', stopIndex: 0, arrival: '--:--', departure: '07:15', distanceKm: 0, dayCount: 1 },
    { stationCode: 'CTC', stationName: 'Cuttack Junction', stopIndex: 1, arrival: '07:50', departure: '07:52', distanceKm: 28, dayCount: 1 },
    { stationCode: 'BLS', stationName: 'Baleshwar', stopIndex: 2, arrival: '10:00', departure: '10:02', distanceKm: 206, dayCount: 1 },
    { stationCode: 'HIJ', stationName: 'Hijli', stopIndex: 3, arrival: '11:25', departure: '11:30', distanceKm: 318, dayCount: 1 },
    { stationCode: 'TATA', stationName: 'Tatanagar Junction', stopIndex: 4, arrival: '13:20', departure: '13:25', distanceKm: 452, dayCount: 1 },
    { stationCode: 'BKSC', stationName: 'Bokaro Steel City', stopIndex: 5, arrival: '15:25', departure: '15:30', distanceKm: 602, dayCount: 1 },
    { stationCode: 'GAYA', stationName: 'Gaya Junction', stopIndex: 6, arrival: '18:15', departure: '18:18', distanceKm: 805, dayCount: 1 },
    { stationCode: 'DDU', stationName: 'Pt. Deen Dayal Upadhyaya Jn', stopIndex: 7, arrival: '20:45', departure: '20:55', distanceKm: 1010, dayCount: 1 },
    { stationCode: 'PRYJ', stationName: 'Prayagraj Junction', stopIndex: 8, arrival: '22:48', departure: '22:50', distanceKm: 1163, dayCount: 1 },
    { stationCode: 'CNB', stationName: 'Kanpur Central', stopIndex: 9, arrival: '00:50', departure: '00:55', distanceKm: 1357, dayCount: 2 },
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 10, arrival: '05:35', departure: '--:--', distanceKm: 1797, dayCount: 2 },
  ],

  // 12951: Mumbai Central - New Delhi Tejas Rajdhani Express
  '12951': [
    { stationCode: 'MMCT', stationName: 'Mumbai Central', stopIndex: 0, arrival: '--:--', departure: '17:00', distanceKm: 0, dayCount: 1 },
    { stationCode: 'BVI', stationName: 'Borivali', stopIndex: 1, arrival: '17:22', departure: '17:24', distanceKm: 30, dayCount: 1 },
    { stationCode: 'ST', stationName: 'Surat', stopIndex: 2, arrival: '19:43', departure: '19:48', distanceKm: 263, dayCount: 1 },
    { stationCode: 'BRC', stationName: 'Vadodara Junction', stopIndex: 3, arrival: '21:06', departure: '21:16', distanceKm: 393, dayCount: 1 },
    { stationCode: 'RTM', stationName: 'Ratlam Junction', stopIndex: 4, arrival: '00:25', departure: '00:28', distanceKm: 653, dayCount: 2 },
    { stationCode: 'KOTA', stationName: 'Kota Junction', stopIndex: 5, arrival: '03:15', departure: '03:20', distanceKm: 920, dayCount: 2 },
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 6, arrival: '08:32', departure: '--:--', distanceKm: 1386, dayCount: 2 },
  ],

  // 12004: New Delhi - Lucknow Shatabdi Express
  '12004': [
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 0, arrival: '--:--', departure: '06:10', distanceKm: 0, dayCount: 1 },
    { stationCode: 'CNB', stationName: 'Kanpur Central', stopIndex: 1, arrival: '11:20', departure: '11:25', distanceKm: 440, dayCount: 1 },
    { stationCode: 'LJN', stationName: 'Lucknow Junction', stopIndex: 2, arrival: '12:40', departure: '--:--', distanceKm: 512, dayCount: 1 },
  ],

  // 12875: Neelachal Express (Puri -> Anand Vihar Terminal via Jaleswar, DDU)
  '12875': [
    { stationCode: 'PURI', stationName: 'Puri', stopIndex: 0, arrival: '--:--', departure: '11:00', distanceKm: 0, dayCount: 1 },
    { stationCode: 'BBS', stationName: 'Bhubaneswar', stopIndex: 1, arrival: '12:15', departure: '12:20', distanceKm: 63, dayCount: 1 },
    { stationCode: 'CTC', stationName: 'Cuttack Junction', stopIndex: 2, arrival: '12:49', departure: '12:54', distanceKm: 91, dayCount: 1 },
    { stationCode: 'BLS', stationName: 'Baleshwar', stopIndex: 3, arrival: '15:23', departure: '15:28', distanceKm: 268, dayCount: 1 },
    { stationCode: 'JER', stationName: 'Jaleswar', stopIndex: 4, arrival: '16:08', departure: '16:10', distanceKm: 316, dayCount: 1 },
    { stationCode: 'HIJ', stationName: 'Hijli', stopIndex: 5, arrival: '16:55', departure: '17:05', distanceKm: 380, dayCount: 1 },
    { stationCode: 'TATA', stationName: 'Tatanagar Junction', stopIndex: 6, arrival: '19:25', departure: '19:30', distanceKm: 515, dayCount: 1 },
    { stationCode: 'GMO', stationName: 'NSCB Gomoh Junction', stopIndex: 7, arrival: '22:45', departure: '22:50', distanceKm: 697, dayCount: 1 },
    { stationCode: 'GAYA', stationName: 'Gaya Junction', stopIndex: 8, arrival: '01:55', departure: '02:00', distanceKm: 868, dayCount: 2 },
    { stationCode: 'DDU', stationName: 'Pt. Deen Dayal Upadhyaya Jn', stopIndex: 9, arrival: '07:35', departure: '07:45', distanceKm: 1073, dayCount: 2 },
    { stationCode: 'PRYJ', stationName: 'Prayagraj Junction', stopIndex: 10, arrival: '10:45', departure: '10:55', distanceKm: 1226, dayCount: 2 },
    { stationCode: 'CNB', stationName: 'Kanpur Central', stopIndex: 11, arrival: '13:30', departure: '13:35', distanceKm: 1420, dayCount: 2 },
    { stationCode: 'ANVT', stationName: 'Anand Vihar Terminal', stopIndex: 12, arrival: '21:30', departure: '--:--', distanceKm: 1860, dayCount: 2 },
  ],

  // 12301: Howrah - New Delhi Rajdhani Express
  '12301': [
    { stationCode: 'HWH', stationName: 'Howrah Junction', stopIndex: 0, arrival: '--:--', departure: '16:50', distanceKm: 0, dayCount: 1 },
    { stationCode: 'GAYA', stationName: 'Gaya Junction', stopIndex: 1, arrival: '22:19', departure: '22:22', distanceKm: 458, dayCount: 1 },
    { stationCode: 'DDU', stationName: 'Pt. Deen Dayal Upadhyaya Jn', stopIndex: 2, arrival: '00:45', departure: '00:55', distanceKm: 663, dayCount: 2 },
    { stationCode: 'PRYJ', stationName: 'Prayagraj Junction', stopIndex: 3, arrival: '02:43', departure: '02:45', distanceKm: 816, dayCount: 2 },
    { stationCode: 'CNB', stationName: 'Kanpur Central', stopIndex: 4, arrival: '04:50', departure: '04:55', distanceKm: 1010, dayCount: 2 },
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 5, arrival: '10:05', departure: '--:--', distanceKm: 1450, dayCount: 2 },
  ],

  // 12302: New Delhi - Howrah Rajdhani Express
  '12302': [
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 0, arrival: '--:--', departure: '16:50', distanceKm: 0, dayCount: 1 },
    { stationCode: 'CNB', stationName: 'Kanpur Central', stopIndex: 1, arrival: '21:32', departure: '21:37', distanceKm: 440, dayCount: 1 },
    { stationCode: 'PRYJ', stationName: 'Prayagraj Junction', stopIndex: 2, arrival: '23:43', departure: '23:45', distanceKm: 634, dayCount: 1 },
    { stationCode: 'DDU', stationName: 'Pt. Deen Dayal Upadhyaya Jn', stopIndex: 3, arrival: '01:42', departure: '01:52', distanceKm: 787, dayCount: 2 },
    { stationCode: 'GAYA', stationName: 'Gaya Junction', stopIndex: 4, arrival: '03:45', departure: '03:48', distanceKm: 992, dayCount: 2 },
    { stationCode: 'HWH', stationName: 'Howrah Junction', stopIndex: 5, arrival: '09:55', departure: '--:--', distanceKm: 1450, dayCount: 2 },
  ],

  // 12821: Dhauli Express (Howrah -> Puri)
  '12821': [
    { stationCode: 'HWH', stationName: 'Howrah Junction', stopIndex: 0, arrival: '--:--', departure: '09:15', distanceKm: 0, dayCount: 1 },
    { stationCode: 'KGP', stationName: 'Kharagpur Junction', stopIndex: 1, arrival: '10:50', departure: '10:55', distanceKm: 115, dayCount: 1 },
    { stationCode: 'BLS', stationName: 'Baleshwar', stopIndex: 2, arrival: '12:00', departure: '12:05', distanceKm: 231, dayCount: 1 },
    { stationCode: 'BHC', stationName: 'Bhadrak', stopIndex: 3, arrival: '12:48', departure: '12:50', distanceKm: 294, dayCount: 1 },
    { stationCode: 'JJKR', stationName: 'Jajpur Keonjhar Road', stopIndex: 4, arrival: '13:21', departure: '13:23', distanceKm: 337, dayCount: 1 },
    { stationCode: 'CTC', stationName: 'Cuttack Junction', stopIndex: 5, arrival: '14:10', departure: '14:15', distanceKm: 409, dayCount: 1 },
    { stationCode: 'BBS', stationName: 'Bhubaneswar', stopIndex: 6, arrival: '14:55', departure: '15:00', distanceKm: 437, dayCount: 1 },
    { stationCode: 'PURI', stationName: 'Puri', stopIndex: 7, arrival: '16:00', departure: '--:--', distanceKm: 500, dayCount: 1 },
  ],

  // 12822: Dhauli Express (Puri -> Howrah)
  '12822': [
    { stationCode: 'PURI', stationName: 'Puri', stopIndex: 0, arrival: '--:--', departure: '10:25', distanceKm: 0, dayCount: 1 },
    { stationCode: 'BBS', stationName: 'Bhubaneswar', stopIndex: 1, arrival: '11:45', departure: '11:50', distanceKm: 63, dayCount: 1 },
    { stationCode: 'CTC', stationName: 'Cuttack Junction', stopIndex: 2, arrival: '12:15', departure: '12:20', distanceKm: 91, dayCount: 1 },
    { stationCode: 'JJKR', stationName: 'Jajpur Keonjhar Road', stopIndex: 3, arrival: '13:08', departure: '13:10', distanceKm: 163, dayCount: 1 },
    { stationCode: 'BHC', stationName: 'Bhadrak', stopIndex: 4, arrival: '13:58', departure: '14:00', distanceKm: 206, dayCount: 1 },
    { stationCode: 'BLS', stationName: 'Baleshwar', stopIndex: 5, arrival: '14:48', departure: '14:53', distanceKm: 269, dayCount: 1 },
    { stationCode: 'KGP', stationName: 'Kharagpur Junction', stopIndex: 6, arrival: '16:30', departure: '16:35', distanceKm: 385, dayCount: 1 },
    { stationCode: 'HWH', stationName: 'Howrah Junction', stopIndex: 7, arrival: '19:20', departure: '--:--', distanceKm: 500, dayCount: 1 },
  ],

  // 12841: Coromandel Express (Howrah -> Chennai Central)
  '12841': [
    { stationCode: 'HWH', stationName: 'Howrah Junction', stopIndex: 0, arrival: '--:--', departure: '15:20', distanceKm: 0, dayCount: 1 },
    { stationCode: 'KGP', stationName: 'Kharagpur Junction', stopIndex: 1, arrival: '17:00', departure: '17:05', distanceKm: 115, dayCount: 1 },
    { stationCode: 'BLS', stationName: 'Baleshwar', stopIndex: 2, arrival: '18:20', departure: '18:25', distanceKm: 231, dayCount: 1 },
    { stationCode: 'CTC', stationName: 'Cuttack Junction', stopIndex: 3, arrival: '20:45', departure: '20:50', distanceKm: 409, dayCount: 1 },
    { stationCode: 'BBS', stationName: 'Bhubaneswar', stopIndex: 4, arrival: '21:20', departure: '21:25', distanceKm: 437, dayCount: 1 },
    { stationCode: 'VSKP', stationName: 'Visakhapatnam Junction', stopIndex: 5, arrival: '04:25', departure: '04:45', distanceKm: 880, dayCount: 2 },
    { stationCode: 'BZA', stationName: 'Vijayawada Junction', stopIndex: 6, arrival: '09:55', departure: '10:05', distanceKm: 1230, dayCount: 2 },
    { stationCode: 'MAS', stationName: 'Chennai Central', stopIndex: 7, arrival: '16:45', departure: '--:--', distanceKm: 1660, dayCount: 2 },
  ],

  // 22436: Vande Bharat Express (New Delhi -> Varanasi)
  '22436': [
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 0, arrival: '--:--', departure: '06:00', distanceKm: 0, dayCount: 1 },
    { stationCode: 'CNB', stationName: 'Kanpur Central', stopIndex: 1, arrival: '10:08', departure: '10:10', distanceKm: 440, dayCount: 1 },
    { stationCode: 'PRYJ', stationName: 'Prayagraj Junction', stopIndex: 2, arrival: '12:08', departure: '12:10', distanceKm: 634, dayCount: 1 },
    { stationCode: 'BSB', stationName: 'Varanasi Junction', stopIndex: 3, arrival: '14:00', departure: '--:--', distanceKm: 755, dayCount: 1 },
  ],

  // 12417: Prayagraj Express (Prayagraj -> New Delhi)
  '12417': [
    { stationCode: 'PRYJ', stationName: 'Prayagraj Junction', stopIndex: 0, arrival: '--:--', departure: '22:10', distanceKm: 0, dayCount: 1 },
    { stationCode: 'CNB', stationName: 'Kanpur Central', stopIndex: 1, arrival: '00:25', departure: '00:30', distanceKm: 194, dayCount: 2 },
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 2, arrival: '07:00', departure: '--:--', distanceKm: 634, dayCount: 2 },
  ],

  // 12418: Prayagraj Express (New Delhi -> Prayagraj)
  '12418': [
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 0, arrival: '--:--', departure: '22:10', distanceKm: 0, dayCount: 1 },
    { stationCode: 'CNB', stationName: 'Kanpur Central', stopIndex: 1, arrival: '03:50', departure: '03:55', distanceKm: 440, dayCount: 2 },
    { stationCode: 'PRYJ', stationName: 'Prayagraj Junction', stopIndex: 2, arrival: '07:00', departure: '--:--', distanceKm: 634, dayCount: 2 },
  ],

  // 12816: Nandan Kanan Express (Anand Vihar -> Puri)
  '12816': [
    { stationCode: 'ANVT', stationName: 'Anand Vihar Terminal', stopIndex: 0, arrival: '--:--', departure: '07:30', distanceKm: 0, dayCount: 1 },
    { stationCode: 'ALJN', stationName: 'Aligarh Junction', stopIndex: 1, arrival: '09:05', departure: '09:07', distanceKm: 126, dayCount: 1 },
    { stationCode: 'TDL', stationName: 'Tundla Junction', stopIndex: 2, arrival: '10:18', departure: '10:20', distanceKm: 205, dayCount: 1 },
    { stationCode: 'CNB', stationName: 'Kanpur Central', stopIndex: 3, arrival: '13:20', departure: '13:25', distanceKm: 428, dayCount: 1 },
    { stationCode: 'FTP', stationName: 'Fatehpur', stopIndex: 4, arrival: '14:25', departure: '14:27', distanceKm: 506, dayCount: 1 },
    { stationCode: 'PRYJ', stationName: 'Prayagraj Junction', stopIndex: 5, arrival: '15:55', departure: '16:05', distanceKm: 622, dayCount: 1 },
    { stationCode: 'MZP', stationName: 'Mirzapur', stopIndex: 6, arrival: '17:08', departure: '17:10', distanceKm: 711, dayCount: 1 },
    { stationCode: 'DDU', stationName: 'Pt. Deen Dayal Upadhyaya Jn', stopIndex: 7, arrival: '18:30', departure: '18:40', distanceKm: 775, dayCount: 1 },
    { stationCode: 'DOS', stationName: 'Dehri On Sone', stopIndex: 8, arrival: '19:40', departure: '19:42', distanceKm: 894, dayCount: 1 },
    { stationCode: 'GAYA', stationName: 'Gaya Junction', stopIndex: 9, arrival: '21:30', departure: '21:35', distanceKm: 980, dayCount: 1 },
    { stationCode: 'GMO', stationName: 'NSCB Gomoh Junction', stopIndex: 10, arrival: '00:30', departure: '00:35', distanceKm: 1150, dayCount: 2 },
    { stationCode: 'ADRA', stationName: 'Adra Junction', stopIndex: 11, arrival: '02:00', departure: '02:05', distanceKm: 1227, dayCount: 2 },
    { stationCode: 'BQA', stationName: 'Bankura', stopIndex: 12, arrival: '02:48', departure: '02:50', distanceKm: 1280, dayCount: 2 },
    { stationCode: 'VSU', stationName: 'Bishnupur', stopIndex: 13, arrival: '03:14', departure: '03:16', distanceKm: 1310, dayCount: 2 },
    { stationCode: 'MDN', stationName: 'Midnapore', stopIndex: 14, arrival: '04:18', departure: '04:20', distanceKm: 1383, dayCount: 2 },
    { stationCode: 'HIJ', stationName: 'Hijli', stopIndex: 15, arrival: '06:30', departure: '06:35', distanceKm: 1409, dayCount: 2 },
    { stationCode: 'JER', stationName: 'Jaleswar', stopIndex: 16, arrival: '07:22', departure: '07:24', distanceKm: 1473, dayCount: 2 },
    { stationCode: 'BLS', stationName: 'Baleshwar', stopIndex: 17, arrival: '08:05', departure: '08:10', distanceKm: 1521, dayCount: 2 },
    { stationCode: 'BHC', stationName: 'Bhadrak', stopIndex: 18, arrival: '09:28', departure: '09:30', distanceKm: 1583, dayCount: 2 },
    { stationCode: 'JJKR', stationName: 'Jajpur Keonjhar Road', stopIndex: 19, arrival: '10:03', departure: '10:05', distanceKm: 1627, dayCount: 2 },
    { stationCode: 'CTC', stationName: 'Cuttack Junction', stopIndex: 20, arrival: '11:00', departure: '11:05', distanceKm: 1699, dayCount: 2 },
    { stationCode: 'BBS', stationName: 'Bhubaneswar', stopIndex: 21, arrival: '11:45', departure: '11:50', distanceKm: 1727, dayCount: 2 },
    { stationCode: 'PURI', stationName: 'Puri', stopIndex: 22, arrival: '13:15', departure: '--:--', distanceKm: 1790, dayCount: 2 },
  ],

  // 12802: Purushottam Express (New Delhi -> Puri)
  '12802': [
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 0, arrival: '--:--', departure: '22:40', distanceKm: 0, dayCount: 1 },
    { stationCode: 'CNB', stationName: 'Kanpur Central', stopIndex: 1, arrival: '04:00', departure: '04:05', distanceKm: 440, dayCount: 2 },
    { stationCode: 'PRYJ', stationName: 'Prayagraj Junction', stopIndex: 2, arrival: '06:55', departure: '07:00', distanceKm: 634, dayCount: 2 },
    { stationCode: 'DDU', stationName: 'Pt. Deen Dayal Upadhyaya Jn', stopIndex: 3, arrival: '09:50', departure: '10:00', distanceKm: 787, dayCount: 2 },
    { stationCode: 'GAYA', stationName: 'Gaya Junction', stopIndex: 4, arrival: '12:35', departure: '12:40', distanceKm: 992, dayCount: 2 },
    { stationCode: 'GMO', stationName: 'NSCB Gomoh Junction', stopIndex: 5, arrival: '15:25', departure: '15:30', distanceKm: 1163, dayCount: 2 },
    { stationCode: 'BKSC', stationName: 'Bokaro Steel City', stopIndex: 6, arrival: '16:35', departure: '16:40', distanceKm: 1195, dayCount: 2 },
    { stationCode: 'TATA', stationName: 'Tatanagar Junction', stopIndex: 7, arrival: '19:52', departure: '20:02', distanceKm: 1345, dayCount: 2 },
    { stationCode: 'HIJ', stationName: 'Hijli', stopIndex: 8, arrival: '22:30', departure: '22:35', distanceKm: 1479, dayCount: 2 },
    { stationCode: 'BLS', stationName: 'Baleshwar', stopIndex: 9, arrival: '00:01', departure: '00:06', distanceKm: 1591, dayCount: 3 },
    { stationCode: 'CTC', stationName: 'Cuttack Junction', stopIndex: 10, arrival: '02:30', departure: '02:35', distanceKm: 1769, dayCount: 3 },
    { stationCode: 'BBS', stationName: 'Bhubaneswar', stopIndex: 11, arrival: '03:30', departure: '03:35', distanceKm: 1797, dayCount: 3 },
    { stationCode: 'PURI', stationName: 'Puri', stopIndex: 12, arrival: '05:25', departure: '--:--', distanceKm: 1860, dayCount: 3 },
  ],

  // 12952: New Delhi - Mumbai Central Tejas Rajdhani
  '12952': [
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 0, arrival: '--:--', departure: '16:55', distanceKm: 0, dayCount: 1 },
    { stationCode: 'KOTA', stationName: 'Kota Junction', stopIndex: 1, arrival: '21:30', departure: '21:40', distanceKm: 465, dayCount: 1 },
    { stationCode: 'RTM', stationName: 'Ratlam Junction', stopIndex: 2, arrival: '00:55', departure: '00:58', distanceKm: 731, dayCount: 2 },
    { stationCode: 'BRC', stationName: 'Vadodara Junction', stopIndex: 3, arrival: '04:10', departure: '04:18', distanceKm: 992, dayCount: 2 },
    { stationCode: 'ST', stationName: 'Surat', stopIndex: 4, arrival: '05:48', departure: '05:53', distanceKm: 1122, dayCount: 2 },
    { stationCode: 'BVI', stationName: 'Borivali', stopIndex: 5, arrival: '07:58', departure: '08:00', distanceKm: 1355, dayCount: 2 },
    { stationCode: 'MMCT', stationName: 'Mumbai Central', stopIndex: 6, arrival: '08:35', departure: '--:--', distanceKm: 1385, dayCount: 2 },
  ],

  // 12393: Sampoorna Kranti Express (Patna -> New Delhi)
  '12393': [
    { stationCode: 'PNBE', stationName: 'Patna Junction', stopIndex: 0, arrival: '--:--', departure: '19:25', distanceKm: 0, dayCount: 1 },
    { stationCode: 'DDU', stationName: 'Pt. Deen Dayal Upadhyaya Jn', stopIndex: 1, arrival: '22:20', departure: '22:30', distanceKm: 211, dayCount: 1 },
    { stationCode: 'CNB', stationName: 'Kanpur Central', stopIndex: 2, arrival: '02:25', departure: '02:30', distanceKm: 557, dayCount: 2 },
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 3, arrival: '07:55', departure: '--:--', distanceKm: 1001, dayCount: 2 },
  ],

  // 12394: Sampoorna Kranti Express (New Delhi -> Patna)
  '12394': [
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 0, arrival: '--:--', departure: '17:30', distanceKm: 0, dayCount: 1 },
    { stationCode: 'CNB', stationName: 'Kanpur Central', stopIndex: 1, arrival: '22:22', departure: '22:30', distanceKm: 444, dayCount: 1 },
    { stationCode: 'DDU', stationName: 'Pt. Deen Dayal Upadhyaya Jn', stopIndex: 2, arrival: '02:25', departure: '02:35', distanceKm: 790, dayCount: 2 },
    { stationCode: 'PNBE', stationName: 'Patna Junction', stopIndex: 3, arrival: '06:50', departure: '--:--', distanceKm: 1001, dayCount: 2 },
  ],

  // 12842: Coromandel Express (Chennai Central -> Howrah)
  '12842': [
    { stationCode: 'MAS', stationName: 'Chennai Central', stopIndex: 0, arrival: '--:--', departure: '07:00', distanceKm: 0, dayCount: 1 },
    { stationCode: 'BZA', stationName: 'Vijayawada Junction', stopIndex: 1, arrival: '13:00', departure: '13:10', distanceKm: 430, dayCount: 1 },
    { stationCode: 'VSKP', stationName: 'Visakhapatnam Junction', stopIndex: 2, arrival: '19:40', departure: '20:00', distanceKm: 780, dayCount: 1 },
    { stationCode: 'BBS', stationName: 'Bhubaneswar', stopIndex: 3, arrival: '02:15', departure: '02:20', distanceKm: 1223, dayCount: 2 },
    { stationCode: 'CTC', stationName: 'Cuttack Junction', stopIndex: 4, arrival: '02:50', departure: '02:55', distanceKm: 1251, dayCount: 2 },
    { stationCode: 'BLS', stationName: 'Baleshwar', stopIndex: 5, arrival: '05:15', departure: '05:20', distanceKm: 1429, dayCount: 2 },
    { stationCode: 'KGP', stationName: 'Kharagpur Junction', stopIndex: 6, arrival: '07:15', departure: '07:20', distanceKm: 1545, dayCount: 2 },
    { stationCode: 'HWH', stationName: 'Howrah Junction', stopIndex: 7, arrival: '11:00', departure: '--:--', distanceKm: 1660, dayCount: 2 },
  ],

  // 22435: Vande Bharat Express (Varanasi -> New Delhi)
  '22435': [
    { stationCode: 'BSB', stationName: 'Varanasi Junction', stopIndex: 0, arrival: '--:--', departure: '15:00', distanceKm: 0, dayCount: 1 },
    { stationCode: 'PRYJ', stationName: 'Prayagraj Junction', stopIndex: 1, arrival: '16:30', departure: '16:32', distanceKm: 121, dayCount: 1 },
    { stationCode: 'CNB', stationName: 'Kanpur Central', stopIndex: 2, arrival: '18:30', departure: '18:32', distanceKm: 315, dayCount: 1 },
    { stationCode: 'NDLS', stationName: 'New Delhi', stopIndex: 3, arrival: '23:00', departure: '--:--', distanceKm: 755, dayCount: 1 },
  ],
};
