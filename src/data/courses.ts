import aiImg from "@/assets/course-ai.jpg";
import dataImg from "@/assets/course-data.jpg";
import devImg from "@/assets/course-dev.jpg";
import securityImg from "@/assets/course-security.jpg";
import cloudImg from "@/assets/course-cloud.jpg";
import databaseImg from "@/assets/course-database.jpg";
import automationImg from "@/assets/course-automation.jpg";

export type CategoryId =
  | "ai"
  | "data-science"
    "data-analysis"
  | "development"
  | "cybersecurity"
  | "cloud"
  | "database"
  | "automation"
    "management";

export type Level = "Beginner" | "Intermediate" | "Advanced";
export type Delivery = "Physical" | "Live Online" | "Both";

export interface Category {
  id: CategoryId;
  name: string;
  shortName: string;
  description: string;
  image: string;
}

export interface Course {
  slug: string;
  title: string;
  category: CategoryId;
  level: Level;
  duration: string;
  delivery: Delivery;
  summary: string;
  overview: string;
  audience: string;
  outcomes: string[];
  curriculum: { module: string; topics: string[] }[];
  prerequisites: string[];
  featured?: boolean;
  image: string;
}

export const categories: Category[] = [
  {
    id: "ai",
    name: "Artificial Intelligence",
    shortName: "AI",
    description: "Machine learning, generative AI and applied model building.",
    image: aiImg,
  },
  {
    id: "data-science",
    name: "Data Science ",
    shortName: "Data Science",
    description: "Analysis, visualisation and decision-ready reporting.",
    image: dataImg,
  },
  
  {
    id: "data-analysis",
    name: "Data Analysis",
    shortName: "Data Analysis",
    description: "Exploring data, identifying patterns and drawing insights.",
    image: dataImg,
  },
   {
    id: "management",
    name: "Project Management",
    shortName: "Management",
    description: "Planning, executing and closing projects effectively.",
    image: dataImg,
  },
  {
    id: "development",
    name: "Software Development",
    shortName: "Development",
    description: "Front-end, back-end and full-stack engineering.",
    image: devImg,
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    shortName: "Cybersecurity",
    description: "Defensive and offensive security fundamentals.",
    image: securityImg,
  },
  {
    id: "cloud",
    name: "Cloud Computing",
    shortName: "Cloud",
    description: "Cloud architecture, deployment and DevOps practice.",
    image: cloudImg,
  },
  {
    id: "database",
    name: "Database Management",
    shortName: "Database",
    description: "Modelling, SQL and production database administration.",
    image: databaseImg,
  },
  {
    id: "automation",
    name: "Automation",
    shortName: "Automation",
    description: "Scripting and no-code workflow automation for real work.",
    image: automationImg,
  },
];

export const categoryName = (id: CategoryId) =>
  categories.find((c) => c.id === id)?.name ?? id;

