'use client';

import { useState } from 'react';
import { jobService, JobCreateRequest, JobCreateResponse } from './services/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'detail'>('create');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [jobs, setJobs] = useState<JobCreateResponse[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobCreateResponse | null>(null);
  const [jobId, setJobId] = useState('');

  // Form state
  const [formData, setFormData] = useState<JobCreateRequest>({
    queueType: 'EMAIL',
    taskType: '',
    payload: {},
    scheduledAt: '',
    priority: 1,
    maxAttempts: 3,
    idempotencyKey: '',
  });

  const [payloadInput, setPayloadInput] = useState('{}');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Parse payload safely
      let payloadObj = {};
      if (payloadInput.trim()) {
        payloadObj = JSON.parse(payloadInput);
      }

      const jobData: JobCreateRequest = {
        ...formData,
        payload: payloadObj,

        // FIX: enforce idempotencyKey
        idempotencyKey:
            formData.idempotencyKey && formData.idempotencyKey.trim() !== ''
                ? formData.idempotencyKey
                : crypto.randomUUID(),

        // FIX: proper ISO format for Spring (CRITICAL)
        scheduledAt:
            formData.scheduledAt && formData.scheduledAt !== ''
                ? new Date(formData.scheduledAt).toISOString()
                : undefined,
      };

      const result = await jobService.createJob(jobData);

      setMessage(`Job created successfully! ID: ${result.id}`);

      // Reset form
      setFormData({
        queueType: 'EMAIL',
        taskType: '',
        payload: {},
        scheduledAt: '',
        priority: 1,
        maxAttempts: 3,
        idempotencyKey: '',
      });

      setPayloadInput('{}');

    } catch (error: any) {
      setMessage(
          error?.response?.data?.error ||
          error?.message ||
          'Unknown error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGetJob = async () => {
    if (!jobId) {
      setMessage('Please enter a job ID');
      return;
    }

    setLoading(true);
    setMessage('');
    setSelectedJob(null);

    try {
      const result = await jobService.getJob(jobId);
      setSelectedJob(result);
      setMessage('Job found!');
    } catch (error: any) {
      setMessage(`Error fetching job: ${error.message || 'Job not found'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetAllJobs = async () => {
    setLoading(true);
    setMessage('');

    try {
      const result = await jobService.getAllJobs();
      setJobs(result);
      setMessage(`Found ${result.length} jobs`);
    } catch (error: any) {
      setMessage(`Error fetching jobs: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ChronoQueue Manager</h1>
          <p className="text-gray-600">Simple job queue management interface</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Create Job
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                View All Jobs
              </button>
              <button
                onClick={() => setActiveTab('detail')}
                className={`px-6 py-4 text-sm font-medium border-b-2 ${
                  activeTab === 'detail'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Job Details
              </button>
            </nav>
          </div>

          {/* Message Display */}
          {message && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-blue-800 text-sm">{message}</p>
            </div>
          )}

          {/* Create Job Tab */}
          {activeTab === 'create' && (
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Queue Type
                    </label>
                    <select
                      value={formData.queueType}
                      onChange={(e) => setFormData({...formData, queueType: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="EMAIL">Email</option>
                      <option value="NOTIFICATION">Notification</option>
                      <option value="REPORT">Report</option>
                      <option value="DATA_SYNC">Data Sync</option>
                      <option value="BACKGROUND_TASK">Background Task</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Type
                    </label>
                    <input
                      type="text"
                      value={formData.taskType}
                      onChange={(e) => setFormData({...formData, taskType: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., email_notification, data_processing"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Attempts
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxAttempts}
                      onChange={(e) => setFormData({...formData, maxAttempts: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled At (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledAt || ''}
                      onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idempotency Key (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.idempotencyKey}
                      onChange={(e) => setFormData({...formData, idempotencyKey: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., unique-key-123"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payload (JSON)
                  </label>
                  <textarea
                    value={payloadInput}
                    onChange={(e) => setPayloadInput(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder='{"key": "value", "number": 123}'
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter valid JSON for the job payload</p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Job'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* View All Jobs Tab */}
          {activeTab === 'list' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">All Jobs</h2>
                <button
                  onClick={handleGetAllJobs}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {jobs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No jobs found. Create one to get started!</p>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{job.taskType}</h3>
                          <p className="text-sm text-gray-600">ID: {job.id}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            job.state === 'SUCCEEDED' ? 'bg-green-100 text-green-800' :
                            job.state === 'FAILED' ? 'bg-red-100 text-red-800' :
                            job.state === 'DEAD' ? 'bg-red-200 text-red-900' :
                            job.state === 'RUNNING' ? 'bg-yellow-100 text-yellow-800' :
                            job.state === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.state}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Queue:</span> {job.queueType}
                        </div>
                        <div>
                          <span className="font-medium">Priority:</span> {job.priority}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {new Date(job.createdAt).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Scheduled:</span> {job.scheduledAt ? new Date(job.scheduledAt).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Job Details Tab */}
          {activeTab === 'detail' && (
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={jobId}
                      onChange={(e) => setJobId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter job ID to fetch details"
                    />
                    <button
                      onClick={handleGetJob}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Get Job'}
                    </button>
                  </div>
                </div>

                {selectedJob && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Job ID</span>
                        <p className="mt-1 text-gray-900 font-mono">{selectedJob.id}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Task Type</span>
                        <p className="mt-1 text-gray-900">{selectedJob.taskType}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Queue Type</span>
                        <p className="mt-1 text-gray-900">{selectedJob.queueType}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">State</span>
                        <p className="mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            selectedJob.state === 'SUCCEEDED' ? 'bg-green-100 text-green-800' :
                            selectedJob.state === 'FAILED' ? 'bg-red-100 text-red-800' :
                            selectedJob.state === 'DEAD' ? 'bg-red-200 text-red-900' :
                            selectedJob.state === 'RUNNING' ? 'bg-yellow-100 text-yellow-800' :
                            selectedJob.state === 'PENDING' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedJob.state}
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Priority</span>
                        <p className="mt-1 text-gray-900">{selectedJob.priority}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Max Attempts</span>
                        <p className="mt-1 text-gray-900">{selectedJob.maxAttempts}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Created At</span>
                        <p className="mt-1 text-gray-900">{new Date(selectedJob.createdAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Scheduled At</span>
                        <p className="mt-1 text-gray-900">{selectedJob.scheduledAt ? new Date(selectedJob.scheduledAt).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-500">Payload</span>
                      <pre className="mt-2 p-4 bg-gray-50 rounded-lg overflow-auto max-h-60 font-mono text-sm">
                        {JSON.stringify(selectedJob.payload, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}