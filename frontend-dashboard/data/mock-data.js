window.MOCK_DATA = {
  samplePostcodes: {
    "EC1A 1BB": {
      label: "Barbican, London",
      coordinates: { lat: 51.5202, lng: -0.0977 }
    },
    "SW1A 0AA": {
      label: "Westminster, London",
      coordinates: { lat: 51.501, lng: -0.1416 }
    },
    "M1 1AE": {
      label: "Manchester City Centre",
      coordinates: { lat: 53.4808, lng: -2.2374 }
    }
  },
  patientSummary: {
    alias: "A. Smith",
    homePostcode: "EC1A 1BB",
    activity: [4, 3, 5, 4, 6, 5, 4],
    activityDates: [
      "2025-10-16",
      "2025-10-17",
      "2025-10-18",
      "2025-10-19",
      "2025-10-20",
      "2025-10-21",
      "2025-10-22"
    ],
    nextAppointment: {
      date: "2025-10-25",
      time: "10:30",
      gpName: "City Road Medical Centre",
      address: "190 City Rd, London EC1V 2QH"
    },
    medicationReminder: {
      time: "20:00",
      note: "Evening inhaler",
      status: "Due tonight"
    },
    supportNote: "Weekly exercise target achieved — keep light walks going!"
  },
  weatherToday: {
    temperatureC: 12,
    humidity: 48,
    aqi: 76,
    condition: "Partly cloudy",
    icon: "⛅",
    advice:
      "AQI is moderate. Plan shorter outdoor walks and keep your scarf handy."
  },
  gpLocations: [
    {
      id: "gp-01",
      name: "City Road Medical Centre",
      postcode: "EC1V 2PD",
      coordinates: { lat: 51.527193, lng: -0.086555 },
      rating: 4.6,
      recoveryRate: 0.78,
      waitingTimeDays: 3,
      patients: 1480,
      isNhs: true,
      phone: "+44 20 7608 2500"
    },
    {
      id: "gp-02",
      name: "Goswell Road Practice",
      postcode: "EC1V 7PD",
      coordinates: { lat: 51.527837, lng: -0.102135 },
      rating: 4.2,
      recoveryRate: 0.73,
      waitingTimeDays: 5,
      patients: 1120,
      isNhs: true,
      phone: "+44 20 7253 6120"
    },
    {
      id: "gp-03",
      name: "Westminster Health Centre",
      postcode: "SW1A 2DX",
      coordinates: { lat: 51.501812, lng: -0.137671 },
      rating: 4.8,
      recoveryRate: 0.81,
      waitingTimeDays: 4,
      patients: 1320,
      isNhs: true,
      phone: "+44 20 7930 3606"
    },
    {
      id: "gp-04",
      name: "Manchester COPD Clinic",
      postcode: "M1 3LD",
      coordinates: { lat: 53.477716, lng: -2.238147 },
      rating: 4.4,
      recoveryRate: 0.76,
      waitingTimeDays: 2,
      patients: 1210,
      isNhs: false,
      phone: "+44 161 236 5100"
    },
    {
      id: "gp-05",
      name: "Islington Care Hub",
      postcode: "N1 8XX",
      coordinates: { lat: 51.535197, lng: -0.10045 },
      rating: 4.1,
      recoveryRate: 0.7,
      waitingTimeDays: 6,
      patients: 980,
      isNhs: true,
      phone: "+44 20 7359 3100"
    }
  ]
};

