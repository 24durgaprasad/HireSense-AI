# API Reference - Sample Requests & Responses

This document contains sample API requests and responses for the AI-Powered ATS.

---

## 1. Create Job (Upload JD)

### Request
```http
POST /api/jobs
Content-Type: multipart/form-data

file: [job_description.docx]
```

### Response
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Senior Full Stack Developer",
    "seniorityLevel": "senior",
    "requiredSkills": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
    "preferredSkills": ["GraphQL", "Docker", "Kubernetes"],
    "experience": {
      "min_years": 5,
      "max_years": 10,
      "required_domains": ["fintech", "e-commerce"],
      "preferred_domains": ["SaaS"]
    },
    "education": {
      "min_degree": "bachelor",
      "preferred_degree": "master",
      "required_fields": ["Computer Science", "Software Engineering"],
      "preferred_fields": ["Information Technology"]
    },
    "threshold": 70,
    "createdAt": "2026-01-22T11:30:00.000Z"
  },
  "message": "Job description analyzed successfully"
}
```

---

## 2. Upload Resumes

### Request
```http
POST /api/jobs/550e8400-e29b-41d4-a716-446655440000/candidates
Content-Type: multipart/form-data

files: [resume1.pdf, resume2.pdf, resume3.docx]
```

### Response
```json
{
  "success": true,
  "data": {
    "processed": 3,
    "failed": 0,
    "candidates": [
      {
        "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "name": "Alice Johnson",
        "score": 85,
        "classification": "shortlisted"
      },
      {
        "id": "8f14e45f-ceea-46ed-a8ff-45ac4e9afd71",
        "name": "Bob Smith",
        "score": 72,
        "classification": "shortlisted"
      },
      {
        "id": "9a3b7c8d-1234-5678-9abc-def012345678",
        "name": "Carol Davis",
        "score": 58,
        "classification": "rejected"
      }
    ]
  },
  "message": "Successfully processed 3 resume(s)"
}
```

---

## 3. Get Ranked Candidates

### Request
```http
GET /api/jobs/550e8400-e29b-41d4-a716-446655440000/candidates?classification=shortlisted
```

### Response
```json
{
  "success": true,
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "jobTitle": "Senior Full Stack Developer",
    "threshold": 70,
    "candidates": [
      {
        "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "rank": 1,
        "name": "Alice Johnson",
        "email": "alice.johnson@email.com",
        "scores": {
          "total": 85,
          "skills": 90,
          "experience": 85,
          "projects": 75,
          "education": 80
        },
        "classification": "shortlisted",
        "classificationDisplay": {
          "label": "Shortlisted",
          "emoji": "✅",
          "color": "green"
        },
        "explanation": {
          "summary": "Strong candidate with excellent technical skills and relevant experience in full-stack development. Has worked on similar fintech projects with measurable impact.",
          "strengths": [
            "Expert-level React and Node.js proficiency",
            "5+ years of experience in fintech domain",
            "Led team of 4 developers on e-commerce platform"
          ],
          "gaps": [
            "Limited experience with Kubernetes",
            "No GraphQL experience mentioned"
          ],
          "recommendation": "strong_hire",
          "interview_focus_areas": [
            "System design for high-scale applications",
            "Experience with AWS infrastructure"
          ]
        },
        "processedAt": "2026-01-22T11:35:00.000Z"
      }
    ],
    "stats": {
      "total": 10,
      "shortlisted": 3,
      "borderline": 4,
      "rejected": 3,
      "threshold": 70,
      "averageScore": 68,
      "highestScore": 85,
      "lowestScore": 45
    }
  }
}
```

---

## 4. Get Candidate Details

### Request
```http
GET /api/jobs/550e8400-e29b-41d4-a716-446655440000/candidates/7c9e6679-7425-40de-944b-e07fc1f90ae7
```

### Response
```json
{
  "success": true,
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "jobTitle": "Senior Full Stack Developer",
    "name": "Alice Johnson",
    "email": "alice.johnson@email.com",
    "phone": "+1-555-123-4567",
    "scores": {
      "total": 85,
      "skills": 90,
      "experience": 85,
      "projects": 75,
      "education": 80
    },
    "classification": "shortlisted",
    "classificationDisplay": {
      "label": "Shortlisted",
      "emoji": "✅",
      "color": "green"
    },
    "structuredResume": {
      "contact": {
        "name": "Alice Johnson",
        "email": "alice.johnson@email.com",
        "phone": "+1-555-123-4567",
        "location": "San Francisco, CA",
        "linkedin": "https://linkedin.com/in/alicejohnson"
      },
      "summary": "Senior Full Stack Developer with 6+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud infrastructure.",
      "skills": [
        { "name": "React", "category": "technical", "proficiency": "expert", "years_used": 5 },
        { "name": "Node.js", "category": "technical", "proficiency": "expert", "years_used": 6 },
        { "name": "TypeScript", "category": "technical", "proficiency": "advanced", "years_used": 4 },
        { "name": "PostgreSQL", "category": "technical", "proficiency": "advanced", "years_used": 5 },
        { "name": "AWS", "category": "tool", "proficiency": "advanced", "years_used": 4 }
      ],
      "experience": {
        "total_years": 6,
        "positions": [
          {
            "title": "Senior Full Stack Developer",
            "company": "FinTech Innovations Inc.",
            "duration_months": 36,
            "start_date": "2023-01",
            "end_date": "present",
            "responsibilities": [
              "Lead development of customer-facing trading platform",
              "Architect microservices-based backend system"
            ],
            "achievements": [
              "Reduced API response time by 60%",
              "Led team of 4 developers",
              "Implemented CI/CD pipeline reducing deployment time by 80%"
            ],
            "technologies": ["React", "Node.js", "PostgreSQL", "AWS"],
            "domain": "fintech"
          }
        ]
      },
      "projects": [
        {
          "name": "Real-time Trading Dashboard",
          "description": "Built a real-time trading dashboard handling 10k concurrent users",
          "technologies": ["React", "WebSocket", "Redis", "Node.js"],
          "role": "Lead Developer",
          "impact": "Enabled 40% faster trade execution"
        }
      ],
      "education": [
        {
          "degree": "master",
          "field": "Computer Science",
          "institution": "Stanford University",
          "year": 2020,
          "gpa": 3.8
        }
      ],
      "_computed": {
        "skill_set": ["react", "nodejs", "typescript", "postgresql", "aws"],
        "total_experience_years": 6,
        "highest_degree": "master"
      }
    },
    "explanation": {
      "summary": "Alice is an excellent match for the Senior Full Stack Developer role. She demonstrates strong expertise in all required technologies (React, Node.js, TypeScript, PostgreSQL, AWS) with hands-on experience in the fintech domain.",
      "strengths": [
        "Expert-level proficiency in React and Node.js with 5-6 years of hands-on experience",
        "Directly relevant fintech experience matching job requirements",
        "Proven leadership experience - led team of 4 developers",
        "Quantifiable achievements: 60% API performance improvement, 80% faster deployments",
        "Master's degree in Computer Science from top university"
      ],
      "gaps": [
        "No mentioned experience with Kubernetes (preferred skill)",
        "GraphQL experience not evident in resume"
      ],
      "skill_analysis": {
        "matched_required": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
        "missing_required": [],
        "matched_preferred": ["Docker"],
        "bonus_skills": ["WebSocket", "Redis", "CI/CD"]
      },
      "experience_analysis": {
        "meets_requirement": true,
        "relevant_experience": "6 years of full-stack development with 3 years in senior role at fintech company",
        "domain_fit": "Strong - direct fintech experience matching required domains"
      },
      "project_analysis": {
        "relevant_projects": ["Real-time Trading Dashboard"],
        "impact_evidence": "Quantifiable impact: 40% faster trade execution, 10k concurrent users"
      },
      "education_analysis": {
        "meets_requirement": true,
        "relevance": "Master's in Computer Science exceeds bachelor requirement and aligns perfectly with the role"
      },
      "recommendation": "strong_hire",
      "interview_focus_areas": [
        "System design for high-throughput trading systems",
        "Experience with Kubernetes and container orchestration",
        "Leadership and team management approach"
      ],
      "risk_factors": [
        "May expect high compensation given senior experience and top-tier education"
      ]
    },
    "processedAt": "2026-01-22T11:35:00.000Z"
  }
}
```

---

## 5. Update Threshold

### Request
```http
PUT /api/jobs/550e8400-e29b-41d4-a716-446655440000/threshold
Content-Type: application/json

