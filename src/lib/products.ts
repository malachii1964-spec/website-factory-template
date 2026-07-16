export type ProductCategory = "templates" | "prompts" | "ebooks" | "automation" | "assets" | "courses";

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  tag?: string;
  features: string[];
  industry?: string;
  icon: string;
}

export const products: Product[] = [
  // === AI TEMPLATES ===
  {
    id: "t1",
    slug: "ai-workspace-notion-template",
    title: "AI Workspace - Notion Template",
    description: "Complete Notion workspace for managing AI projects, prompts, and outputs in one organized system.",
    longDescription: "Transform your Notion into a powerful AI command center. This template includes prompt libraries, output tracking, project boards, and automated workflows that keep your AI work organized and productive. Perfect for freelancers, consultants, and teams using AI daily.",
    category: "templates",
    price: 19,
    originalPrice: 39,
    tag: "Best Seller",
    features: ["50+ pre-built prompt storage pages", "AI project tracker with Kanban boards", "Output quality scoring system", "Client delivery pipeline", "Weekly AI productivity dashboard", "Auto-linked databases"],
    icon: "layout"
  },
  {
    id: "t2",
    slug: "content-machine-spreadsheet",
    title: "Content Machine - Google Sheets System",
    description: "Automated content calendar and performance tracker that plans 90 days of content in minutes.",
    longDescription: "Stop spending hours planning content. This Google Sheets system uses built-in formulas and frameworks to generate 90 days of content ideas, schedule posts, track performance metrics, and identify what's working. Includes AI prompt templates for generating each piece of content.",
    category: "templates",
    price: 14,
    originalPrice: 29,
    tag: "Popular",
    features: ["90-day content calendar auto-generator", "Platform-specific posting schedules", "Performance tracking dashboard", "AI content prompt templates", "Hashtag research tracker", "Engagement rate calculator"],
    icon: "table"
  },
  {
    id: "t3",
    slug: "client-proposal-canva-pack",
    title: "Client Proposal - Canva Template Pack",
    description: "10 premium proposal templates that close deals. Designed for freelancers and agencies.",
    longDescription: "Win more clients with proposals that look like they cost $5,000 to design. This pack includes 10 fully customizable Canva templates covering different industries and service types. Each template includes AI-generated copy suggestions and pricing frameworks.",
    category: "templates",
    price: 24,
    originalPrice: 49,
    tag: "Premium",
    features: ["10 unique proposal designs", "Drag-and-drop customization", "AI copywriting prompts included", "Pricing table frameworks", "Case study layouts", "Mobile-responsive versions"],
    icon: "presentation"
  },
  {
    id: "t4",
    slug: "freelancer-finance-tracker",
    title: "Freelancer Finance Tracker",
    description: "Track income, expenses, taxes, and client payments. Never miss a deduction again.",
    longDescription: "Built specifically for freelancers and solopreneurs. This spreadsheet automatically categorizes expenses, calculates quarterly tax estimates, tracks client invoices, and generates profit/loss reports. Includes tax deduction checklists for common freelancer expenses.",
    category: "templates",
    price: 12,
    originalPrice: 24,
    tag: "Essential",
    features: ["Automatic tax calculation", "Invoice tracking system", "Expense categorization", "Quarterly P&L reports", "Tax deduction checklist", "Multiple currency support"],
    icon: "calculator"
  },
  {
    id: "t5",
    slug: "social-media-analytics-dashboard",
    title: "Social Media Analytics Dashboard",
    description: "Track all your social platforms in one place. Identify trends and optimize your strategy.",
    longDescription: "Connect your social media metrics into one powerful dashboard. This Google Sheets template lets you manually input or paste data from any platform and instantly see growth trends, engagement patterns, best posting times, and content performance rankings.",
    category: "templates",
    price: 9,
    tag: "Starter",
    features: ["Multi-platform tracking", "Growth trend visualizations", "Best time to post analysis", "Content performance ranking", "Follower demographics tracker", "Weekly/monthly report generator"],
    icon: "bar-chart"
  },

  // === PROMPT LIBRARIES ===
  {
    id: "p1",
    slug: "ultimate-chatgpt-prompt-vault",
    title: "Ultimate ChatGPT Prompt Vault",
    description: "500+ battle-tested prompts organized by use case. Copy, paste, profit.",
    longDescription: "Stop wasting time writing mediocre prompts. This vault contains 500+ meticulously crafted prompts that have been tested across thousands of use cases. Each prompt includes variables you can customize, expected output examples, and tips for getting the best results.",
    category: "prompts",
    price: 29,
    originalPrice: 59,
    tag: "Best Seller",
    features: ["500+ tested prompts", "25 categories (marketing, coding, writing, business)", "Copy-paste ready format", "Variable placeholders for customization", "Output examples included", "Monthly updates with new prompts"],
    icon: "message-square"
  },
  {
    id: "p2",
    slug: "midjourney-prompt-mastery",
    title: "Midjourney Prompt Mastery Pack",
    description: "200+ image generation prompts with style modifiers, aspect ratios, and composition guides.",
    longDescription: "Create stunning AI art consistently. This pack includes 200+ proven Midjourney prompts with detailed style modifiers, composition techniques, and parameter settings. Includes a visual guide showing exactly what each modifier does to your output.",
    category: "prompts",
    price: 24,
    originalPrice: 44,
    tag: "Creative",
    features: ["200+ image prompts", "Style modifier encyclopedia", "Aspect ratio guide", "Composition frameworks", "Before/after examples", "Commercial use tips"],
    icon: "image"
  },
  {
    id: "p3",
    slug: "business-email-prompt-pack",
    title: "Business Email AI Prompt Pack",
    description: "100 prompts for every business email scenario. Cold outreach, follow-ups, negotiations, and more.",
    longDescription: "Never stare at a blank email again. This collection covers every business email scenario you'll encounter — from cold outreach that gets replies to negotiation emails that close deals. Each prompt is designed to sound human, professional, and persuasive.",
    category: "prompts",
    price: 14,
    tag: "Essential",
    features: ["100 email-specific prompts", "Cold outreach sequences", "Follow-up frameworks", "Negotiation templates", "Tone adjustment modifiers", "Industry-specific variations"],
    icon: "mail"
  },
  {
    id: "p4",
    slug: "code-assistant-prompt-library",
    title: "Code Assistant Prompt Library",
    description: "150 prompts for debugging, refactoring, documentation, and building features with AI.",
    longDescription: "Supercharge your coding workflow with AI. This library contains 150 prompts specifically designed for software development — from debugging complex issues to generating documentation, writing tests, and building entire features from specifications.",
    category: "prompts",
    price: 19,
    tag: "Developer",
    features: ["150 coding-specific prompts", "Debugging frameworks", "Code review prompts", "Documentation generators", "Test writing templates", "Architecture planning prompts"],
    icon: "code"
  },

  // === E-BOOKS & GUIDES ===
  {
    id: "e1",
    slug: "ai-first-professional-ebook",
    title: "The AI-First Professional",
    description: "The definitive guide to integrating AI into your career. 200+ pages of actionable strategy.",
    longDescription: "This comprehensive guide shows you exactly how to become indispensable in an AI-driven workplace. Covers AI tool selection, workflow automation, prompt engineering, AI-augmented decision making, and building an AI-first personal brand. Includes case studies from professionals who 10x'd their output.",
    category: "ebooks",
    price: 29,
    originalPrice: 49,
    tag: "Flagship",
    features: ["200+ pages of actionable content", "Step-by-step implementation guides", "Real-world case studies", "Tool comparison matrices", "30-day transformation plan", "Bonus: AI career roadmap"],
    icon: "book-open"
  },
  {
    id: "e2",
    slug: "passive-income-with-ai-guide",
    title: "Passive Income with AI - Complete Guide",
    description: "How to build automated income streams using AI tools. From zero to $5K/month.",
    longDescription: "A step-by-step blueprint for building passive income streams powered by AI. Covers digital product creation, automated content systems, AI-powered services, and scaling strategies. Includes real revenue numbers and timelines from people who've done it.",
    category: "ebooks",
    price: 24,
    originalPrice: 44,
    tag: "New",
    features: ["Complete passive income blueprint", "7 proven AI income models", "Revenue projections & timelines", "Tool stack recommendations", "Automation workflow diagrams", "Bonus: 30 AI side hustle ideas"],
    icon: "trending-up"
  },
  {
    id: "e3",
    slug: "local-business-ai-playbook",
    title: "Local Business AI Playbook",
    description: "How any local business can save 20+ hours/week with simple AI automation.",
    longDescription: "Written specifically for local business owners who are overwhelmed with paperwork, scheduling, and customer communication. This playbook shows you exactly which AI tools to use, how to set them up, and how to save 20+ hours per week without any technical knowledge.",
    category: "ebooks",
    price: 19,
    tag: "For Business Owners",
    features: ["Industry-specific chapters", "No-code automation guides", "ROI calculator included", "Customer communication templates", "Scheduling automation setup", "Invoice & billing automation"],
    icon: "store"
  },
  {
    id: "e4",
    slug: "prompt-engineering-masterclass-ebook",
    title: "Prompt Engineering Masterclass",
    description: "The science behind perfect prompts. Advanced techniques that 99% of people don't know.",
    longDescription: "Go beyond basic prompting. This guide teaches you the advanced techniques used by professional prompt engineers — chain-of-thought reasoning, few-shot learning, role-based prompting, and output formatting. Includes exercises and real examples across multiple AI platforms.",
    category: "ebooks",
    price: 19,
    originalPrice: 34,
    tag: "Advanced",
    features: ["Advanced prompting techniques", "Chain-of-thought frameworks", "Few-shot learning examples", "Platform-specific optimization", "Practice exercises", "Prompt debugging guide"],
    icon: "brain"
  },

  {
    id: "e5",
    slug: "easy-ai-prompt-mastery",
    title: "Malachi's EASY AI - Prompt Mastery for Beginners",
    description: "The complete 18-chapter guide to using AI for life, work, business, content, and money. No fluff, no jargon.",
    longDescription: "Written by Malachi for real people who feel intimidated by AI. This complete 18-chapter book teaches the EASY AI method — a simple framework for getting amazing results from ChatGPT, Claude, and any AI tool. Covers prompting fundamentals, the Perfect Prompt Blueprint, fixing bad AI answers, AI for business, content creation, digital products, automation, and safety, plus a 30-day challenge and a 40-prompt copy-and-paste vault. Deliberately no-fluff — every chapter earns its place. No tech background needed.",
    category: "ebooks",
    price: 24,
    originalPrice: 49,
    tag: "Flagship",
    features: ["Complete 18-chapter book", "The EASY AI prompting method", "Perfect Prompt Blueprint", "30-Day FutureDeskAI Challenge", "Copy-and-paste prompt vault", "Real output examples", "Business & money chapters", "AI safety & fact-checking guide"],
    icon: "book-open"
  },

  // === LOCAL BUSINESS AUTOMATION PACKS ===
  {
    id: "a1",
    slug: "plumber-automation-pack",
    title: "Plumber's AI Automation Pack",
    description: "Automated scheduling, invoicing, follow-ups, and review requests for plumbing businesses.",
    longDescription: "Built specifically for plumbing businesses. This pack includes ready-to-use automation templates that handle appointment scheduling, automatic invoice generation, customer follow-up sequences, review request emails, and seasonal maintenance reminders. Save 15+ hours per week on paperwork.",
    category: "automation",
    price: 49,
    originalPrice: 99,
    tag: "Trade Pro",
    features: ["Appointment scheduling automation", "Auto-invoice generation templates", "Customer follow-up sequences", "Google review request system", "Seasonal maintenance reminders", "Emergency call routing setup"],
    industry: "Plumbing",
    icon: "wrench"
  },
  {
    id: "a2",
    slug: "electrician-automation-pack",
    title: "Electrician's AI Automation Pack",
    description: "Streamline estimates, scheduling, safety compliance docs, and customer communications.",
    longDescription: "Designed for electrical contractors and businesses. Automate your estimate generation, job scheduling, safety compliance documentation, customer communications, and payment follow-ups. Includes templates for common electrical job types with pre-filled descriptions.",
    category: "automation",
    price: 49,
    originalPrice: 99,
    tag: "Trade Pro",
    features: ["Estimate generator templates", "Job scheduling automation", "Safety compliance doc templates", "Customer communication sequences", "Payment reminder automation", "Inspection checklist generator"],
    industry: "Electrical",
    icon: "zap"
  },
  {
    id: "a3",
    slug: "landscaper-automation-pack",
    title: "Landscaper's AI Automation Pack",
    description: "Seasonal scheduling, quote generation, crew management, and client communication on autopilot.",
    longDescription: "Purpose-built for landscaping businesses. Handle seasonal scheduling changes, generate professional quotes in minutes, manage crew assignments, send weather-related updates to clients, and automate end-of-season billing. Grow your business without growing your admin time.",
    category: "automation",
    price: 49,
    originalPrice: 99,
    tag: "Trade Pro",
    features: ["Seasonal schedule automation", "Quick quote generator", "Crew assignment templates", "Weather update notifications", "Before/after photo system", "Annual contract renewal reminders"],
    industry: "Landscaping",
    icon: "trees"
  },
  {
    id: "a4",
    slug: "restaurant-automation-pack",
    title: "Restaurant AI Automation Pack",
    description: "Menu updates, reservation management, review responses, and staff scheduling simplified.",
    longDescription: "Designed for restaurant owners and managers. Automate your menu update process, streamline reservation management, generate professional review responses, simplify staff scheduling, and create social media content for daily specials. Focus on food, not paperwork.",
    category: "automation",
    price: 49,
    originalPrice: 99,
    tag: "Hospitality",
    features: ["Menu update templates", "Reservation confirmation automation", "AI review response generator", "Staff schedule templates", "Social media content calendar", "Supplier order reminders"],
    industry: "Restaurant",
    icon: "utensils"
  },
  {
    id: "a5",
    slug: "real-estate-automation-pack",
    title: "Real Estate Agent AI Pack",
    description: "Listing descriptions, client follow-ups, market reports, and open house automation.",
    longDescription: "Built for real estate agents who want to close more deals with less admin work. Generate compelling listing descriptions in seconds, automate client follow-up sequences, create market analysis reports, and streamline open house management from invitations to follow-ups.",
    category: "automation",
    price: 49,
    originalPrice: 99,
    tag: "Real Estate",
    features: ["AI listing description generator", "Client nurture sequences", "Market report templates", "Open house automation workflow", "Closing checklist automation", "Anniversary/check-in reminders"],
    industry: "Real Estate",
    icon: "home"
  },
  {
    id: "a6",
    slug: "salon-spa-automation-pack",
    title: "Salon & Spa AI Automation Pack",
    description: "Appointment reminders, rebooking sequences, inventory alerts, and social content.",
    longDescription: "Designed for salons, spas, and beauty businesses. Automate appointment reminders, create rebooking sequences that keep clients coming back, set up inventory alerts, generate social media content showcasing your work, and manage staff schedules effortlessly.",
    category: "automation",
    price: 49,
    originalPrice: 99,
    tag: "Beauty & Wellness",
    features: ["Appointment reminder automation", "Rebooking sequence templates", "Inventory alert system", "Social media content templates", "Client birthday/anniversary messages", "Staff schedule optimization"],
    industry: "Beauty & Wellness",
    icon: "scissors"
  },
  {
    id: "a7",
    slug: "hvac-automation-pack",
    title: "HVAC Business AI Automation Pack",
    description: "Service reminders, maintenance contracts, emergency dispatch, and seasonal campaigns.",
    longDescription: "Purpose-built for HVAC businesses. Automate seasonal maintenance reminders, manage service contracts, streamline emergency dispatch communications, generate professional estimates, and run seasonal marketing campaigns that fill your calendar year-round.",
    category: "automation",
    price: 49,
    originalPrice: 99,
    tag: "Trade Pro",
    features: ["Seasonal maintenance reminders", "Service contract management", "Emergency dispatch templates", "Estimate generation system", "Seasonal marketing campaigns", "Equipment warranty tracking"],
    industry: "HVAC",
    icon: "thermometer"
  },
  {
    id: "a8",
    slug: "dental-office-automation-pack",
    title: "Dental Office AI Automation Pack",
    description: "Patient reminders, insurance verification, treatment plans, and recall systems.",
    longDescription: "Streamline your dental practice operations. Automate patient appointment reminders, simplify insurance verification workflows, generate treatment plan presentations, manage recall systems for cleanings and check-ups, and handle new patient onboarding seamlessly.",
    category: "automation",
    price: 59,
    originalPrice: 119,
    tag: "Healthcare",
    features: ["Patient reminder automation", "Insurance verification templates", "Treatment plan generators", "Recall system automation", "New patient onboarding flow", "Post-procedure follow-up sequences"],
    industry: "Dental",
    icon: "heart-pulse"
  },
  {
    id: "a9",
    slug: "fitness-trainer-automation-pack",
    title: "Fitness Trainer AI Automation Pack",
    description: "Client onboarding, workout plans, progress tracking, and retention sequences.",
    longDescription: "Built for personal trainers and fitness coaches. Automate client onboarding, generate customized workout plans, set up progress tracking systems, create nutrition guidance templates, and implement retention sequences that keep clients engaged long-term.",
    category: "automation",
    price: 39,
    originalPrice: 79,
    tag: "Fitness",
    features: ["Client onboarding automation", "Workout plan generators", "Progress tracking templates", "Nutrition guidance frameworks", "Client retention sequences", "Social proof collection system"],
    industry: "Fitness",
    icon: "dumbbell"
  },
  {
    id: "a10",
    slug: "cleaning-service-automation-pack",
    title: "Cleaning Service AI Automation Pack",
    description: "Booking, scheduling, quality checklists, and client communication for cleaning businesses.",
    longDescription: "Designed for residential and commercial cleaning businesses. Streamline booking and scheduling, create quality assurance checklists, automate client communications, manage team assignments, and generate professional quotes that win more jobs.",
    category: "automation",
    price: 39,
    originalPrice: 79,
    tag: "Service Pro",
    features: ["Online booking automation", "Team scheduling templates", "Quality assurance checklists", "Client communication sequences", "Quote generation system", "Supply inventory tracking"],
    industry: "Cleaning",
    icon: "sparkles"
  },

  {
    id: "a11",
    slug: "contractor-automation-pack",
    title: "General Contractor AI Automation Pack",
    description: "Proposals, change orders, project updates, sub scheduling, and client communication for contractors.",
    longDescription: "Built specifically for general contractors and remodelers. This comprehensive pack includes professional proposal templates, change order documentation, weekly project update systems, subcontractor scheduling and communication templates, detailed estimate frameworks for kitchens, bathrooms, and additions, plus 90 days of social media content. Stop losing hours to paperwork and start winning more bids.",
    category: "automation",
    price: 59,
    originalPrice: 119,
    tag: "Trade Pro",
    features: ["Professional proposal templates", "Change order documentation system", "Weekly project update templates", "Subcontractor scheduling & communication", "Detailed estimate frameworks (kitchen, bath, addition)", "90-day social media content calendar", "Client completion & warranty letters"],
    industry: "General Contracting",
    icon: "hard-hat"
  },

  // === AI ASSET PACKS ===
  {
    id: "as1",
    slug: "futuristic-social-media-pack",
    title: "Futuristic Social Media Asset Pack",
    description: "100+ AI-generated social media graphics, backgrounds, and templates in a premium futuristic style.",
    longDescription: "Elevate your social media presence with 100+ premium AI-generated graphics. Includes story templates, post backgrounds, highlight covers, and banner designs — all in a cohesive futuristic aesthetic that makes your brand stand out from the crowd.",
    category: "assets",
    price: 29,
    originalPrice: 59,
    tag: "Creative",
    features: ["100+ unique graphics", "Story templates", "Post backgrounds", "Highlight covers", "Banner designs", "Commercial license included"],
    icon: "palette"
  },
  {
    id: "as2",
    slug: "ai-presentation-backgrounds",
    title: "AI Presentation Background Collection",
    description: "50 premium AI-generated slide backgrounds for professional presentations.",
    longDescription: "Make every presentation memorable with 50 stunning AI-generated backgrounds. Includes abstract, corporate, creative, and industry-specific designs in multiple aspect ratios. Perfect for keynotes, pitch decks, and client presentations.",
    category: "assets",
    price: 19,
    tag: "Professional",
    features: ["50 unique backgrounds", "Multiple aspect ratios", "Abstract & corporate styles", "4K resolution", "PowerPoint & Keynote ready", "Commercial license included"],
    icon: "monitor"
  },

  // === COURSES ===
  {
    id: "c1",
    slug: "ai-first-professional-course",
    title: "AI-First Professional Masterclass",
    description: "12-module course transforming you into an AI-powered professional. Video lessons, exercises, and community.",
    longDescription: "The most comprehensive course on becoming an AI-augmented professional. 12 modules covering everything from basic AI literacy to advanced automation, prompt engineering, and building AI-powered businesses. Includes video lessons, practical exercises, templates, and lifetime community access.",
    category: "courses",
    price: 97,
    originalPrice: 197,
    tag: "Flagship",
    features: ["12 in-depth modules", "40+ video lessons", "Practical exercises", "Downloadable templates", "Community access", "Lifetime updates", "Certificate of completion"],
    icon: "graduation-cap"
  },
  {
    id: "c2",
    slug: "local-business-ai-automation-course",
    title: "AI Automation for Local Businesses",
    description: "Step-by-step course teaching local business owners to automate 80% of their admin work.",
    longDescription: "Specifically designed for local business owners with zero technical background. This course walks you through automating scheduling, invoicing, customer follow-ups, review management, and marketing — using free or low-cost AI tools. Save 20+ hours per week.",
    category: "courses",
    price: 67,
    originalPrice: 147,
    tag: "For Business Owners",
    features: ["8 practical modules", "Screen-share tutorials", "Industry-specific examples", "No-code tools only", "Done-for-you templates", "Private support group"],
    icon: "building"
  },
  {
    id: "c3",
    slug: "prompt-engineering-certification",
    title: "Prompt Engineering Certification",
    description: "Become a certified prompt engineer. Advanced techniques, real projects, and a professional credential.",
    longDescription: "Go from casual AI user to certified prompt engineer. This intensive course covers advanced prompting techniques, multi-step workflows, API integration, and real-world project work. Complete the final project to earn your FutureDesk AI Prompt Engineering certification.",
    category: "courses",
    price: 149,
    originalPrice: 299,
    tag: "Certification",
    features: ["10 advanced modules", "Real-world projects", "API integration training", "Professional certification", "Portfolio building", "Job placement support"],
    icon: "award"
  }
];

export const categories: { id: ProductCategory; label: string; description: string }[] = [
  { id: "templates", label: "AI Templates", description: "Ready-to-use Notion, Canva & spreadsheet templates" },
  { id: "prompts", label: "Prompt Libraries", description: "Battle-tested prompt collections for every AI tool" },
  { id: "ebooks", label: "E-Books & Guides", description: "In-depth guides on AI strategy and implementation" },
  { id: "automation", label: "Local Business Automation", description: "Industry-specific automation packs for local businesses" },
  { id: "assets", label: "AI Asset Packs", description: "Premium AI-generated visuals and design assets" },
  { id: "courses", label: "Courses & Training", description: "Expert-led courses to master AI skills" }
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find(p => p.slug === slug);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return products.filter(p => p.category === category);
}
