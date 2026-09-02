import aiImg from "@/assets/course-ai.jpg";
import dataImg from "@/assets/course-data.jpg";
import advancedExcelImg from "@/assets/advanced-excel.png";
import devImg from "@/assets/course-dev.jpg";
import securityImg from "@/assets/course-security.jpg";
import cloudImg from "@/assets/course-cloud.jpg";
import databaseImg from "@/assets/course-database.jpg";
import automationImg from "@/assets/course-automation.jpg";
import managementImg from "@/assets/project-management.png";
import danImg from "@/assets/Applied-Machine- Learning-with- Python.png";

export type CategoryId =
  | "ai"
  | "data-science"
  | "data-analysis"
  | "development"
  | "cybersecurity"
  | "cloud"
  | "database"
  | "automation"
  | "management";

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
  // Already used by several course entries below but not previously declared
  // here — adding them so TypeScript stops silently allowing (or flagging)
  // excess properties on those objects.
  tools?: string[];
  projects?: string[];
  // New: SEO-focused fields. All optional, so existing courses keep working
  // without changes. Fill these in gradually, course by course.
  seoIntro?: string;
  faqs?: { question: string; answer: string }[];
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
    id: "ai",
    name: "Machine Learning",
    shortName: "Apply Machine Learning",
    description: "Build Business Solution.",
    image: danImg,
  },
  {
    id: "data-science",
    name: "Data Science",
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
    image: managementImg,
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
  slug: "full-stack-data-science",
  title: "Full-Stack Data Science",
  category: "data-science",
  level: "Beginner to Advanced",
  duration: "10 weeks",
  delivery: "Both",
  featured: true,
  image: dataImg,

  summary:
    "Master the complete data workflow with Excel, SQL, Python, SPSS, Power BI and Tableau. From raw data to analysis, visualisation and business insight.",

  seoIntro:
    "Looking for a Data Science course in Lagos that actually takes you from beginner to job-ready? The Full-Stack Data Science programme at Corepoint Tech Academy is a 10-week, project-based course covering the entire modern data workflow — Excel, SQL, Python, SPSS, Power BI and Tableau — so you learn to work with data the way real analysts and data scientists do, not just watch tutorials. Whether you're a graduate starting out, a data analyst looking to add Python and machine learning to your toolkit, or a career changer in Nigeria aiming for a data science role, this course is built to get you from raw data to real, portfolio-ready insight.",

  overview:
    "A comprehensive, project-based Data Science programme designed to take learners from foundational data analysis to advanced data science workflows. Students work with industry-relevant tools including Microsoft Excel, SQL, Python, SPSS, Power BI and Tableau while developing practical skills in data cleaning, statistical analysis, exploratory data analysis, data visualisation, business intelligence and predictive analytics. Throughout the programme, learners work with real-world datasets and complete portfolio projects that demonstrate their ability to transform raw data into actionable insights.",

  audience:
    "Aspiring data scientists, data analysts, business intelligence professionals, graduates, researchers, business professionals and career changers who want comprehensive practical skills across the modern data analytics and data science ecosystem.",

  outcomes: [
    "Understand the complete data science and analytics lifecycle",
    "Collect, clean, transform and prepare real-world datasets",
    "Use Microsoft Excel for advanced data analysis and reporting",
    "Write SQL queries to extract and analyse data from relational databases",
    "Use Python for data cleaning, exploratory analysis and statistical computing",
    "Perform statistical analysis using SPSS",
    "Create interactive dashboards and reports with Power BI",
    "Build professional data visualisations using Tableau",
    "Perform exploratory data analysis and identify meaningful patterns",
    "Apply descriptive and inferential statistical techniques",
    "Perform correlation and regression analysis",
    "Communicate analytical findings through effective data storytelling",
    "Select the appropriate tool for different data analysis and business problems",
    "Combine multiple tools into an end-to-end data workflow",
    "Develop portfolio-ready data analytics and data science projects",
    "Present data-driven recommendations to technical and non-technical stakeholders",
  ],

  faqs: [
    {
      question: "Do I need a data or programming background to join this course?",
      answer:
        "No. The course starts with foundational data analysis using Excel before introducing SQL and Python, so no prior programming or data experience is required.",
    },
    {
      question: "Is this course focused on Data Analysis or Data Science?",
      answer:
        "Both. It's designed as a full-stack progression: you start with data analysis fundamentals (Excel, SQL, statistics) and build up to data science skills (Python, predictive analytics), so you finish with both skill sets.",
    },
    {
      question: "Will I get hands-on practice, or is it mostly theory?",
      answer:
        "The course is project-based throughout. You'll work with real-world datasets and build portfolio projects using each tool covered — Excel, SQL, Python, SPSS, Power BI, and Tableau.",
    },
    {
      question: "Is this course available online, or only in Lagos?",
      answer:
        "This course is available both physically in Lagos and live online, so you can join from anywhere in Nigeria.",
    },
  ],

  curriculum: [
    {
      module: "Module 1: Introduction to Data Science & Analytics",
      topics: [
        "Introduction to data science",
        "Data science vs data analytics",
        "Business intelligence fundamentals",
        "The data analytics lifecycle",
        "The data science lifecycle",
        "Types of data",
        "Structured and unstructured data",
        "Data collection and preparation",
        "Data quality",
        "Exploratory data analysis",
        "Data-driven decision making",
        "Choosing the right data tool",
      ],
    },

    {
      module: "Module 2: Advanced Excel for Data Analysis",
      topics: [
        "Advanced Excel functions",
        "XLOOKUP and lookup techniques",
        "INDEX and MATCH",
        "Logical and conditional functions",
        "Text and date functions",
        "Dynamic arrays",
        "Data cleaning",
        "Excel Tables",
        "Data validation",
        "PivotTables",
        "PivotCharts",
        "Slicers and interactive reporting",
        "Power Query",
        "Data modelling in Excel",
        "Advanced Excel dashboards",
      ],
    },

    {
      module: "Module 3: SQL for Data Analysis",
      topics: [
        "Relational databases",
        "Database concepts",
        "SELECT statements",
        "Filtering and sorting",
        "Aggregate functions",
        "GROUP BY and HAVING",
        "INNER and OUTER joins",
        "Subqueries",
        "Common Table Expressions",
        "Window functions",
        "CASE statements",
        "Date and time analysis",
        "Data cleaning with SQL",
        "Business analysis using SQL",
      ],
    },

    {
      module: "Module 4: Python for Data Science",
      topics: [
        "Python fundamentals for data science",
        "Jupyter Notebook",
        "NumPy",
        "Pandas",
        "Importing datasets",
        "Data cleaning",
        "Missing values",
        "Duplicate records",
        "Data transformation",
        "Grouping and aggregation",
        "Merging datasets",
        "Exploratory Data Analysis",
        "Working with APIs",
        "Automating data analysis workflows",
      ],
    },

    {
      module: "Module 5: Statistics & SPSS",
      topics: [
        "Introduction to statistics",
        "Descriptive statistics",
        "Measures of central tendency",
        "Measures of dispersion",
        "Probability fundamentals",
        "Sampling techniques",
        "Hypothesis testing",
        "Confidence intervals",
        "t-tests",
        "Chi-square tests",
        "ANOVA",
        "Correlation analysis",
        "Regression analysis",
        "SPSS interface",
        "Data preparation in SPSS",
        "Statistical analysis in SPSS",
        "Interpreting SPSS output",
      ],
    },

    {
      module: "Module 6: Data Visualisation with Python",
      topics: [
        "Principles of data visualisation",
        "Choosing the right visualisation",
        "Matplotlib",
        "Seaborn",
        "Bar charts",
        "Line charts",
        "Scatter plots",
        "Histograms",
        "Box plots",
        "Heatmaps",
        "Distribution analysis",
        "Statistical visualisation",
        "Data storytelling",
      ],
    },

    {
      module: "Module 7: Power BI for Business Intelligence",
      topics: [
        "Introduction to Power BI",
        "Power BI Desktop",
        "Connecting to data sources",
        "Power Query",
        "Data transformation",
        "Data modelling",
        "Relationships",
        "Star schema",
        "Date tables",
        "DAX fundamentals",
        "Calculated columns",
        "Measures",
        "Filter context",
        "Time intelligence",
        "Interactive dashboards",
        "Power BI Service",
        "Publishing and sharing reports",
      ],
    },

    {
      module: "Module 8: Tableau for Data Visualisation",
      topics: [
        "Introduction to Tableau",
        "Connecting to datasets",
        "Tableau data preparation",
        "Dimensions and measures",
        "Calculated fields",
        "Filters and parameters",
        "Charts and visualisations",
        "Dashboards",
        "Interactive dashboards",
        "Geographical visualisation",
        "Advanced visual analytics",
        "Storytelling with Tableau",
        "Publishing and sharing dashboards",
      ],
    },

    {
      module: "Module 9: Predictive Analytics & Data Science",
      topics: [
        "Introduction to predictive analytics",
        "Regression fundamentals",
        "Linear regression",
        "Logistic regression",
        "Feature engineering",
        "Model preparation",
        "Training and testing data",
        "Model evaluation",
        "Classification fundamentals",
        "Clustering fundamentals",
        "Introduction to machine learning",
        "Business applications of predictive analytics",
      ],
    },

    {
      module: "Module 10: Data Integration & End-to-End Analytics",
      topics: [
        "Building an end-to-end data workflow",
        "Combining Excel and SQL",
        "Connecting SQL databases to Power BI",
        "Connecting Python to databases",
        "Preparing data with Python",
        "Statistical analysis with SPSS",
        "Dashboard development with Power BI",
        "Visualisation with Tableau",
        "Data consistency across tools",
        "Automating recurring analysis",
        "Building reproducible workflows",
        "Data governance fundamentals",
      ],
    },

    {
      module: "Module 11: Data Storytelling & Business Communication",
      topics: [
        "Turning analysis into insights",
        "Identifying key business questions",
        "Choosing meaningful KPIs",
        "Building executive dashboards",
        "Data storytelling principles",
        "Presenting analytical findings",
        "Communicating statistical results",
        "Writing data-driven reports",
        "Presenting insights to stakeholders",
        "Making evidence-based recommendations",
      ],
    },

    {
      module: "Module 12: Full-Stack Data Science Capstone",
      topics: [
        "Business problem definition",
        "Data collection",
        "Data extraction using SQL",
        "Data cleaning using Excel or Python",
        "Statistical analysis using SPSS or Python",
        "Exploratory data analysis",
        "Data visualisation",
        "Power BI dashboard development",
        "Tableau dashboard development",
        "Predictive analysis",
        "Business insight generation",
        "Executive reporting",
        "Final project presentation",
        "Portfolio documentation",
      ],
    },
  ],

  projects: [
    "Retail Sales & Customer Analytics",
    "Financial Performance & Business Intelligence Dashboard",
    "Customer Behaviour & Segmentation Analysis",
    "Employee Performance & Workforce Analytics",
    "Marketing Campaign Performance Analysis",
    "Healthcare Data Statistical Analysis",
    "Sales Forecasting & Predictive Analytics",
    "Power BI Executive Business Dashboard",
    "Tableau Interactive Analytics Dashboard",
    "End-to-End Full-Stack Data Science Capstone",
  ],

  tools: [
    "Microsoft Excel",
    "Power Query",
    "SQL",
    "PostgreSQL",
    "Microsoft SQL Server",
    "Python",
    "Pandas",
    "NumPy",
    "Matplotlib",
    "Seaborn",
    "SPSS",
    "Power BI",
    "DAX",
    "Tableau",
    "Jupyter Notebook",
    "Git & GitHub",
  ],

  prerequisites: [
    "Basic computer literacy",
    "No previous data science experience required",
    "Basic mathematics is recommended",
    "Basic spreadsheet knowledge is helpful but not required",
  ],
 },
  {
  slug: "r-programming-for-data-science",
  title: "R Programming for Data Science",
  category: "data-science",
  level: "Beginner to Intermediate",
  duration: "6 weeks",
  delivery: "Both",
  image: dataImg,

  summary:
    "Learn R for data analysis, statistical modelling, visualisation and data-driven decision-making using real-world datasets.",

  overview:
    "A practical, project-based R programming programme designed for learners who want to develop professional skills in data analysis and statistical computing. Students learn how to work with datasets in R, clean and transform data, perform exploratory and statistical analysis, create professional visualisations with ggplot2 and build reproducible analytical workflows. The programme combines R programming with practical statistics and real-world data science projects.",

  audience:
    "Aspiring data scientists, data analysts, researchers, statisticians, graduates, business professionals and professionals who want to develop practical data analysis skills using R.",

  outcomes: [
    "Understand the fundamentals of R programming for data science",
    "Work confidently with vectors, lists, data frames and other R data structures",
    "Import and export data from common file formats",
    "Clean and transform real-world datasets using R",
    "Perform exploratory data analysis",
    "Apply descriptive and inferential statistical techniques",
    "Create professional data visualisations using ggplot2",
    "Analyse relationships between variables",
    "Build and interpret statistical models",
    "Perform regression analysis using R",
    "Work with categorical and numerical data",
    "Create reproducible data analysis workflows",
    "Build professional reports using R Markdown",
    "Communicate analytical findings effectively",
    "Complete a portfolio-ready data science project using R",
  ],

  curriculum: [
    {
      module: "Module 1: Introduction to R & RStudio",
      topics: [
        "Introduction to R programming",
        "R for data science",
        "Installing R and RStudio",
        "RStudio interface",
        "Variables and objects",
        "Data types",
        "Vectors",
        "Lists",
        "Matrices",
        "Data frames",
        "Factors",
        "Basic R operators",
      ],
    },

    {
      module: "Module 2: R Programming Fundamentals",
      topics: [
        "Conditional statements",
        "Loops",
        "Functions",
        "Custom functions",
        "Vectorised operations",
        "Working with strings",
        "Date and time data",
        "Handling missing values",
        "Error handling",
        "Writing reusable R code",
      ],
    },

    {
      module: "Module 3: Data Import, Cleaning & Transformation",
      topics: [
        "Importing CSV files",
        "Importing Excel data",
        "Working with databases",
        "Data inspection",
        "Handling missing data",
        "Removing duplicates",
        "Data type conversion",
        "Filtering data",
        "Sorting and arranging data",
        "Creating calculated columns",
        "Joining datasets",
        "Data transformation with dplyr",
      ],
    },

    {
      module: "Module 4: Exploratory Data Analysis",
      topics: [
        "Introduction to exploratory data analysis",
        "Understanding dataset structure",
        "Descriptive statistics",
        "Measures of central tendency",
        "Measures of dispersion",
        "Grouping and aggregation",
        "Distribution analysis",
        "Outlier detection",
        "Correlation analysis",
        "Identifying trends and patterns",
        "EDA workflow with R",
      ],
    },

    {
      module: "Module 5: Data Visualisation with ggplot2",
      topics: [
        "Introduction to data visualisation",
        "Grammar of graphics",
        "Building charts with ggplot2",
        "Bar charts",
        "Line charts",
        "Scatter plots",
        "Histograms",
        "Box plots",
        "Faceting",
        "Customising visualisations",
        "Themes and annotations",
        "Statistical visualisation",
        "Data storytelling",
      ],
    },

    {
      module: "Module 6: Statistics & Statistical Modelling",
      topics: [
        "Probability fundamentals",
        "Sampling concepts",
        "Confidence intervals",
        "Hypothesis testing",
        "t-tests",
        "Chi-square tests",
        "ANOVA",
        "Correlation",
        "Simple linear regression",
        "Multiple linear regression",
        "Model interpretation",
        "Model diagnostics",
      ],
    },

    {
      module: "Module 7: Advanced Data Science with R",
      topics: [
        "Introduction to the tidyverse",
        "Advanced data manipulation",
        "Advanced visualisation",
        "Working with larger datasets",
        "Functional programming concepts",
        "Working with APIs",
        "Database connectivity",
        "Introduction to machine learning with R",
        "Classification fundamentals",
        "Clustering fundamentals",
      ],
    },

    {
      module: "Module 8: Reproducible Analysis & Reporting",
      topics: [
        "Reproducible data science",
        "R Markdown",
        "Creating analytical reports",
        "Embedding code and visualisations",
        "Generating tables",
        "Report formatting",
        "Documenting analysis",
        "Version control with Git",
        "Publishing analytical work",
        "Building a professional data science portfolio",
      ],
    },

    {
      module: "Module 9: R Data Science Capstone Project",
      topics: [
        "Define a real-world business problem",
        "Acquire and import data",
        "Clean and transform the dataset",
        "Perform exploratory data analysis",
        "Develop statistical analysis",
        "Build visualisations",
        "Develop a statistical model",
        "Interpret results",
        "Create an R Markdown report",
        "Present business insights",
        "Document the project",
        "Publish the completed project",
      ],
    },
  ],

  projects: [
    "Sales & Customer Behaviour Analysis",
    "Employee Performance & Workforce Analytics",
    "Customer Satisfaction Statistical Analysis",
    "Healthcare Data Analysis",
    "Financial & Economic Data Analysis",
    "End-to-End R Data Science Capstone Project",
  ],

  tools: [
    "R",
    "RStudio",
    "Tidyverse",
    "dplyr",
    "ggplot2",
    "tidyr",
    "readr",
    "readxl",
    "lubridate",
    "Stats",
    "R Markdown",
    "Git & GitHub",
  ],

  prerequisites: [
    "Basic computer literacy",
    "No previous R programming experience required",
    "Basic mathematics is recommended",
    "Basic understanding of statistics is helpful but not required",
  ],
},
  {
  slug: "statistical-analysis-and-data-science-with-python",
  title: "Statistical Analysis & Data Science with Python",
  category: "data-science",
  level: "Intermediate",
  duration: "6 weeks",
  delivery: "Both",
  image: dataImg,

  summary:
    "Use Python and statistics to analyse real-world data, discover meaningful patterns and support data-driven decisions.",

  overview:
    "A practical, project-based programme designed to strengthen the statistical and analytical skills required for modern data science. Students learn how to work with real-world datasets using Python, perform exploratory data analysis, apply descriptive and inferential statistics, test hypotheses, analyse relationships between variables and communicate findings effectively. The course provides a strong foundation for advanced analytics and machine learning.",

  audience:
    "Data analysts, aspiring data scientists, researchers, business professionals, graduates and Python users who want to strengthen their statistical analysis and data science skills.",

  outcomes: [
    "Understand the data science workflow from data collection to insight generation",
    "Use Python to load, clean and analyse real-world datasets",
    "Perform exploratory data analysis using Pandas and NumPy",
    "Apply descriptive statistics to understand datasets",
    "Understand probability and common probability distributions",
    "Perform statistical hypothesis tests",
    "Interpret p-values, confidence intervals and statistical significance",
    "Analyse relationships between variables using correlation and regression",
    "Identify patterns, trends, outliers and anomalies in datasets",
    "Create effective statistical visualisations with Python",
    "Communicate statistical findings to technical and non-technical audiences",
    "Apply statistical techniques to real-world business problems",
    "Build reproducible data analysis workflows using Python and Jupyter",
    "Develop a portfolio-ready statistical data science project",
  ],

  curriculum: [
    {
      module: "Module 1: Introduction to Data Science & Python",
      topics: [
        "Introduction to data science",
        "Data science vs data analytics",
        "The data science lifecycle",
        "Types of data",
        "Structured and unstructured data",
        "Python environment setup",
        "Jupyter Notebook",
        "Python fundamentals for data science",
        "NumPy fundamentals",
        "Pandas fundamentals",
      ],
    },

    {
      module: "Module 2: Data Cleaning & Exploratory Data Analysis",
      topics: [
        "Understanding real-world datasets",
        "Importing CSV and Excel data",
        "Data inspection",
        "Handling missing values",
        "Removing duplicates",
        "Data type conversion",
        "Outlier detection",
        "Data transformation",
        "Grouping and aggregation",
        "Exploratory Data Analysis",
        "Identifying trends and patterns",
      ],
    },

    {
      module: "Module 3: Descriptive Statistics & Probability",
      topics: [
        "Measures of central tendency",
        "Mean, median and mode",
        "Range and variance",
        "Standard deviation",
        "Percentiles and quartiles",
        "Probability fundamentals",
        "Conditional probability",
        "Independent and dependent events",
        "Normal distribution",
        "Binomial distribution",
        "Poisson distribution",
        "Understanding distributions in real-world data",
      ],
    },

    {
      module: "Module 4: Statistical Inference & Hypothesis Testing",
      topics: [
        "Population and sample",
        "Sampling techniques",
        "Sampling distributions",
        "Central Limit Theorem",
        "Confidence intervals",
        "Null and alternative hypotheses",
        "Type I and Type II errors",
        "p-values",
        "Statistical significance",
        "One-sample hypothesis tests",
        "Two-sample hypothesis tests",
        "Chi-square tests",
        "Practical hypothesis testing with Python",
      ],
    },

    {
      module: "Module 5: Correlation, Regression & Statistical Modelling",
      topics: [
        "Understanding relationships between variables",
        "Correlation analysis",
        "Pearson correlation",
        "Spearman correlation",
        "Correlation vs causation",
        "Simple linear regression",
        "Multiple linear regression",
        "Regression assumptions",
        "Model interpretation",
        "Residual analysis",
        "Regression evaluation",
        "Predictive analysis with Python",
      ],
    },

    {
      module: "Module 6: Data Visualisation & Statistical Reporting",
      topics: [
        "Principles of effective data visualisation",
        "Choosing the right chart",
        "Matplotlib",
        "Seaborn",
        "Distribution plots",
        "Box plots",
        "Scatter plots",
        "Correlation heatmaps",
        "Statistical visualisation",
        "Interactive visualisation fundamentals",
        "Data storytelling",
        "Communicating statistical findings",
      ],
    },

    {
      module: "Module 7: Applied Data Science Capstone Project",
      topics: [
        "Define a real-world business problem",
        "Identify and acquire relevant data",
        "Clean and prepare the dataset",
        "Perform exploratory data analysis",
        "Apply descriptive statistics",
        "Develop statistical hypotheses",
        "Perform hypothesis testing",
        "Analyse relationships between variables",
        "Build a statistical model",
        "Create visualisations",
        "Interpret and communicate findings",
        "Prepare a professional data science report",
        "Present the final project",
      ],
    },
  ],

  projects: [
    "Customer Behaviour & Sales Analysis",
    "Employee Performance & Workforce Analysis",
    "Customer Satisfaction Statistical Analysis",
    "Sales Forecasting & Trend Analysis",
    "A/B Testing & Business Decision Analysis",
    "End-to-End Statistical Data Science Capstone",
  ],

  tools: [
    "Python",
    "Pandas",
    "NumPy",
    "Matplotlib",
    "Seaborn",
    "SciPy",
    "Statsmodels",
    "Jupyter Notebook",
    "Git & GitHub",
  ],

    prerequisites: [
    "Basic Python knowledge is recommended",
    "Basic understanding of spreadsheets is helpful",
    "Basic mathematics is recommended",
    "No previous statistics experience required",
  ],
  },
  {
    slug: "project-management",
    title: "Project Management",
    category: "management",
    level: "Beginner",
    duration: "6 weeks",
    delivery: "Both",
    featured: true,
    image: managementImg,

    summary:
      "Learn how to plan, organise, execute and close projects using practical project management methods, tools and documentation.",

    overview:
      "A practical project management course designed for professionals, team leads, entrepreneurs and career starters who want to manage projects with more structure and confidence. Students learn how to define project goals, create schedules, manage stakeholders, monitor risks, coordinate teams and close projects professionally using real workplace scenarios.",

    audience:
      "Aspiring project managers, team leads, business owners, administrators, operations staff, graduates and professionals who coordinate projects or want to move into project management roles.",

    outcomes: [
      "Understand the project lifecycle from initiation to closure",
      "Define project scope, objectives, deliverables and success criteria",
      "Create work breakdown structures and practical project schedules",
      "Identify stakeholders and communicate with project teams effectively",
      "Manage project risks, issues, changes and dependencies",
      "Track progress using project dashboards, reports and meetings",
      "Apply agile and traditional project management concepts",
      "Prepare project documentation for real workplace use",
      "Close projects with lessons learned and final handover",
    ],

    curriculum: [
      {
        module: "Module 1: Project Management Foundations",
        topics: [
          "What project management is",
          "Projects vs operations",
          "The project lifecycle",
          "Project roles and responsibilities",
          "Common project management approaches",
          "Project success factors",
        ],
      },
      {
        module: "Module 2: Project Initiation & Planning",
        topics: [
          "Project charters",
          "Defining goals and deliverables",
          "Scope planning",
          "Work breakdown structures",
          "Estimating time and resources",
          "Creating a practical project plan",
        ],
      },
      {
        module: "Module 3: Scheduling, Budgeting & Resources",
        topics: [
          "Project scheduling fundamentals",
          "Milestones and dependencies",
          "Resource planning",
          "Budget tracking basics",
          "Project constraints",
          "Using project planning tools",
        ],
      },
      {
        module: "Module 4: Stakeholder & Team Management",
        topics: [
          "Stakeholder identification",
          "Communication planning",
          "Running project meetings",
          "Team coordination",
          "Conflict handling",
          "Project status reporting",
        ],
      },
      {
        module: "Module 5: Risk, Issue & Change Management",
        topics: [
          "Identifying project risks",
          "Risk assessment and response planning",
          "Issue tracking",
          "Change requests",
          "Decision logs",
          "Escalation and accountability",
        ],
      },
      {
        module: "Module 6: Project Execution & Capstone",
        topics: [
          "Monitoring project progress",
          "Managing deliverables",
          "Project dashboards",
          "Project closure",
          "Lessons learned",
          "Final project presentation",
        ],
      },
    ],

    prerequisites: [
      "Basic computer literacy",
      "No prior project management experience required",
      "Experience working with teams is helpful but not required",
    ],
  },
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
      "Learn how to build, evaluate and deploy machine learning models with Python using real-world datasets and practical business problems.",

    overview:
      "A practical, project-based machine learning programme designed to take learners from data preparation and problem definition to model development, evaluation and deployment. Students work with real-world datasets, learn both supervised and unsupervised learning techniques, develop production-ready workflows and complete portfolio projects that demonstrate practical machine learning skills.",

    audience:
      "Data analysts, software developers, data professionals, graduates and technology practitioners with basic Python knowledge who want to develop practical machine learning skills.",

    outcomes: [
      "Understand the fundamentals of machine learning and its real-world applications",
      "Translate business problems into appropriate machine learning tasks",
      "Prepare, clean and explore datasets for machine learning",
      "Handle missing values, outliers, categorical variables and imbalanced datasets",
      "Perform feature engineering and feature selection",
      "Build regression models for prediction and forecasting",
      "Build classification models for business decision-making",
      "Train and evaluate tree-based and ensemble models",
      "Apply clustering and dimensionality reduction techniques",
      "Use cross-validation and appropriate evaluation metrics",
      "Tune model hyperparameters and compare competing models",
      "Build reproducible machine learning pipelines",
      "Deploy a trained model through an API",
      "Monitor model performance and understand model drift",
      "Build portfolio-ready machine learning projects",
    ],

    curriculum: [
      {
        module: "Module 1: Machine Learning Fundamentals",
        topics: [
          "Introduction to machine learning",
          "AI, machine learning and deep learning",
          "Supervised vs unsupervised learning",
          "Regression and classification",
          "Clustering and dimensionality reduction",
          "Machine learning workflow",
          "Business problem formulation",
          "Training, validation and test datasets",
          "Overfitting and underfitting",
          "Bias-variance trade-off",
        ],
      },

      {
        module: "Module 2: Python for Machine Learning",
        topics: [
          "Python programming for machine learning",
          "NumPy fundamentals",
          "Pandas for data manipulation",
          "DataFrame operations",
          "Data cleaning",
          "Exploratory data analysis",
          "Data visualisation with Matplotlib and Seaborn",
          "Working with real-world datasets",
          "Writing reusable analysis code",
        ],
      },

      {
        module: "Module 3: Data Preprocessing & Feature Engineering",
        topics: [
          "Handling missing data",
          "Detecting and treating outliers",
          "Encoding categorical variables",
          "Feature scaling",
          "Normalisation and standardisation",
          "Feature selection",
          "Feature transformation",
          "Handling imbalanced datasets",
          "Data leakage",
          "Building preprocessing pipelines",
        ],
      },

      {
        module: "Module 4: Regression & Predictive Modelling",
        topics: [
          "Linear regression",
          "Multiple linear regression",
          "Polynomial regression",
          "Regularisation",
          "Ridge and Lasso regression",
          "Regression assumptions",
          "Mean Absolute Error",
          "Mean Squared Error",
          "Root Mean Squared Error",
          "R-squared",
          "Building a predictive regression project",
        ],
      },

      {
        module: "Module 5: Classification",
        topics: [
          "Logistic regression",
          "K-Nearest Neighbours",
          "Decision trees",
          "Support Vector Machines",
          "Classification workflows",
          "Confusion matrix",
          "Precision and recall",
          "F1-score",
          "ROC-AUC",
          "Handling class imbalance",
          "Building a classification project",
        ],
      },

      {
        module: "Module 6: Ensemble Learning & Model Optimisation",
        topics: [
          "Random Forest",
          "Gradient Boosting",
          "XGBoost fundamentals",
          "Feature importance",
          "Ensemble learning concepts",
          "Cross-validation",
          "Hyperparameter tuning",
          "Grid Search",
          "Random Search",
          "Model comparison",
          "Selecting the best-performing model",
        ],
      },

      {
        module: "Module 7: Unsupervised Learning",
        topics: [
          "Introduction to unsupervised learning",
          "K-Means clustering",
          "Hierarchical clustering",
          "Cluster evaluation",
          "Principal Component Analysis",
          "Dimensionality reduction",
          "Customer segmentation",
          "Anomaly detection fundamentals",
          "Unsupervised learning project",
        ],
      },

      {
        module: "Module 8: Machine Learning Pipelines & Production",
        topics: [
          "Building reproducible ML pipelines",
          "Scikit-learn pipelines",
          "Feature preprocessing pipelines",
          "Model persistence",
          "Saving and loading trained models",
          "Project structure for ML applications",
          "Version control with Git",
          "Model documentation",
          "Experiment tracking fundamentals",
        ],
      },

      {
        module: "Module 9: Model Deployment & Monitoring",
        topics: [
          "Introduction to machine learning deployment",
          "Serving models with FastAPI",
          "Building prediction APIs",
          "Request and response validation",
          "API testing",
          "Containerisation fundamentals",
          "Deploying a machine learning application",
          "Monitoring model performance",
          "Data drift and model drift",
          "Model maintenance and retraining",
        ],
      },

      {
        module: "Module 10: Machine Learning Capstone Project",
        topics: [
          "Business problem definition",
          "Dataset acquisition and exploration",
          "Data cleaning and preprocessing",
          "Feature engineering",
          "Model development",
          "Model evaluation and comparison",
          "Hyperparameter optimisation",
          "Model pipeline development",
          "API deployment",
          "Model documentation",
          "Business interpretation of results",
          "Portfolio presentation",
        ],
      },
    ],

    projects: [
      "House Price Prediction Model",
      "Customer Churn Classification System",
      "Customer Segmentation with Clustering",
      "Fraud or Anomaly Detection Model",
      "End-to-End Machine Learning Deployment Project",
    ],

    tools: [
      "Python",
      "NumPy",
      "Pandas",
      "Matplotlib",
      "Seaborn",
      "Scikit-learn",
      "XGBoost",
      "Jupyter Notebook",
      "FastAPI",
      "Git & GitHub",
    ],

    prerequisites: [
      "Basic Python programming",
      "Basic understanding of data analysis",
      "Comfort working with spreadsheets or SQL",
      "Basic statistics is recommended",
    ],
  },
  {
    slug: "generative-ai-and-llm-applications",
    title: "Generative AI & LLM Applications",
    category: "ai",
    level: "Intermediate",
    duration: "8 weeks",
    delivery: "Live Online",
    featured: true,
    image: aiImg,

    summary:
      "Learn to design, build and deploy practical Generative AI applications using large language models, prompt engineering, RAG, AI agents and modern AI development tools.",

    overview:
      "A practical, project-based programme for developers, data professionals and technology practitioners who want to move beyond using AI chatbots and learn how to build real-world Generative AI applications. Students explore how large language models work, develop reliable prompts, work with embeddings and vector databases, build Retrieval-Augmented Generation systems, integrate APIs, implement AI agents and apply evaluation, security and deployment practices.",

    audience:
      "Software developers, data analysts, data scientists, AI enthusiasts, product professionals and technology practitioners who want to build and deploy Generative AI applications.",

    outcomes: [
      "Understand the fundamentals of Generative AI and large language models",
      "Understand tokens, context windows, inference and model limitations",
      "Select appropriate AI models based on performance, cost and use case",
      "Design reliable and structured prompts for different business tasks",
      "Use few-shot prompting and structured output techniques",
      "Integrate LLM APIs into applications",
      "Work with embeddings and vector databases",
      "Build Retrieval-Augmented Generation applications",
      "Connect LLMs to private documents and knowledge bases",
      "Build AI-powered assistants and agentic workflows",
      "Implement evaluation, guardrails and responsible AI practices",
      "Optimise AI applications for cost, latency and reliability",
      "Deploy a production-ready Generative AI application",
    ],

    curriculum: [
      {
        module: "Module 1: Generative AI & LLM Fundamentals",
        topics: [
          "Introduction to Generative AI",
          "Generative AI vs traditional AI and machine learning",
          "Large Language Models",
          "Tokens and tokenisation",
          "Context windows",
          "Training vs inference",
          "Model parameters and capabilities",
          "Foundation models",
          "Model selection",
          "AI limitations and hallucinations",
          "Generative AI use cases in business",
        ],
      },

      {
        module: "Module 2: Prompt Engineering",
        topics: [
          "Fundamentals of prompt engineering",
          "Instruction design",
          "Role and context prompting",
          "Zero-shot prompting",
          "Few-shot prompting",
          "Chain-of-thought concepts",
          "Structured outputs",
          "Prompt templates",
          "Prompt refinement and testing",
          "Common prompt failure modes",
          "Building reusable prompts for business applications",
        ],
      },

      {
        module: "Module 3: LLM APIs & AI Application Development",
        topics: [
          "Working with LLM APIs",
          "API authentication and security",
          "Sending prompts programmatically",
          "Handling model responses",
          "Streaming responses",
          "Managing conversation history",
          "System and user messages",
          "Function and tool calling concepts",
          "Building an AI-powered application with Python",
          "Error handling and API reliability",
        ],
      },

      {
        module: "Module 4: Embeddings & Vector Databases",
        topics: [
          "Understanding embeddings",
          "Text and document embeddings",
          "Semantic similarity",
          "Vector search fundamentals",
          "Vector databases",
          "FAISS and other vector stores",
          "Document indexing",
          "Metadata and filtering",
          "Similarity search",
          "Retrieving relevant information",
        ],
      },

      {
        module: "Module 5: Retrieval-Augmented Generation (RAG)",
        topics: [
          "Introduction to RAG",
          "RAG architecture",
          "Document ingestion",
          "Document parsing",
          "Chunking strategies",
          "Embedding generation",
          "Vector retrieval",
          "Context injection",
          "Grounded responses",
          "Reducing hallucinations",
          "Building a document-based AI assistant",
        ],
      },

      {
        module: "Module 6: AI Agents & Tool Use",
        topics: [
          "Introduction to AI agents",
          "Agents vs traditional chatbots",
          "Agent architecture",
          "Tools and function calling",
          "Connecting AI to external systems",
          "Multi-step reasoning workflows",
          "Agent memory concepts",
          "Planning and task execution",
          "Building practical AI agents",
          "Agent safety and control",
        ],
      },

      {
        module: "Module 7: Evaluation, Security & Responsible AI",
        topics: [
          "Evaluating LLM outputs",
          "Accuracy and relevance",
          "Groundedness and faithfulness",
          "Creating evaluation datasets",
          "Automated evaluation",
          "Human evaluation",
          "Prompt injection risks",
          "Data privacy",
          "PII and sensitive information",
          "Guardrails",
          "Responsible AI principles",
        ],
      },

      {
        module: "Module 8: Production & Capstone Project",
        topics: [
          "AI application architecture",
          "Cost and token optimisation",
          "Latency optimisation",
          "Caching strategies",
          "Logging and monitoring",
          "Application security",
          "Deployment fundamentals",
          "Production considerations",
          "End-to-end Generative AI project",
          "Project testing and evaluation",
          "Portfolio presentation",
        ],
      },
    ],

    projects: [
      "AI Business Assistant",
      "Document Question-Answering RAG System",
      "Knowledge Base Chatbot",
      "AI Agent with External Tools",
      "End-to-End Generative AI Capstone Application",
    ],

    tools: [
      "Python",
      "LLM APIs",
      "LangChain",
      "Vector Databases",
      "FAISS",
      "Jupyter Notebook",
      "Git & GitHub",
    ],

    prerequisites: [
      "Basic programming knowledge",
      "Basic Python knowledge is recommended",
      "Basic understanding of APIs is helpful but not required",
    ],
  },
  {
  slug: "data-analysis-full-stack",
  title: "Full Stack Data Analysis ",
  category: "data-analysis",
  level: "Beginner to Intermediate",
  duration: "8-9 weeks",
  delivery: "Both",
  featured: true,
  image: dataImg,

  summary:
    "Master Advanced Excel, SQL and Power BI to clean, analyse, transform and communicate real-world business data.",

  overview:
    "A practical, career-focused data analysis programme designed to take learners from spreadsheet-based analysis to professional business intelligence. Students learn Advanced Excel, SQL and Power BI through real-world datasets, practical exercises and portfolio projects.",

  audience:
    "Beginners, graduates, career switchers and professionals who want to develop practical data analysis and business intelligence skills.",

  outcomes: [
    "Use Advanced Excel to clean, analyse and automate business data",
    "Build advanced Excel formulas, PivotTables and interactive dashboards",
    "Write SQL queries to retrieve, filter, join and aggregate data",
    "Work with relational databases and perform advanced SQL analysis",
    "Clean and transform data using Power Query",
    "Build interactive Power BI dashboards and reports",
    "Create calculated columns and measures using DAX",
    "Apply data modelling principles in Power BI",
    "Communicate data-driven insights to non-technical stakeholders",
    "Build professional portfolio projects using real-world datasets",
  ],

  curriculum: [
    {
      module: "Module 1: Advanced Excel Fundamentals",
      topics: [
        "Excel interface and professional workbook structure",
        "Data types and data preparation",
        "Advanced formulas and functions",
        "Relative, absolute and mixed cell references",
        "IF, IFS and nested logical functions",
        "SUMIFS, COUNTIFS and AVERAGEIFS",
        "XLOOKUP and advanced lookup techniques",
        "INDEX and MATCH",
        "Text and date functions",
        "Error handling with IFERROR",
      ],
    },

    {
      module: "Module 2: Advanced Excel Data Analysis",
      topics: [
        "Excel Tables and structured references",
        "Sorting and advanced filtering",
        "Conditional formatting",
        "Data validation",
        "PivotTables",
        "PivotCharts",
        "Slicers and timelines",
        "What-If Analysis",
        "Goal Seek",
        "Scenario Manager",
        "Basic statistical analysis",
      ],
    },

    {
      module: "Module 3: Excel Data Cleaning & Automation",
      topics: [
        "Data cleaning techniques",
        "Removing duplicates",
        "Handling missing and inconsistent data",
        "Text-to-Columns",
        "Flash Fill",
        "Power Query fundamentals",
        "Importing data from multiple sources",
        "Transforming and combining datasets",
        "Automating recurring data preparation tasks",
        "Building automated Excel reports",
      ],
    },

    {
      module: "Module 4: Excel Dashboards & Reporting",
      topics: [
        "Principles of effective dashboard design",
        "KPI development",
        "Interactive dashboard design",
        "Charts and visualisation techniques",
        "Dynamic charts",
        "Slicers and interactive controls",
        "Management reporting",
        "Building an executive dashboard",
        "Excel sales and performance dashboard project",
      ],
    },

    {
      module: "Module 5: SQL Fundamentals",
      topics: [
        "Introduction to relational databases",
        "Tables, rows, columns and keys",
        "SELECT statements",
        "WHERE filtering",
        "ORDER BY",
        "DISTINCT",
        "LIMIT and TOP",
        "Aliases",
        "Arithmetic and comparison operators",
        "NULL values",
      ],
    },

    {
      module: "Module 6: SQL Data Analysis",
      topics: [
        "Aggregate functions",
        "COUNT, SUM, AVG, MIN and MAX",
        "GROUP BY",
        "HAVING",
        "CASE statements",
        "Date and time functions",
        "String functions",
        "Subqueries",
        "Common Table Expressions (CTEs)",
        "Writing business-focused SQL queries",
      ],
    },

    {
      module: "Module 7: Advanced SQL & Database Analysis",
      topics: [
        "INNER JOIN",
        "LEFT JOIN",
        "RIGHT JOIN",
        "FULL OUTER JOIN",
        "Self joins",
        "Multiple-table analysis",
        "Window functions",
        "ROW_NUMBER",
        "RANK and DENSE_RANK",
        "PARTITION BY",
        "Running totals and moving averages",
        "SQL performance and query optimisation fundamentals",
      ],
    },

    {
      module: "Module 8: Power BI Fundamentals",
      topics: [
        "Introduction to Power BI",
        "Power BI Desktop interface",
        "Importing data from Excel and databases",
        "Data types and data profiling",
        "Power Query",
        "Data cleaning and transformation",
        "Merging and appending queries",
        "Creating relationships",
        "Data modelling fundamentals",
        "Star schema concepts",
      ],
    },

    {
      module: "Module 9: Power BI, DAX & Dashboards",
      topics: [
        "Introduction to DAX",
        "Calculated columns",
        "Measures",
        "CALCULATE",
        "SUM, COUNT and DISTINCTCOUNT",
        "FILTER",
        "Time intelligence fundamentals",
        "KPI calculations",
        "Interactive reports",
        "Drill-through and tooltips",
        "Slicers and filters",
        "Professional dashboard design",
        "Power BI business intelligence project",
      ],
    },

    {
      module: "Module 10: Data Analysis Capstone Project",
      topics: [
        "Business problem definition",
        "Data collection and preparation",
        "Advanced Excel analysis",
        "SQL data extraction and analysis",
        "Power BI data modelling",
        "Interactive dashboard development",
        "KPI and performance analysis",
        "Generating business insights",
        "Executive report preparation",
        "Portfolio presentation",
      ],
    },
  ],

  projects: [
    "Advanced Excel Sales & Performance Dashboard",
    "SQL Customer & Sales Analysis",
    "Power BI Business Intelligence Dashboard",
    "End-to-End Data Analysis Capstone Project",
  ],

  tools: [
    "Microsoft Excel",
    "Power Query",
    "SQL",
    "Microsoft SQL Server",
    "Power BI",
    "DAX",
  ],

  prerequisites: [
    "Basic computer skills",
    "Basic understanding of Microsoft Excel is helpful but not required",
  ],
},
  {
    slug: "advanced-excel-for-data-analysis",
    title: "Advanced Excel for Data Analysis",
    category: "data-analysis",
    level: "Intermediate",
    duration: "5 weeks",
    delivery: "Both",
    image: advancedExcelImg,

    summary:
      "Master advanced Excel techniques for data cleaning, analysis, dashboard development, reporting and business decision-making.",

    overview:
      "A practical, project-based Excel programme designed for professionals and analysts who want to move beyond basic spreadsheet tasks and develop advanced data analysis skills. Students learn advanced formulas, lookup functions, data cleaning, PivotTables, Power Query, dashboard development, data visualisation and Excel automation using real-world business datasets.",

    audience:
      "Data analysts, finance professionals, operations staff, business users, administrators and professionals who already use Excel and want to develop advanced data analysis and reporting skills.",

    outcomes: [
      "Use advanced Excel formulas and functions confidently",
      "Apply XLOOKUP, INDEX and MATCH to solve complex data problems",
      "Build dynamic formulas using modern Excel functions",
      "Clean, transform and structure messy datasets for analysis",
      "Use Excel Tables and structured references effectively",
      "Analyse large datasets using PivotTables and PivotCharts",
      "Create interactive dashboards with charts, slicers and timelines",
      "Use Power Query to automate data cleaning and transformation",
      "Perform advanced business and statistical analysis in Excel",
      "Build professional management and executive reports",
      "Automate repetitive reporting and spreadsheet workflows",
      "Apply Excel-based analysis to real-world business problems",
    ],

    curriculum: [
      {
        module: "Module 1: Advanced Excel Functions & Formulas",
        topics: [
          "Advanced Excel formula concepts",
          "Relative, absolute and mixed references",
          "IF, IFS and nested logical functions",
          "SUMIFS, COUNTIFS and AVERAGEIFS",
          "XLOOKUP",
          "INDEX and MATCH",
          "Nested lookup techniques",
          "IFERROR and error handling",
          "Text functions",
          "Date and time functions",
          "Dynamic array functions",
          "FILTER, SORT and UNIQUE",
        ],
      },

      {
        module: "Module 2: Data Cleaning & Preparation",
        topics: [
          "Understanding data quality",
          "Data cleaning principles",
          "Removing duplicates",
          "Handling missing values",
          "Standardising inconsistent data",
          "Text-to-Columns",
          "Flash Fill",
          "Data validation",
          "Excel Tables",
          "Structured references",
          "Working with large datasets",
          "Preparing data for analysis",
        ],
      },

      {
        module: "Module 3: Power Query & Data Transformation",
        topics: [
          "Introduction to Power Query",
          "Importing data from Excel and CSV files",
          "Connecting to multiple data sources",
          "Changing data types",
          "Removing errors and duplicates",
          "Splitting and merging columns",
          "Filtering and transforming data",
          "Merging queries",
          "Appending queries",
          "Creating calculated columns",
          "Refreshing queries",
          "Automating recurring data preparation",
        ],
      },

      {
        module: "Module 4: Data Analysis with PivotTables",
        topics: [
          "PivotTable fundamentals",
          "Creating and configuring PivotTables",
          "Grouping and filtering data",
          "Calculated fields and calculations",
          "PivotCharts",
          "Slicers",
          "Timelines",
          "Interactive reporting",
          "KPI analysis",
          "Trend analysis",
          "Sales and performance analysis",
        ],
      },

      {
        module: "Module 5: Advanced Dashboards & Business Reporting",
        topics: [
          "Dashboard design principles",
          "Choosing effective visualisations",
          "KPI cards",
          "Interactive charts",
          "Dynamic dashboards",
          "Slicers and interactive controls",
          "Conditional formatting",
          "Management reporting",
          "Executive dashboards",
          "Data storytelling",
          "Building a professional Excel dashboard",
        ],
      },

      {
        module: "Module 6: Excel Automation & Reporting Workflows",
        topics: [
          "Introduction to Excel automation",
          "Recording and using macros",
          "Macro security",
          "Automating repetitive tasks",
          "Automated report generation",
          "Reusable reporting templates",
          "Workbook optimisation",
          "Introduction to VBA concepts",
          "Building automated Excel workflows",
          "Maintaining automated reports",
        ],
      },

      {
        module: "Module 7: Advanced Business Analysis",
        topics: [
          "What-If Analysis",
          "Goal Seek",
          "Scenario Manager",
          "Data Tables",
          "Forecasting fundamentals",
          "Trend analysis",
          "Variance analysis",
          "Budget vs actual analysis",
          "Financial and operational KPIs",
          "Decision-support analysis",
        ],
      },

      {
        module: "Module 8: Final Excel Data Analysis Project",
        topics: [
          "Business problem definition",
          "Data collection and preparation",
          "Data cleaning with Power Query",
          "Advanced formula analysis",
          "PivotTable analysis",
          "Dashboard development",
          "KPI development",
          "Automated reporting workflow",
          "Business insights",
          "Final presentation",
        ],
      },
    ],

    projects: [
      "Sales Performance Analysis Dashboard",
      "Financial Budget vs Actual Analysis",
      "HR Workforce Analytics Dashboard",
      "Inventory & Operations Dashboard",
      "Automated Management Reporting System",
      "End-to-End Excel Data Analysis Capstone Project",
    ],

    tools: [
      "Microsoft Excel",
      "Power Query",
      "PivotTables",
      "PivotCharts",
      "Power Pivot",
      "Basic VBA",
    ],

    prerequisites: [
      "Working knowledge of Microsoft Excel",
      "Basic formulas and spreadsheet operations",
      "Basic understanding of tables and charts",
    ],
  },
  {
    slug: "business-intelligence",
    title: "Power BI for Business Intelligence",
    category: "data-analysis",
    level: "Beginner to Intermediate",
    duration: "6 weeks",
    delivery: "Both",
    image: dataImg,
    summary:
      "Transform raw business data into interactive dashboards, meaningful KPIs and actionable insights with Power BI.",
    overview:
      "A practical, project-based Power BI programme designed to take learners from raw data to professional business intelligence solutions. Students learn how to connect and transform data with Power Query, build robust data models, write DAX measures, create interactive dashboards and publish reports for decision-makers.",
    audience:
      "Data analysts, finance professionals, operations staff, business owners, managers and professionals who work with business data and want to build professional Power BI reports and dashboards.",
    outcomes: [
      "Connect Power BI to Excel, CSV, SQL databases and other data sources",
      "Clean and transform data efficiently using Power Query",
      "Design professional star-schema data models",
      "Create relationships between tables and manage data modelling challenges",
      "Write DAX measures and calculated columns",
      "Understand filter context and context transition",
      "Create KPIs and business performance metrics",
      "Build interactive and professional Power BI dashboards",
      "Apply time intelligence for trend and performance analysis",
      "Publish and share Power BI reports securely",
      "Implement row-level security",
      "Present data-driven insights to business stakeholders",
    ],
    curriculum: [
      {
        module: "Module 1: Power BI Fundamentals",
        topics: [
          "Introduction to Business Intelligence",
          "Power BI ecosystem",
          "Power BI Desktop interface",
          "Importing data from Excel, CSV and databases",
          "Understanding tables, columns and data types",
          "Data profiling and quality checks",
          "Creating basic visualisations",
          "Power BI report structure",
        ],
      },
      {
        module: "Module 2: Power Query & Data Transformation",
        topics: [
          "Introduction to Power Query",
          "Connecting to multiple data sources",
          "Data cleaning and preparation",
          "Changing data types",
          "Removing duplicates and errors",
          "Handling missing values",
          "Splitting and merging columns",
          "Merging queries",
          "Appending queries",
          "Conditional and custom columns",
          "Query parameters",
          "Refresh and automation",
        ],
      },
      {
        module: "Module 3: Data Modelling",
        topics: [
          "Understanding relational data",
          "Fact and dimension tables",
          "Star-schema architecture",
          "Creating table relationships",
          "Cardinality and cross-filter direction",
          "Primary and foreign keys",
          "Date tables",
          "Data model optimisation",
          "Common modelling mistakes",
          "Building a professional business data model",
        ],
      },
      {
        module: "Module 4: DAX & Business Calculations",
        topics: [
          "Introduction to DAX",
          "Calculated columns vs measures",
          "SUM, COUNT and DISTINCTCOUNT",
          "CALCULATE",
          "FILTER",
          "IF and SWITCH",
          "DIVIDE",
          "Understanding filter context",
          "Context transition",
          "KPI calculations",
          "Percentage and variance analysis",
          "Time intelligence",
          "Year-to-Date and Month-to-Date analysis",
          "Running totals and comparative analysis",
        ],
      },
      {
        module: "Module 5: Dashboard Design & Business Reporting",
        topics: [
          "Principles of effective dashboard design",
          "Choosing the right visualisation",
          "Cards and KPI indicators",
          "Charts and tables",
          "Slicers and filters",
          "Drill-down and drill-through",
          "Tooltips",
          "Bookmarks and navigation",
          "Interactive dashboard design",
          "Executive reporting",
          "Performance optimisation",
          "Storytelling with data",
        ],
      },
      {
        module: "Module 6: Publishing, Security & Capstone Project",
        topics: [
          "Power BI Service",
          "Publishing reports",
          "Workspaces and apps",
          "Dashboard sharing",
          "Scheduled data refresh",
          "Row-Level Security",
          "Managing report access",
          "Power BI deployment fundamentals",
          "End-to-end business intelligence project",
          "Presenting insights to stakeholders",
        ],
      },
    ],
    projects: [
      "Sales Performance Dashboard",
      "Financial Performance Dashboard",
      "HR Workforce Analytics Dashboard",
      "Operations & KPI Dashboard",
      "End-to-End Business Intelligence Capstone Project",
    ],
    tools: ["Microsoft Power BI", "Power Query", "DAX", "Microsoft Excel", "SQL"],
    prerequisites: [
      "Basic computer skills",
      "Basic Excel knowledge is recommended",
      "No prior Power BI experience required",
    ],
  },
  {
    slug: "full-stack-web-development",
    title: "Full-Stack Web Development",
    category: "development",
    level: "Beginner to Intermediate",
    duration: "12-16 weeks",
    delivery: "Both",
    featured: true,
    image: devImg,

    summary:
      "Learn to design, build, test and deploy modern full-stack web applications using HTML, CSS, JavaScript, TypeScript, React, APIs and databases.",

    overview:
      "A comprehensive, project-based web development programme designed to take learners from the fundamentals of web development to building and deploying production-ready full-stack applications. Students learn modern frontend and backend development, database design, authentication, APIs, testing, Git, deployment and professional development workflows. The programme includes multiple portfolio projects and code reviews to help learners develop practical, industry-ready skills.",

    audience:
      "Beginners starting a career in web development, aspiring software engineers, graduates, career changers and self-taught developers who want to strengthen their skills and build professional projects.",

    outcomes: [
      "Understand the fundamentals of modern web development",
      "Build semantic and accessible websites with HTML",
      "Create responsive and visually engaging interfaces with CSS",
      "Develop interactive applications using modern JavaScript",
      "Write maintainable and type-safe applications with TypeScript",
      "Build reusable user interfaces with React",
      "Implement routing, state management and data fetching",
      "Design and consume RESTful APIs",
      "Build backend services and application logic",
      "Design and work with relational databases",
      "Implement user authentication and authorisation",
      "Use Git and GitHub for professional version control",
      "Write and maintain automated tests",
      "Deploy applications to production environments",
      "Monitor, troubleshoot and maintain live applications",
      "Build a professional portfolio of full-stack projects",
    ],

    curriculum: [
      {
        module: "Module 1: Web Development Fundamentals",
        topics: [
          "Introduction to web development",
          "How the web works",
          "Client-side vs server-side development",
          "HTML fundamentals",
          "Semantic HTML",
          "Forms and input elements",
          "Accessibility fundamentals",
          "HTML5 best practices",
          "Introduction to developer tools",
        ],
      },

      {
        module: "Module 2: CSS & Responsive Web Design",
        topics: [
          "CSS fundamentals",
          "Selectors and specificity",
          "Box model",
          "Typography and colours",
          "Flexbox",
          "CSS Grid",
          "Responsive design",
          "Media queries",
          "Mobile-first development",
          "CSS positioning",
          "Transitions and animations",
          "Building responsive page layouts",
        ],
      },

      {
        module: "Module 3: JavaScript Programming",
        topics: [
          "JavaScript fundamentals",
          "Variables and data types",
          "Operators and expressions",
          "Conditional statements",
          "Loops",
          "Functions",
          "Arrays and objects",
          "DOM manipulation",
          "Events",
          "Modules",
          "Error handling",
          "Modern JavaScript features",
        ],
      },

      {
        module: "Module 4: Modern JavaScript & TypeScript",
        topics: [
          "ES6+ features",
          "Destructuring",
          "Spread and rest operators",
          "Array methods",
          "Promises",
          "Async and await",
          "Working with APIs",
          "TypeScript fundamentals",
          "Types and interfaces",
          "Generics",
          "Type-safe application development",
        ],
      },

      {
        module: "Module 5: React Frontend Development",
        topics: [
          "Introduction to React",
          "Components and JSX",
          "Props and state",
          "React hooks",
          "Event handling",
          "Conditional rendering",
          "Lists and reusable components",
          "Forms and validation",
          "Component architecture",
          "React application structure",
        ],
      },

      {
        module: "Module 6: Advanced React & Frontend Applications",
        topics: [
          "React Router",
          "Application navigation",
          "State management",
          "Context API",
          "API integration",
          "Data fetching",
          "Loading and error states",
          "Authentication flows",
          "Protected routes",
          "Reusable UI patterns",
          "Frontend performance optimisation",
        ],
      },

      {
        module: "Module 7: Backend Development & REST APIs",
        topics: [
          "Introduction to backend development",
          "Server-side programming",
          "Node.js fundamentals",
          "Express.js",
          "REST API architecture",
          "HTTP methods",
          "Request and response handling",
          "API routing",
          "Middleware",
          "Error handling",
          "API validation",
          "Building a production-ready REST API",
        ],
      },

      {
        module: "Module 8: Databases & Data Management",
        topics: [
          "Database fundamentals",
          "Relational vs non-relational databases",
          "SQL fundamentals",
          "Database tables and relationships",
          "Primary and foreign keys",
          "CRUD operations",
          "Database design",
          "Queries and joins",
          "Connecting applications to databases",
          "Data validation and integrity",
          "Database security fundamentals",
        ],
      },

      {
        module: "Module 9: Authentication & Application Security",
        topics: [
          "Authentication vs authorisation",
          "User registration and login",
          "Password security",
          "Sessions and tokens",
          "JWT authentication",
          "Protected API routes",
          "Role-based access control",
          "Input validation",
          "Common web security risks",
          "Secure application development",
        ],
      },

      {
        module: "Module 10: Testing & Software Quality",
        topics: [
          "Introduction to software testing",
          "Unit testing",
          "Integration testing",
          "Frontend testing fundamentals",
          "API testing",
          "Test-driven development concepts",
          "Debugging techniques",
          "Code quality",
          "Linting and formatting",
          "Writing maintainable code",
        ],
      },

      {
        module: "Module 11: Git, GitHub & Professional Development",
        topics: [
          "Git fundamentals",
          "Repositories and commits",
          "Branches and merging",
          "Pull requests",
          "GitHub workflows",
          "Code reviews",
          "Project documentation",
          "README development",
          "Collaboration workflows",
          "Professional development practices",
        ],
      },

      {
        module: "Module 12: Deployment, CI/CD & Production",
        topics: [
          "Application deployment fundamentals",
          "Frontend deployment",
          "Backend deployment",
          "Environment variables",
          "Production configuration",
          "Domain and DNS fundamentals",
          "Continuous Integration",
          "Continuous Deployment",
          "Application monitoring",
          "Error tracking",
          "Performance optimisation",
          "Application maintenance",
        ],
      },

      {
        module: "Module 13: Full-Stack Capstone Project",
        topics: [
          "Project planning and requirements",
          "UI/UX planning",
          "Frontend architecture",
          "Backend architecture",
          "Database design",
          "REST API development",
          "Authentication and authorisation",
          "Frontend and backend integration",
          "Testing and debugging",
          "Deployment",
          "Documentation",
          "Portfolio presentation",
        ],
      },
    ],

    projects: [
      "Responsive Business Website",
      "React Task Management Application",
      "Full-Stack E-Commerce Application",
      "Authentication & User Management System",
      "REST API with Database Integration",
      "Production-Ready Full-Stack Capstone Project",
    ],

    tools: [
      "HTML5",
      "CSS3",
      "JavaScript",
      "TypeScript",
      "React",
      "Node.js",
      "Express.js",
      "SQL",
      "PostgreSQL",
      "Git",
      "GitHub",
      "REST APIs",
      "VS Code",
    ],

    prerequisites: [
      "Basic computer literacy",
      "No previous programming experience required",
      "A personal laptop is recommended for practical exercises",
    ],
  },
  {
    slug: "mobile-app-development-react-native",
    title: "Mobile App Development with React Native",
    category: "development",
    level: "Intermediate",
    duration: "10 weeks",
    delivery: "Live Online",
    image: devImg,

    summary:
      "Build modern, production-ready Android and iOS applications with React Native from a single codebase.",

    overview:
      "A practical, project-based mobile development programme designed for developers who want to build and deploy cross-platform applications. Students learn React Native, navigation, APIs, authentication, device features, local storage, backend integration, testing and app deployment while building a complete mobile application.",

    audience:
      "Web developers, JavaScript developers, React developers and aspiring mobile developers who want to build professional Android and iOS applications.",

    outcomes: [
      "Set up and structure a professional React Native application",
      "Build responsive mobile interfaces with reusable components",
      "Implement navigation and multi-screen applications",
      "Manage application state effectively",
      "Connect mobile applications to REST APIs",
      "Implement authentication and user sessions",
      "Work with local storage and offline data",
      "Integrate device features such as camera, location and notifications",
      "Handle forms, validation and error states",
      "Build and test production-ready mobile applications",
      "Debug and optimise React Native applications",
      "Build and deploy applications for Android and iOS",
    ],

    curriculum: [
      {
        module: "Module 1: React Native Fundamentals",
        topics: [
          "Introduction to cross-platform mobile development",
          "React Native ecosystem",
          "Expo and development environment",
          "Project structure",
          "Components and JSX",
          "Props and state",
          "Reusable components",
          "Styling and responsive layouts",
          "Debugging React Native applications",
        ],
      },

      {
        module: "Module 2: Mobile UI & Navigation",
        topics: [
          "Designing mobile interfaces",
          "Flexbox layouts",
          "Buttons, forms and input components",
          "Lists and cards",
          "Images and icons",
          "Stack navigation",
          "Tab navigation",
          "Drawer navigation",
          "Navigation parameters",
          "Animations and transitions",
          "Responsive mobile UI design",
        ],
      },

      {
        module: "Module 3: State, Forms & Data Management",
        topics: [
          "Managing component state",
          "React hooks",
          "useState and useEffect",
          "Form handling",
          "Form validation",
          "Loading and error states",
          "State management fundamentals",
          "Local storage",
          "AsyncStorage",
          "Offline-first application concepts",
        ],
      },

      {
        module: "Module 4: APIs & Backend Integration",
        topics: [
          "Understanding REST APIs",
          "HTTP requests",
          "GET, POST, PUT and DELETE",
          "Fetching data with Fetch and Axios",
          "Working with JSON",
          "Connecting applications to backend services",
          "Authentication APIs",
          "Handling API errors",
          "Loading states and retries",
          "Secure API communication",
        ],
      },

      {
        module: "Module 5: Authentication & Device Features",
        topics: [
          "User registration and login",
          "Authentication flows",
          "Token-based authentication",
          "Protected screens",
          "Camera integration",
          "Image selection and uploads",
          "Location services",
          "Device permissions",
          "Push notifications",
          "Deep linking fundamentals",
        ],
      },

      {
        module: "Module 6: Production App Development",
        topics: [
          "Application architecture",
          "Reusable components and code organisation",
          "Environment variables",
          "Security fundamentals",
          "Performance optimisation",
          "Error handling",
          "Testing fundamentals",
          "Application logging",
          "Production-ready UI and UX",
          "Preparing an app for release",
        ],
      },

      {
        module: "Module 7: Mobile App Deployment",
        topics: [
          "Android application builds",
          "iOS application builds",
          "App icons and splash screens",
          "App configuration",
          "Version management",
          "Generating production builds",
          "Google Play Console fundamentals",
          "Apple App Store Connect fundamentals",
          "Store listings and screenshots",
          "App submission process",
          "App updates and maintenance",
        ],
      },

      {
        module: "Module 8: Final Mobile App Project",
        topics: [
          "Project planning and requirements",
          "UI/UX implementation",
          "Navigation and application architecture",
          "API and backend integration",
          "Authentication",
          "Database and local storage",
          "Device feature integration",
          "Testing and debugging",
          "Production build",
          "Deployment preparation",
          "Portfolio presentation",
        ],
      },
    ],

    projects: [
      "Mobile Task Management Application",
      "Authentication & User Profile Application",
      "API-Driven Mobile Application",
      "Location & Notification-Based Mobile App",
      "Complete Production-Ready Android & iOS Capstone Project",
    ],

    tools: [
      "React Native",
      "Expo",
      "JavaScript",
      "React",
      "REST APIs",
      "Git & GitHub",
      "Android Studio",
      "Xcode",
    ],

    prerequisites: [
      "Basic JavaScript knowledge",
      "Basic React knowledge",
      "Basic understanding of HTML and CSS is recommended",
      "A laptop capable of running the development environment",
    ],
  },
  {
    slug: "cybersecurity-fundamentals",
    title: "Cybersecurity Fundamentals",
    category: "cybersecurity",
    level: "Beginner",
    duration: "10 weeks",
    delivery: "Both",
    featured: true,
    image: securityImg,

    summary:
      "Build practical cybersecurity skills by learning how to identify threats, secure systems, analyse security events and respond to incidents.",

    overview:
      "A practical, lab-driven cybersecurity programme designed for beginners and aspiring security professionals. Students develop a strong foundation in cybersecurity, networking, system security, identity and access management, security monitoring, threat detection and incident response through guided labs and simulated security scenarios.",

    audience:
      "IT support professionals, graduates, students, system administrators and career changers who want to begin a career in cybersecurity or security operations.",

    outcomes: [
      "Understand fundamental cybersecurity concepts and security principles",
      "Identify common cyber threats, vulnerabilities and attack techniques",
      "Understand how networks, operating systems and applications can be attacked",
      "Apply basic security controls to protect systems and user accounts",
      "Understand network security, firewalls and traffic monitoring",
      "Configure basic identity and access management controls",
      "Analyse security logs and identify suspicious activity",
      "Use SIEM concepts and tools to investigate security alerts",
      "Apply a structured incident response process",
      "Understand endpoint, email and web security fundamentals",
      "Document security incidents and communicate findings professionally",
      "Build practical skills for entry-level cybersecurity and SOC roles",
    ],

    curriculum: [
      {
        module: "Module 1: Cybersecurity Fundamentals",
        topics: [
          "Introduction to cybersecurity",
          "Cybersecurity roles and career paths",
          "CIA triad",
          "Confidentiality, integrity and availability",
          "Authentication and authorisation",
          "Threats, vulnerabilities and risks",
          "Threat actors and motivations",
          "Common attack vectors",
          "Security policies and controls",
        ],
      },

      {
        module: "Module 2: Networking & Network Security",
        topics: [
          "Networking fundamentals",
          "TCP/IP and OSI models",
          "IP addressing and subnetting fundamentals",
          "Common network protocols",
          "DNS, HTTP, HTTPS and SSH",
          "Ports and network services",
          "Firewalls and network segmentation",
          "VPN fundamentals",
          "Network monitoring",
          "Introduction to packet analysis",
        ],
      },

      {
        module: "Module 3: Operating System & Endpoint Security",
        topics: [
          "Windows security fundamentals",
          "Linux security fundamentals",
          "Users, groups and permissions",
          "File and directory permissions",
          "System hardening",
          "Patch management",
          "Endpoint protection",
          "Malware fundamentals",
          "Antivirus and EDR concepts",
          "Secure configuration practices",
        ],
      },

      {
        module: "Module 4: Identity & Access Management",
        topics: [
          "Identity and access management fundamentals",
          "Authentication methods",
          "Multi-factor authentication",
          "Password security",
          "Role-based access control",
          "Principle of least privilege",
          "Account management",
          "Privileged access",
          "Access reviews",
          "Identity-related security threats",
        ],
      },

      {
        module: "Module 5: Threat Detection & Security Monitoring",
        topics: [
          "Security logging fundamentals",
          "Understanding security events",
          "Log collection and analysis",
          "Indicators of compromise",
          "Threat intelligence fundamentals",
          "Security monitoring",
          "Introduction to SIEM",
          "SIEM dashboards and alerts",
          "Alert triage",
          "Detecting suspicious behaviour",
        ],
      },

      {
        module: "Module 6: Incident Response",
        topics: [
          "Incident response fundamentals",
          "Incident identification",
          "Incident classification",
          "Containment",
          "Eradication",
          "Recovery",
          "Evidence preservation",
          "Incident documentation",
          "Incident response playbooks",
          "Post-incident analysis",
        ],
      },

      {
        module: "Module 7: Web, Email & Social Engineering Security",
        topics: [
          "Web security fundamentals",
          "Common web application threats",
          "Authentication vulnerabilities",
          "Injection attack concepts",
          "Cross-site scripting fundamentals",
          "Email security",
          "Phishing and social engineering",
          "Business email compromise",
          "Security awareness",
          "Defensive security practices",
        ],
      },

      {
        module: "Module 8: Security Operations & SOC Fundamentals",
        topics: [
          "Introduction to Security Operations Centres",
          "SOC roles and responsibilities",
          "Security alert investigation",
          "Incident ticket management",
          "Log correlation",
          "Basic threat hunting concepts",
          "Security metrics and reporting",
          "Escalation procedures",
          "Writing professional security reports",
          "SOC analyst workflow",
        ],
      },

      {
        module: "Module 9: Practical Cybersecurity Labs",
        topics: [
          "Network security investigation",
          "Log analysis lab",
          "Phishing investigation",
          "Suspicious login investigation",
          "Endpoint security investigation",
          "SIEM alert investigation",
          "Basic incident response simulation",
          "Threat detection exercise",
          "Security assessment exercise",
        ],
      },

      {
        module: "Module 10: Final Cybersecurity Capstone",
        topics: [
          "Security incident scenario",
          "Initial alert investigation",
          "Log and evidence analysis",
          "Threat identification",
          "Incident classification",
          "Containment and response planning",
          "Incident documentation",
          "Security recommendations",
          "Final security report",
          "Capstone presentation",
        ],
      },
    ],

    projects: [
      "Network Security Monitoring Lab",
      "Phishing Email Investigation",
      "Security Log Analysis Project",
      "SIEM Alert Investigation",
      "Incident Response Simulation",
      "Cybersecurity Operations Capstone Project",
    ],

    tools: [
      "Linux",
      "Windows",
      "Wireshark",
      "SIEM Platform",
      "Virtual Machines",
      "Security Monitoring Tools",
      "Git & GitHub",
    ],

    prerequisites: [
      "Basic computer skills",
      "Basic networking knowledge is helpful but not required",
      "No previous cybersecurity experience required",
    ],
  },
  {
    slug: "ethical-hacking-and-penetration-testing",
    title: "Ethical Hacking & Penetration Testing",
    category: "cybersecurity",
    level: "Advanced",
    duration: "10 weeks",
    delivery: "Live Online",
    image: securityImg,

    summary:
      "Develop practical offensive security skills by learning how to assess, exploit and secure systems through authorised penetration testing in controlled lab environments.",

    overview:
      "An advanced, hands-on ethical hacking and penetration testing programme designed for cybersecurity professionals who want to develop practical offensive security capabilities. Students learn the complete penetration testing lifecycle, from engagement planning and reconnaissance to vulnerability assessment, controlled exploitation, privilege escalation, post-exploitation analysis and professional security reporting. All practical activities are performed in authorised, isolated lab environments.",

    audience:
      "Cybersecurity analysts, system administrators, network professionals, IT professionals and security practitioners who want to develop penetration testing and offensive security skills.",

    outcomes: [
      "Understand ethical hacking principles and professional penetration testing methodologies",
      "Define scope, objectives and rules of engagement for authorised security assessments",
      "Perform reconnaissance and information gathering in controlled environments",
      "Identify vulnerabilities in systems, networks and web applications",
      "Use industry-standard security testing tools effectively",
      "Assess common web application vulnerabilities based on the OWASP Top 10",
      "Perform controlled exploitation within authorised laboratory environments",
      "Understand privilege escalation techniques on Linux and Windows systems",
      "Analyse network services and identify potential attack paths",
      "Understand lateral movement and post-exploitation concepts in lab environments",
      "Collect and document technical evidence during security assessments",
      "Assess vulnerabilities using risk-based methodologies",
      "Write professional penetration testing reports",
      "Provide practical remediation recommendations to reduce security risk",
    ],

    curriculum: [
      {
        module: "Module 1: Ethical Hacking & Penetration Testing Fundamentals",
        topics: [
          "Introduction to ethical hacking",
          "Offensive vs defensive security",
          "Penetration testing methodologies",
          "Security assessment types",
          "Black-box, grey-box and white-box testing",
          "Scope and objectives",
          "Rules of engagement",
          "Legal and ethical considerations",
          "Lab environment setup",
          "Professional penetration testing workflow",
        ],
      },

      {
        module: "Module 2: Reconnaissance & Information Gathering",
        topics: [
          "Passive and active reconnaissance",
          "Information gathering techniques",
          "OSINT fundamentals",
          "Target identification",
          "Domain and DNS reconnaissance",
          "Network discovery",
          "Service enumeration",
          "Technology identification",
          "Attack surface mapping",
          "Documenting reconnaissance findings",
        ],
      },

      {
        module: "Module 3: Vulnerability Assessment & Scanning",
        topics: [
          "Vulnerability assessment fundamentals",
          "Network scanning",
          "Port and service discovery",
          "Service enumeration",
          "Vulnerability scanners",
          "Vulnerability classification",
          "CVE and CVSS fundamentals",
          "False positives and validation",
          "Prioritising vulnerabilities",
          "Building a vulnerability assessment report",
        ],
      },

      {
        module: "Module 4: Web Application Security",
        topics: [
          "Web application architecture",
          "HTTP and HTTPS fundamentals",
          "OWASP Top 10",
          "Authentication vulnerabilities",
          "Authorisation and access control issues",
          "Injection vulnerabilities",
          "Cross-Site Scripting fundamentals",
          "Security misconfiguration",
          "Session security",
          "File upload vulnerabilities",
          "Web security testing methodology",
        ],
      },

      {
        module: "Module 5: Network & System Security Testing",
        topics: [
          "Network attack surfaces",
          "Common network services",
          "Service enumeration",
          "Weak configurations",
          "Password and authentication security",
          "Windows security fundamentals",
          "Linux security fundamentals",
          "System vulnerability assessment",
          "Controlled exploitation",
          "Documenting security findings",
        ],
      },

      {
        module: "Module 6: Exploitation & Privilege Escalation",
        topics: [
          "Exploitation fundamentals",
          "Understanding exploit chains",
          "Controlled exploitation methodology",
          "Metasploit fundamentals",
          "Linux privilege escalation concepts",
          "Windows privilege escalation concepts",
          "Misconfiguration-based privilege escalation",
          "Credential security",
          "Post-exploitation fundamentals",
          "Maintaining evidence during an assessment",
        ],
      },

      {
        module: "Module 7: Post-Exploitation & Attack Path Analysis",
        topics: [
          "Post-exploitation concepts",
          "Understanding attack paths",
          "Credential discovery concepts",
          "Privilege and access analysis",
          "Lateral movement concepts",
          "Network segmentation assessment",
          "Attack path documentation",
          "Impact assessment",
          "Data exposure assessment",
          "Safe post-exploitation practices",
        ],
      },

      {
        module: "Module 8: Penetration Testing Tools & Lab Operations",
        topics: [
          "Kali Linux fundamentals",
          "Nmap",
          "Burp Suite",
          "Wireshark",
          "Metasploit",
          "Vulnerability assessment tools",
          "Password auditing tools",
          "Web security testing tools",
          "Tool selection and methodology",
          "Building an isolated penetration testing lab",
        ],
      },

      {
        module: "Module 9: Reporting, Risk & Remediation",
        topics: [
          "Penetration testing evidence",
          "Technical finding documentation",
          "Risk assessment",
          "CVSS fundamentals",
          "Severity classification",
          "Business impact analysis",
          "Executive summaries",
          "Technical remediation recommendations",
          "Prioritising remediation",
          "Professional penetration testing reports",
        ],
      },

      {
        module: "Module 10: Full Penetration Testing Capstone",
        topics: [
          "Engagement planning",
          "Defining scope and rules of engagement",
          "Reconnaissance",
          "Network and service enumeration",
          "Vulnerability assessment",
          "Web application security testing",
          "Controlled exploitation",
          "Privilege escalation",
          "Attack path analysis",
          "Evidence collection",
          "Risk assessment",
          "Remediation recommendations",
          "Professional penetration testing report",
          "Client-style presentation",
        ],
      },
    ],

    projects: [
      "Controlled Network Security Assessment",
      "Web Application Security Assessment",
      "Vulnerability Assessment & Risk Analysis",
      "Linux & Windows Privilege Escalation Lab",
      "End-to-End Penetration Testing Capstone",
    ],

    tools: [
      "Kali Linux",
      "Nmap",
      "Burp Suite",
      "Wireshark",
      "Metasploit",
      "Nessus",
      "Virtual Machines",
      "Git & GitHub",
    ],

    prerequisites: [
      "Strong understanding of networking fundamentals",
      "Comfortable working with the Linux command line",
      "Basic understanding of operating systems",
      "Basic cybersecurity knowledge",
      "Familiarity with TCP/IP and common network protocols",
    ],
  },
  {
    slug: "aws-cloud-practitioner-to-solutions-architect",
    title: "AWS Cloud Practitioner to Solutions Architect",
    category: "cloud",
    level: "Beginner to Intermediate",
    duration: "10 weeks",
    delivery: "Both",
    image: cloudImg,

    summary:
      "Build practical AWS cloud skills, design secure and highly available architectures, and prepare for the AWS Certified Solutions Architect – Associate certification.",

    overview:
      "A practical, hands-on AWS cloud programme designed to take learners from foundational cloud concepts to designing and deploying scalable solutions on AWS. Students work with core AWS services, networking, security, storage, databases, monitoring and cost management while applying cloud architecture principles through real-world labs and projects.",

    audience:
      "IT professionals, system administrators, software developers, data professionals, cloud beginners and technology practitioners who want to build practical AWS skills and pursue a career in cloud computing.",

    outcomes: [
      "Understand fundamental cloud computing concepts and AWS architecture",
      "Navigate and configure core AWS services",
      "Deploy and manage applications using AWS compute services",
      "Work with AWS storage and database services",
      "Design secure and scalable AWS network architectures",
      "Configure identity and access management using IAM",
      "Apply AWS security and encryption best practices",
      "Design highly available and fault-tolerant cloud architectures",
      "Implement load balancing and auto scaling",
      "Use monitoring and logging to maintain cloud workloads",
      "Apply AWS cost optimisation principles",
      "Understand Infrastructure as Code fundamentals",
      "Design solutions based on the AWS Well-Architected Framework",
      "Build practical cloud projects using AWS",
      "Prepare for the AWS Certified Solutions Architect – Associate examination",
    ],

    curriculum: [
      {
        module: "Module 1: Cloud Computing & AWS Fundamentals",
        topics: [
          "Introduction to cloud computing",
          "Cloud service models",
          "Infrastructure as a Service, Platform as a Service and Software as a Service",
          "Cloud deployment models",
          "AWS global infrastructure",
          "AWS Regions and Availability Zones",
          "AWS Management Console",
          "AWS account and billing fundamentals",
          "AWS shared responsibility model",
          "AWS Well-Architected Framework",
        ],
      },

      {
        module: "Module 2: AWS Compute Services",
        topics: [
          "Amazon EC2 fundamentals",
          "EC2 instance types",
          "Amazon Machine Images",
          "Security groups",
          "Elastic IP addresses",
          "EC2 storage options",
          "Auto Scaling fundamentals",
          "Elastic Load Balancing",
          "AWS Lambda fundamentals",
          "Choosing the right compute service",
        ],
      },

      {
        module: "Module 3: AWS Storage & Content Delivery",
        topics: [
          "Amazon S3 fundamentals",
          "S3 buckets and objects",
          "Storage classes",
          "Lifecycle policies",
          "Versioning",
          "Access control",
          "Encryption",
          "Amazon EBS",
          "Amazon EFS",
          "Amazon CloudFront",
          "Choosing the right AWS storage service",
        ],
      },

      {
        module: "Module 4: AWS Networking & VPC",
        topics: [
          "Networking fundamentals for AWS",
          "Amazon VPC",
          "Subnets",
          "Route tables",
          "Internet gateways",
          "NAT gateways",
          "Security groups",
          "Network ACLs",
          "Public and private subnets",
          "VPC connectivity",
          "VPC architecture design",
        ],
      },

      {
        module: "Module 5: AWS Databases",
        topics: [
          "Database fundamentals",
          "Amazon RDS",
          "RDS database engines",
          "Database backups",
          "Multi-AZ deployments",
          "Read replicas",
          "Amazon Aurora",
          "Amazon DynamoDB",
          "Database security",
          "Choosing between relational and NoSQL databases",
        ],
      },

      {
        module: "Module 6: AWS Identity, Security & Compliance",
        topics: [
          "AWS Identity and Access Management",
          "Users, groups and roles",
          "IAM policies",
          "Least-privilege access",
          "Multi-factor authentication",
          "AWS Key Management Service",
          "Encryption fundamentals",
          "AWS security services",
          "CloudTrail",
          "Security best practices",
        ],
      },

      {
        module: "Module 7: High Availability, Scalability & Resilience",
        topics: [
          "High availability principles",
          "Fault tolerance",
          "Horizontal and vertical scaling",
          "Elastic Load Balancing",
          "Auto Scaling",
          "Multi-AZ architectures",
          "Disaster recovery fundamentals",
          "Backup strategies",
          "Decoupled architectures",
          "Amazon SQS and SNS",
          "Designing resilient cloud applications",
        ],
      },

      {
        module: "Module 8: Monitoring, Operations & Cost Optimisation",
        topics: [
          "Amazon CloudWatch",
          "AWS CloudTrail",
          "Logging and monitoring",
          "Cloud resource management",
          "AWS billing and cost management",
          "Cost allocation",
          "AWS pricing models",
          "Right-sizing resources",
          "Reserved and Savings Plans fundamentals",
          "Cost optimisation strategies",
          "Operational best practices",
        ],
      },

      {
        module: "Module 9: Infrastructure as Code & Cloud Architecture",
        topics: [
          "Infrastructure as Code fundamentals",
          "AWS CloudFormation",
          "Infrastructure automation",
          "Reusable infrastructure templates",
          "AWS architecture patterns",
          "Three-tier architecture",
          "Serverless architecture",
          "Microservices fundamentals",
          "Decoupled architectures",
          "AWS Well-Architected Framework",
          "Architecture design exercises",
        ],
      },

      {
        module: "Module 10: Solutions Architect Capstone & Certification Preparation",
        topics: [
          "AWS Solutions Architect exam structure",
          "Architecture scenario analysis",
          "Selecting appropriate AWS services",
          "Security and compliance scenarios",
          "High availability scenarios",
          "Cost optimisation scenarios",
          "Performance and scalability scenarios",
          "Designing a production-ready AWS architecture",
          "End-to-end AWS capstone project",
          "Practice questions and mock examination",
          "Certification preparation",
        ],
      },
    ],

    projects: [
      "Deploy a Secure Web Application on AWS",
      "Highly Available Three-Tier AWS Architecture",
      "Serverless Application with AWS Lambda",
      "Scalable Application with EC2, Load Balancing and Auto Scaling",
      "AWS Cloud Architecture & Solutions Architect Capstone",
    ],

    tools: [
      "Amazon Web Services (AWS)",
      "AWS Management Console",
      "Amazon EC2",
      "Amazon S3",
      "Amazon VPC",
      "Amazon RDS",
      "AWS IAM",
      "AWS Lambda",
      "Amazon CloudWatch",
      "AWS CloudFormation",
      "AWS CLI",
      "Git & GitHub",
    ],

    prerequisites: [
      "Basic computer literacy",
      "General IT or software development experience is helpful",
      "Basic networking knowledge is recommended",
      "No previous AWS experience required",
    ],
  },
  {
    slug: "devops-with-docker-and-kubernetes",
    title: "DevOps with Docker & Kubernetes",
    category: "cloud",
    level: "Intermediate to Advanced",
    duration: "10 weeks",
    delivery: "Live Online",
    image: cloudImg,

    summary:
      "Learn modern DevOps practices by containerising applications, automating deployments and managing scalable workloads with Docker and Kubernetes.",

    overview:
      "A practical, project-based DevOps programme designed for developers, system administrators and IT professionals who want to build modern software delivery and infrastructure skills. Students learn containerisation with Docker, orchestration with Kubernetes, CI/CD automation, Infrastructure as Code, configuration and secrets management, cloud deployment, monitoring and reliability practices. The programme focuses on real-world deployment workflows rather than theory alone.",

    audience:
      "Software developers, system administrators, cloud engineers, IT professionals and technical practitioners who want to develop practical DevOps and cloud deployment skills.",

    outcomes: [
      "Understand DevOps principles, practices and software delivery workflows",
      "Containerise applications using Docker",
      "Write efficient and secure Dockerfiles",
      "Manage multi-container applications with Docker Compose",
      "Understand container networking, storage and volumes",
      "Deploy and manage applications using Kubernetes",
      "Work with Pods, Deployments, Services and Ingress",
      "Scale and update containerised applications",
      "Implement CI/CD pipelines for automated software delivery",
      "Manage application configuration and secrets securely",
      "Use Infrastructure as Code concepts to automate infrastructure",
      "Implement monitoring, logging and observability",
      "Understand GitOps and modern deployment workflows",
      "Apply DevOps security and reliability practices",
      "Deploy and operate a production-style containerised application",
    ],

    curriculum: [
      {
        module: "Module 1: DevOps Fundamentals & Development Workflows",
        topics: [
          "Introduction to DevOps",
          "DevOps culture and principles",
          "Software development lifecycle",
          "Development, testing and production environments",
          "Continuous Integration and Continuous Delivery",
          "Version control with Git",
          "GitHub workflows",
          "Branching strategies",
          "Infrastructure and application automation",
          "DevOps project structure",
        ],
      },

      {
        module: "Module 2: Docker & Containerisation",
        topics: [
          "Introduction to containers",
          "Containers vs virtual machines",
          "Docker architecture",
          "Docker images",
          "Docker containers",
          "Dockerfiles",
          "Building and managing images",
          "Container networking",
          "Volumes and persistent storage",
          "Environment variables",
          "Docker registries",
          "Container security fundamentals",
        ],
      },

      {
        module: "Module 3: Docker Compose & Multi-Container Applications",
        topics: [
          "Docker Compose fundamentals",
          "Compose files",
          "Multi-container application architecture",
          "Application and database containers",
          "Networks and volumes",
          "Environment configuration",
          "Service dependencies",
          "Health checks",
          "Local development environments",
          "Containerised application project",
        ],
      },

      {
        module: "Module 4: Kubernetes Fundamentals",
        topics: [
          "Introduction to Kubernetes",
          "Kubernetes architecture",
          "Control plane and worker nodes",
          "Clusters and namespaces",
          "Pods",
          "Deployments",
          "ReplicaSets",
          "Labels and selectors",
          "Kubernetes manifests",
          "kubectl fundamentals",
          "Deploying applications to Kubernetes",
        ],
      },

      {
        module: "Module 5: Kubernetes Networking, Storage & Scaling",
        topics: [
          "Kubernetes Services",
          "ClusterIP, NodePort and LoadBalancer",
          "Ingress",
          "Service discovery",
          "ConfigMaps",
          "Secrets",
          "Persistent volumes",
          "Persistent volume claims",
          "Horizontal scaling",
          "Rolling updates",
          "Rollbacks",
        ],
      },

      {
        module: "Module 6: CI/CD & Deployment Automation",
        topics: [
          "CI/CD fundamentals",
          "Automated build pipelines",
          "Automated testing",
          "Docker image builds",
          "Container image registries",
          "Automated deployments",
          "GitHub Actions",
          "Pipeline security",
          "Deployment strategies",
          "Blue-green and rolling deployments",
          "Continuous delivery workflows",
        ],
      },

      {
        module: "Module 7: Infrastructure as Code & GitOps",
        topics: [
          "Infrastructure as Code fundamentals",
          "Terraform fundamentals",
          "Infrastructure provisioning",
          "Reusable infrastructure configurations",
          "Managing infrastructure state",
          "GitOps principles",
          "Declarative infrastructure",
          "Configuration management",
          "Automated infrastructure deployment",
          "Infrastructure version control",
        ],
      },

      {
        module: "Module 8: Cloud & Kubernetes Deployment",
        topics: [
          "Cloud deployment fundamentals",
          "Deploying containers to the cloud",
          "Managed Kubernetes services",
          "Amazon EKS fundamentals",
          "Cloud networking concepts",
          "Container registries",
          "Load balancing",
          "Application configuration",
          "Production deployment considerations",
          "Cloud cost awareness",
        ],
      },

      {
        module: "Module 9: Monitoring, Logging & Reliability",
        topics: [
          "Observability fundamentals",
          "Monitoring applications and infrastructure",
          "Metrics, logs and traces",
          "Application health checks",
          "Centralised logging",
          "Prometheus fundamentals",
          "Grafana dashboards",
          "Alerting",
          "Incident management fundamentals",
          "Troubleshooting containerised applications",
          "Reliability and availability",
        ],
      },

      {
        module: "Module 10: DevOps Capstone Project",
        topics: [
          "Application architecture and planning",
          "Containerising a real application",
          "Creating Docker images",
          "Multi-container development environment",
          "Deploying to Kubernetes",
          "Configuring Services and Ingress",
          "Managing application secrets",
          "Building a CI/CD pipeline",
          "Infrastructure automation",
          "Monitoring and logging",
          "Production deployment",
          "Technical documentation",
          "Final project presentation",
        ],
      },
    ],

    projects: [
      "Dockerised Web Application",
      "Multi-Container Application with Docker Compose",
      "Kubernetes Application Deployment",
      "Automated CI/CD Pipeline",
      "Infrastructure as Code Project",
      "End-to-End DevOps Capstone Project",
    ],

    tools: [
      "Linux",
      "Git",
      "GitHub",
      "Docker",
      "Docker Compose",
      "Kubernetes",
      "kubectl",
      "GitHub Actions",
      "Terraform",
      "Prometheus",
      "Grafana",
      "AWS",
    ],

    prerequisites: [
      "Basic Linux command-line knowledge",
      "Basic Git and version control knowledge",
      "Basic understanding of web applications",
      "Some software development or deployment experience is recommended",
      "Basic networking knowledge is helpful",
    ],
  },
  {
    slug: "sql-and-database-administration",
    title: "SQL & Database Administration",
    category: "database",
    level: "Beginner to Intermediate",
    duration: "8 weeks",
    delivery: "Both",
    image: databaseImg,

    summary:
      "Develop strong SQL skills, design reliable relational databases, optimise queries and learn essential database administration practices using PostgreSQL and SQL Server.",

    overview:
      "A practical, project-based programme that takes learners from SQL fundamentals to advanced querying and core database administration. Students learn how to retrieve and analyse data, design normalised relational schemas, manage users and permissions, optimise database performance, perform backups and recovery, and automate routine database operations using PostgreSQL and Microsoft SQL Server.",

    audience:
      "Data analysts, software developers, database professionals, IT support staff, system administrators and technology professionals who work with relational databases or want to build practical SQL and database administration skills.",

    outcomes: [
      "Understand relational database concepts and architecture",
      "Write SQL queries to retrieve, filter and analyse data",
      "Use joins, subqueries, CTEs and window functions effectively",
      "Perform data aggregation and business-focused analysis",
      "Design normalised relational database schemas",
      "Create tables, relationships, constraints and indexes",
      "Write views, functions and stored procedures",
      "Understand database transactions and concurrency",
      "Identify and troubleshoot slow-running queries",
      "Apply indexing and query optimisation techniques",
      "Manage database users, roles and permissions",
      "Implement database backup and recovery strategies",
      "Apply fundamental database security practices",
      "Automate routine database administration tasks",
      "Work confidently with PostgreSQL and Microsoft SQL Server",
    ],

    curriculum: [
      {
        module: "Module 1: Database & SQL Fundamentals",
        topics: [
          "Introduction to relational databases",
          "Database concepts and terminology",
          "Tables, rows and columns",
          "Primary and foreign keys",
          "Relationships between tables",
          "SQL fundamentals",
          "SELECT statements",
          "WHERE filtering",
          "ORDER BY",
          "DISTINCT",
          "NULL values",
          "Basic data manipulation",
        ],
      },

      {
        module: "Module 2: SQL Data Analysis & Aggregation",
        topics: [
          "Aggregate functions",
          "COUNT, SUM, AVG, MIN and MAX",
          "GROUP BY",
          "HAVING",
          "CASE expressions",
          "Date and time functions",
          "String functions",
          "Mathematical functions",
          "Conditional logic",
          "Business-focused SQL analysis",
        ],
      },

      {
        module: "Module 3: Joins & Advanced SQL",
        topics: [
          "INNER JOIN",
          "LEFT JOIN",
          "RIGHT JOIN",
          "FULL OUTER JOIN",
          "Self joins",
          "Multiple-table queries",
          "Subqueries",
          "Correlated subqueries",
          "Common Table Expressions",
          "Recursive CTE fundamentals",
          "Set operations",
        ],
      },

      {
        module: "Module 4: Advanced SQL & Analytical Queries",
        topics: [
          "Window functions",
          "ROW_NUMBER",
          "RANK and DENSE_RANK",
          "PARTITION BY",
          "Running totals",
          "Moving averages",
          "Lead and lag analysis",
          "Ranking and segmentation",
          "Advanced date analysis",
          "Writing complex analytical queries",
        ],
      },

      {
        module: "Module 5: Database Design & Data Modelling",
        topics: [
          "Database design principles",
          "Entity-Relationship modelling",
          "ER diagrams",
          "Normalisation",
          "First, Second and Third Normal Forms",
          "Primary and foreign key design",
          "Constraints",
          "Unique and check constraints",
          "Referential integrity",
          "Schema design",
          "Database migrations",
        ],
      },

      {
        module: "Module 6: PostgreSQL & SQL Server",
        topics: [
          "PostgreSQL fundamentals",
          "Microsoft SQL Server fundamentals",
          "Database and schema management",
          "Creating and modifying tables",
          "SQL Server Management Studio",
          "PostgreSQL administration tools",
          "Importing and exporting data",
          "Working with database objects",
          "Platform differences",
          "Practical database administration workflows",
        ],
      },

      {
        module: "Module 7: Database Administration & Security",
        topics: [
          "Database administration fundamentals",
          "Users and roles",
          "Permissions and privileges",
          "Role-based access control",
          "Principle of least privilege",
          "Authentication fundamentals",
          "Database security",
          "Auditing and logging",
          "Managing database connections",
          "Security best practices",
        ],
      },

      {
        module: "Module 8: Performance, Backup & Recovery",
        topics: [
          "Database performance fundamentals",
          "Understanding query execution",
          "Execution plans",
          "Indexing fundamentals",
          "Clustered and non-clustered indexes",
          "Query optimisation",
          "Identifying slow queries",
          "Database statistics",
          "Backup strategies",
          "Full and incremental backups",
          "Database recovery",
          "Disaster recovery fundamentals",
        ],
      },

      {
        module: "Module 9: Automation & Database Operations",
        topics: [
          "Automating database tasks",
          "Stored procedures",
          "Functions",
          "Triggers",
          "Scheduled database jobs",
          "Data import and export automation",
          "Maintenance tasks",
          "Database monitoring",
          "Routine administration workflows",
          "Operational documentation",
        ],
      },

      {
        module: "Module 10: Database Administration Capstone",
        topics: [
          "Database requirements analysis",
          "Relational database design",
          "Schema development",
          "Data loading",
          "Advanced SQL analysis",
          "User and permission management",
          "Index and performance optimisation",
          "Backup and recovery implementation",
          "Database security configuration",
          "Automation of routine tasks",
          "Performance testing",
          "Technical documentation",
          "Final database project presentation",
        ],
      },
    ],

    projects: [
      "Sales & Customer Relational Database",
      "Business Reporting Database",
      "Advanced SQL Data Analysis Project",
      "PostgreSQL Database Administration Lab",
      "SQL Server Database Administration Lab",
      "End-to-End Database Design & Administration Capstone",
    ],

    tools: [
      "SQL",
      "PostgreSQL",
      "Microsoft SQL Server",
      "SQL Server Management Studio",
      "pgAdmin",
      "Git & GitHub",
    ],

    prerequisites: [
      "Basic computer literacy",
      "No prior SQL experience required",
      "Basic understanding of spreadsheets is helpful but not required",
    ],
  },
  {
    slug: "workflow-automation-no-code",
    title: "Workflow Automation & No-Code",
    category: "automation",
    level: "Beginner to Intermediate",
    duration: "6 weeks",
    delivery: "Live Online",
    image: automationImg,

    summary:
      "Automate repetitive business processes, reports, emails and data workflows using Python, n8n, Zapier, Make and other automation tools.",

    overview:
      "A practical, project-based automation programme designed to help professionals identify repetitive tasks, design efficient workflows and automate business processes with little or no code. Students learn both no-code and low-code automation using platforms such as n8n, Zapier and Make, alongside Python scripting for more advanced automation. The programme focuses on real-world business processes including email automation, data processing, reporting, file management, API integration and workflow monitoring.",

    audience:
      "Business owners, operations teams, administrators, finance professionals, data analysts, marketers, entrepreneurs and professionals who want to reduce repetitive work and improve workplace productivity through automation.",

    outcomes: [
      "Identify repetitive business processes suitable for automation",
      "Analyse and map workflows before implementing automation",
      "Select the right automation approach and tools for different use cases",
      "Build automated workflows using no-code and low-code platforms",
      "Create business automations with n8n, Zapier and Make",
      "Automate email, spreadsheet, file and reporting workflows",
      "Use webhooks and APIs to connect different applications",
      "Process and transform data automatically between systems",
      "Write basic Python scripts for tasks that require custom logic",
      "Schedule and monitor automated workflows",
      "Implement error handling and workflow recovery",
      "Apply authentication and security best practices",
      "Document workflows for maintenance and team handover",
      "Build practical automation solutions for real business problems",
    ],

    curriculum: [
      {
        module: "Module 1: Automation Fundamentals & Workflow Design",
        topics: [
          "Introduction to business process automation",
          "Automation vs manual processes",
          "Identifying repetitive tasks",
          "Workflow mapping",
          "Process analysis",
          "Automation opportunities",
          "Choosing between no-code, low-code and custom code",
          "Automation risks and limitations",
          "Human-in-the-loop workflows",
          "Designing reliable automation processes",
        ],
      },

      {
        module: "Module 2: No-Code & Low-Code Automation",
        topics: [
          "Introduction to no-code automation",
          "Understanding triggers and actions",
          "Workflow logic",
          "Conditions and branching",
          "Data mapping",
          "Variables and expressions",
          "n8n fundamentals",
          "Zapier fundamentals",
          "Make fundamentals",
          "Building multi-step workflows",
        ],
      },

      {
        module: "Module 3: Business Process Automation",
        topics: [
          "Email automation",
          "Google Forms automation",
          "Google Sheets workflows",
          "Microsoft Excel automation",
          "File and document management",
          "Automated notifications",
          "Approval workflows",
          "Lead and customer workflows",
          "Employee and administrative workflows",
          "Automated reporting",
        ],
      },

      {
        module: "Module 4: APIs, Webhooks & Application Integration",
        topics: [
          "Understanding APIs",
          "REST API fundamentals",
          "HTTP methods",
          "API authentication",
          "API requests and responses",
          "JSON data",
          "Webhooks",
          "Connecting applications",
          "Sending and receiving data",
          "Building API-powered workflows",
        ],
      },

      {
        module: "Module 5: Python for Workflow Automation",
        topics: [
          "Introduction to Python automation",
          "Reading and writing files",
          "Working with folders and directories",
          "CSV and Excel automation",
          "Data processing with pandas",
          "Automated email with Python",
          "Working with APIs using Python",
          "Automating repetitive data tasks",
          "Scheduling Python scripts",
          "Integrating Python with automation workflows",
        ],
      },

      {
        module: "Module 6: Advanced Workflow Automation & Operations",
        topics: [
          "Conditional workflows",
          "Loops and data processing",
          "Error handling",
          "Retries and fallback workflows",
          "Workflow logging",
          "Monitoring automation jobs",
          "Scheduling workflows",
          "Authentication and credential management",
          "Automation security",
          "Testing and debugging workflows",
          "Documentation and team handover",
        ],
      },

      {
        module: "Module 7: Automation Capstone Project",
        topics: [
          "Identify a real business process",
          "Analyse the existing workflow",
          "Design the automated solution",
          "Select appropriate automation tools",
          "Build the workflow",
          "Integrate APIs and applications",
          "Add validation and error handling",
          "Test the automation",
          "Deploy and schedule the workflow",
          "Monitor the automation",
          "Document the complete solution",
          "Present the final automation project",
        ],
      },
    ],

    projects: [
      "Automated Student Application & Notification System",
      "Automated Email & Reporting Workflow",
      "Excel/Google Sheets Data Processing Automation",
      "Lead Capture & CRM Automation",
      "Document & File Management Automation",
      "End-to-End Business Process Automation Capstone",
    ],

    tools: [
      "n8n",
      "Zapier",
      "Make",
      "Python",
      "Pandas",
      "Google Sheets",
      "Microsoft Excel",
      "REST APIs",
      "Webhooks",
      "Git & GitHub",
    ],

    prerequisites: [
      "Basic computer literacy",
      "No programming experience required",
      "Basic understanding of spreadsheets is helpful but not required",
    ],
  },

  {
    slug: "generative-ai-prompt-engineering",
    title: "Generative AI & Prompt Engineering",
    category: "ai",
    level: "Beginner",
    duration: "6 weeks",
    delivery: "Both",
    featured: true,
    image: aiImg,

    summary:
      "Learn to use generative AI tools effectively prompting, AI-assisted content creation, workflow automation, and integrating AI into everyday work.",

    seoIntro:
      "Searching for a Generative AI course in Lagos or Prompt Engineering training in Nigeria? This 6-week programme at Corepoint Tech Academy teaches you how to work effectively with modern AI tools — from writing prompts that actually get useful results, to using generative AI for content, research, and automation. No coding background required. It's built for professionals, students, and business owners who want to use AI as a practical productivity tool, not just talk about it.",

    overview:
      "A practical, hands-on programme focused on understanding and working effectively with generative AI. Rather than treating AI as an abstract concept, this course teaches prompting techniques, AI-assisted content generation, research workflows, and how to integrate generative AI into real tasks — writing, analysis, automation, and decision-making. Learners leave with practical prompting skills and a portfolio of AI-assisted projects.",

    audience:
      "Professionals, students, content creators, marketers, business owners, and career changers who want to use generative AI productively in their work, without needing a programming background.",

    outcomes: [
      "Understand how large language models and generative AI systems work at a practical level",
      "Write effective prompts for text, image, and code generation tasks",
      "Use AI-assisted research and writing techniques",
      "Apply prompt engineering frameworks to get consistent, high-quality outputs",
      "Use generative AI for content creation, summarization, and analysis",
      "Combine generative AI with basic automation tools for repetitive tasks",
      "Evaluate AI outputs critically and recognize common failure modes",
      "Apply generative AI responsibly, including data privacy considerations",
      "Build a portfolio of practical AI-assisted projects",
    ],

    curriculum: [
      {
        module: "Module 1: Understanding Generative AI",
        topics: [
          "What generative AI is and how it works",
          "Large language models explained simply",
          "Text, image, audio, and code generation",
          "Popular generative AI tools and platforms",
          "Capabilities and limitations of current AI systems",
        ],
      },
      {
        module: "Module 2: Prompt Engineering Fundamentals",
        topics: [
          "Anatomy of an effective prompt",
          "Zero-shot, few-shot, and chain-of-thought prompting",
          "Role-based and context-based prompting",
          "Iterative prompt refinement",
          "Common prompting mistakes and how to avoid them",
        ],
      },
      {
        module: "Module 3: AI-Assisted Writing & Content Creation",
        topics: [
          "Drafting and editing with AI",
          "Summarization and repurposing content",
          "Tone, style, and audience control",
          "AI-assisted research workflows",
          "Fact-checking and verifying AI outputs",
        ],
      },
      {
        module: "Module 4: Generative AI for Business & Productivity",
        topics: [
          "Using AI for reports, presentations, and proposals",
          "AI-assisted data analysis and summarization",
          "Customer communication and support use cases",
          "Combining AI with spreadsheets and documents",
          "Building repeatable AI-assisted workflows",
        ],
      },
      {
        module: "Module 5: Introduction to AI Automation",
        topics: [
          "Connecting generative AI to simple workflows",
          "Using AI within no-code automation tools",
          "Practical automation examples",
          "When to automate vs. when to keep a human in the loop",
        ],
      },
      {
        module: "Module 6: Responsible & Practical AI Use",
        topics: [
          "Data privacy when using AI tools",
          "Bias and limitations in AI outputs",
          "Ethical considerations in AI-assisted work",
          "Building your personal AI toolkit",
          "Final portfolio project",
        ],
      },
    ],

    projects: [
      "AI-Assisted Content Calendar & Writing Workflow",
      "AI-Powered Research & Summary Report",
      "Prompt Library for a Specific Business Use Case",
      "Simple AI + Automation Workflow",
    ],

    tools: [
      "ChatGPT / Claude",
      "Prompt engineering frameworks",
      "AI image generation tools",
      "Basic automation tools (n8n / Zapier)",
    ],

    prerequisites: [
      "Basic computer literacy",
      "No programming experience required",
      "No prior AI experience required",
    ],

    faqs: [
      {
        question: "Do I need to know how to code for this course?",
        answer:
          "No. This course is designed for non-technical learners who want to use generative AI effectively in their work, without any programming background required.",
      },
      {
        question: "How is this different from your main AI course?",
        answer:
          "This course focuses specifically on using generative AI tools effectively through prompting and practical workflows. Our broader AI programme covers machine learning and AI engineering in more technical depth.",
      },
      {
        question: "Will this help me in my current job, even if it's not tech-related?",
        answer:
          "Yes. Generative AI skills apply across marketing, writing, customer service, research, administration, and many other roles — the course is built around practical, everyday use cases.",
      },
      {
        question: "Is this course available online?",
        answer:
          "Yes, it's available both physically in Lagos and live online.",
      },
    ],
  },

  {
    slug: "professional-certificate-ai-engineering",
    title: "Professional Certificate in AI Engineering",
    category: "ai",
    level: "Intermediate to Advanced",
    duration: "16 weeks",
    delivery: "Both",
    featured: true,
    image: aiImg,

    summary:
      "An advanced, professional level programme covering machine learning, deep learning, AI system design, and deployment for those ready to build and ship real AI applications.",

    seoIntro:
      "Looking for a professional AI Engineering course in Lagos that goes beyond the basics? This 16-week advanced programme at Corepoint Tech Academy is built for developers, data professionals, and career changers who already have some technical foundation and want to become job-ready AI Engineers. You'll cover machine learning, deep learning, model deployment, and applied generative AI system design with a heavy emphasis on shipping real, working applications rather than just completing tutorials.",

    overview:
      "A rigorous, project-based programme designed to take learners with an existing technical foundation into professional AI Engineering. The programme covers advanced machine learning, deep learning fundamentals, model evaluation and optimization, AI application architecture, deployment of models as APIs, and applied generative AI system design, including retrieval-augmented generation and AI agents. Learners complete a substantial capstone project that mirrors real-world AI engineering work from problem definition to deployed application.",

    audience:
      "Software developers, data analysts, data scientists, and technically-inclined professionals who already have basic Python experience and want to specialize in building and deploying AI systems professionally.",

    outcomes: [
      "Design and train machine learning models for real-world problems",
      "Understand deep learning fundamentals and neural network architectures",
      "Evaluate, tune, and optimize models for production use",
      "Build APIs to serve machine learning and AI models",
      "Design applied generative AI systems, including retrieval-augmented generation",
      "Understand the fundamentals of AI agents and tool-using systems",
      "Apply MLOps practices for model versioning, monitoring, and deployment",
      "Architect end-to-end AI applications from data to deployed product",
      "Evaluate AI system performance, cost, and reliability trade-offs",
      "Complete and present a full AI engineering capstone project",
    ],

    curriculum: [
      {
        module: "Module 1: Advanced Machine Learning Foundations",
        topics: [
          "Review of supervised and unsupervised learning",
          "Feature engineering at scale",
          "Model selection and evaluation strategies",
          "Handling imbalanced and real-world messy data",
          "Cross-validation and hyperparameter tuning",
        ],
      },
      {
        module: "Module 2: Deep Learning Fundamentals",
        topics: [
          "Neural network fundamentals",
          "Training, backpropagation, and optimization",
          "Convolutional neural networks",
          "Sequence models and transformers (conceptual)",
          "Working with pre-trained models",
        ],
      },
      {
        module: "Module 3: Applied Generative AI Systems",
        topics: [
          "How modern generative AI systems are architected",
          "Retrieval-augmented generation (RAG)",
          "Vector databases and embeddings",
          "Building applications on top of AI APIs",
          "Introduction to AI agents and tool use",
        ],
      },
      {
        module: "Module 4: Model Deployment & APIs",
        topics: [
          "Serving models with FastAPI",
          "Containerization basics with Docker",
          "API design for AI applications",
          "Handling latency, cost, and scaling considerations",
          "Basic cloud deployment (Render / AWS / Azure)",
        ],
      },
      {
        module: "Module 5: MLOps & Production Practices",
        topics: [
          "Model versioning and experiment tracking",
          "Monitoring model performance in production",
          "Data and model drift",
          "CI/CD concepts for machine learning",
          "Documentation and handover practices",
        ],
      },
      {
        module: "Module 6: AI Engineering Capstone Project",
        topics: [
          "Defining a real-world AI engineering problem",
          "Data collection and preparation",
          "Model or system design and development",
          "Deployment as a working application",
          "Technical documentation and final presentation",
        ],
      },
    ],

    projects: [
      "Production-Ready Predictive Model with Deployed API",
      "Retrieval-Augmented Generation (RAG) Application",
      "AI Agent for a Real Business Workflow",
      "End-to-End AI Engineering Capstone Project",
    ],

    tools: [
      "Python",
      "scikit-learn",
      "PyTorch or TensorFlow",
      "FastAPI",
      "Docker",
      "Vector databases",
      "Git & GitHub",
    ],

    prerequisites: [
      "Basic Python programming experience",
      "Familiarity with fundamental machine learning concepts is helpful but not required",
      "Comfortable using the command line at a basic level",
    ],

    faqs: [
      {
        question: "Is this course for complete beginners?",
        answer:
          "No. This is an advanced, professional-level programme designed for learners who already have basic Python experience. If you're completely new to programming, we recommend starting with our Data Science or AI Fundamentals course first.",
      },
      {
        question: "What makes this 'professional' rather than a general AI course?",
        answer:
          "This programme focuses specifically on the engineering side of AI — deployment, APIs, MLOps, and production practices — rather than just model building. It's designed to prepare you for an actual AI Engineer role, not just conceptual understanding.",
      },
      {
        question: "Will I deploy real, working applications?",
        answer:
          "Yes. You'll deploy models as APIs during the course, and your capstone project is a full end-to-end AI application, not just a notebook or slide deck.",
      },
      {
        question: "Is this course available live online?",
        answer:
          "Yes, it's available both physically in Lagos and live online, so you can join from anywhere in Nigeria.",
      },
    ],
  },
];

export const featuredCourses = courses.filter((c) => c.featured);

export const getCourse = (slug: string) => courses.find((c) => c.slug === slug);