{
  "threshold": 75
}
```

### Response
```json
{
  "success": true,
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "threshold": 75,
    "stats": {
      "total": 10,
      "shortlisted": 2,
      "borderline": 3,
      "rejected": 5
    }
  },
  "message": "Threshold updated and candidates reclassified"
}
```

---

## 6. Compare Candidates

### Request
```http
POST /api/jobs/550e8400-e29b-41d4-a716-446655440000/candidates/compare
Content-Type: application/json

{
  "candidateIds": [
    "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "8f14e45f-ceea-46ed-a8ff-45ac4e9afd71"
  ]
}
```

### Response
```json
{
  "success": true,
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "jobTitle": "Senior Full Stack Developer",
    "comparison": {
      "candidates": [
        {
          "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
          "name": "Alice Johnson",
          "scores": { "total": 85, "skills": 90, "experience": 85, "projects": 75, "education": 80 },
          "classification": "shortlisted"
        },
        {
          "id": "8f14e45f-ceea-46ed-a8ff-45ac4e9afd71",
          "name": "Bob Smith",
          "scores": { "total": 72, "skills": 75, "experience": 80, "projects": 60, "education": 65 },
          "classification": "shortlisted"
        }
      ],
      "dimensions": [
        {
          "dimension": "skills",
          "scores": [
            { "candidateId": "7c9e6679-7425-40de-944b-e07fc1f90ae7", "score": 90 },
            { "candidateId": "8f14e45f-ceea-46ed-a8ff-45ac4e9afd71", "score": 75 }
          ],
          "winner": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
        },
        {
          "dimension": "experience",
          "scores": [
            { "candidateId": "7c9e6679-7425-40de-944b-e07fc1f90ae7", "score": 85 },
            { "candidateId": "8f14e45f-ceea-46ed-a8ff-45ac4e9afd71", "score": 80 }
          ],
          "winner": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
        }
      ],
      "overallWinner": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
    }
  }
}
```

---

## Error Response Format

All errors follow this consistent format:

```json
{
  "success": false,
  "error": "Descriptive error message explaining what went wrong"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid input) |
| 404 | Not Found |
| 500 | Internal Server Error |
