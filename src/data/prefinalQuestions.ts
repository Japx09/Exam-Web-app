import {
  ActiveQuestion,
  ExamEssayPrompt,
  formatMultiPartEssayAnswer
} from '@/lib/examUtils'

export type UxAuditCategory = 'GOOD_UX' | 'AI_SLOP'

export interface DesignAuditSpecimen {
  id: string
  title: string
  context: string
  visualKey: 'slop_hero' | 'good_clinic' | 'slop_checkout' | 'good_medialab' | 'slop_bento'
  correctCategory: UxAuditCategory
  points: number
  rationale: string
}

export interface VisualPrincipleItem {
  id: string
  title: string
  visualKey: 'hierarchy' | 'accessibility' | 'whitespace' | 'vector' | 'feedback'
  question: string
  options: string[]
  answer: string
  points: number
}

export const prefinalMCQs: ActiveQuestion[] = [
  // MULTIMEDIA FOUNDATIONS & PRODUCTION (12 Questions — Lessons 1–5)
  {
    id: 1,
    topic: "Control Flow",
    question: "A campus museum kiosk lets visitors tap any artifact on an interactive floor map to inspect audio clips and timelines in any order, rather than watching a continuous reel. Which multimedia architecture applies?",
    options: [
      "Linear playback",
      "Non-linear flow",
      "Passive broadcast",
      "Sequential render"
    ],
    answer: "Non-linear flow"
  },
  {
    id: 2,
    topic: "Core Elements Synergy",
    question: "During playtesting of a 4K campus safety film, testers praise the cinematography but say the scene feels flat and fail to notice urgent warning moments. Which multimedia element needs rework?",
    options: [
      "Audio soundscapes",
      "Serif typography",
      "Raster grid depth",
      "Vector stroke size"
    ],
    answer: "Audio soundscapes"
  },
  {
    id: 3,
    topic: "Hardware Bottlenecks",
    question: "While editing a multi-camera event recap, your laptop handles timeline cuts smoothly until you open Photoshop and a browser concurrently, causing severe switching lag. Which upgrade targets this bottleneck?",
    options: [
      "Higher SSD capacity",
      "Larger monitor PPI",
      "More system RAM",
      "Studio condenser mic"
    ],
    answer: "More system RAM"
  },
  {
    id: 4,
    topic: "GPU vs CPU Roles",
    question: "A 3D thesis trailer stalls at 99% during heavy lighting and particle rendering even though opening project files from the drive is fast. Which hardware component is overloaded?",
    options: [
      "Dedicated GPU",
      "NVMe SSD drive",
      "System RAM pool",
      "Audio interface"
    ],
    answer: "Dedicated GPU"
  },
  {
    id: 5,
    topic: "Authoring Pipeline",
    question: "Your team finished retouching photos in Photoshop, mixing voiceovers in Audacity, and cutting clips in Premiere Pro. Which tool category combines these assets with clickable buttons into one app?",
    options: [
      "Audio sequencer",
      "Vector illustrator",
      "Authoring tool",
      "Non-linear editor"
    ],
    answer: "Authoring tool"
  },
  {
    id: 6,
    topic: "Typeface vs Font",
    question: "A design brief specifies Roboto across the portal, while the navigation bar strictly uses Roboto Bold at 16px and captions use Roboto Regular at 12px. What does 'Roboto Bold 16px' represent?",
    options: [
      "Typeface family",
      "Specific font",
      "Serif category",
      "Glyph kerning"
    ],
    answer: "Specific font"
  },
  {
    id: 7,
    topic: "Legibility vs Readability",
    question: "On a mobile quiz app, users easily tell uppercase 'I', lowercase 'l', and '1' apart, yet abandon reading passages because long lines and bright backgrounds strain their eyes. Which quality failed?",
    options: [
      "Glyph legibility",
      "Font licensing",
      "Text readability",
      "Typeface weight"
    ],
    answer: "Text readability"
  },
  {
    id: 8,
    topic: "Raster vs Vector",
    question: "A student org exports its crest from a web page and scales it to 4 meters wide for a gymnasium stage tarp, producing stair-stepped edges. Why did this scaling failure happen?",
    options: [
      "Vector paths blur above 72 PPI",
      "Raster grids blur when enlarged",
      "RGB light lowers print contrast",
      "Sans-serif letters stretch unevenly"
    ],
    answer: "Raster grids blur when enlarged"
  },
  {
    id: 9,
    topic: "Color & Print Specs",
    question: "Your event poster looks vibrant on an OLED phone display, but physical flyers printed from the exact same file look dark and muddy. What export setting mismatch caused this shift?",
    options: [
      "Used 60fps instead of 24fps",
      "Used RGB instead of CMYK",
      "Used SVG instead of JPEG",
      "Used 300 DPI instead of 72 PPI"
    ],
    answer: "Used RGB instead of CMYK"
  },
  {
    id: 10,
    topic: "Image Format Trade-offs",
    question: "You need an app icon with crisp curved edges and a transparent background that scales cleanly across watch, phone, and desktop screens at the smallest file size. Which format fits best?",
    options: [
      "Lossy .JPEG file",
      "Flattened .BMP file",
      "Scalable .SVG file",
      "High-DPI .RAW file"
    ],
    answer: "Scalable .SVG file"
  },
  {
    id: 11,
    topic: "Audio Digitization",
    question: "During podcast recording, air pressure waves strike a studio condenser microphone, which converts physical vibrations into electrical data sampled 44,100 times per second. What role does the mic perform?",
    options: [
      "Sample bit depth",
      "Analog transducer",
      "Timeline sequencer",
      "NLE color grader"
    ],
    answer: "Analog transducer"
  },
  {
    id: 12,
    topic: "Video NLE & Sync",
    question: "A film crew snaps a clapperboard before shooting a dialogue scene, even though both camera and external recorder capture crisp tracks. Why does the editor rely on that snap?",
    options: [
      "Boosts camera frame rate to 60fps",
      "Balances warm and cool color grading",
      "Aligns audio spikes with visual frames",
      "Compresses 4K footage for web export"
    ],
    answer: "Aligns audio spikes with visual frames"
  },

  // UX ENGINEERING & WORKSHOPS (12 Questions — UX Lessons & Case Studies)
  {
    id: 13,
    topic: "UX Scope",
    question: "A student registration site uses modern colors and rounded buttons, yet applicants leave unsure whether their slot was saved and cannot fix typos afterward. What core UX goal failed?",
    options: [
      "Visual polish and drop shadow styling",
      "End-to-end completion and user assurance",
      "Typography scale and decorative accents",
      "High-resolution raster background graphics"
    ],
    answer: "End-to-end completion and user assurance"
  },
  {
    id: 14,
    topic: "Surface vs Structure",
    question: "Before finalizing a campus clearance form, a team cuts 'Home Street Address' and 'Guardian Occupation' so students can submit in 20 seconds on mobile. Which layer did they improve?",
    options: [
      "UI surface styling",
      "UX structural flow",
      "Color contrast ratio",
      "Icon anti-aliasing"
    ],
    answer: "UX structural flow"
  },
  {
    id: 15,
    topic: "Quiet Care",
    question: "A scholarship portal preserves every typed field locally when a student's 3G signal drops mid-submission, letting them continue after reconnecting. Which UX principle does this demonstrate?",
    options: [
      "Visual scale",
      "Safe pricing",
      "Quiet care",
      "Mockup grid"
    ],
    answer: "Quiet care"
  },
  {
    id: 16,
    topic: "System Feedback",
    question: "Students tap 'Submit Enrollment' repeatedly because the screen freezes for 8 seconds after the first tap, creating duplicate database entries. Which interface fix prevents this behavior?",
    options: [
      "Enlarge the primary submit label",
      "Show immediate loading feedback",
      "Move the button above the banner",
      "Add an extra confirmation field"
    ],
    answer: "Show immediate loading feedback"
  },
  {
    id: 17,
    topic: "Actionable Microcopy",
    question: "When a student types an invalid campus address, a popup reads 'Error 422: Validation Failed'. Which microcopy revision best helps the student recover without guessing?",
    options: [
      "Submission rejected by policy.",
      "Enter a valid .edu.ph email.",
      "Fatal input error code #422.",
      "Invalid text format detected."
    ],
    answer: "Enter a valid .edu.ph email."
  },
  {
    id: 18,
    topic: "Accessible Indicators",
    question: "A clinic form marks mandatory inputs solely with a thin red border, causing colorblind users to miss required fields and hit repeated submit errors. Which fix solves this reliably?",
    options: [
      "Switch the border to bright green",
      "Double the red border pixel width",
      "Add an asterisk and Required text",
      "Animate the border on mouse hover"
    ],
    answer: "Add an asterisk and Required text"
  },
  {
    id: 19,
    topic: "Visual Hierarchy",
    question: "On a mobile ticket page, event title, remaining slot count, and date compete at identical 14px gray text while the footer logo dominates the screen. What UX principle is broken?",
    options: [
      "Visual hierarchy",
      "Lossless format",
      "Audio frame sync",
      "Vector precision"
    ],
    answer: "Visual hierarchy"
  },
  {
    id: 20,
    topic: "Honest Choices",
    question: "A campus shuttle booking app advertises a PHP 30 ride on Screen 1, then quietly adds a mandatory PHP 15 terminal fee only on the final confirmation tap. What standard does this break?",
    options: [
      "Colorblind accessibility",
      "Upfront honest pricing",
      "Low-fidelity wireframing",
      "Anti-aliased typography"
    ],
    answer: "Upfront honest pricing"
  },
  {
    id: 21,
    topic: "UX Blueprint Order",
    question: "After interviewing students about dorm registration pain points and mapping a 4-step user flow, a teammate wants to pick brand gradients immediately. What blueprint step comes first?",
    options: [
      "Final visual polishing",
      "Low-fidelity wireframing",
      "Production deployment",
      "Audio narration mixing"
    ],
    answer: "Low-fidelity wireframing"
  },
  {
    id: 22,
    topic: "Silent Usability Testing",
    question: "During a 4-minute peer test of your paper wireframe, a classmate pauses for 20 seconds and hovers over the wrong tab. What is the correct facilitator response?",
    options: [
      "Point directly to the intended tab",
      "Ask if they like the layout style",
      "Observe silently and note pauses",
      "Explain the full screen flow aloud"
    ],
    answer: "Observe silently and note pauses"
  },
  {
    id: 23,
    topic: "Community Constraints",
    question: "Nanay Elena checks a Barangay clinic web app on prepaid data to verify whether Losartan is available before paying tricycle fare. What must Screen 01 display upfront?",
    options: [
      "PhilHealth PDF upload and password setup",
      "Clinic history and barangay official directory",
      "Live medicine stock and doctor schedule",
      "Clinical dosage terms and audit logs"
    ],
    answer: "Live medicine stock and doctor schedule"
  },
  {
    id: 24,
    topic: "High-Urgency Mobile UX",
    question: "Leo orders lunch with one thumb in a crowded hallway on a strict PHP 100 budget, while Jules reserves lab gear with 10 minutes before filming. What shared flaw breaks both flows?",
    options: [
      "Using clean sans-serif button labels",
      "Hiding availability until final submit",
      "Displaying pickup counter numbers early",
      "Showing total fees before checkout"
    ],
    answer: "Hiding availability until final submit"
  },

  // AI ETIQUETTE, PROMPTING & GOOGLE WORKSPACE (6 Questions — Work Smarter. Communicate Better.)
  {
    id: 25,
    topic: "Clear Communication",
    question: "A committee lead emails a department chair: 'Sir, regarding next week's seminar, please advise.' Why does this message slow down faculty approval?",
    options: [
      "It lacks decorative header graphics",
      "It omits purpose, details, and request",
      "It uses a formal sans-serif typeface",
      "It attaches a Google Calendar link"
    ],
    answer: "It omits purpose, details, and request"
  },
  {
    id: 26,
    topic: "AI Briefing Structure",
    question: "Contrast 'Act as a professional writer' with a brief specifying recipient, confirmed room, respectful tone, no invented facts, and 3 short paragraphs. Which framework completes that brief?",
    options: [
      "Goal, Context, Constraints, Format",
      "Sketch, Wireframe, Prototype, Test",
      "Input, Processor, Storage, Output",
      "Text, Graphics, Audio, Animation"
    ],
    answer: "Goal, Context, Constraints, Format"
  },
  {
    id: 27,
    topic: "Fact-Checking AI Output",
    question: "An AI draft to Prof. Reyes reads smoothly and politely, yet inserts 'Main Auditorium' and 'free lunch provided' even though neither was confirmed. Which rule applies here?",
    options: [
      "Fluent tone ensures verified accuracy",
      "Polite drafts bypass fact checking",
      "Confident wording can still hallucinate",
      "Detailed prompts eliminate manual review"
    ],
    answer: "Confident wording can still hallucinate"
  },
  {
    id: 28,
    topic: "Chat vs Agents",
    question: "An AI agent gathers RSVP totals from Sheets and drafts a faculty permit email in Docs before sending. Which safeguard must stay in place prior to dispatching the Gmail message?",
    options: [
      "Human review gate",
      "Model retraining loop",
      "Auto-send override",
      "Lossy text compression"
    ],
    answer: "Human review gate"
  },
  {
    id: 29,
    topic: "Prompts vs Reusable Skills",
    question: "Your student org copies the exact same audience rules, concise tone, and bracketed-gap instructions before every club announcement prompt. What workflow upgrade removes this repetition?",
    options: [
      "Retrain the base model",
      "Build a reusable skill",
      "Send drafts via mobile",
      "Drop tone restrictions"
    ],
    answer: "Build a reusable skill"
  },
  {
    id: 30,
    topic: "Connected Workspace",
    question: "In the connected Google Workspace event workflow, once Google Forms collects student sign-ups and Sheets organizes responses, what stage bridges Docs drafting and Gmail dispatch?",
    options: [
      "Auto calendar sync",
      "Human review gate",
      "Direct form purge",
      "Raw agent dispatch"
    ],
    answer: "Human review gate"
  }
]

