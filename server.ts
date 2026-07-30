import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import bcrypt from "bcryptjs";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// DEFAULT SINGLE ADMIN INITIALIZATION & AUTH SYSTEM
// ----------------------------------------------------
const DEFAULT_ADMIN_EMAIL = "revanth23arr@gmail.com";
const DEFAULT_ADMIN_NAME = "Administrator";
const DEFAULT_ADMIN_PLAIN_PASSWORD = "admin@show*u";

// Store pre-hashed BCrypt password for default admin
let defaultAdminHash = "";

function initializeAdminAccount() {
  try {
    defaultAdminHash = bcrypt.hashSync(DEFAULT_ADMIN_PLAIN_PASSWORD, 10);
    console.log(`[Admin Auto-Init] Default Admin account verified/created for: ${DEFAULT_ADMIN_EMAIL}`);
  } catch (err) {
    console.error("[Admin Init Error] Failed to generate admin BCrypt hash:", err);
  }
}

// Auto-create/verify admin account on server startup
initializeAdminAccount();

// Endpoint to handle Authentication & BCrypt Password Verification
app.post("/api/auth/login", (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  // Admin login handling
  if (role === "admin" || cleanEmail === DEFAULT_ADMIN_EMAIL) {
    if (cleanEmail !== DEFAULT_ADMIN_EMAIL) {
      return res.status(401).json({ error: "Unauthorized: Invalid admin email address." });
    }

    const isMatch = bcrypt.compareSync(String(password), defaultAdminHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid admin password." });
    }

    return res.json({
      success: true,
      user: {
        uid: "admin_primary",
        email: DEFAULT_ADMIN_EMAIL,
        name: DEFAULT_ADMIN_NAME,
        role: "admin",
        createdAt: new Date().toISOString()
      }
    });
  }

  // Candidate / Employer generic login
  return res.json({
    success: true,
    user: {
      uid: "user_" + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      name: cleanEmail.split("@")[0],
      role: role || "candidate",
      createdAt: new Date().toISOString()
    }
  });
});

// Endpoint to handle Registration - Explicitly block Admin Registration
app.post("/api/auth/register", (req, res) => {
  const { email, role } = req.body;
  const cleanEmail = String(email || "").trim().toLowerCase();

  if (role === "admin" || cleanEmail === DEFAULT_ADMIN_EMAIL) {
    return res.status(403).json({
      error: "Admin registration is not allowed. Only one pre-configured Admin account exists."
    });
  }

  return res.json({ success: true });
});

// Initialize GoogleGenAI lazily and safely
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({ apiKey });
    console.log("GoogleGenAI initialized successfully with API key");
  } catch (e) {
    console.error("Error initializing GoogleGenAI:", e);
  }
} else {
  console.warn("GEMINI_API_KEY environment variable is not set. Running in fallback/mock AI mode.");
}

// System instructions for structured output
const JSON_MIME_CONFIG = { 
  responseMimeType: "application/json",
  systemInstruction: "You are a professional recruiting assistant. Keep all responses highly concise, fast, and strictly formatted as requested JSON. Do not write extra commentary.",
  temperature: 0.1
};

// ----------------------------------------------------
// AI ENDPOINTS
// ----------------------------------------------------

// 1. AI Resume Screening
app.post("/api/ai/screen-resume", async (req, res) => {
  const { resumeText, jobDescription } = req.body;
  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: "Missing resumeText or jobDescription" });
  }

  if (!ai) {
    // Graceful fallback
    return res.json({
      matchScore: 78,
      matchingSkills: ["React", "TypeScript", "Tailwind CSS"],
      missingSkills: ["Express", "Node.js", "Firebase"],
      resumeSummary: "The candidate has strong frontend skills but lacks the required backend experience listed in the job description.",
      aiRecommendation: "Highly recommend for a frontend role, or backend training is recommended before hiring.",
      _mock: true
    });
  }

  try {
    const prompt = `Analyze the following resume text against the job description. Return a JSON object with:
    {
      "matchScore": number (0 to 100),
      "matchingSkills": array of strings,
      "missingSkills": array of strings,
      "resumeSummary": string (concise summary of resume),
      "aiRecommendation": string (detailed advice for employer)
    }
    
    Resume Text:
    ${resumeText}
    
    Job Description:
    ${jobDescription}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: JSON_MIME_CONFIG
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Screen Resume Error:", err);
    res.status(500).json({ error: err.message || "Failed to screen resume" });
  }
});

// 2. AI Candidate Ranking
app.post("/api/ai/rank-candidates", async (req, res) => {
  const { candidates, jobDescription } = req.body;
  if (!candidates || !jobDescription) {
    return res.status(400).json({ error: "Missing candidates list or jobDescription" });
  }

  if (!ai) {
    // Graceful fallback
    const rankings = candidates.map((c: any, index: number) => ({
      candidateId: c.id,
      rankScore: 90 - index * 10,
      matchReason: `Matches ${c.skills?.length || 0} key skills with strong academic education background.`
    }));
    return res.json({ rankings, _mock: true });
  }

  try {
    const prompt = `Rank these applicants for the job. Job description:
    ${jobDescription}
    
    Applicants list:
    ${JSON.stringify(candidates, null, 2)}
    
    Return a JSON object containing a "rankings" array with items having "candidateId", "rankScore" (0-100), and "matchReason" (string explaining their placement):
    {
      "rankings": [
        { "candidateId": "...", "rankScore": 85, "matchReason": "..." }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: JSON_MIME_CONFIG
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Rank Candidates Error:", err);
    res.status(500).json({ error: err.message || "Failed to rank candidates" });
  }
});

