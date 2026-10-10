## Updated GitHub Copilot Prompt: Fix Mobile Navigation and Implement Collapsible Course Dropdown

**Role:** Act as a senior full-stack software engineer and UI/UX designer specializing in React, TypeScript, TanStack Start, Tailwind CSS, responsive design, and web accessibility.

### Project Context

Website: Corepoint Tech Academy  
Technology Stack: React, TypeScript, TanStack Start, Tailwind CSS  
Deployment: Vercel

### Problem

The current mobile navigation menu has two major issues:

1. **Missing Blog Page:** The Blog navigation link is not appearing in the mobile menu.
2. **Poor Mobile Navigation Experience:** The All Courses section displays numerous course categories by default, making the navigation unnecessarily long and forcing users to scroll.

### Task 1: Fix the Missing Blog Navigation

1. Inspect the existing desktop and mobile navigation components.
2. Identify why the Blog link is missing from the mobile menu.
3. Add the Blog link immediately after All Courses.
4. Ensure it connects to the existing Blog route.
5. Do not create a duplicate Blog page.
6. Ensure the Blog link works correctly on desktop, tablets, and mobile devices.
7. Use a shared navigation configuration where appropriate to keep desktop and mobile menus synchronized.

### Task 2: Convert All Courses Into a Collapsible Dropdown

Redesign the mobile navigation so that **All Courses becomes an expandable and collapsible dropdown menu**.

**Expected behaviour:**

- All Courses should be collapsed by default.
- Display a downward chevron icon beside All Courses.
- When a user taps All Courses, smoothly expand the dropdown to reveal the course categories.
- When tapped again, collapse the dropdown.
- Rotate the chevron icon to indicate the expanded or collapsed state.
- Ensure every course category remains clickable.
- Clicking a course should navigate to its existing page and close the mobile navigation.
- Use smooth animations without negatively affecting performance.
- Ensure the dropdown works correctly on Android, iOS, and tablets.

**Existing course categories to preserve:**

1. Artificial Intelligence
2. Machine Learning
3. Data Science
4. Data Analysis
5. Project Management
6. Software Development
7. Cybersecurity
8. Cloud Computing
9. Database Management
10. AI Automation

Preserve any additional courses already configured in the application.

Do not remove, rename, or break existing course routes.

### Task 3: Improve the Mobile Navigation UI/UX

Implement the following navigation structure:

```text
┌────────────────────────────────┐
│                                │
│  COREPOINT TECH            ✕   │
│                                │
├────────────────────────────────┤
│                                │
│  🏠 Home                       │
│                                │
│  📚 All Courses             ▼  │
│                                │
│  📝 Blog                       │
│                                │
│  ℹ️ About                      │
│                                │
│  📞 Contact                    │
│                                │
│  💳 Payment Plans              │
│                                │
│  ┌──────────────────────────┐  │
│  │       Register Now       │  │
│  └──────────────────────────┘  │
│                                │
└────────────────────────────────┘
```

When All Courses is expanded:

```text
📚 All Courses                 ▲
    │
    ├── Artificial Intelligence
    ├── Machine Learning
    ├── Data Science
    ├── Data Analysis
    ├── Project Management
    ├── Software Development
    ├── Cybersecurity
    ├── Cloud Computing
    ├── Database Management
    └── AI Automation
```

### Task 4: Preserve Corepoint Tech Branding

Maintain the existing website's visual identity.

- Preserve the Corepoint Tech logo.
- Maintain existing brand colours.
- Use consistent typography.
- Ensure appropriate spacing between navigation items.
- Keep the Register Now button prominent.
- Use subtle hover and active states.
- Highlight the currently active page.
- Ensure the navigation remains visually professional.

### Task 5: Accessibility and Responsive Behaviour

Implement the following:

1. Use semantic HTML elements.
2. Add `aria-expanded` to the collapsible dropdown trigger.
3. Add `aria-controls` to associate the trigger with its submenu.
4. Ensure keyboard accessibility.
5. Maintain sufficient contrast between text and backgrounds.
6. Support reduced-motion preferences.
7. Prevent background scrolling while the mobile menu is open.
8. Allow users to close the menu using the close button or Escape key.
9. Ensure the menu remains usable on smaller mobile screens.
10. Make the navigation content scrollable when it exceeds the available viewport height.

### Task 6: Testing and Validation

After implementation:

- Verify that Blog appears in the mobile navigation.
- Verify that Blog opens the correct page.
- Verify that All Courses expands and collapses correctly.
- Verify that all existing course links work.
- Verify that clicking a navigation link closes the mobile menu.
- Test on mobile, tablet, and desktop viewport sizes.
- Check for TypeScript errors.
- Run the existing test suite.
- Run the production build.
- Ensure the changes are compatible with Vercel deployment.

### Important Development Instructions

**Before writing code:**

Inspect the existing project structure, navigation components, routing configuration, and styling conventions.

Reuse existing components and dependencies whenever possible.

Do not introduce unnecessary libraries.

Do not modify unrelated functionality.

Do not redesign the entire website.

**Expected Deliverables:**

1. A functioning mobile navigation menu.
2. A visible and functional Blog navigation link.
3. A collapsible All Courses dropdown.
4. Improved mobile responsiveness.
5. A summary of modified files.
6. Confirmation of tests and build results.

**Final objective:** Create a clean, modern, accessible, and user-friendly mobile navigation experience for Corepoint Tech Academy while preserving the existing desktop navigation and website functionality.