export const prefinalAuditSpecimens: DesignAuditSpecimen[] = [
  {
    id: "audit_1",
    title: "Tech Week Event Banner",
    context: "Student org landing hero section",
    visualKey: "slop_hero",
    correctCategory: "AI_SLOP",
    points: 1,
    rationale: "Uses neon purple-cyan gradient text, sparkle hype copy, glowing blur blobs, and a vague 'Proceed' CTA."
  },
  {
    id: "audit_2",
    title: "Barangay Clinic Queue Card",
    context: "Community health booking screen",
    visualKey: "good_clinic",
    correctCategory: "GOOD_UX",
    points: 1,
    rationale: "Shows live doctor/medicine stock upfront, uses '* Required' text labels, saves drafts, and promises SMS confirmation."
  },
  {
    id: "audit_3",
    title: "Campus Shuttle Checkout",
    context: "Mobile fare confirmation popup",
    visualKey: "slop_checkout",
    correctCategory: "AI_SLOP",
    points: 1,
    rationale: "Hides a mandatory PHP 15 fee in fine print, relies on a red-only error border with 'Error 422', and uses twin glowing buttons."
  },
  {
    id: "audit_4",
    title: "Media Lab Gear Reserve",
    context: "Quick equipment checkout form",
    visualKey: "good_medialab",
    correctCategory: "GOOD_UX",
    points: 1,
    rationale: "Displays live gear counts, cuts clutter down to 2 required fields, and confirms submission with clear processing feedback."
  },
  {
    id: "audit_5",
    title: "Portal Features Grid",
    context: "Three-column homepage cards",
    visualKey: "slop_bento",
    correctCategory: "AI_SLOP",
    points: 1,
    rationale: "Repeats identical emoji-headed icon cards, decorative '01 //' kickers, and generic buzzwords without real user clarity."
  }
]

