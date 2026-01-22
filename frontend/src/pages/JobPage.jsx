import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Upload,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronLeft,
  Settings,
  RefreshCw,
  Eye,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { jobApi, candidateApi } from '../services/api';

function JobPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [threshold, setThreshold] = useState(70);
  const [filter, setFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadData();
  }, [jobId]);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [jobResponse, candidatesResponse] = await Promise.all([
        jobApi.getById(jobId),
        candidateApi.getAll(jobId),
      ]);

      setJob(jobResponse.data);
      setThreshold(jobResponse.data.threshold || 70);
      setCandidates(candidatesResponse.data.candidates || []);
      setStats(candidatesResponse.data.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResumeUpload(files) {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((f) =>
      f.type === 'application/pdf' ||
      f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    if (validFiles.length === 0) {
      setError('Please upload PDF or DOCX files');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await candidateApi.upload(jobId, validFiles);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function applyThreshold() {
    try {
      await jobApi.updateThreshold(jobId, threshold);
      await loadData();
      setShowSettings(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteCandidate(candidateId) {
    if (!confirm('Delete this candidate?')) return;

    try {
      await candidateApi.delete(jobId, candidateId);
      setCandidates(candidates.filter((c) => c.id !== candidateId));
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredCandidates = candidates.filter((c) => {
    if (filter === 'all') return true;
    return c.classification === filter;
  });

  function getScoreClass(score) {
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  if (loading) {
    return (
      <div className="container">
        <div className="page-loading">
          <div className="spinner spinner-lg"></div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container">
        <div className="page-error">
          <p>Job not found</p>
          <Link to="/" className="btn btn-primary">Go Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="job-page">
      <div className="container">
        {/* Header */}
        <header className="page-header">
          <Link to="/" className="back-link">
            <ChevronLeft size={20} />
            <span>Back</span>
          </Link>

          <div className="header-row">
            <div className="header-info">
              <h1>{job.structuredJD?.title || 'Job Position'}</h1>
              <div className="header-badges">
                {job.structuredJD?.seniority_level && (
                  <span className="badge badge-neutral">{job.structuredJD.seniority_level}</span>
                )}
              </div>
            </div>
            <div className="header-actions">
              <button className="btn btn-secondary" onClick={() => setShowSettings(!showSettings)}>
                <Settings size={16} />
                <span className="hide-mobile">Settings</span>
              </button>
              <button className="btn btn-ghost btn-icon" onClick={loadData}>
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Settings Modal */}
        {showSettings && (
          <div className="settings-panel card card-elevated animate-fade-in-up">
            <div className="settings-header">
              <h3>Threshold Settings</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowSettings(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="threshold-control">
              <div className="threshold-display">
                <span className="threshold-value">{threshold}</span>
              </div>
              <input
                type="range"
                className="slider"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              />
              <div className="threshold-scale">
                <span>0</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            <div className="threshold-legend">
              <div className="legend-item success">
                <CheckCircle size={14} />
                <span>≥ {threshold}: Shortlisted</span>
              </div>
              <div className="legend-item warning">
                <AlertTriangle size={14} />
                <span>{Math.max(0, threshold - 10)}-{threshold - 1}: Borderline</span>
              </div>
              <div className="legend-item danger">
                <XCircle size={14} />
                <span>&lt; {Math.max(0, threshold - 10)}: Rejected</span>
              </div>
            </div>

            <button className="btn btn-primary" onClick={applyThreshold} style={{ width: '100%' }}>
              Apply Changes
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <Users size={18} />
            <div className="stat-data">
              <span className="stat-value">{stats?.total || 0}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
          <div className="stat-card success">
            <CheckCircle size={18} />
            <div className="stat-data">
              <span className="stat-value">{stats?.shortlisted || 0}</span>
              <span className="stat-label">Shortlisted</span>
            </div>
          </div>
          <div className="stat-card warning">
            <AlertTriangle size={18} />
            <div className="stat-data">
              <span className="stat-value">{stats?.borderline || 0}</span>
              <span className="stat-label">Borderline</span>
            </div>
          </div>
          <div className="stat-card">
            <TrendingUp size={18} />
            <div className="stat-data">
              <span className="stat-value">{stats?.averageScore || 0}</span>
              <span className="stat-label">Avg</span>
            </div>
          </div>
        </div>

        {/* Upload */}
        <div
          className={`upload-bar ${uploading ? 'uploading' : ''}`}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            multiple
            onChange={(e) => handleResumeUpload(e.target.files)}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          {uploading ? (
            <>
              <div className="spinner"></div>
              <span>Processing resumes...</span>
            </>
          ) : (
            <>
              <Upload size={18} />
              <span>Upload resumes</span>
              <span className="upload-hint">PDF or DOCX</span>
            </>
          )}
        </div>

        {error && (
          <div className="error-alert">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* Candidates */}
        <section className="candidates-section">
          <div className="section-header">
            <h2>Candidates</h2>
            <div className="filter-pills">
              {['all', 'shortlisted', 'borderline', 'rejected'].map((f) => (
                <button
                  key={f}
                  className={`filter-pill ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {candidates.length === 0 ? (
            <div className="empty-state">
              <Users size={32} />
              <h3>No candidates</h3>
              <p>Upload resumes to start evaluating</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Candidate</th>
                    <th style={{ width: '70px' }}>Score</th>
                    <th className="hide-mobile" style={{ width: '70px' }}>Skills</th>
                    <th className="hide-mobile" style={{ width: '70px' }}>Exp</th>
                    <th style={{ width: '110px' }}>Status</th>
                    <th style={{ width: '70px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/jobs/${jobId}/candidates/${c.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="rank">#{c.rank}</td>
                      <td>
                        <div className="candidate-cell">
                          <span className="name">{c.name}</span>
                          {c.email && <span className="email">{c.email}</span>}
                        </div>
                      </td>
                      <td>
                        <div className={`score-display ${getScoreClass(c.scores.total)}`}>
                          {c.scores.total}
                        </div>
                      </td>
                      <td className="hide-mobile dim">{c.scores.skills}</td>
                      <td className="hide-mobile dim">{c.scores.experience}</td>
                      <td>
                        <span className={`badge badge-${c.classification === 'shortlisted' ? 'success' :
                            c.classification === 'borderline' ? 'warning' : 'danger'
                          }`}>
                          {c.classificationDisplay?.label}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/jobs/${jobId}/candidates/${c.id}`);
                            }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCandidate(c.id);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <style>{`
        .job-page {
          min-height: 100%;
        }

        .page-loading,
        .page-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-20);
          gap: var(--space-4);
        }

        /* Header */
        .page-header {
          margin-bottom: var(--space-6);
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--text-sm);
          color: var(--gray-500);
          margin-bottom: var(--space-4);
          transition: color var(--duration-fast);
        }

        .back-link:hover {
          color: var(--gray-200);
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: var(--space-4);
        }

        .header-info h1 {
          margin-bottom: var(--space-2);
        }

        .header-badges {
          display: flex;
          gap: var(--space-2);
        }

        .header-actions {
          display: flex;
          gap: var(--space-2);
        }

        /* Settings */
        .settings-panel {
          margin-bottom: var(--space-6);
          max-width: 400px;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-5);
        }

        .settings-header h3 {
          font-size: var(--text-base);
        }

        .threshold-control {
          margin-bottom: var(--space-6);
        }

        .threshold-display {
          text-align: center;
          margin-bottom: var(--space-4);
        }

        .threshold-value {
          font-size: var(--text-4xl);
          font-weight: 700;
          background: linear-gradient(135deg, var(--primary-400), var(--accent-400));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .threshold-scale {
          display: flex;
          justify-content: space-between;
          font-size: var(--text-xs);
          color: var(--gray-600);
          margin-top: var(--space-2);
        }

        .threshold-legend {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          margin-bottom: var(--space-5);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          color: var(--gray-400);
        }

        .legend-item.success svg { color: var(--success-400); }
        .legend-item.warning svg { color: var(--warning-400); }
        .legend-item.danger svg { color: var(--danger-400); }

        /* Stats */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--bg-primary);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
        }

        .stat-card svg {
          color: var(--gray-500);
        }

        .stat-card.success svg { color: var(--success-400); }
        .stat-card.warning svg { color: var(--warning-400); }

        .stat-data {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--gray-100);
          line-height: 1;
        }

        .stat-label {
          font-size: var(--text-xs);
          color: var(--gray-500);
          margin-top: var(--space-1);
        }

        /* Upload */
        .upload-bar {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-4) var(--space-5);
          margin-bottom: var(--space-6);
          background: var(--bg-secondary);
          border: 1px dashed var(--border-default);
          border-radius: var(--radius-xl);
          cursor: pointer;
          transition: all var(--duration-normal) var(--ease-out);
        }

        .upload-bar:hover {
          border-color: var(--primary-500);
          background: var(--bg-active);
        }

        .upload-bar.uploading {
          pointer-events: none;
        }

        .upload-bar svg {
          color: var(--gray-500);
        }

        .upload-bar span {
          font-size: var(--text-sm);
          color: var(--gray-400);
        }

        .upload-hint {
          margin-left: auto;
          color: var(--gray-600) !important;
        }

        .error-alert {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          margin-bottom: var(--space-6);
          background: var(--danger-bg);
          border: 1px solid var(--danger-border);
          border-radius: var(--radius-lg);
          color: var(--danger-400);
          font-size: var(--text-sm);
        }

        /* Candidates */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-4);
          margin-bottom: var(--space-4);
          flex-wrap: wrap;
        }

        .section-header h2 {
          font-size: var(--text-lg);
        }

        .filter-pills {
          display: flex;
          gap: var(--space-1);
          padding: var(--space-1);
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
        }

        .filter-pill {
          padding: var(--space-2) var(--space-4);
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--gray-500);
          cursor: pointer;
          transition: all var(--duration-fast);
        }

        .filter-pill:hover {
          color: var(--gray-200);
        }

        .filter-pill.active {
          background: var(--bg-primary);
          color: var(--gray-100);
          box-shadow: var(--shadow-sm);
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

        .empty-state svg {
          color: var(--gray-600);
          margin-bottom: var(--space-4);
        }

        .empty-state h3 {
          font-size: var(--text-base);
          margin-bottom: var(--space-1);
        }

        /* Table */
        .rank {
          font-weight: 600;
          color: var(--primary-400);
        }

        .candidate-cell {
          display: flex;
          flex-direction: column;
        }

        .candidate-cell .name {
          font-weight: 500;
          color: var(--gray-100);
        }

        .candidate-cell .email {
          font-size: var(--text-xs);
          color: var(--gray-500);
        }

        .dim {
          color: var(--gray-500);
        }

        .row-actions {
          display: flex;
          gap: var(--space-1);
        }

        @media (max-width: 1024px) {
          .stats-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .stats-row {
            grid-template-columns: repeat(2, 1fr);
          }

          .header-row {
            flex-direction: column;
          }

          .filter-pills {
            width: 100%;
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}

export default JobPage;
