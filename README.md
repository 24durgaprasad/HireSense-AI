# 🎯 AI-Powered Applicant Tracking System (ATS)

## What Problem This Solves

Traditional ATS systems rely on **keyword matching**, which leads to:
- ❌ Great candidates being rejected due to different terminology
- ❌ Keyword stuffing gaming the system
- ❌ No understanding of context, projects, or transferable skills
- ❌ Black-box rejections with no explainability

**This AI-powered ATS solves these problems by:**
- ✅ Semantic understanding of job requirements and candidate qualifications
- ✅ Context-aware matching (understands "React" and "ReactJS" are the same)
- ✅ Explainable scores with detailed breakdowns
- ✅ Weighted scoring system aligned with HR priorities
- ✅ Transparent decision-making for both HR and candidates

---

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React)                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  JD Upload  │  │Resume Upload│  │  Threshold  │  │   Results Table     │ │
│  │  Component  │  │  (Bulk)     │  │   Control   │  │   + Detail View     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Node.js + Express)                          │
│                            API Orchestration Layer                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  POST /api/jobs          - Upload & analyze JD                          ││
│  │  POST /api/jobs/:id/candidates - Upload & analyze resumes               ││
│  │  GET  /api/jobs/:id/results    - Get ranked candidates                  ││
│  │  PUT  /api/jobs/:id/threshold  - Update shortlist threshold             ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  File Processing     │ │  JD Intelligence     │ │  Resume Intelligence │
│  Service             │ │  Service             │ │  Service             │
│  ────────────────    │ │  ────────────────    │ │  ────────────────    │
│  • PDF → Text        │ │  • LLM-based JD      │ │  • LLM-based Resume  │
│  • DOCX → Text       │ │    parsing           │ │    parsing           │
│  • Text cleanup      │ │  • Structured JSON   │ │  • Structured JSON   │
│  • Normalization     │ │    output            │ │    output            │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
                                      │
                                      ▼
              ┌─────────────────────────────────────────────────┐
              │           Matching & Scoring Engine             │
              │  ─────────────────────────────────────────────  │
              │  • Skill Match (50%)                            │
              │  • Experience Match (25%)                       │
              │  • Project Relevance (15%)                      │
              │  • Education Match (10%)                        │
              │  • Explanation Generation                       │
              └─────────────────────────────────────────────────┘
                                      │
                                      ▼
              ┌─────────────────────────────────────────────────┐
              │         Ranking & Threshold Service             │
              │  ─────────────────────────────────────────────  │
              │  • Sort by score                                │
              │  • Apply threshold                              │
              │  • Label: Shortlisted / Borderline / Rejected   │
              └─────────────────────────────────────────────────┘
                                      │
                                      ▼
              ┌─────────────────────────────────────────────────┐
              │               MongoDB Database                  │
              │  ─────────────────────────────────────────────  │
              │  • Jobs (JD metadata + structured analysis)     │
              │  • Candidates (scores, explanations, status)    │
              │  • NO raw resume storage (privacy first)        │
              └─────────────────────────────────────────────────┘
```

---

## 📊 Scoring Logic

| Dimension          | Weight | What We Evaluate                              |
|--------------------|--------|-----------------------------------------------|
| **Skill Match**    | 50%    | Required + preferred skills overlap           |
| **Experience**     | 25%    | Years + seniority level + domain relevance    |
| **Projects**       | 15%    | Relevance of past work to role                |
| **Education**      | 10%    | Degree level + field match                    |

**Final Score = Σ (Dimension Score × Weight)**

Each dimension is scored 0-100, then weighted.

---

## 🧑‍💼 How HR Uses This System

### Step 1: Upload Job Description
Upload a `.docx` file containing the job description. The AI will extract:
- Role title and level
- Required skills (must-have)
- Preferred skills (nice-to-have)
- Experience requirements
- Domain/industry context

### Step 2: Upload Candidate Resumes
Bulk upload resume files (`.pdf` or `.docx`). Each resume is:
- Converted to clean text
- Analyzed by AI to extract structured data
- Scored against the job description

### Step 3: Set Shortlist Threshold
Define your threshold (e.g., 70):
- **≥ 70**: Shortlisted ✅
- **60-69**: Borderline ⚠️
- **< 60**: Rejected ❌

### Step 4: Review Results
See a ranked table with:
- Candidate name and contact
- Overall score
- Dimension-wise breakdown
- Human-readable explanation

Click any candidate to see detailed analysis.

---

## 🚀 Why This Is Better Than Traditional ATS

| Traditional ATS               | This AI-Powered ATS                        |
|-------------------------------|---------------------------------------------|
| Keyword matching              | Semantic understanding                      |
| Binary pass/fail              | Nuanced scoring with breakdown              |
| No explanation                | Full explainability                         |
| Easy to game with keywords    | Evaluates actual competency                 |
| Misses synonyms               | Understands "JS" = "JavaScript"             |
| Ignores project context       | Evaluates project relevance                 |
| One-size-fits-all             | Weighted scoring per dimension              |

---

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **AI/LLM**: Perplexity API (sonar model)
- **Database**: MongoDB (with Mongoose ODM)
- **File Processing**: pdf-parse, mammoth

---

## 📁 Project Structure

```
ats/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Thin API controllers
│   │   ├── services/          # Business logic
│   │   │   ├── fileProcessing.service.js
│   │   │   ├── jdIntelligence.service.js
│   │   │   ├── resumeIntelligence.service.js
│   │   │   ├── matching.service.js
│   │   │   └── ranking.service.js
│   │   ├── prompts/           # AI prompt templates
│   │   ├── routes/            # Express routes
│   │   ├── models/            # Database models
│   │   ├── utils/             # Helpers
│   │   └── config/            # Configuration
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Route pages
│   │   ├── services/          # API calls
│   │   ├── hooks/             # Custom React hooks
│   │   └── utils/             # Frontend helpers
│   └── package.json
│
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB (local or MongoDB Atlas)
- Perplexity API key

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Add your PERPLEXITY_API_KEY and MONGODB_URI to .env
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📝 License

MIT License - Build something great! 🚀
