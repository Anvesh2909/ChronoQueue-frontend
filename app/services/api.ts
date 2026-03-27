import axios from 'axios';

const API_BASE_URL = 'http://16.112.57.1:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface JobCreateRequest {
  queueType: 'EMAIL' | 'NOTIFICATION' | 'REPORT' | 'DATA_SYNC' | 'BACKGROUND_TASK';
  taskType: string;
  payload: Record<string, any>;
  scheduledAt?: string;
  priority?: number;
  maxAttempts?: number;
  idempotencyKey?: string;
}

export interface JobCreateResponse {
  id: string;
  queueType: string;
  taskType: string;
  payload: Record<string, any>;
  scheduledAt: string;
  state: string;
  priority: number;
  maxAttempts: number;
  createdAt: string;
}

export const jobService = {
  createJob: async (data: JobCreateRequest): Promise<JobCreateResponse> => {
    try {
      const response = await api.post('/api/jobs', data);
      return response.data;
    } catch (error: any) {
      console.error('POST /api/jobs failed:', error.response?.data || error.message);
      throw error;
    }
  },

  getJob: async (id: string): Promise<JobCreateResponse> => {
    const response = await api.get(`/api/jobs/${id}`);
    return response.data;
  },

  getAllJobs: async (): Promise<JobCreateResponse[]> => {
    const response = await api.get('/api/jobs');
    return response.data;
  },
};