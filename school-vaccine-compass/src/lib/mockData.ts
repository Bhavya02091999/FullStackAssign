
// Types
export interface Student {
  id: string;
  name: string;
  class: string;
  section: string;
  rollNumber: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  vaccinations: {
    driveId: string;
    vaccineName: string;
    date: string;
    status: 'completed' | 'scheduled' | 'cancelled'; // Updated to include 'cancelled'
  }[];
}

export interface VaccinationDrive {
  id: string;
  name: string;
  date: string;
  vaccineName: string;
  totalDoses: number;
  usedDoses: number;
  targetClasses: string[];
  status: 'scheduled' | 'completed' | 'cancelled';
}

// Mock Data
export const mockStudents: Student[] = [
  {
    id: '1',
    name: 'John Smith',
    class: '8',
    section: 'A',
    rollNumber: '2301',
    age: 13,
    gender: 'Male',
    vaccinations: [
      {
        driveId: '1',
        vaccineName: 'MMR',
        date: '2023-11-15',
        status: 'completed'
      },
      {
        driveId: '2',
        vaccineName: 'Tdap',
        date: '2024-02-10',
        status: 'completed'
      }
    ]
  },
  {
    id: '2',
    name: 'Emma Johnson',
    class: '7',
    section: 'B',
    rollNumber: '2201',
    age: 12,
    gender: 'Female',
    vaccinations: [
      {
        driveId: '1',
        vaccineName: 'MMR',
        date: '2023-11-15',
        status: 'completed'
      }
    ]
  },
  {
    id: '3',
    name: 'Michael Brown',
    class: '9',
    section: 'A',
    rollNumber: '2401',
    age: 14,
    gender: 'Male',
    vaccinations: []
  },
  {
    id: '4',
    name: 'Sophia Davis',
    class: '6',
    section: 'C',
    rollNumber: '2101',
    age: 11,
    gender: 'Female',
    vaccinations: [
      {
        driveId: '1',
        vaccineName: 'MMR',
        date: '2023-11-15',
        status: 'completed'
      },
      {
        driveId: '3',
        vaccineName: 'Hepatitis B',
        date: '2024-06-05',
        status: 'scheduled'
      }
    ]
  },
  {
    id: '5',
    name: 'Daniel Miller',
    class: '8',
    section: 'B',
    rollNumber: '2302',
    age: 13,
    gender: 'Male',
    vaccinations: [
      {
        driveId: '2',
        vaccineName: 'Tdap',
        date: '2024-02-10',
        status: 'completed'
      }
    ]
  },
  {
    id: '6',
    name: 'Olivia Wilson',
    class: '7',
    section: 'A',
    rollNumber: '2202',
    age: 12,
    gender: 'Female',
    vaccinations: [
      {
        driveId: '1',
        vaccineName: 'MMR',
        date: '2023-11-15',
        status: 'completed'
      },
      {
        driveId: '2',
        vaccineName: 'Tdap',
        date: '2024-02-10',
        status: 'completed'
      },
      {
        driveId: '3',
        vaccineName: 'Hepatitis B',
        date: '2024-06-05',
        status: 'scheduled'
      }
    ]
  },
  {
    id: '7',
    name: 'James Anderson',
    class: '9',
    section: 'B',
    rollNumber: '2402',
    age: 14,
    gender: 'Male',
    vaccinations: []
  },
  {
    id: '8',
    name: 'Emily Taylor',
    class: '6',
    section: 'A',
    rollNumber: '2102',
    age: 11,
    gender: 'Female',
    vaccinations: [
      {
        driveId: '2',
        vaccineName: 'Tdap',
        date: '2024-02-10',
        status: 'completed'
      }
    ]
  }
];

export const mockVaccinationDrives: VaccinationDrive[] = [
  {
    id: '1',
    name: 'Annual MMR Vaccination',
    date: '2023-11-15',
    vaccineName: 'MMR',
    totalDoses: 100,
    usedDoses: 84,
    targetClasses: ['6', '7', '8'],
    status: 'completed'
  },
  {
    id: '2',
    name: 'Tdap Booster Drive',
    date: '2024-02-10',
    vaccineName: 'Tdap',
    totalDoses: 75,
    usedDoses: 62,
    targetClasses: ['7', '8', '9'],
    status: 'completed'
  },
  {
    id: '3',
    name: 'Hepatitis B Vaccination',
    date: '2024-06-05',
    vaccineName: 'Hepatitis B',
    totalDoses: 120,
    usedDoses: 0,
    targetClasses: ['6', '7', '8', '9'],
    status: 'scheduled'
  },
  {
    id: '4',
    name: 'HPV Vaccination Drive',
    date: '2024-06-20',
    vaccineName: 'HPV',
    totalDoses: 80,
    usedDoses: 0,
    targetClasses: ['8', '9'],
    status: 'scheduled'
  }
];
