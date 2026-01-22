import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  Users,
  ArrowRight,
  Brain,
  Target,
  BarChart3,
  Trash2,
  Clock,
  Zap
} from 'lucide-react';
import { jobApi } from '../services/api';

function HomePage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setLoading(true);
      const response = await jobApi.getAll();
      setJobs(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(files) {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or DOCX file');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const response = await jobApi.create(file);
      navigate(`/jobs/${response.data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  }

  async function handleDeleteJob(e, jobId) {
    e.stopPropagation();
    if (!confirm('Delete this job and all candidates?')) return;

    try {
      await jobApi.delete(jobId);
      setJobs(jobs.filter(j => j.id !== jobId));
    } catch (err) {
      setError(err.message);
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="home-page">
      <div className="container">
        {/* Hero */}
        <section className="hero">
          <div className="hero-glow"></div>
          <h1>
            <span className="gradient-text">AI-Powered</span> Resume Screening
          </h1>
          <p>
            Upload job descriptions and resumes. Get intelligent match scores
            with detailed explanations in seconds.
          </p>

          <div className="features">
            <div className="feature">
              <Brain size={18} />
              <span>Semantic Analysis</span>
            </div>
            <div className="feature">
              <BarChart3 size={18} />
              <span>Weighted Scoring</span>
            </div>
            <div className="feature">
              <Target size={18} />
              <span>Explainable Results</span>
            </div>
          </div>
        </section>

        {/* Upload */}
        <section className="upload-section">
          <div className="upload-card card card-elevated">
            <div className="upload-header">
              <Zap size={20} className="upload-icon" />
              <div>
                <h2>New Evaluation</h2>
                <p>Upload a job description to start matching</p>
              </div>
            </div>

            <div
              className={`upload-zone ${dragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={uploading}
              />

              {uploading ? (
                <div className="upload-loading">
                  <div className="spinner spinner-lg"></div>
                  <span>Analyzing with AI...</span>
                </div>
              ) : (
                <>
                  <div className="upload-icon-box">
                    <Upload size={24} />
                  </div>
                  <span className="upload-title">Drop your job description</span>
                  <span className="upload-hint">PDF or DOCX • Click to browse</span>
                </>
              )}
            </div>

            {error && (
              <div className="error-alert">{error}</div>
            )}
          </div>
        </section>

        {/* Jobs */}
        <section className="jobs-section">
          <div className="section-header">
            <h2>Recent Jobs</h2>
            <span className="jobs-count">{jobs.length}</span>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner spinner-lg"></div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <FileText size={28} />
              </div>
              <h3>No jobs yet</h3>
              <p>Upload a job description to get started</p>
            </div>
          ) : (
            <div className="jobs-list animate-stagger">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="job-card card card-interactive"
                  onClick={() => navigate(`/jobs/${job.id}`)}
                >
                  <div className="job-icon">
                    <FileText size={20} />
                  </div>

                  <div className="job-info">
                    <h3>{job.title || 'Untitled Position'}</h3>
                    <div className="job-meta">
                      <span><Users size={14} /> {job.totalCandidates || 0}</span>
                      <span><Clock size={14} /> {formatDate(job.createdAt)}</span>
                    </div>
                  </div>

                  {(job.shortlistedCount > 0) && (
                    <span className="badge badge-success">
                      {job.shortlistedCount} shortlisted
                    </span>
                  )}

                  <div className="job-actions">
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={(e) => handleDeleteJob(e, job.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                    <ArrowRight size={18} className="arrow" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <style>{`
        .home-page {
          position: relative;
        }

        /* Hero */
        .hero {
          position: relative;
          text-align: center;
          padding: var(--space-16) 0;
          max-width: 680px;
          margin: 0 auto;
        }

        .hero-glow {
          position: absolute;
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          width: 600px;
          height: 400px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        .hero h1 {
          font-size: var(--text-4xl);
          margin-bottom: var(--space-4);
          position: relative;
        }

        .gradient-text {
          background: linear-gradient(135deg, var(--primary-400), var(--accent-400));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero p {
          font-size: var(--text-lg);
          color: var(--gray-400);
          max-width: 500px;
          margin: 0 auto;
        }

        .features {
          display: flex;
          justify-content: center;
          gap: var(--space-6);
          margin-top: var(--space-8);
        }

        .feature {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          color: var(--gray-400);
        }

        .feature svg {
          color: var(--primary-400);
        }

        /* Upload */
        .upload-section {
          max-width: 580px;
          margin: 0 auto var(--space-16);
        }

        .upload-card {
          padding: var(--space-6);
        }

        .upload-header {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .upload-header .upload-icon {
          color: var(--primary-400);
        }

        .upload-header h2 {
          font-size: var(--text-lg);
          margin-bottom: var(--space-1);
        }

        .upload-header p {
          font-size: var(--text-sm);
          color: var(--gray-500);
        }

        .upload-zone {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-10);
          border: 2px dashed var(--border-default);
          border-radius: var(--radius-xl);
          background: var(--bg-secondary);
          cursor: pointer;
          transition: all var(--duration-normal) var(--ease-out);
        }

        .upload-zone:hover {
          border-color: var(--primary-500);
          background: var(--bg-active);
        }

        .upload-zone.active {
          border-color: var(--primary-400);
          background: var(--bg-active);
          border-style: solid;
        }

        .upload-zone.uploading {
          pointer-events: none;
        }

        .upload-zone input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }

        .upload-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          color: var(--gray-400);
          margin-bottom: var(--space-4);
        }

        .upload-title {
          font-size: var(--text-base);
          font-weight: 500;
          color: var(--gray-200);
          margin-bottom: var(--space-1);
        }

        .upload-hint {
          font-size: var(--text-sm);
          color: var(--gray-500);
        }

        .upload-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
        }

        .upload-loading span {
          font-size: var(--text-sm);
          color: var(--primary-400);
          font-weight: 500;
        }

        .error-alert {
          margin-top: var(--space-4);
          padding: var(--space-3) var(--space-4);
          background: var(--danger-bg);
          border: 1px solid var(--danger-border);
          border-radius: var(--radius-lg);
          color: var(--danger-400);
          font-size: var(--text-sm);
        }

        /* Jobs */
        .jobs-section {
          max-width: 700px;
          margin: 0 auto;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }

        .section-header h2 {
          font-size: var(--text-lg);
        }

        .jobs-count {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          height: 24px;
          padding: 0 var(--space-2);
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--gray-400);
        }

        .loading-state {
          display: flex;
          justify-content: center;
          padding: var(--space-16);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-16);
          background: var(--bg-primary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          text-align: center;
        }

        .empty-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-xl);
          color: var(--gray-500);
          margin-bottom: var(--space-4);
        }

        .empty-state h3 {
          font-size: var(--text-base);
          margin-bottom: var(--space-1);
        }

        .jobs-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .job-card {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-4) var(--space-5);
        }

        .job-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, var(--primary-500), var(--accent-500));
          border-radius: var(--radius-lg);
          color: white;
          flex-shrink: 0;
        }

        .job-info {
          flex: 1;
          min-width: 0;
        }

        .job-info h3 {
          font-size: var(--text-base);
          font-weight: 500;
          margin-bottom: var(--space-1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .job-meta {
          display: flex;
          gap: var(--space-4);
          font-size: var(--text-sm);
          color: var(--gray-500);
        }

        .job-meta span {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .job-actions {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .arrow {
          color: var(--gray-600);
          transition: all var(--duration-fast) var(--ease-out);
        }

        .job-card:hover .arrow {
          color: var(--gray-300);
          transform: translateX(4px);
        }

        @media (max-width: 768px) {
          .hero h1 {
            font-size: var(--text-3xl);
          }

          .features {
            flex-direction: column;
            align-items: center;
            gap: var(--space-3);
          }

          .job-meta span:last-child {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default HomePage;