export const courses: Course[] = [
  {
    slug: "applied-machine-learning-with-python",
    title: "Applied Machine Learning with Python",
    category: "ai",
    level: "Intermediate",
    duration: "10 weeks",
    delivery: "Both",
    featured: true,
    image: aiImg,
    summary:
      "Build, evaluate and ship supervised and unsupervised models on real datasets.",
    overview:
      "A hands-on programme that takes you from clean data to a deployed model. You work with real, messy datasets every week and finish with a portfolio project you can defend in an interview.",
    audience:
      "Analysts, developers and graduates who already write basic Python and want production machine learning skills.",
    outcomes: [
      "Frame a business problem as a machine learning task",
      "Engineer features and handle missing, skewed and imbalanced data",
      "Train and tune regression, classification and clustering models",
      "Evaluate models properly with cross-validation and the right metrics",
      "Package and deploy a model behind a simple API",
    ],
    curriculum: [
      { module: "Foundations", topics: ["Python for ML", "NumPy & pandas", "The ML workflow"] },
      { module: "Supervised learning", topics: ["Linear & logistic models", "Trees & ensembles", "Model evaluation"] },
      { module: "Unsupervised learning", topics: ["Clustering", "Dimensionality reduction", "Anomaly detection"] },
      { module: "Deployment", topics: ["Pipelines", "Model serving with FastAPI", "Monitoring & drift"] },
    ],
    prerequisites: ["Basic Python", "Comfort with spreadsheets or SQL"],
  },
  {
    slug: "generative-ai-and-llm-applications",
    title: "Generative AI & LLM Applications",
    category: "ai",
    level: "Intermediate",
    duration: "6 weeks",
    delivery: "Live Online",
    featured: true,
    image: aiImg,
    summary:
      "Design prompts, build RAG pipelines and ship useful AI assistants for real businesses.",
    overview:
      "Go beyond chatbot demos. You learn how large language models actually behave, how to ground them in your own documents, and how to evaluate output quality before it reaches users.",
    audience: "Developers, product people and analysts building AI features at work.",
    outcomes: [
      "Write reliable, testable prompts",
      "Build retrieval-augmented generation over your own documents",
      "Use embeddings and vector search effectively",
      "Add guardrails, evaluation and cost controls",
      "Ship an AI assistant end to end",
    ],
    curriculum: [
      { module: "How LLMs work", topics: ["Tokens & context", "Model selection", "Cost and latency"] },
      { module: "Prompt engineering", topics: ["Structured output", "Few-shot patterns", "Failure modes"] },
      { module: "RAG", topics: ["Chunking", "Embeddings & vector stores", "Grounded answers"] },
      { module: "Production", topics: ["Evaluation harnesses", "Guardrails", "Deployment"] },
    ],
    prerequisites: ["Any programming experience"],
  },
  {
    slug: "data-analysis-with-python",
    title: "Data Analysis ",
    category: "data-science",
    level: "Beginner",
    duration: "8 weeks",
    delivery: "Both",
    featured: true,
    image: dataImg,
    summary:
      "Clean, analyse and visualise real data with pandas, then tell the story behind it.",
    overview:
      "The fastest route from spreadsheets to code. Each session is built around a real dataset, and you leave with three analysis projects in your portfolio.",
    audience: "Career switchers, graduates and professionals who work with data in Excel today.",
    outcomes: [
      "Load, clean and reshape data with pandas",
      "Perform exploratory analysis with confidence",
      "Build clear charts with matplotlib and seaborn",
      "Automate recurring reports",
      "Present findings to non-technical stakeholders",
    ],
    curriculum: [
      { module: "Python essentials", topics: ["Syntax", "Data structures", "Notebooks"] },
      { module: "pandas", topics: ["Cleaning", "Joins & groupby", "Time series"] },
      { module: "Visualisation", topics: ["Chart selection", "matplotlib & seaborn", "Design for clarity"] },
      { module: "Capstone", topics: ["End-to-end analysis", "Reporting", "Presentation"] },
    ],
    prerequisites: ["None — we start from zero"],
  },
  {
    slug: "Business-intelligence",
    title: "Power BI for Business Intelligence",
    category: "data-science",
    level: "Beginner",
    duration: "5 weeks",
    delivery: "Both",
    image: dataImg,
    summary: "Model data and build dashboards executives actually use.",
    overview:
      "A practical Power BI course focused on data modelling and DAX, not just drag-and-drop visuals. You build a full company dashboard from raw exports.",
    audience: "Analysts, finance and operations staff who report on numbers weekly.",
    outcomes: [
      "Connect and transform data with Power Query",
      "Design star-schema data models",
      "Write DAX measures that stay correct",
      "Build interactive, fast dashboards",
      "Publish and share reports securely",
    ],
    curriculum: [
      { module: "Power Query", topics: ["Connectors", "Transformations", "Refresh"] },
      { module: "Modelling", topics: ["Relationships", "Star schema", "Date tables"] },
      { module: "DAX", topics: ["Measures", "Filter context", "Time intelligence"] },
      { module: "Delivery", topics: ["Report design", "Publishing", "Row-level security"] },
    ],
    prerequisites: ["Working knowledge of Excel"],
  },
  {
    slug: "full-stack-web-development",
    title: "Full-Stack Web Development",
    category: "development",
    level: "Beginner",
    duration: "16 weeks",
    delivery: "Both",
    featured: true,
    image: devImg,
    summary:
      "Go from HTML to deployed full-stack apps with React, TypeScript and a real database.",
    overview:
      "Our flagship developer programme. Small cohorts, weekly code review and four shipped projects — you graduate with a live portfolio, not just certificates.",
    audience: "Beginners serious about a developer career, and self-taught coders filling gaps.",
    outcomes: [
      "Build responsive interfaces with HTML, CSS and React",
      "Write maintainable TypeScript",
      "Design and consume REST APIs",
      "Work with a relational database and authentication",
      "Deploy, monitor and iterate on a live application",
    ],
    curriculum: [
      { module: "Web foundations", topics: ["HTML & semantics", "CSS layout", "Responsive design"] },
      { module: "JavaScript & TypeScript", topics: ["Language core", "Async", "Types"] },
      { module: "React", topics: ["Components & state", "Routing", "Data fetching"] },
      { module: "Back-end", topics: ["APIs", "Databases", "Auth"] },
      { module: "Ship it", topics: ["Testing", "CI/CD", "Deployment"] },
    ],
    prerequisites: ["Basic computer literacy"],
  },
  {
    slug: "mobile-app-development-react-native",
    title: "Mobile App Development with React Native",
    category: "development",
    level: "Intermediate",
    duration: "8 weeks",
    delivery: "Live Online",
    image: devImg,
    summary: "Build and publish cross-platform Android and iOS apps from one codebase.",
    overview:
      "Turn your web skills into mobile skills. You build a production-quality app with navigation, offline storage and push notifications, then publish it to the stores.",
    audience: "Web developers moving into mobile.",
    outcomes: [
      "Structure a React Native project",
      "Implement navigation and native device features",
      "Handle offline storage and sync",
      "Add push notifications",
      "Publish to Google Play and the App Store",
    ],
    curriculum: [
      { module: "Setup", topics: ["Expo", "Project structure", "Debugging"] },
      { module: "Core UI", topics: ["Layout", "Navigation", "Animations"] },
      { module: "Device & data", topics: ["Camera & location", "Local storage", "APIs"] },
      { module: "Release", topics: ["Builds", "Store submission", "Updates"] },
    ],
    prerequisites: ["JavaScript and React basics"],
  },
  {
    slug: "cybersecurity-fundamentals",
    title: "Cybersecurity Fundamentals",
    category: "cybersecurity",
    level: "Beginner",
    duration: "8 weeks",
    delivery: "Both",
    featured: true,
    image: securityImg,
    summary: "Understand threats, defences and the daily work of a security analyst.",
    overview:
      "A lab-driven introduction to security operations. You investigate simulated incidents each week and finish able to work confidently in a junior SOC role.",
    audience: "IT support staff, graduates and anyone starting a security career.",
    outcomes: [
      "Explain core security principles and common attack paths",
      "Harden systems, accounts and networks",
      "Use SIEM tooling to investigate alerts",
      "Run a basic incident response process",
      "Prepare for entry-level security certifications",
    ],
    curriculum: [
      { module: "Principles", topics: ["CIA triad", "Threat actors", "Risk"] },
      { module: "Network security", topics: ["Protocols", "Firewalls", "Traffic analysis"] },
      { module: "Defence", topics: ["Hardening", "Identity & access", "Logging"] },
      { module: "Operations", topics: ["SIEM", "Incident response", "Reporting"] },
    ],
    prerequisites: ["Basic networking awareness helps but is not required"],
  },
  {
    slug: "ethical-hacking-and-penetration-testing",
    title: "Ethical Hacking & Penetration Testing",
    category: "cybersecurity",
    level: "Advanced",
    duration: "10 weeks",
    delivery: "Live Online",
    image: securityImg,
    summary: "Test systems the way attackers do — legally, methodically and with a report to show for it.",
    overview:
      "Work through a full penetration test lifecycle in an isolated lab: reconnaissance, exploitation, privilege escalation and a client-ready report.",
    audience: "Security analysts and sysadmins moving into offensive security.",
    outcomes: [
      "Scope and plan an authorised engagement",
      "Perform reconnaissance and vulnerability discovery",
      "Exploit common web and network weaknesses",
      "Escalate privileges and move laterally in a lab",
      "Write a professional penetration test report",
    ],
    curriculum: [
      { module: "Methodology", topics: ["Rules of engagement", "Recon", "Scanning"] },
      { module: "Web exploitation", topics: ["OWASP Top 10", "Injection", "Auth flaws"] },
      { module: "Network exploitation", topics: ["Services", "Privilege escalation", "Pivoting"] },
      { module: "Reporting", topics: ["Evidence", "Risk rating", "Remediation advice"] },
    ],
    prerequisites: ["Linux command line", "Networking fundamentals"],
  },
  {
    slug: "aws-cloud-practitioner-to-solutions-architect",
    title: "AWS Cloud: Practitioner to Solutions Architect",
    category: "cloud",
    level: "Intermediate",
    duration: "10 weeks",
    delivery: "Both",
    image: cloudImg,
    summary: "Design, secure and cost-optimise real workloads on AWS.",
    overview:
      "Built around the Solutions Architect Associate blueprint, with weekly hands-on labs in your own AWS account so the knowledge sticks.",
    audience: "IT professionals and developers moving workloads to the cloud.",
    outcomes: [
      "Navigate core AWS compute, storage and networking services",
      "Design highly available, fault-tolerant architectures",
      "Apply IAM and security best practice",
      "Control and forecast cloud spend",
      "Prepare for the Solutions Architect Associate exam",
    ],
    curriculum: [
      { module: "Core services", topics: ["EC2 & S3", "VPC", "RDS"] },
      { module: "Architecture", topics: ["High availability", "Scaling", "Decoupling"] },
      { module: "Security", topics: ["IAM", "Encryption", "Monitoring"] },
      { module: "Operations", topics: ["Cost optimisation", "Infrastructure as code", "Exam prep"] },
    ],
    prerequisites: ["General IT or development experience"],
  },
  {
    slug: "devops-with-docker-and-kubernetes",
    title: "DevOps with Docker & Kubernetes",
    category: "cloud",
    level: "Advanced",
    duration: "8 weeks",
    delivery: "Live Online",
    image: cloudImg,
    summary: "Containerise applications and run them reliably with automated pipelines.",
    overview:
      "A practical DevOps course: you containerise a real application, orchestrate it on Kubernetes and automate delivery with CI/CD.",
    audience: "Developers and sysadmins responsible for deployments.",
    outcomes: [
      "Write efficient Dockerfiles and compose stacks",
      "Deploy and scale workloads on Kubernetes",
      "Build CI/CD pipelines",
      "Manage configuration and secrets safely",
      "Add monitoring, logging and alerting",
    ],
    curriculum: [
      { module: "Containers", topics: ["Images", "Networking", "Volumes"] },
      { module: "Kubernetes", topics: ["Pods & deployments", "Services & ingress", "Scaling"] },
      { module: "Automation", topics: ["CI/CD", "GitOps", "Infrastructure as code"] },
      { module: "Reliability", topics: ["Observability", "Alerting", "Incident basics"] },
    ],
    prerequisites: ["Linux basics", "Some deployment experience"],
  },
  {
    slug: "sql-and-database-administration",
    title: "SQL & Database Administration",
    category: "database",
    level: "Beginner",
    duration: "6 weeks",
    delivery: "Both",
    image: databaseImg,
    summary: "Query with confidence, design sound schemas and keep databases healthy.",
    overview:
      "From your first SELECT to backups, indexing and performance tuning on PostgreSQL and SQL Server.",
    audience: "Analysts, developers and IT staff who work with databases.",
    outcomes: [
      "Write complex queries including joins, CTEs and window functions",
      "Design normalised schemas",
      "Index and tune slow queries",
      "Manage users, permissions and backups",
      "Automate routine database tasks",
    ],
    curriculum: [
      { module: "Querying", topics: ["SELECT & filtering", "Joins", "Aggregation"] },
      { module: "Advanced SQL", topics: ["CTEs", "Window functions", "Stored procedures"] },
      { module: "Design", topics: ["Normalisation", "Constraints", "Migrations"] },
      { module: "Administration", topics: ["Indexing", "Backups & recovery", "Security"] },
    ],
    prerequisites: ["None"],
  },
  {
    slug: "workflow-automation-with-python-and-no-code",
    title: "Workflow Automation with Python & No-Code",
    category: "automation",
    level: "Beginner",
    duration: "4 weeks",
    delivery: "Live Online",
    image: automationImg,
    summary: "Automate reports, files and repetitive admin work — with or without code.",
    overview:
      "A short, high-impact course. Bring the tasks that waste your week and leave with them automated using Python scripts and tools like Zapier and Make.",
    audience: "Operations, admin and finance teams, and anyone drowning in repetitive tasks.",
    outcomes: [
      "Identify tasks worth automating",
      "Script file, spreadsheet and email automation in Python",
      "Connect apps with no-code automation tools",
      "Schedule and monitor automated jobs",
      "Document automations so a team can maintain them",
    ],
    curriculum: [
      { module: "Automation mindset", topics: ["Mapping processes", "Choosing tools", "Risk & review"] },
      { module: "Python scripting", topics: ["Files & folders", "Excel & CSV", "Email & APIs"] },
      { module: "No-code", topics: ["Zapier & Make", "Webhooks", "Data between apps"] },
      { module: "Operate", topics: ["Scheduling", "Error handling", "Handover docs"] },
    ],
    prerequisites: ["None"],
  },
];

export const featuredCourses = courses.filter((c) => c.featured);

export const getCourse = (slug: string) => courses.find((c) => c.slug === slug);