export const prefinalVisualPrinciples: VisualPrincipleItem[] = [
  {
    id: "vp_1",
    title: "Visual Specimen 1",
    visualKey: "hierarchy",
    question: "Inspect the visual screen above. Which core design principle gives the user an immediate reading path from title to action?",
    options: [
      "Visual hierarchy",
      "Audio sampling",
      "Lossy compression",
      "CMYK calibration"
    ],
    answer: "Visual hierarchy",
    points: 1
  },
  {
    id: "vp_2",
    title: "Visual Specimen 2",
    visualKey: "accessibility",
    question: "Inspect the comparison above. Which design principle requires pairing color cues with an asterisk and text label?",
    options: [
      "Accessibility",
      "Anti-aliasing",
      "Color grading",
      "Frame syncing"
    ],
    answer: "Accessibility",
    points: 1
  },
  {
    id: "vp_3",
    title: "Visual Specimen 3",
    visualKey: "whitespace",
    question: "Inspect the form layout difference above. Which principle uses breathing room and tighter inner spacing to organize related inputs?",
    options: [
      "Whitespace & grouping",
      "CMYK ink subtraction",
      "Audio waveform sync",
      "Additive light mix"
    ],
    answer: "Whitespace & grouping",
    points: 1
  },
  {
    id: "vp_4",
    title: "Visual Specimen 4",
    visualKey: "vector",
    question: "Inspect the 400% zoom preview above. Which technical multimedia principle explains why the SVG crest stays razor-sharp at any scale?",
    options: [
      "Vector scalability",
      "Quiet care design",
      "Silent peer tests",
      "Subtle microcopy"
    ],
    answer: "Vector scalability",
    points: 1
  },
  {
    id: "vp_5",
    title: "Visual Specimen 5",
    visualKey: "feedback",
    question: "Inspect the upload sequence above. Which UX principle stops anxious users from tapping 'Submit' repeatedly during a slow upload?",
    options: [
      "System feedback",
      "Serif typography",
      "Hard offset drop",
      "Lossless bitmap"
    ],
    answer: "System feedback",
    points: 1
  }
]

