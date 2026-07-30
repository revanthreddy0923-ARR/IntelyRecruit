export type UserRole = 'candidate' | 'employer' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  // Employer fields
  companyName?: string;
  companyWebsite?: string;
  companyBio?: string;
  isApproved?: boolean;
  approvalStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  // Candidate fields
  phone?: string;
  bio?: string;
  skills?: string[];
  education?: string[];
  experience?: string[];
  certifications?: string[];
  resumeUrl?: string;
  resumeFileName?: string;
  resumeText?: string;
}

export interface JobPost {
  id: string;
  title: string;
  companyName: string;
  description: string;
  location: string;
  salary: string;
  requirements: string[];
  experienceYears: number;
  type: 'Full-time' | 'Part-time' | 'Remote' | 'Contract';
  postedAt: string;
  employerId: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  appliedAt: string;
  status: 'Applied' | 'Screening' | 'Interviewing' | 'Offered' | 'Rejected';
  resumeUrl?: string;
  resumeText?: string;
  
  // AI Metrics
  matchScore?: number;
  matchingSkills?: string[];
  missingSkills?: string[];
  resumeSummary?: string;
  aiRecommendation?: string;
  
  // Ranking & Extras
  rankScore?: number; // Calculated overall score
  fraudRisk?: {
    score: number;
    level: 'Low' | 'Medium' | 'High';
    explanation: string[];
  };
  successPrediction?: {
    probability: number;
    reasoning: string;
    trainingRequired: string[];
    recommendedRole: string;
  };
}

export interface SkillVerification {
  id: string;
  candidateId: string;
  skillName: string;
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
  }[];
  answers?: number[]; // indices of candidate's answers
  score?: number; // percentage correct
  verifiedAt?: string;
  status: 'pending' | 'completed';
}

export interface CareerRoadmap {
  id: string;
  candidateId: string;
  targetRole: string;
  estimatedMonths: number;
  roadmapSteps: {
    title: string;
    desc: string;
    resources: string[];
    duration: string;
  }[];
}

export interface InterviewQuestionsSet {
  id: string;
  jobId: string;
  candidateId: string;
  technical: { question: string; answerOutline: string }[];
  hr: { question: string; answerOutline: string }[];
  scenario: { question: string; answerOutline: string }[];
}

export interface FraudReport {
  id: string;
  candidateId: string;
  applicationId: string;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  issues: string[];
  explanation: string;
  generatedAt: string;
}

export interface CandidateNotification {
  id: string;
  candidateId: string;
  title: string;
  message: string;
  type: 'status_change' | 'interview_generated' | 'screening_complete' | 'general';
  read: boolean;
  createdAt: string;
  relatedJobId?: string;
  companyName?: string;
  employerUserId?: string;
}