// 3. AI Skill Gap Analysis
app.post("/api/ai/gap-analysis", async (req, res) => {
  const { candidateSkills, jobSkills } = req.body;
  if (!candidateSkills || !jobSkills) {
    return res.status(400).json({ error: "Missing candidateSkills or jobSkills" });
  }

  if (!ai) {
    return res.json({
      missingSkills: ["Docker", "Kubernetes", "AWS CloudFormation"],
      suggestedCertifications: ["AWS Certified Solutions Architect", "Certified Kubernetes Administrator (CKA)"],
      recommendedCourses: ["Docker & Kubernetes Course on Udemy", "AWS Developer Path on Coursera"],
      learningResources: [
        { title: "Official Kubernetes Tutorials", platform: "Kubernetes.io", link: "https://kubernetes.io/docs/tutorials/" },
        { title: "AWS Technical Essentials", platform: "Amazon AWS", link: "https://aws.amazon.com/training/essentials/" }
      ],
      improvementPercentage: 45,
      _mock: true
    });
  }

  try {
    const prompt = `Compare these candidate skills: ${JSON.stringify(candidateSkills)} 
    with the job requirements: ${JSON.stringify(jobSkills)}.
    
    Return a JSON object with:
    {
      "missingSkills": array of strings,
      "suggestedCertifications": array of strings,
      "recommendedCourses": array of strings,
      "learningResources": array of objects with { "title": "...", "platform": "...", "link": "..." },
      "improvementPercentage": number (0-100 of how much completing this list improves match)
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: JSON_MIME_CONFIG
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Gap Analysis Error:", err);
    res.status(500).json({ error: err.message || "Failed to calculate skill gap" });
  }
});

// 4. AI Interview Question Generator
app.post("/api/ai/generate-questions", async (req, res) => {
  const { resumeText, jobDescription } = req.body;
  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: "Missing resumeText or jobDescription" });
  }

  if (!ai) {
    return res.json({
      technical: [
        { question: "Explain the virtual DOM lifecycle in React and why you used it in your project.", answerOutline: "Should reference component mounting, reconciliation, diffing algorithm, and state updates." },
        { question: "How do you handle async state operations in Redux or React Context?", answerOutline: "References to thunks, async/await, fetching state management, and avoiding infinite loops." }
      ],
      hr: [
        { question: "Tell me about a time you handled a tight deadline.", answerOutline: "STAR method: Situation, Task, Action, Result. Highlight communication and delegation." }
      ],
      scenario: [
        { question: "If the production site crashes due to a slow DB query, what are the exact diagnostic steps you would take?", answerOutline: "Check server logs, examine DB CPU/index performance, look at recent git commits, setup a quick read replica or index." }
      ],
      _mock: true
    });
  }

  try {
    const prompt = `Generate technical, HR, and scenario-based interview questions with high-level answer outlines based on the candidate's resume and target job description:
    Resume:
    ${resumeText}
    
    Job Description:
    ${jobDescription}
    
    Return a JSON object with:
    {
      "technical": [ { "question": "...", "answerOutline": "..." } ],
      "hr": [ { "question": "...", "answerOutline": "..." } ],
      "scenario": [ { "question": "...", "answerOutline": "..." } ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: JSON_MIME_CONFIG
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Interview Questions Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate interview questions" });
  }
});

// 5. AI Resume Builder & ATS Score
app.post("/api/ai/resume-score", async (req, res) => {
  const { resumeData } = req.body;
  if (!resumeData) {
    return res.status(400).json({ error: "Missing resumeData" });
  }

  if (!ai) {
    return res.json({
      atsScore: 82,
      grammarIssues: ["No major issues, but recommendation to use active action verbs (e.g., 'Directed' instead of 'Responsible for')."],
      formattingSuggestions: ["Include clear headers for Projects and Education.", "Set consistent font sizes for subheadings."],
      missingKeywords: ["CI/CD", "Docker", "Unit Testing", "REST API Integration"],
      readability: "Easy",
      completenessScore: 90,
      improvementSuggestions: ["Expand on your primary project metrics - add percentages (e.g. 'Improved efficiency by 25%').", "Add LinkedIn or Github link in professional headers."],
      _mock: true
    });
  }

  try {
    const prompt = `Analyze this resume structure and content for ATS compatibility, grammar, readibility, and keyword rich content:
    Resume JSON:
    ${JSON.stringify(resumeData, null, 2)}
    
    Return a JSON object with:
    {
      "atsScore": number (0-100),
      "grammarIssues": array of strings,
      "formattingSuggestions": array of strings,
      "missingKeywords": array of strings,
      "readability": "Easy" | "Medium" | "Difficult",
      "completenessScore": number (0-100),
      "improvementSuggestions": array of strings
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: JSON_MIME_CONFIG
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Resume Score Error:", err);
    res.status(500).json({ error: err.message || "Failed to evaluate resume" });
  }
});

// 6. AI Career Roadmap
app.post("/api/ai/career-roadmap", async (req, res) => {
  const { targetRole, currentSkills } = req.body;
  if (!targetRole) {
    return res.status(400).json({ error: "Missing targetRole" });
  }

  if (!ai) {
    const roleLower = targetRole.toLowerCase();
    let estimatedMonths = 6;
    let roadmapSteps = [];

    if (roleLower.includes("frontend") || roleLower.includes("react") || roleLower.includes("ui") || roleLower.includes("ux") || roleLower.includes("design")) {
      estimatedMonths = 5;
      roadmapSteps = [
        { title: "Master HTML5, CSS3, & Modern UI Layouts", desc: "Deep dive into Flexbox, Grid, CSS custom properties, responsive structures, and Tailwind CSS configuration.", resources: ["Tailwind CSS Docs", "MDN CSS Layouts"], duration: "1 month" },
        { title: "Advanced JavaScript & TypeScript Core", desc: "Learn asynchronous flows, DOM scripting, type assertions, interface configurations, and ESNext methods.", resources: ["TypeScript Deep Dive", "Eloquent JavaScript"], duration: "1.5 months" },
        { title: "Component Systems & State Architectures", desc: "Build modular web components using React, handling Context APIs, custom hooks, memoization, and React 19 rules.", resources: ["React.dev guides", "Epic React tutorials"], duration: "2.5 months" }
      ];
    } else if (roleLower.includes("data") || roleLower.includes("machine") || roleLower.includes("learning") || roleLower.includes("ml") || roleLower.includes("ai") || roleLower.includes("nlp") || roleLower.includes("science")) {
      estimatedMonths = 8;
      roadmapSteps = [
        { title: "Probability, Statistics, & Python Core", desc: "Build solid foundation in NumPy, Pandas, linear algebra, hypothesis testing, and descriptive statistics.", resources: ["Python for Data Analysis book", "StatQuest Youtube Series"], duration: "2 months" },
        { title: "Classical Machine Learning Models", desc: "Train and tune Scikit-Learn classifiers, regressions, decision trees, random forests, and gradient boosters.", resources: ["Hands-On ML with Scikit-Learn", "Kaggle Micro-courses"], duration: "3 months" },
        { title: "Deep Learning & Generative Architectures", desc: "Configure Neural Networks with PyTorch, explore CNNs for vision, RNNs/Transformers for text, and query Gemini APIs.", resources: ["Fast.ai Deep Learning course", "HuggingFace NLP course"], duration: "3 months" }
      ];
    } else if (roleLower.includes("devops") || roleLower.includes("cloud") || roleLower.includes("aws") || roleLower.includes("infrastructure") || roleLower.includes("kubernetes") || roleLower.includes("sre")) {
      estimatedMonths = 6;
      roadmapSteps = [
        { title: "Linux Systems & Scripting Core", desc: "Master Bash automation, systemd process management, user permissions, and network configurations.", resources: ["Linux Journey tutorial", "Bash scripting guide"], duration: "1.5 months" },
        { title: "Containerization & Orchestration", desc: "Build optimized Docker files, run container clusters with Docker Compose, and orchestrate with Kubernetes.", resources: ["Kubernetes Up & Running", "Docker Mastery course"], duration: "2 months" },
        { title: "Infrastructure as Code & CI/CD Pipelines", desc: "Automate provisions with Terraform, and configure deployment loops using GitHub Actions or GitLab pipelines.", resources: ["Terraform Up & Running", "GitHub Actions docs"], duration: "2.5 months" }
      ];
    } else if (roleLower.includes("security") || roleLower.includes("cyber") || roleLower.includes("pentest") || roleLower.includes("ethical")) {
      estimatedMonths = 7;
      roadmapSteps = [
        { title: "Networking Protocols & Operating Systems Security", desc: "Master TCP/IP, DNS, SSL/TLS, firewalls, and securing Linux and Windows server nodes.", resources: ["CompTIA Security+ guide", "Professor Messer lectures"], duration: "2 months" },
        { title: "OWASP Top 10 & Web Vulnerabilities", desc: "Audit web portals for SQLi, XSS, CSRF, insecure object references, and execute penetration audits.", resources: ["PortSwigger Web Security Academy", "OWASP testing guide"], duration: "2.5 months" },
        { title: "Incident Response & Defensive Ops", desc: "Configure SIEM tools, analyze network packet logs using Wireshark, and set up IDS rule sets.", resources: ["Wireshark Network Analysis", "Splunk tutorials"], duration: "2.5 months" }
      ];
    } else {
      // Default general backend/full-stack
      estimatedMonths = 6;
      roadmapSteps = [
        { title: "Master Modern Backend Systems", desc: "Gain deep proficiency in Express, Node.js and database structuring with Firebase Firestore or MongoDB.", resources: ["Traversy Media Express crash course", "Official Node docs"], duration: "1.5 months" },
        { title: "Understand Containerization & DevOps", desc: "Learn Docker, GitHub Actions CI/CD to containerize the applications and deploy pipelines.", resources: ["Docker Mastery by Bret Fisher", "DevOps Roadmap on roadmap.sh"], duration: "2 months" },
        { title: "Build Scalable System Architecture", desc: "Design microservices, handle rate-limiters, cache with Redis and test integrations.", resources: ["ByteByteGo System Design", "Pragmatic Programmer book"], duration: "2.5 months" }
      ];
    }

    return res.json({
      estimatedMonths,
      roadmapSteps,
      _mock: true
    });
  }

  try {
    const prompt = `Create an elegant step-by-step career development roadmap to transition to the role of "${targetRole}" starting with current skills: ${JSON.stringify(currentSkills || [])}.
    
    Return a JSON object with:
    {
      "estimatedMonths": number,
      "roadmapSteps": [
        {
          "title": "step title",
          "desc": "detailed step description",
          "resources": ["resource 1", "resource 2"],
          "duration": "e.g. 1 month"
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: JSON_MIME_CONFIG
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Career Roadmap Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate roadmap" });
  }
});

// 7. AI Fraud Detection
app.post("/api/ai/fraud-detection", async (req, res) => {
  const { resumeText } = req.body;
  if (!resumeText) {
    return res.status(400).json({ error: "Missing resumeText" });
  }

  if (!ai) {
    return res.json({
      riskScore: 25,
      riskLevel: "Low",
      issues: ["No timeline gaps, but contains slight keyword density for 'React' which could look like subtle optimization."],
      explanation: "The profile seems standard with realistic educational timelines and progressive project difficulty.",
      _mock: true
    });
  }

  try {
    const prompt = `Inspect this resume text for potential issues such as:
    - Timeline overlaps or unrealistic gapless transitions
    - Fake or generic company/project phrasing
    - Duplicate template content
    - Exaggerated skill stacks (e.g. 15 core database types claimed simultaneously for entry role)
    - Key-word stuffing patterns
    
    Resume Text:
    ${resumeText}
    
    Return a JSON object with:
    {
      "riskScore": number (0-100 where higher means higher fraud risk),
      "riskLevel": "Low" | "Medium" | "High",
      "issues": array of strings (list of specific suspicious points found),
      "explanation": string (overall reasoning summary)
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: JSON_MIME_CONFIG
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Fraud Detection Error:", err);
    res.status(500).json({ error: err.message || "Failed to screen for fraud" });
  }
});

// 8. AI Hiring Assistant (Recruiter Copilot Chat)
app.post("/api/ai/recruiter-chat", async (req, res) => {
  const { message, chatHistory, candidates, jobs } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  if (!ai) {
    return res.json({
      response: "Hello! I am your AI Recruiter Co-pilot. Based on your current roster, I notice we have some high-potential matches. If we look at candidates like Rahul or Priya, they possess strong React and database design skills. Please ask me to compare specific applicants or search by technical keywords!",
      recommendedCandidateIds: candidates && candidates.length > 0 ? [candidates[0].id] : [],
      _mock: true
    });
  }

  try {
    const prompt = `You are an elite Recruiter Copilot Assistant. Help the recruiter search candidates, compare them, explain rankings, and suggest best hires.
    
    Available Job Posts:
    ${JSON.stringify(jobs || [], null, 2)}
    
    Available Candidate Applications/Profiles:
    ${JSON.stringify(candidates || [], null, 2)}
    
    Conversation History:
    ${JSON.stringify(chatHistory || [], null, 2)}
    
    Current Message:
    "${message}"
    
    Return a JSON object containing:
    {
      "response": "Your markdown formatted reply providing details, tables, or explanation.",
      "recommendedCandidateIds": ["candidate_id_1", "candidate_id_2"] (optional array of matches relevant to the recruiter's query)
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: JSON_MIME_CONFIG
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Recruiter Chat Error:", err);
    res.status(500).json({ error: err.message || "Failed to process recruitment co-pilot message" });
  }
});

// 9. AI Skill Verification Quiz
app.post("/api/ai/skill-verification", async (req, res) => {
  const { skillName } = req.body;
  if (!skillName) {
    return res.status(400).json({ error: "Missing skillName" });
  }

  if (!ai) {
    return res.json({
      questions: [
        { question: `What is the primarily designed use-case of ${skillName}?`, options: ["Performance scaling", "Data storage modeling", "Stateless component execution", "State synchronization"], correctIndex: 2 },
        { question: `Which of the following is considered a major performance anti-pattern in ${skillName}?`, options: ["Declaring prop-types", "Triggering state changes inside render logic", "Splitting code into custom hooks", "Using absolute layouts"], correctIndex: 1 },
        { question: `How can you optimize runtime latency in a highly intensive ${skillName} procedure?`, options: ["Memoizing costly computation returns", "Increasing CSS rules count", "Removing TypeScript typings", "Replacing local variables with global scope"], correctIndex: 0 }
      ],
      _mock: true
    });
  }

  try {
    const prompt = `Generate a rigorous 4-question multiple-choice technical assessment/quiz for the skill: "${skillName}".
    Each question must have exactly 4 plausible technical options and 1 clear correct answer.
    
    Return a JSON object with:
    {
      "questions": [
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctIndex": number (0 to 3)
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: JSON_MIME_CONFIG
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Quiz Generation Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate assessment quiz" });
  }
});

// 10. AI Hiring Success Predictor
app.post("/api/ai/hiring-predictor", async (req, res) => {
  const { candidate, job, quizScores, atsScore } = req.body;
  if (!candidate || !job) {
    return res.status(400).json({ error: "Missing candidate or job parameters" });
  }

  if (!ai) {
    return res.json({
      probability: 88,
      reasoning: "The candidate demonstrates exceptional matching skills (90% ATS match) and has proven expertise through verified skill tests.",
      trainingRequired: ["Advanced Docker Deployment patterns", "AWS CloudFormation structures"],
      recommendedRole: "Frontend Developer (React Expert) with Backend Transition Track",
      _mock: true
    });
  }

  try {
    const prompt = `Estimate the candidate's hiring success rate and training needs for the job:
    Job: ${JSON.stringify(job)}
    Candidate Info: ${JSON.stringify(candidate)}
    Skill Quiz Scores: ${JSON.stringify(quizScores || [])}
    ATS Score: ${atsScore || 70}
    
    Return a JSON object with:
    {
      "probability": number (0-100 of predicted performance success),
      "reasoning": string (explainable reasoning based on data),
      "trainingRequired": array of strings (suggested training topics upon hiring),
      "recommendedRole": string (e.g. Senior Frontend, Mid Backend, etc.)
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: JSON_MIME_CONFIG
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (err: any) {
    console.error("Hiring Predictor Error:", err);
    res.status(500).json({ error: err.message || "Failed to predict hiring success" });
  }
});


// Vite middleware for development & static file serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