export const prefinalEssays: ExamEssayPrompt[] = [
  {
    id: "pf_essay_1_ai_slop",
    title: "Essay 1: Identifying & Fixing AI Slop UI (5 Points)",
    points: 5,
    scenario:
      "A student generates a campus event website by typing 'Build a cool modern site' into an AI tool. The screen ships with purple-to-cyan gradient text, glowing neon borders, sparkle emojis in every card title, identical 3-column filler cards, red-only error borders, and a generic 'Proceed' button that crashes on slow Wi-Fi.",
    instructions: [
      "1. Spot the AI Slop (2.5 pts): Explain what 'AI Slop UI' means in web design and identify three specific slop tells in this scenario that hurt visual clarity, contrast, or usability.",
      "2. Replace with Design Craft (2.5 pts): Describe concrete UI/UX fixes to turn that screen into deliberate, human-centered craft (restrained color & typography, whitespace/hierarchy, accessible labels, clear microcopy, and state recovery)."
    ],
    rubric: [
      "2.5 pts: Clearly defines AI Slop UI and pinpoints 3 concrete visual/UX flaws from the scenario.",
      "2.5 pts: Proposes disciplined fixes covering restrained palette/type, hierarchy/whitespace, accessibility, and clear microcopy/recovery."
    ]
  },
  {
    id: "pf_essay_2_design_workflow",
    title: "Essay 2: The Better Website Design Workflow (Human + AI) (5 Points)",
    points: 5,
    scenario:
      "Many students prompt AI once, copy-paste the generated UI straight into production without wireframing or testing, and wonder why users hesitate or trust broken pages. Your team wants a professional workflow that uses AI as a collaborator while keeping high UX and engineering standards.",
    instructions: [
      "1. End-to-End Design Workflow (3 pts): Trace the disciplined step-by-step workflow to build better websites: User Discovery & Flow → Low-Fidelity Wireframes → Structured AI Brief (Goal + Context + Constraints + Format & Reusable Standards/Skills) → Browser Critique & Silent Usability Testing.",
      "2. Human Judgment & Verification (2 pts): Explain why skipping wireframes/discovery or trusting AI's first confident output produces slop, and how human review + testing before shipping guarantees real quality."
    ],
    rubric: [
      "3 pts: Maps a coherent workflow from User Discovery/Flow and Wireframes through Structured AI Briefing/Reusable Standards to Testing & Polish.",
      "2 pts: Explains why human judgment, fact-checking, and real browser/user testing prevent AI slop."
    ]
  }
]

