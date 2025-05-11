// This file extends the existing mockData.ts types with MongoDB specific fields

import { VaccinationDrive as BaseVaccinationDrive } from './mockData';

// First, let's modify the import to use our new StudentVaccinationStatus type
import { Student as MockStudent } from './mockData';

// Define the StudentVaccinationStatus type that includes all possible statuses
export type StudentVaccinationStatus = 'scheduled' | 'completed' | 'cancelled';

// Since the base Student type in mockData doesn't support 'cancelled' status,
// we need to create an extended base student type that does
export interface BaseStudent extends Omit<MockStudent, 'vaccinations'> {
  id: string;
  vaccinations: {
    driveId: string;
    vaccineName: string;
    date: string;
    status: StudentVaccinationStatus;
  }[];
}

// MongoDB related types
export interface MongoDBDocument {
  _id: string;
  id?: string; // Keeping for backward compatibility
  createdAt?: string;
  updatedAt?: string;
}

// Extended types for API responses
export interface Student extends Omit<BaseStudent, 'id'>, MongoDBDocument {
  // _id is already included through MongoDBDocument
  vaccinations: {
    driveId: string;
    vaccineName: string;
    date: string;
    status: StudentVaccinationStatus;
  }[];
}

export interface VaccinationDrive extends Omit<BaseVaccinationDrive, 'id'>, MongoDBDocument {
  // _id is already included through MongoDBDocument
}

// Add helper functions to convert between types
export const convertToUIStudent = (student: Student): BaseStudent => {
  return {
    ...student,
    id: student._id || student.id || '',
    vaccinations: student.vaccinations.map(v => ({
      ...v,
      // Keep the status as is since our BaseStudent type now supports 'cancelled'
    })),
  };
};

export const convertToUIVaccinationDrive = (drive: VaccinationDrive): BaseVaccinationDrive => {
  return {
    ...drive,
    id: drive._id || drive.id || '',
  };
};
