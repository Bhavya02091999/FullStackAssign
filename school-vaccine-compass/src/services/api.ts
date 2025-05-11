
import axios from 'axios';
import { toast } from 'sonner';
import { Student, VaccinationDrive } from '@/lib/types';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    toast.error(message);
    return Promise.reject(error);
  }
);

// Student API
export const studentApi = {
  getAll: async (): Promise<Student[]> => {
    const response = await api.get('/students');
    return response.data;
  },
  
  getById: async (id: string): Promise<Student> => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },
  
  create: async (student: Omit<Student, '_id' | 'id' | 'vaccinations'>): Promise<Student> => {
    const response = await api.post('/students', student);
    return response.data;
  },
  
  update: async (student: Student): Promise<Student> => {
    const response = await api.put(`/students/${student._id}`, student);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}`);
  },
  
  importStudents: async (students: Omit<Student, '_id' | 'id' | 'vaccinations'>[]): Promise<Student[]> => {
    const response = await api.post('/students/import', students);
    return response.data;
  },
  
  markVaccinated: async (studentId: string, driveId: string): Promise<Student> => {
    const response = await api.post(`/students/${studentId}/vaccinate/${driveId}`);
    return response.data;
  }
};

// Vaccination Drive API
export const vaccinationDriveApi = {
  getAll: async (): Promise<VaccinationDrive[]> => {
    const response = await api.get('/vaccination-drives');
    return response.data;
  },
  
  getById: async (id: string): Promise<VaccinationDrive> => {
    const response = await api.get(`/vaccination-drives/${id}`);
    return response.data;
  },
  
  create: async (drive: Omit<VaccinationDrive, '_id' | 'id' | 'usedDoses' | 'status'>): Promise<VaccinationDrive> => {
    const response = await api.post('/vaccination-drives', drive);
    return response.data;
  },
  
  update: async (drive: VaccinationDrive): Promise<VaccinationDrive> => {
    const response = await api.put(`/vaccination-drives/${drive._id}`, drive);
    return response.data;
  },
  
  cancel: async (id: string): Promise<VaccinationDrive> => {
    const response = await api.put(`/vaccination-drives/${id}/cancel`);
    return response.data;
  },
  
  complete: async (id: string): Promise<VaccinationDrive> => {
    const response = await api.put(`/vaccination-drives/${id}/complete`);
    return response.data;
  },
  
  getVaccinatedStudents: async (driveId: string): Promise<Student[]> => {
    const response = await api.get(`/vaccination-drives/${driveId}/students`);
    return response.data;
  },
  
  markStudentVaccinated: async (driveId: string, studentId: string): Promise<{ student: Student; drive: VaccinationDrive }> => {
    const response = await api.post(`/vaccination-drives/${driveId}/vaccinate`, { studentId });
    return response.data;
  },
  
  getUpcoming: async (): Promise<VaccinationDrive[]> => {
    const response = await api.get('/vaccination-drives/upcoming/list');
    return response.data;
  },
  
  getStats: async (): Promise<{ total: number; vaccinated: number; percentage: number }> => {
    const response = await api.get('/vaccination-drives/stats/overview');
    return response.data;
  }
};