export const prefinalCombinedEssayPromptForAI = `
Evaluate the student's TWO Pre-Final College-Level Essays (Total: 10 Points = 5 Points for Essay 1 + 5 Points for Essay 2):

=== ESSAY 1: Identifying & Fixing AI Slop UI (5 Points) ===
Scenario: Student generates a site with "Build a cool modern site" -> purple-cyan gradient text, glowing neon borders, sparkle emojis, identical 3-card filler grids, red-only error borders, vague "Proceed" CTA.
Expected Elements (5 pts):
- 2.5 pts: Explains what AI Slop UI is and identifies 3 specific slop tells (decorative glows/gradients, emoji clutter, vague microcopy, poor accessibility/hierarchy).
- 2.5 pts: Concrete craft fixes (restrained neutral palette + single purposeful accent, clear Sans-Serif typography & whitespace, non-color accessibility labels, honest/clear microcopy, and recovery feedback).

=== ESSAY 2: The Better Website Design Workflow (Human + AI) (5 Points) ===
Scenario: Replacing one-shot AI copy-paste with a repeatable professional website design workflow.
Expected Elements (5 pts):
- 3 pts: Traces a complete workflow: User Discovery & User Flow -> Low-Fidelity Wireframes -> Structured AI Brief (Goal + Context + Constraints + Format & Reusable Design Skills/Tokens) -> Visual Critique & Silent Peer Usability Testing.
- 2 pts: Explains why human judgment, verification ("confident doesn't always mean correct"), and real user/browser checks prevent AI slop.
`

export function scorePrefinalDesignAudit(
  classifications: Record<string, UxAuditCategory>,
  principleAnswers: Record<string, string>
): number {
  let score = 0
  for (const spec of prefinalAuditSpecimens) {
    if (classifications[spec.id] === spec.correctCategory) {
      score += spec.points
    }
  }
  for (const vp of prefinalVisualPrinciples) {
    if (principleAnswers[vp.id] === vp.answer) {
      score += vp.points
    }
  }
  return score
}

export function formatPrefinalEssayAnswer(
  part1McqScore: number,
  part2AuditScore: number,
  essay1: string,
  essay2: string,
  email?: string
): string {
  return formatMultiPartEssayAnswer(
    'PREFINAL',
    part1McqScore,
    part2AuditScore,
    essay1,
    essay2,
    email,
    [
      'ESSAY 1: Identifying & Fixing AI Slop UI',
      'ESSAY 2: The Better Website Design Workflow (Human + AI)'
    ]
  )
}
