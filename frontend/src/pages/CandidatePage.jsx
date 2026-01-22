import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Code,
  FolderGit2,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Target,
  MessageSquare,
} from 'lucide-react';
import { candidateApi } from '../services/api';

function CandidatePage() {
  const { jobId, candidateId } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCandidate();
  }, [jobId, candidateId]);

  async function loadCandidate() {
    try {
      setLoading(true);
      const response = await candidateApi.getById(jobId, candidateId);
      setCandidate(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getScoreClass(score) {
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  if (loading) {
    return (
      <div className="container">
        <div className="page-loading"><div className="spinner spinner-lg"></div></div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="container">
        <div className="page-error">
          <p>{error || 'Candidate not found'}</p>
          <Link to={`/jobs/${jobId}`} className="btn btn-primary">Back</Link>
        </div>
      </div>
    );
  }

  const { scores, explanation, structuredResume, classificationDisplay } = candidate;

  return (
    <div className="candidate-page">
      <div className="container">
        {/* Header */}
        <header className="page-header">
          <Link to={`/jobs/${jobId}`} className="back-link">
            <ChevronLeft size={20} />
            <span>Candidates</span>
          </Link>

          <div className="profile-card card">
            <div className="profile-main">
              <div className="avatar">
                <User size={28} />
              </div>
              <div className="profile-info">
                <h1>{candidate.name}</h1>
                <div className="contact-row">
                  {candidate.email && (
                    <a href={`mailto:${candidate.email}`}><Mail size={14} /> {candidate.email}</a>
                  )}
                  {candidate.phone && (
                    <span><Phone size={14} /> {candidate.phone}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="score-box">
              <div className={`big-score ${getScoreClass(scores.total)}`}>
                <span className="score-num">{scores.total}</span>
                <span className="score-label">Score</span>
              </div>
              <span className={`badge badge-${candidate.classification === 'shortlisted' ? 'success' :
                  candidate.classification === 'borderline' ? 'warning' : 'danger'
                }`}>
                {classificationDisplay?.label}
              </span>
            </div>
          </div>
        </header>

        <div className="content-grid">
          {/* Main */}
          <div className="main-col">
            {/* Scores */}
            <div className="card">
              <h2>Score Breakdown</h2>
              <div className="score-list">
                <ScoreBar label="Skills" score={scores.skills} weight="50%" icon={Code} />
                <ScoreBar label="Experience" score={scores.experience} weight="25%" icon={Briefcase} />
                <ScoreBar label="Projects" score={scores.projects} weight="15%" icon={FolderGit2} />
                <ScoreBar label="Education" score={scores.education} weight="10%" icon={GraduationCap} />
              </div>
            </div>

            {/* Analysis */}
            {explanation && (
              <div className="card">
                <div className="card-title">
                  <Lightbulb size={18} />
                  <h2>AI Analysis</h2>
                </div>

                {explanation.summary && (
                  <div className="summary-box">
                    <p>{explanation.summary}</p>
                  </div>
                )}

                {explanation.recommendation && (
                  <div className={`rec-badge ${explanation.recommendation.replace('_', '-')}`}>
                    <Target size={16} />
                    {explanation.recommendation === 'strong_hire' ? 'Strong Hire' :
                      explanation.recommendation === 'hire' ? 'Hire' :
                        explanation.recommendation === 'maybe' ? 'Maybe' : 'No Hire'}
                  </div>
                )}

                <div className="analysis-cols">
                  {explanation.strengths?.length > 0 && (
                    <div className="analysis-box strengths">
                      <div className="box-header">
                        <CheckCircle size={14} />
                        <span>Strengths</span>
                      </div>
                      <ul>
                        {explanation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {explanation.gaps?.length > 0 && (
                    <div className="analysis-box gaps">
                      <div className="box-header">
                        <AlertTriangle size={14} />
                        <span>Gaps</span>
                      </div>
                      <ul>
                        {explanation.gaps.map((g, i) => <li key={i}>{g}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                {explanation.interview_focus_areas?.length > 0 && (
                  <div className="focus-section">
                    <div className="box-header">
                      <MessageSquare size={14} />
                      <span>Interview Focus</span>
                    </div>
                    <div className="focus-chips">
                      {explanation.interview_focus_areas.map((a, i) => (
                        <span key={i} className="chip">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Side */}
          <div className="side-col">
            {/* Skills */}
            {structuredResume?.skills?.length > 0 && (
              <div className="card">
                <h3><Code size={16} /> Skills</h3>
                <div className="skill-list">
                  {structuredResume.skills.slice(0, 12).map((s, i) => (
                    <div key={i} className="skill-row">
                      <span>{s.name}</span>
                      {s.proficiency && <span className={`level ${s.proficiency}`}>{s.proficiency}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {structuredResume?.experience?.positions?.length > 0 && (
              <div className="card">
                <h3><Briefcase size={16} /> Experience</h3>
                <div className="exp-list">
                  {structuredResume.experience.positions.slice(0, 3).map((p, i) => (
                    <div key={i} className="exp-item">
                      <div className="exp-top">
                        <span className="exp-title">{p.title}</span>
                        <span className="exp-date">{p.start_date} - {p.end_date || 'Now'}</span>
                      </div>
                      <span className="exp-company">{p.company}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {structuredResume?.education?.length > 0 && (
              <div className="card">
                <h3><GraduationCap size={16} /> Education</h3>
                <div className="edu-list">
                  {structuredResume.education.map((e, i) => (
                    <div key={i} className="edu-item">
                      <span className="edu-degree">{e.degree} in {e.field}</span>
                      <span className="edu-school">{e.institution}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .candidate-page { min-height: 100%; }

        .page-loading, .page-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--space-20);
          gap: var(--space-4);
        }

        .page-header { margin-bottom: var(--space-6); }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          font-size: var(--text-sm);
          color: var(--gray-500);
          margin-bottom: var(--space-4);
        }
        .back-link:hover { color: var(--gray-200); }

        .profile-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-6);
        }

        .profile-main {
          display: flex;
          gap: var(--space-4);
        }

        .avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, var(--primary-500), var(--accent-500));
          border-radius: var(--radius-xl);
          color: white;
        }

        .profile-info h1 {
          font-size: var(--text-2xl);
          margin-bottom: var(--space-2);
        }

        .contact-row {
          display: flex;
          gap: var(--space-4);
          font-size: var(--text-sm);
          color: var(--gray-500);
        }

        .contact-row a, .contact-row span {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .contact-row a:hover { color: var(--primary-400); }

        .score-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
        }

        .big-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-4) var(--space-6);
          border-radius: var(--radius-xl);
        }

        .big-score.high { background: var(--success-bg); }
        .big-score.medium { background: var(--warning-bg); }
        .big-score.low { background: var(--danger-bg); }

        .score-num {
          font-size: var(--text-4xl);
          font-weight: 700;
          line-height: 1;
        }

        .big-score.high .score-num { color: var(--success-400); }
        .big-score.medium .score-num { color: var(--warning-400); }
        .big-score.low .score-num { color: var(--danger-400); }

        .score-label {
          font-size: var(--text-xs);
          color: var(--gray-500);
          margin-top: var(--space-1);
        }

        /* Grid */
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: var(--space-6);
        }

        .main-col, .side-col {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .card h2 {
          font-size: var(--text-base);
          margin-bottom: var(--space-5);
        }

        .card h3 {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          margin-bottom: var(--space-4);
        }

        .card-title {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-5);
        }

        .card-title svg { color: var(--primary-400); }
        .card-title h2 { margin-bottom: 0; }

        /* Scores */
        .score-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        /* Summary */
        .summary-box {
          padding: var(--space-4);
          background: var(--bg-tertiary);
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-5);
        }

        .summary-box p {
          color: var(--gray-300);
          line-height: var(--leading-relaxed);
        }

        .rec-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-full);
          font-size: var(--text-sm);
          font-weight: 600;
          margin-bottom: var(--space-5);
        }

        .rec-badge.strong-hire, .rec-badge.hire {
          background: var(--success-bg);
          border: 1px solid var(--success-border);
          color: var(--success-400);
        }

        .rec-badge.maybe {
          background: var(--warning-bg);
          border: 1px solid var(--warning-border);
          color: var(--warning-400);
        }

        .rec-badge.no-hire {
          background: var(--danger-bg);
          border: 1px solid var(--danger-border);
          color: var(--danger-400);
        }

        .analysis-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-4);
          margin-bottom: var(--space-5);
        }

        .analysis-box {
          padding: var(--space-4);
          border-radius: var(--radius-lg);
        }

        .analysis-box.strengths {
          background: var(--success-bg);
          border: 1px solid var(--success-border);
        }

        .analysis-box.gaps {
          background: var(--warning-bg);
          border: 1px solid var(--warning-border);
        }

        .box-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-xs);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: var(--space-3);
        }

        .analysis-box.strengths .box-header { color: var(--success-400); }
        .analysis-box.gaps .box-header { color: var(--warning-400); }

        .analysis-box ul {
          list-style: none;
        }

        .analysis-box li {
          font-size: var(--text-sm);
          color: var(--gray-300);
          padding: var(--space-1) 0;
          padding-left: var(--space-3);
          border-left: 2px solid currentColor;
          opacity: 0.8;
          margin-bottom: var(--space-2);
        }

        .focus-section .box-header { color: var(--primary-400); }

        .focus-chips {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-top: var(--space-3);
        }

        .chip {
          padding: var(--space-2) var(--space-3);
          background: var(--primary-50);
          border: 1px solid var(--primary-100);
          border-radius: var(--radius-full);
          font-size: var(--text-sm);
          color: var(--primary-400);
        }

        /* Skills */
        .skill-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .skill-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-2) 0;
          border-bottom: 1px solid var(--border-subtle);
          font-size: var(--text-sm);
        }

        .skill-row:last-child { border-bottom: none; }

        .level {
          font-size: var(--text-xs);
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          text-transform: capitalize;
        }

        .level.expert { background: var(--success-bg); color: var(--success-400); }
        .level.advanced { background: var(--primary-50); color: var(--primary-400); }
        .level.intermediate { background: var(--bg-tertiary); color: var(--gray-400); }

        /* Experience */
        .exp-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .exp-item {
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--border-subtle);
        }

        .exp-item:last-child {
          padding-bottom: 0;
          border-bottom: none;
        }

        .exp-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--space-1);
        }

        .exp-title {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--gray-100);
        }

        .exp-date {
          font-size: var(--text-xs);
          color: var(--gray-600);
        }

        .exp-company {
          font-size: var(--text-sm);
          color: var(--primary-400);
        }

        /* Education */
        .edu-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .edu-degree {
          display: block;
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--gray-100);
          margin-bottom: var(--space-1);
        }

        .edu-school {
          font-size: var(--text-sm);
          color: var(--gray-500);
        }

        @media (max-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr;
          }

          .analysis-cols {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .profile-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .score-box {
            flex-direction: row;
            width: 100%;
            justify-content: space-between;
          }

          .contact-row {
            flex-direction: column;
            gap: var(--space-2);
          }
        }
      `}</style>
    </div>
  );
}

function ScoreBar({ label, score, weight, icon: Icon }) {
  const getClass = (s) => s >= 70 ? 'high' : s >= 50 ? 'medium' : 'low';
  const colors = {
    high: 'var(--success-500)',
    medium: 'var(--warning-500)',
    low: 'var(--danger-500)',
  };

  return (
    <div className="score-bar">
      <div className="bar-label">
        <Icon size={16} style={{ color: 'var(--gray-500)' }} />
        <span>{label}</span>
        <span className="weight">{weight}</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${score}%`, background: colors[getClass(score)] }} />
      </div>
      <span className={`bar-value ${getClass(score)}`}>{score}</span>

      <style>{`
        .score-bar {
          display: grid;
          grid-template-columns: 130px 1fr 40px;
          align-items: center;
          gap: var(--space-4);
        }

        .bar-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          color: var(--gray-300);
        }

        .weight {
          color: var(--gray-600);
          font-size: var(--text-xs);
        }

        .bar-track {
          height: 8px;
          background: var(--bg-tertiary);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          border-radius: var(--radius-full);
          transition: width var(--duration-slow) var(--ease-out);
        }

        .bar-value {
          font-size: var(--text-base);
          font-weight: 600;
          text-align: right;
        }

        .bar-value.high { color: var(--success-400); }
        .bar-value.medium { color: var(--warning-400); }
        .bar-value.low { color: var(--danger-400); }
      `}</style>
    </div>
  );
}

export default CandidatePage;
