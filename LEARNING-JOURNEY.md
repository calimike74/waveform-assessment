# Waveform Assessment App: Learning Journey

#teaching #music-technology #web-development #vibe-coding #next-js #vercel #supabase

This document chronicles the complete development journey of the Waveform Assessment App - from an existing React component to a fully deployed web application with database integration.

---

## Overview

**What We Built**: A live web application that tests students' ability to identify waveform shapes (sine, square, sawtooth, triangle) by ear, with all submissions saved to a database for teacher review.

**Final Result**: [waveform-assessment.vercel.app](https://waveform-assessment.vercel.app)

**Time Investment**: Approximately 2-3 hours of collaborative development

---

## Part 1: Understanding the Tech Stack

### The Modern Web Development Stack

Before writing any code, we established the technology foundation:

| Technology | Purpose | Why We Chose It |
|------------|---------|-----------------|
| **Next.js 15** | React framework | Handles routing, server rendering, and deployment optimization automatically |
| **Vercel** | Hosting platform | Created by Next.js team, offers free tier with instant deployments |
| **Supabase** | Database (PostgreSQL) | Free tier, easy setup, real-time capabilities, excellent documentation |
| **React 19** | UI library | Component-based architecture, already familiar from existing code |
| **Tailwind CSS** | Styling | Utility-first CSS that speeds up development significantly |

### Why This Stack?

This combination is often called the "modern indie stack" because:

1. **Zero upfront cost** - All services have generous free tiers
2. **Minimal configuration** - Sensible defaults that "just work"
3. **Production-ready** - Same infrastructure used by major companies
4. **Developer experience** - Fast feedback loops, excellent error messages

---

## Part 2: What is "Vibe Coding"?

### The Philosophy

"Vibe coding" is a development approach where you:

1. **Start with something that works** (even if imperfect)
2. **Iterate quickly** based on what you see
3. **Let AI handle boilerplate** while you focus on logic
4. **Ship early, improve often**

### Vibe Coding in Practice

Traditional approach:
```
Plan → Design → Implement → Test → Deploy → Wait weeks
```

Vibe coding approach:
```
Prototype → Deploy → See it live → Iterate → Improve → Minutes to hours
```

### Why It Works for This Project

We had an existing React component that worked locally. Rather than planning a perfect architecture, we:
- Got it deployed immediately
- Made it work in the browser
- Added features incrementally
- Fixed issues as they appeared

This is particularly effective for educational tools where the pedagogy matters more than the architecture.

---

## Part 3: Starting Point - The Existing Component

### What We Had

In the Professional folder, there was already a working React component:

```
Professional/Curriculum-Topics/1.3 Synthesis/03 - Teaching Materials/
└── Waveform-Assessment-Component/
    └── WaveformAssessment.jsx
```

This component:
- Generated audio for different waveform shapes using Web Audio API
- Displayed visual representations of waveforms
- Had a quiz interface with immediate feedback
- Tracked scores and cycles

### The Challenge

The component was designed for local/classroom use with:
- Hints visible to students
- Cycle counter (showing how many times they'd attempted)
- No data persistence
- No way to collect student submissions

---

## Part 4: Creating the Next.js Project

### Why Next.js?

Next.js wraps React with production-ready features:
- **File-based routing** - Create a file, get a route
- **Automatic optimization** - Images, fonts, and code splitting
- **API routes** - Backend functionality without a separate server
- **Built-in deployment** - Designed to work seamlessly with Vercel

### The Command

```bash
cd "/Users/mikelehnert/Library/Mobile Documents/iCloud~md~obsidian/Documents/Professional (AI)"
npx create-next-app@latest waveform-assessment
```

### Interactive Prompts

```
✔ Would you like to use TypeScript? No
✔ Would you like to use ESLint? Yes
✔ Would you like to use Tailwind CSS? Yes
✔ Would you like your code inside a `src/` directory? No
✔ Would you like to use App Router? Yes
✔ Would you like to use Turbopack for `next dev`? Yes
✔ Would you like to customize the import alias? No
```

**Why these choices?**
- **No TypeScript**: Simpler for learning, faster iteration
- **Yes Tailwind**: Rapid styling without separate CSS files
- **Yes App Router**: The modern Next.js standard
- **Yes Turbopack**: Faster development server

---

## Part 5: Understanding Project Structure

### The App Router Architecture

```
waveform-assessment/
├── app/
│   ├── layout.js      # Wraps ALL pages (shared UI, metadata)
│   ├── page.js        # The homepage (waveform-assessment.vercel.app/)
│   └── globals.css    # Global styles (Tailwind imports)
├── components/
│   └── WaveformAssessment.jsx  # Our main component
├── public/            # Static files (images, etc.)
├── package.json       # Dependencies and scripts
└── next.config.mjs    # Next.js configuration
```

### Key Insight: The 'use client' Directive

React components in Next.js 15 are **Server Components by default**. This means they:
- Render on the server
- Cannot use browser APIs (like Web Audio API)
- Cannot use React hooks (useState, useEffect)

Our waveform component needed all of these, so we added:

```javascript
'use client'

import { useState, useEffect, useRef } from 'react'
// ... rest of component
```

**Why this matters**: The `'use client'` directive tells Next.js "this component needs to run in the browser." It's a boundary marker that enables interactivity.

---

## Part 6: Integrating the Component

### Step 1: Create the Components Directory

```bash
mkdir components
```

### Step 2: Copy and Modify the Component

We copied `WaveformAssessment.jsx` to `components/` and added the client directive at the top.

### Step 3: Update the Homepage

```javascript
// app/page.js
import WaveformAssessment from '../components/WaveformAssessment'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <WaveformAssessment />
    </main>
  )
}
```

**Why the wrapper?** The `<main>` element with Tailwind classes ensures:
- Full viewport height (`min-h-screen`)
- Comfortable padding (`p-8`)
- Semantic HTML structure

---

## Part 7: Local Testing

### The Command

```bash
cd waveform-assessment
npm run dev
```

### What Happens

1. Next.js starts a development server (usually http://localhost:3000)
2. Turbopack watches for file changes
3. Hot Module Replacement (HMR) updates the browser instantly when you save
4. Error messages appear directly in the browser with helpful context

### Debugging Process

We encountered and fixed:
- Import path issues (components needed correct relative paths)
- Missing 'use client' directive (initially forgot it)
- Module resolution (ensuring Next.js could find our component)

**Learning moment**: Errors in development are learning opportunities. The Next.js error overlay provides stack traces and often suggests fixes.

---

## Part 8: Deploying to Vercel

### Step 1: Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: Waveform assessment app"
```

**Why Git first?** Vercel deploys from Git repositories. This also gives us version control and the ability to roll back changes.

### Step 2: Create GitHub Repository

```bash
gh repo create waveform-assessment --public --source=. --push
```

This command:
- Creates a new public repository on GitHub
- Sets the local folder as the source
- Pushes all code to GitHub

### Step 3: Connect to Vercel

```bash
npx vercel --prod
```

Or via the Vercel dashboard:
1. Import from GitHub
2. Select the repository
3. Vercel auto-detects Next.js settings
4. Click Deploy

### The Magic of Vercel + Next.js

Vercel understands Next.js projects and automatically:
- Builds the production bundle
- Optimizes assets
- Sets up CDN distribution
- Configures HTTPS
- Creates preview deployments for branches

**Result**: Live at `waveform-assessment.vercel.app` within minutes.

---

## Part 9: Making It Assessment-Ready

### The Problem

The original component was a learning tool with:
- Visible hints
- Cycle counter (students knew how many attempts)
- Practice mode mentality

For proper assessment, we needed to remove scaffolding.

### Changes Made

1. **Removed hint visibility** - Students must rely on ear training
2. **Removed cycle counter** - No indication of attempt number
3. **Streamlined UI** - Focus on the assessment task
4. **Added submission tracking** - Record what students answered

### The Pedagogical Reasoning

In assessment mode:
- **No hints** = Tests actual knowledge
- **No cycle count** = Reduces anxiety about "using up" attempts
- **Clean interface** = Minimizes distractions
- **Data collection** = Enables analysis and feedback

---

## Part 10: Adding Supabase for Data Persistence

### Why Supabase?

We needed to save student submissions. Options considered:

| Option | Pros | Cons |
|--------|------|------|
| Local Storage | Simple | Data stays on student device |
| Google Sheets | Familiar | Complex API setup |
| Firebase | Popular | Google ecosystem lock-in |
| **Supabase** | PostgreSQL, free tier, simple | Newer platform |

Supabase won because:
- Real PostgreSQL database (industry standard)
- Generous free tier (50,000 rows, 500MB)
- Simple JavaScript client
- No credit card required

### Step 1: Create Supabase Project

1. Visit [supabase.com](https://supabase.com)
2. Create new project
3. Note the project URL and anon key

### Step 2: Create the Database Table

In Supabase SQL Editor, we ran:

```sql
CREATE TABLE waveform_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  answers JSONB NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE waveform_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for student submissions)
CREATE POLICY "Allow anonymous inserts" ON waveform_submissions
  FOR INSERT WITH CHECK (true);

-- Allow authenticated reads (for teacher dashboard)
CREATE POLICY "Allow authenticated reads" ON waveform_submissions
  FOR SELECT USING (true);
```

**Understanding the Schema**:
- `id`: Unique identifier (UUID is better than sequential for distributed systems)
- `student_name`: Who submitted
- `answers`: JSONB stores the full answer data flexibly
- `score`, `total_questions`, `percentage`: Quick access to results
- `submitted_at`: Timestamp for ordering and analysis
- **Row Level Security**: Controls who can read/write data

### Step 3: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 4: Create Supabase Configuration

```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Why environment variables?**
- Keeps secrets out of code
- Different values for development vs production
- Security best practice

### Step 5: Add Environment Variables to Vercel

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Or via Vercel dashboard: Settings → Environment Variables

**The NEXT_PUBLIC_ prefix**: Variables starting with this are exposed to the browser. Without it, they're server-only.

### Step 6: Update Component to Save Submissions

Added submission logic to the component:

```javascript
const handleSubmit = async () => {
  const { data, error } = await supabase
    .from('waveform_submissions')
    .insert([{
      student_name: studentName,
      answers: answers,
      score: correctCount,
      total_questions: totalQuestions,
      percentage: (correctCount / totalQuestions) * 100
    }])

  if (error) {
    console.error('Submission error:', error)
  } else {
    setSubmitted(true)
  }
}
```

---

## Part 11: The Final Architecture

### Data Flow

```
Student Opens App
       ↓
Completes Assessment
       ↓
Clicks Submit
       ↓
Data → Supabase API → PostgreSQL Database
       ↓
Teacher Views in Supabase Dashboard (or future custom dashboard)
```

### Deployment Flow

```
Code Changes
     ↓
git push to GitHub
     ↓
Vercel Detects Push (webhook)
     ↓
Automatic Build & Deploy
     ↓
Live at waveform-assessment.vercel.app
```

### Technology Layers

```
┌─────────────────────────────────────┐
│           User Interface            │
│  (React Components + Tailwind CSS)  │
├─────────────────────────────────────┤
│           Application Layer         │
│        (Next.js App Router)         │
├─────────────────────────────────────┤
│           Data Layer                │
│    (Supabase Client + PostgreSQL)   │
├─────────────────────────────────────┤
│           Infrastructure            │
│   (Vercel CDN + Supabase Cloud)     │
└─────────────────────────────────────┘
```

---

## Part 12: Adding AI Marking with Claude Vision

### The Goal

Instead of manually marking each student's drawing, use AI to automatically:
- Count the cycles in the student's drawing
- Check if the waveform shape is correct
- Provide specific feedback
- Suggest a mark out of 10

### Why Claude Vision?

Claude's vision API can analyze images and understand what it "sees". For waveform drawings:
- It can count the number of complete cycles
- It can identify waveform shapes (sine, square, saw, triangle)
- It can compare the student's drawing against expected criteria

### Step 1: Install Anthropic SDK

```bash
npm install @anthropic-ai/sdk
```

### Step 2: Create API Route

Next.js API routes let us run server-side code. We created `/app/api/ai-mark/route.js`:

```javascript
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request) {
    const { submissionId } = await request.json();

    // Fetch submission from database
    // Calculate expected cycles based on challenge
    // Send image to Claude with marking prompt
    // Return structured feedback
}
```

**Why an API route?** The Anthropic API key must stay secret. API routes run on the server, so the key is never exposed to browsers.

### Step 3: Design the Marking Prompt

The prompt tells Claude exactly what to look for:

```
IMAGE CONTEXT:
- Dashed gray line: Original waveform (4 cycles sine)
- Solid blue line: Student's drawn answer

TASK:
Draw a sine wave that is 1 octave higher (should have 8 cycles)

MARKING CRITERIA (10 marks total):
- Cycle Count (4 marks): Correct number of cycles?
- Shape Accuracy (4 marks): Correct waveform shape?
- Drawing Quality (2 marks): Clear and consistent?
```

### Step 4: Parse Structured Response

We ask Claude to return JSON:

```json
{
  "cycleCount": {
    "detected": 8,
    "expected": 8,
    "correct": true,
    "marks": 4
  },
  "shapeAccuracy": {
    "detected": "sine",
    "expected": "sine",
    "correct": true,
    "marks": 4
  },
  "drawingQuality": {
    "marks": 2
  },
  "suggestedMark": 10,
  "overallFeedback": "Excellent work!",
  "strengths": ["Correct cycle count", "Clear waveform shape"],
  "improvements": []
}
```

### Step 5: Update Teacher Dashboard

Added to the modal view:
- "Get AI Feedback" button
- Loading state while analyzing
- Display of AI marks and feedback
- Color-coded mark badge (green/amber/red)
- Strengths and improvements lists

### Database Schema Update

Added columns for storing AI feedback:

```sql
ALTER TABLE submissions ADD COLUMN ai_feedback JSONB;
ALTER TABLE submissions ADD COLUMN ai_marked_at TIMESTAMPTZ;
ALTER TABLE submissions ADD COLUMN ai_mark INTEGER;
```

### Cost Considerations

Each Claude API call costs approximately $0.01-0.03 depending on image size. For a class of 30 students with 10 challenges each, that's roughly $3-9 per complete assessment cycle.

### Limitations and Future Improvements

**Current Limitations:**
- Vision models can struggle with precise cycle counting
- Hand-drawn wobbly lines create ambiguity
- AI confidence varies with drawing quality

---

## Part 13: Correct Answer Overlay and Comparison-Based Marking

### The Problem with Absolute Counting

Initial AI marking asked Claude to count cycles in the student's drawing from scratch. This had limitations:
- Hand-drawn wobbly lines create ambiguity
- Vision models can struggle with precise counting
- No visual reference for what "correct" looks like

### The Solution: Comparison-Based Marking

Instead of counting from scratch, we:
1. **Generate the mathematically correct waveform** programmatically
2. **Send both images to Claude** (student drawing + correct answer)
3. **Ask Claude to compare** rather than count absolutely

### Step 1: Correct Answer Generator

Added waveform shape functions to the teacher dashboard:

```javascript
const waveformShapes = {
    sine: (progress, cycles) => Math.sin(progress * cycles * 2 * Math.PI),
    square: (progress, cycles) => Math.sign(Math.sin(progress * cycles * 2 * Math.PI)),
    saw: (progress, cycles) => {
        const phase = (progress * cycles) % 1;
        return 2 * phase - 1;
    },
    triangle: (progress, cycles) => {
        const phase = (progress * cycles) % 1;
        return 4 * Math.abs(phase - 0.5) - 1;
    }
};
```

### Step 2: Canvas Rendering

Created a `generateCorrectAnswer` function that:
1. Creates an off-screen canvas (700x350 pixels)
2. Draws a grid background matching the assessment style
3. Renders the original waveform (dashed gray line)
4. Renders the correct answer (solid green line)
5. Adds labels showing cycle counts
6. Returns a base64-encoded PNG image

### Step 3: Side-by-Side Display

Updated the teacher dashboard modal to show both images:

```
┌─────────────────────┬─────────────────────┐
│  STUDENT'S DRAWING  │   CORRECT ANSWER    │
│  (blue border)      │   (green border)    │
├─────────────────────┼─────────────────────┤
│ Original: gray dash │ Original: gray dash │
│ Student: blue solid │ Correct: green solid│
└─────────────────────┴─────────────────────┘
```

### Step 4: Updated AI Prompt

When both images are available, the prompt changes:

```
You have TWO IMAGES to compare:
1. FIRST IMAGE (Student's Drawing): Shows the student's attempt (solid blue)
2. SECOND IMAGE (Correct Answer): Shows the CORRECT answer (solid green)

MARKING INSTRUCTIONS:
Compare the student's BLUE line in Image 1 with the CORRECT GREEN line
in Image 2. Mark based on how closely they match.
```

### Why This Works Better

| Aspect | Before (Absolute) | After (Comparison) |
|--------|-------------------|-------------------|
| Cycle Counting | Count from scratch | Compare to reference |
| Shape Detection | Identify by features | Match against ideal |
| Confidence | Medium | High |
| Feedback Quality | Generic | Specific comparison |

### Visual Feedback Benefits

Teachers can now see:
- Exactly what the student drew
- Exactly what they should have drawn
- How they differ at a glance

This makes manual review much faster even without AI marking.

### Implementation Files

| File | Changes |
|------|---------|
| `app/teacher/page.js` | Added waveformShapes, generateCorrectAnswer function, side-by-side UI |
| `app/api/ai-mark/route.js` | Accept correctAnswerImage, dual-image prompt, message content builder |

---

## Part 14: Key Learnings

### Technical Insights

1. **Server vs Client Components**: Understanding the boundary is crucial in modern React
2. **Environment Variables**: Essential for security and configuration management
3. **Database Design**: Even simple apps benefit from proper schema design
4. **Row Level Security**: Supabase's approach to data protection

### Process Insights

1. **Start with working code**: We didn't build from scratch
2. **Deploy early**: Seeing it live reveals real issues
3. **Iterate incrementally**: One feature at a time
4. **Let tools do their job**: Next.js, Vercel, and Supabase handle complexity

### Educational Application

This project demonstrates:
- How to transform classroom materials into web applications
- The workflow of modern web development
- Integration of multiple cloud services
- Assessment design principles (removing scaffolding)

---

## Next Steps and Future Improvements

### Completed
- [x] Create teacher dashboard for viewing submissions
- [x] Add AI marking with Claude Vision API
- [x] **Show correct answer overlay** - Generate ideal waveform and display alongside student drawing
- [x] **Improve AI accuracy** - Send both student drawing and correct answer for comparison marking

### Immediate Enhancements
- [ ] Add student authentication (optional login)
- [ ] Add more waveform types (pulse, noise)

### Advanced Features
- [ ] Batch marking - Mark all submissions at once
- [ ] Export results to CSV
- [ ] Real-time leaderboard
- [ ] Practice mode vs assessment mode toggle
- [ ] Detailed analytics on common mistakes

### Infrastructure
- [ ] Add error monitoring (Sentry)
- [ ] Set up automated testing
- [ ] Create staging environment

---

## Commands Reference

### Development
```bash
npm run dev          # Start development server
npm run build        # Create production build
npm run start        # Run production build locally
npm run lint         # Check code quality
```

### Git & Deployment
```bash
git add .
git commit -m "Description of changes"
git push             # Triggers Vercel deployment
```

### Vercel CLI
```bash
vercel               # Deploy preview
vercel --prod        # Deploy to production
vercel env add       # Add environment variable
vercel logs          # View deployment logs
```

---

## Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Related Files
- [[ARCHITECTURE.canvas]] - Visual diagram of the system
- [[README.md]] - Project overview
- Component source: `components/WaveformAssessment.jsx`

---

*Document created: January 2026*
*Last updated: January 2026*
