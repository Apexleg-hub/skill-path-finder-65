# Skill Catalyst Hub

Tech Training Course Catalog Website 

Overview

A modern, professional marketing website for a technology training provider. Students discover courses across multiple categories, view course details, and submit a registration/enrollment interest form. No online payment, no student login, no dashboard — registration is handled off-platform (call, WhatsApp, email, or manual follow-up), same pattern as dataschoolnigeria.com.ng and lagosdataschool.com.

Core user journey:

Discover → Browse Category → View Course → Register Interest → Get Contacted

1. Homepage

Hero Section

Headline: something like "Build the Technology Skills That Will Shape Your Career"

Subheadline: one line on practical, hands-on training across AI, Data, Development, Cybersecurity, Cloud, and more

Primary button: "Explore Courses"

Secondary button: "Register Now" (links to the registration form)

Why Train With Us

Short section, 3–4 value props. Common patterns from the reference sites: personalized/small-class training, project-based learning with real data, physical + live online delivery options, instructors who are working professionals.

Delivery Methods

Two cards: Physical Class (in-person at your training center) and Live Online (virtual, instructor-led). If you don't have a physical location yet, drop this section or list it as "Live Online" only for v1.

Course Categories (grid of cards, links to filtered course list)

Artificial Intelligence

Data Science & Analytics

Software Development

Cybersecurity

Cloud Computing

Database Management

Automation

(Add/remove categories to match what you actually teach — don't list categories with zero courses, it looks empty)

Featured / Top Courses

3–6 course cards pulled from your catalog, same card format as the full course grid (see below).

2. Course Catalog Page

Filter/Category Tabs

Horizontal tag list, click to filter the grid below (matches the pattern on lagosdataschool.com/courses):

All | AI | Data Science | Development | Cybersecurity | Cloud | Database | Automation

Course Grid

Each course card shows:

Thumbnail image

Course title

Category tag

Skill level (Beginner/Intermediate/Advanced) — optional, only if you consistently tag this

"Read More" / "View Course" button

Keep the card simple. No price, no rating, no student count on v1 — the reference sites don't show these either, and adding them means you have to maintain accurate numbers.

Search (optional for v1)

A simple client-side search box that filters the visible grid by title. Skip server-side search until the catalog is large enough to need it (50+ courses).

3. Course Detail Page

One page per course. Content sections:

Course title

Category

Hero image

Overview / description (what the course covers, who it's for)

What You Will Learn (bullet list of outcomes)

Curriculum (list or accordion of modules/topics)

Delivery format (Physical / Live Online / Both)

Duration

Prerequisites (if any)

CTA button: "Register for This Course" → registration form (either inline on the page or a shared registration page pre-filled with the course name)

Skip for v1: instructor bio block, reviews, pricing display, "seats available" — add these once you have real instructor profiles and consistent pricing to show.

4. Registration Form

Single shared form, reusable across the site (course pages link to it with the course name pre-selected).

Fields:

Full name

Email

Phone number

Course interested in (dropdown, pre-filled if coming from a course page)

Preferred delivery method (Physical / Live Online)

Message (optional)

Submit button: "Register Now" or "Submit"

On submit: show a confirmation message ("Thanks — we'll be in touch shortly"), send the submission to your email (or a simple database table you can view), and optionally trigger a WhatsApp/email auto-reply. No payment processing, no account creation.

5. About Page

Who you are / your story

Mission

Why train with you (repeat/expand on homepage value props)

Team or instructor highlights (optional, simple bios if you have them)

6. Contact Page

Contact form (name, email, subject, message)

Phone number(s)

Email address

Physical address(es), if applicable

Social media links

Optional: embedded map

7. Blog (optional, add when ready)

Simple list + detail page for articles. Good for SEO (both reference sites run one), but not required for launch — add once you're producing content regularly.

8. Navigation

Header: Home | Courses (dropdown by category) | About | Contact | [Register Now button]

Footer: Quick links (About, Courses, Contact), contact details, social links, copyright.

9. Design Requirements

Modern, clean, professional — the two reference sites are WordPress templates and look dated (cluttered mega-menus, inconsistent card styles, stock imagery). Aim for:

Clear typography hierarchy

Consistent course card design across homepage and catalog

Real or well-chosen course thumbnails, not generic clip art

Fast load (the reference sites are slow — heavy WordPress themes)

Fully responsive, mobile-first (most visitors will land from search or social on mobile)

10. Technical Stack (recommended)

Frontend: Next.js + TypeScript, Tailwind CSS

Content: courses can start as structured data (JSON/Markdown files or a simple headless CMS like Sanity/Notion-as-CMS) rather than a full database — you don't need PostgreSQL or a backend API for a v1 catalog + form site

Form handling: a lightweight form backend (e.g. Formspree, Resend, or a small serverless function) to email submissions and store them somewhere you can view (Google Sheet, Airtable, or a simple database table)

Hosting: Vercel (pairs naturally with Next.js)

This is deliberately lighter than a full marketplace stack — no auth, no payment integration, no student database needed until you decide to add self-service enrollment later.

11. Later (only if you outgrow the lead-gen model)

If you eventually want online payment and self-paced access, that's a separate, larger project (see the earlier marketplace spec). Signs you're ready for that: registration form volume is high enough that manual follow-up doesn't scale, and you want students to pay and get instant access without a phone call in between.

## Deployment

This project is a TanStack Start + React application that can be deployed to any Node.js hosting platform.

### Supported Platforms
- **Vercel** - Recommended for TanStack Start applications
- **Netlify** - Supports Node.js functions
- **AWS** - EC2, Lambda, or App Runner
- **Docker** - Containerizable with Dockerfile
- **Heroku** - Node.js buildpack support
- **Railway** - Simple git-based deployment

### Local Development
The application was originally built with Lovable but is now fully independent and portable. You can deploy this to any hosting provider.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
