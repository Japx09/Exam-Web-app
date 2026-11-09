export interface MidtermMCQ {
  id: number
  topic: string
  question: string
  options: string[]
  answer: string
}

export interface DraggableUIElement {
  id: string
  code: string
  uiType: 'badge' | 'textbox' | 'button' | 'card'
  label: string
  subtext?: string
  placeholder?: string
}

export interface WireframeDropZone {
  slotId: string
  slotNumber: number
  slotLabel: string
  correctElementId: string
  points: number
}

export interface WireframeDndChallenge {
  id: string
  title: string
  scenario: string
  points: number
  draggableElements: DraggableUIElement[]
  dropZones: WireframeDropZone[]
}

export interface MidtermEssayPrompt {
  id: string
  title: string
  points: number
  scenario: string
  instructions: string[]
  rubric: string[]
}

export const midtermMCQs: MidtermMCQ[] = [
  {
    id: 1,
    topic: "User Goals",
    question: "A user opens a food delivery app because they are hungry and in a rush. They get stuck on a mandatory, unskippable survey about their favorite colors. What UX principle is being ignored?",
    options: [
      "Starting with the person's goal.",
      "Providing a clear visual hierarchy.",
      "Using readable typography.",
      "Designing for accessibility."
    ],
    answer: "Starting with the person's goal."
  },
  {
    id: 2,
    topic: "Quiet Care",
    question: "Mika is filling out a long registration form. Her internet suddenly disconnects. When she reconnects, all her typed answers are still there. What aspect of UX does this demonstrate?",
    options: [
      "High-quality UI styling.",
      "A recoverable mistake / saved progress.",
      "Clear and helpful microcopy.",
      "Honest choices."
    ],
    answer: "A recoverable mistake / saved progress."
  },
  {
    id: 3,
    topic: "UI vs. UX",
    question: "You design a \"Register\" button that has a beautiful gradient and a perfect drop shadow. However, when users click it, nothing happens and they don't know if their registration went through. Which statement is true?",
    options: [
      "The UI is failing, but the UX is good.",
      "The UI looks good, but the UX is failing.",
      "Both UI and UX are perfect.",
      "Both UI and UX are failing visually."
    ],
    answer: "The UI looks good, but the UX is failing."
  },
  {
    id: 4,
    topic: "System Feedback",
    question: "A student taps \"Submit\" on a project upload. The screen stays exactly the same for 10 seconds. Unsure, they tap \"Submit\" five more times, causing an error. How could the designer have prevented this?",
    options: [
      "By making the button larger.",
      "By changing the button color to red.",
      "By showing a \"Processing\" animation immediately after the first tap.",
      "By adding a required home address field."
    ],
    answer: "By showing a \"Processing\" animation immediately after the first tap."
  },
  {
    id: 5,
    topic: "Microcopy",
    question: "A user enters the wrong password. The system displays a popup saying: \"Invalid Input. Process Terminated.\" How should you rewrite this to improve the UX?",
    options: [
      "\"Error 404: Input invalid.\"",
      "\"Incorrect password. Please try again or click 'Forgot Password'.\"",
      "\"You made a mistake. Try again.\"",
      "\"Fatal Error.\""
    ],
    answer: "\"Incorrect password. Please try again or click 'Forgot Password'.\""
  },
  {
    id: 6,
    topic: "Accessibility",
    question: "You design an app that highlights mandatory form fields with only a thin red border. A user with colorblindness cannot tell which fields are required. How should you fix this?",
    options: [
      "Change the red border to a green border.",
      "Make the border slightly thicker.",
      "Add an asterisk (*) and a text label saying \"Required\".",
      "Remove the mandatory fields entirely."
    ],
    answer: "Add an asterisk (*) and a text label saying \"Required\"."
  },
  {
    id: 7,
    topic: "Visual Hierarchy",
    question: "You are designing a page for a concert. You make the artist's name massive, the date medium-sized, and the \"Buy Tickets\" button bright and prominent. What principle are you applying?",
    options: [
      "Usability testing.",
      "Honest choices.",
      "Visual hierarchy.",
      "Wireframing."
    ],
    answer: "Visual hierarchy."
  },
  {
    id: 8,
    topic: "Honest Choices",
    question: "An airline booking app hides a mandatory PHP 500 baggage fee until the very last checkout screen, hoping users will just pay it because they are already tired. What UX concept is being violated?",
    options: [
      "Giving attention a clear path.",
      "Making important choices honestly.",
      "Creating a user flow.",
      "Using accessible colors."
    ],
    answer: "Making important choices honestly."
  },
  {
    id: 9,
    topic: "Usability Testing",
    question: "You give your prototype to a friend and say, \"Register for the event.\" Your friend stares at the screen for a minute, looking confused. What should you do next?",
    options: [
      "Point to the button and say, \"Click that one.\"",
      "Tell them they are doing it wrong.",
      "Observe their hesitation silently and ask what they expected to happen.",
      "Redesign the entire app immediately."
    ],
    answer: "Observe their hesitation silently and ask what they expected to happen."
  },
  {
    id: 10,
    topic: "Methodology",
    question: "To help Mika register, you map out the steps she needs to take: Find Event → Check Details → Click Register → View Confirmation. What is this step-by-step path called?",
    options: [
      "A wireframe.",
      "A user flow.",
      "A usability test.",
      "A microcopy."
    ],
    answer: "A user flow."
  },
  {
    id: 11,
    topic: "Architecture",
    question: "During a design critique, your teammate suggests removing the \"Home Address\" and \"Mother's Maiden Name\" fields from a quick campus event registration form. Does this change belong to the Surface (UI) or the Structure (UX)?",
    options: [
      "Surface (UI), because it changes the colors of the screen.",
      "Structure (UX), because it improves clarity by removing unnecessary form fields.",
      "Surface (UI), because it adjusts the font contrast.",
      "Neither, because form fields are purely backend database tasks."
    ],
    answer: "Structure (UX), because it improves clarity by removing unnecessary form fields."
  },
  {
    id: 12,
    topic: "The Blueprint",
    question: "Your team has just finished interviewing students about their frustrations with the school library app (Discover) and mapped out the 4 steps to borrow a book (Map Flow). According to the 5-step UX Blueprint, what should you do next before creating a clickable prototype?",
    options: [
      "Launch the app to the public immediately.",
      "Sketch low-fidelity wireframes using simple boxes and clear hierarchy.",
      "Choose the final brand colors and custom illustrations.",
      "Write a 200-word essay about the library."
    ],
    answer: "Sketch low-fidelity wireframes using simple boxes and clear hierarchy."
  },
  {
    id: 13,
    topic: "Barangay Clinic Challenge",
    question: "Nanay Elena (64) forgot her reading glasses and is using a budget phone on PHP 10 mobile data. When she opens the Barangay Health Center portal, she sees \"Antihypertensive Allocation: 0\" in tiny gray text. Which two flaws from the UX Audit are hurting her experience here?",
    options: [
      "Account Wall and No Offline Pass.",
      "Medical Jargon and poor readability/accessibility.",
      "Hidden Prices and Late Sold-Out Alert.",
      "Confusing Serial Codes and Unnecessary Essay Fields."
    ],
    answer: "Medical Jargon and poor readability/accessibility."
  },
  {
    id: 14,
    topic: "Barangay Clinic Challenge",
    question: "To prevent Nanay Elena from wasting PHP 60 on a tricycle ride in the rain when the doctor is out or Losartan is out of stock, what must appear on Screen 01 (Clinic Status) of your paper prototype?",
    options: [
      "A 12-digit password creation form and PhilHealth ID uploader.",
      "The barangay captain's biography and clinic history.",
      "Doctor schedule, live medicine stock, and remaining queue slots upfront.",
      "A link to download a 50MB PDF medical manual."
    ],
    answer: "Doctor schedule, live medicine stock, and remaining queue slots upfront."
  },
  {
    id: 15,
    topic: "Barangay Clinic Microcopy",
    question: "In the Barangay Portal, the button to get a slot is currently labeled \"Initialize Requisition\". Which replacement microcopy best serves a 64-year-old community member?",
    options: [
      "\"Execute Queue Protocol\"",
      "\"Get Morning Queue Number\"",
      "\"Submit Database Entry\"",
      "\"Proceed\""
    ],
    answer: "\"Get Morning Queue Number\""
  },
  {
    id: 16,
    topic: "Barangay Clinic Offline Recovery",
    question: "During peer testing of the Barangay Clinic app, a classmate asks: \"What happens if Nanay Elena's PHP 10 mobile data runs out before she reaches the health center?\" What is the best UX solution for Screen 03 (Queue Pass)?",
    options: [
      "Force her to stay connected to Wi-Fi the entire walk.",
      "Automatically send an SMS confirmation pass and make the queue number easy to screenshot.",
      "Cancel her reservation if she goes offline for more than 30 seconds.",
      "Require her to print the webpage at an internet cafe."
    ],
    answer: "Automatically send an SMS confirmation pass and make the queue number easy to screenshot."
  },
  {
    id: 17,
    topic: "Canteen Rush Challenge",
    question: "Leo is a Grade 11 student walking down a crowded hallway holding books in one hand, with only 15 minutes to eat and a strict PHP 100 budget. Why is the current Canteen App's checkout flow failing him?",
    options: [
      "It shows meal prices and PHP 15 packaging fees upfront on the first screen.",
      "It hides the PHP 15 packaging fee until final checkout and asks for his homeroom adviser and home address.",
      "It lets him order with one thumb in under 30 seconds.",
      "It gives him a large claim number and pickup counter."
    ],
    answer: "It hides the PHP 15 packaging fee until final checkout and asks for his homeroom adviser and home address."
  },
  {
    id: 18,
    topic: "Canteen Rush Microcopy",
    question: "Leo selects \"Pork Sisig\" and taps order, but the last serving was just bought by someone else. The broken app displays \"Error 409\". What is the most helpful recovery microcopy for Screen 04 (Sold-Out State)?",
    options: [
      "\"Fatal Exception 409: Null Inventory.\"",
      "\"Sisig just sold out. See 2 similar meals under PHP 100.\"",
      "\"Done.\"",
      "\"Invalid input. Please restart the app.\""
    ],
    answer: "\"Sisig just sold out. See 2 similar meals under PHP 100.\""
  },
  {
    id: 19,
    topic: "Canteen Rush Testing",
    question: "After submitting his order on the old Canteen App, the screen simply says \"OK\" and closes. Why does this violate the \"System Feedback\" pillar of UX?",
    options: [
      "Because \"OK\" uses two capital letters.",
      "Because Leo has no claim stub, order number, pickup time, or counter number to show the canteen staff.",
      "Because the button wasn't styled with a gradient.",
      "Because it didn't ask for his parent's occupation."
    ],
    answer: "Because Leo has no claim stub, order number, pickup time, or counter number to show the canteen staff."
  },
  {
    id: 20,
    topic: "Media Lab Gear Challenge",
    question: "Jules has 10 minutes before a group film shoot and needs a wireless mic and tripod from the 4th-floor Media Lab. The current app lists items as \"AUD-WM-04\" and \"VID-TR-09\" and hides stock status until the final submit screen. What happens if Jules relies on this app?",
    options: [
      "Jules can reserve the gear in 10 seconds with confidence.",
      "Jules wastes time guessing serial codes and risks climbing 4 floors carrying heavy bags for out-of-stock gear.",
      "The custodian automatically delivers the gear to the 1st floor.",
      "The app automatically edits their film project."
    ],
    answer: "Jules wastes time guessing serial codes and risks climbing 4 floors carrying heavy bags for out-of-stock gear."
  },
  {
    id: 21,
    topic: "Media Lab Form Clutter",
    question: "When reserving a microphone for a 2-hour class shoot, the current Media Lab app requires Student ID, Section, Home Address, Parent's Occupation, and a 200-word Project Essay. How should you redesign Screen 02 (Quick Reserve)?",
    options: [
      "Keep all fields and add a 500-word essay requirement for security.",
      "Cut the clutter and ask only for essential info: Student ID, Section, and Return Time.",
      "Remove all fields so the custodian doesn't know who borrowed the mic.",
      "Ask for a birth certificate upload."
    ],
    answer: "Cut the clutter and ask only for essential info: Student ID, Section, and Return Time."
  },
  {
    id: 22,
    topic: "Peer Testing Rules",
    question: "During the 4-minute Peer Test in class, you swap paper prototypes with another group. As the tester looks at your Screen 01, their finger pauses and they squint at a label. What is the strict rule you must follow?",
    options: [
      "Grab the paper and point to the button they should tap.",
      "Tell them, \"That button obviously means checkout, why are you squinting?\"",
      "Stay silent, watch where they hesitate, and treat their confusion as valuable information about your design.",
      "Ask them, \"Do you like how neat our drawing is?\""
    ],
    answer: "Stay silent, watch where they hesitate, and treat their confusion as valuable information about your design."
  },
  {
    id: 23,
    topic: "The 60-Second Pitch",
    question: "Your group is preparing your 60-second UX pitch. Which of the following follows the proper 4-part pitch structure (User Need → UI Fix & Reason → Test Observation → Next Improvement)?",
    options: [
      "\"We drew 4 screens in 6 minutes. We used black markers. Our group liked the design. Thank you.\"",
      "\"Leo needs lunch under PHP 100 in 15 minutes. We put total prices on Screen 1 and cut the address field. During testing, our classmate still asked where to pick up the food, so we added 'Counter 2' in large text on the claim stub.\"",
      "\"Our app is better than the old one because the buttons are rounder and we added a cool logo on the login screen.\"",
      "\"The tester didn't understand our app because they weren't reading carefully, so we didn't change anything.\""
    ],
    answer: "\"Leo needs lunch under PHP 100 in 15 minutes. We put total prices on Screen 1 and cut the address field. During testing, our classmate still asked where to pick up the food, so we added 'Counter 2' in large text on the claim stub.\""
  },
  {
    id: 24,
    topic: "Human Communication",
    question: "A student organizing a campus event sends a message to their professor that only says: \"Sir, about our event...\" and waits for a reply. According to the communication workflow lesson, what three elements are missing?",
    options: [
      "Greeting, Emoji, and Signature.",
      "Purpose (why you are writing), Context (details the professor needs), and Request (the specific action/approval needed).",
      "A 10-page attachment, a calendar invite, and a spreadsheet link.",
      "Font size, slide transition, and background color."
    ],
    answer: "Purpose (why you are writing), Context (details the professor needs), and Request (the specific action/approval needed)."
  },
  {
    id: 25,
    topic: "AI Briefing",
    question: "You want AI to help draft an email to your professor requesting event approval. Why is the prompt \"Write an email\" ineffective?",
    options: [
      "Because AI cannot write emails under any circumstances.",
      "Because it forces the AI to guess the audience, purpose, confirmed event details, and tone.",
      "Because prompts must be written in binary code.",
      "Because it is too polite."
    ],
    answer: "Because it forces the AI to guess the audience, purpose, confirmed event details, and tone."
  },
  {
    id: 26,
    topic: "Prompt Checklist",
    question: "Which four components make up the practical checklist for briefing AI like a teammate?",
    options: [
      "Role + Color + Font + Length",
      "Goal + Context + Constraints + Format",
      "Login + Password + Server + Database",
      "Sketch + Wireframe + Prototype + Test"
    ],
    answer: "Goal + Context + Constraints + Format"
  },
  {
    id: 27,
    topic: "AI Hallucinations & Review",
    question: "You give AI a well-structured brief to write an event invitation. The output reads fluently and confidently, but it lists the event venue as \"Main Auditorium\" when your group hasn't booked a room yet. What principle does this illustrate?",
    options: [
      "A better prompt guarantees 100% factual accuracy.",
      "Confident doesn't always mean correct; fluent AI drafts still require human verification against source facts.",
      "The AI has automatically booked the Main Auditorium for you.",
      "You should send the email immediately without reading it."
    ],
    answer: "Confident doesn't always mean correct; fluent AI drafts still require human verification against source facts."
  },
  {
    id: 28,
    topic: "Chat vs. Agents",
    question: "What is the key operational difference between a standard AI Chat workflow and an AI Agent workflow?",
    options: [
      "Chat responds to your prompt so you can act; an Agent can take permitted multi-step actions using tools, requiring a human review gate before external actions like sending emails.",
      "Chat costs money while Agents are always offline.",
      "Agents do not need goals or permissions.",
      "Chat automatically sends emails to your professor without asking."
    ],
    answer: "Chat responds to your prompt so you can act; an Agent can take permitted multi-step actions using tools, requiring a human review gate before external actions like sending emails."
  },
  {
    id: 29,
    topic: "Prompts vs. Skills",
    question: "You find yourself typing the exact same tone rules, formatting standards, and fact-checking instructions every time you ask AI to draft a club announcement. How should you solve this?",
    options: [
      "Save those repeated instructions as a reusable Skill (writing guide) that pairs with your daily task prompt.",
      "Retrain the entire large language model from scratch on your laptop.",
      "Stop using standards and accept whatever tone the AI chooses.",
      "Type the instructions manually 50 times a day."
    ],
    answer: "Save those repeated instructions as a reusable Skill (writing guide) that pairs with your daily task prompt."
  },
  {
    id: 30,
    topic: "Google Workspace Workflow",
    question: "Your student organization is managing event sign-ups and approvals. What is the logical role of each tool in the connected Google Workspace workflow?",
    options: [
      "Gmail collects sign-ups → Calendar organizes rows → Forms writes the essay.",
      "Forms collects sign-ups → Sheets organizes responses → Docs holds the plan → Human Review → Gmail communicates & Calendar schedules.",
      "Docs automatically approves the event without human review.",
      "Sheets sends text messages to Nanay Elena."
    ],
    answer: "Forms collects sign-ups → Sheets organizes responses → Docs holds the plan → Human Review → Gmail communicates & Calendar schedules."
  }
]

export const midtermWireframeChallenges: WireframeDndChallenge[] = [
  {
    id: "challenge_1_mika",
    title: "Challenge 1: Mika's Event Registration Wireframe (4 Points)",
    scenario: "Mika has 5 minutes left and unstable internet to register for a PHP 50 campus event. Drag the correct UI elements into the 4 Wireframe Slots from top to bottom based on visual hierarchy and clarity. Leave unnecessary clutter out of the screen.",
    points: 4,
    draggableElements: [
      {
        id: "el_a",
        code: "Element A",
        uiType: "badge",
        label: "UX Design Workshop • PHP 50 Fee (8 Slots Left)",
        subtext: "Header Badge"
      },
      {
        id: "el_b",
        code: "Element B",
        uiType: "textbox",
        label: "Input: Full Name",
        placeholder: "e.g., Mikaela Reyes"
      },
      {
        id: "el_c",
        code: "Element C",
        uiType: "textbox",
        label: "Input: School Email (@edu.ph)",
        placeholder: "mika@school.edu.ph"
      },
      {
        id: "el_d",
        code: "Element D",
        uiType: "textbox",
        label: "Input: Home Street Address & ZIP Code",
        placeholder: "Street, Barangay, City, ZIP"
      },
      {
        id: "el_e",
        code: "Element E",
        uiType: "button",
        label: "Register for Event (PHP 50)",
        subtext: "Primary Button"
      },
      {
        id: "el_f",
        code: "Element F",
        uiType: "button",
        label: "Proceed",
        subtext: "Button"
      }
    ],
    dropZones: [
      {
        slotId: "slot_31",
        slotNumber: 31,
        slotLabel: "Slot 31 (Top — Visual Hierarchy / Event Details)",
        correctElementId: "el_a",
        points: 1
      },
      {
        slotId: "slot_32",
        slotNumber: 32,
        slotLabel: "Slot 32 (Upper Middle — Essential Field 1: Full Name)",
        correctElementId: "el_b",
        points: 1
      },
      {
        slotId: "slot_33",
        slotNumber: 33,
        slotLabel: "Slot 33 (Lower Middle — Essential Field 2: School Email)",
        correctElementId: "el_c",
        points: 1
      },
      {
        slotId: "slot_34",
        slotNumber: 34,
        slotLabel: "Slot 34 (Bottom — Clear Action Promise Button)",
        correctElementId: "el_e",
        points: 1
      }
    ]
  },
  {
    id: "challenge_2_elena",
    title: "Challenge 2: Nanay Elena's Barangay Clinic Screen 01 & 02 (3 Points)",
    scenario: "Redesign the Barangay Health Center booking screen for Nanay Elena (64), who needs to know if Losartan is in stock before paying PHP 60 for a tricycle and doesn't have an email address.",
    points: 3,
    draggableElements: [
      {
        id: "el_g",
        code: "Element G",
        uiType: "badge",
        label: "Today: Dr. Santos In • Losartan: 45 Packs Available",
        subtext: "Status Banner"
      },
      {
        id: "el_h",
        code: "Element H",
        uiType: "badge",
        label: "Antihypertensive Allocation Status: Active",
        subtext: "Status Banner"
      },
      {
        id: "el_i",
        code: "Element I",
        uiType: "textbox",
        label: "Inputs: Full Name, Purok/Zone & SMS Cellphone Number",
        placeholder: "Nanay Elena, Purok 3, 0917xxxxxxx"
      },
      {
        id: "el_j",
        code: "Element J",
        uiType: "textbox",
        label: "Inputs: 12-Digit Password & PhilHealth ID Upload",
        placeholder: "Password + Upload File"
      },
      {
        id: "el_k",
        code: "Element K",
        uiType: "button",
        label: "Get Morning Queue Number (Sent via SMS)",
        subtext: "Action Button"
      }
    ],
    dropZones: [
      {
        slotId: "slot_35",
        slotNumber: 35,
        slotLabel: "Slot 35 (Top — Upfront Stock & Doctor Status)",
        correctElementId: "el_g",
        points: 1
      },
      {
        slotId: "slot_36",
        slotNumber: 36,
        slotLabel: "Slot 36 (Middle — Essential Accessible Text Boxes)",
        correctElementId: "el_i",
        points: 1
      },
      {
        slotId: "slot_37",
        slotNumber: 37,
        slotLabel: "Slot 37 (Bottom — Accessible Community Action Button)",
        correctElementId: "el_k",
        points: 1
      }
    ]
  },
  {
    id: "challenge_3_leo",
    title: "Challenge 3: Leo's Canteen Rush Claim Stub & Recovery (3 Points)",
    scenario: "Leo is ordering lunch in a crowded hallway with one thumb and a PHP 100 budget. Configure the Order Checkout & Claim Flow by dragging the right UI elements into place.",
    points: 3,
    draggableElements: [
      {
        id: "el_l",
        code: "Element L",
        uiType: "card",
        label: "Chicken Adobo Rice • PHP 70 + PHP 15 Box = PHP 85 Total (6 Left)",
        subtext: "Menu Card"
      },
      {
        id: "el_m",
        code: "Element M",
        uiType: "button",
        label: "Place Order PHP 85",
        subtext: "Primary Button"
      },
      {
        id: "el_n",
        code: "Element N",
        uiType: "card",
        label: "Order #42 • Ready at 12:10 PM • Pick up at Counter 2",
        subtext: "Claim Stub Card"
      },
      {
        id: "el_o",
        code: "Element O",
        uiType: "card",
        label: "OK / Process Complete",
        subtext: "System Popup"
      },
      {
        id: "el_p",
        code: "Element P",
        uiType: "textbox",
        label: "Input: Homeroom Adviser Name",
        placeholder: "Enter Adviser Name"
      }
    ],
    dropZones: [
      {
        slotId: "slot_38",
        slotNumber: 38,
        slotLabel: "Slot 38 (Top — Honest Upfront Pricing Card)",
        correctElementId: "el_l",
        points: 1
      },
      {
        slotId: "slot_39",
        slotNumber: 39,
        slotLabel: "Slot 39 (Middle — Clear Checkout Button)",
        correctElementId: "el_m",
        points: 1
      },
      {
        slotId: "slot_40",
        slotNumber: 40,
        slotLabel: "Slot 40 (Bottom — Confirmation System Feedback Stub)",
        correctElementId: "el_n",
        points: 1
      }
    ]
  }
]

export const midtermEssays: MidtermEssayPrompt[] = [
  {
    id: "essay_1_pitch",
    title: "Essay 1: The 60-Second UX Redesign Pitch (5 Points)",
    points: 5,
    scenario: "Choose ONE of the three workshop users: (1) Nanay Elena (64) at the Barangay Health Clinic, (2) Leo (Grade 11) at the School Canteen, or (3) Jules / James Patrick (17) at the Media Equipment Lab.",
    instructions: [
      "1. \"Our user needs...\" (State their specific goal, time/budget/physical constraints, and what gets in the way).",
      "2. \"We changed... because...\" (Describe at least two concrete UI/UX fixes—such as upfront stock, removing clutter fields, or clearer microcopy—and connect them to the user's need).",
      "3. \"When tested, we observed...\" (Describe a realistic point of hesitation or question a classmate might have during a silent 4-minute peer test).",
      "4. \"Our next improvement is...\" (Explain the specific revision you made to fix that friction)."
    ],
    rubric: [
      "2 pts: Accurately identifies user goal, real-world constraints, and at least two specific audit flaws fixed.",
      "2 pts: Connects UI/microcopy changes directly to human empathy and explains a realistic silent peer-testing observation.",
      "1 pt: Follows the 4-part pitch structure clearly and concisely."
    ]
  },
  {
    id: "essay_2_ai_workflow",
    title: "Essay 2: AI Briefing & Google Workspace Workflow (5 Points)",
    points: 5,
    scenario: "Your student group is organizing a Campus Tech Seminar. A teammate opens an AI chat and types: \"Make an invitation email for our professor.\" They plan to copy-paste whatever the AI writes and send it immediately to the department dean without checking.",
    instructions: [
      "1. Rewrite the AI Brief (3 Points): Rewrite your teammate's weak prompt using the Goal + Context + Constraints + Format checklist so the AI has concrete expectations and does not invent details.",
      "2. Workflow & Verification (2 Points): Explain why \"confident doesn't always mean correct\" when reviewing AI output, and trace how Google Forms, Sheets, Docs, Human Review, Gmail, and Calendar should work together to manage this event responsibly."
    ],
    rubric: [
      "3 pts: Rewritten AI prompt clearly specifies Goal, Context (confirmed date/time/venue), Constraints (respectful tone, request first, do not invent details), and Format.",
      "2 pts: Explains the risk of AI hallucinations/invented facts and accurately maps the Forms → Sheets → Docs → Human Review → Gmail / Calendar workflow."
    ]
  }
]

export const midtermCombinedEssayPromptForAI = `
Evaluate the student's TWO Midterm Essays (Total: 10 Points = 5 Points for Essay 1 + 5 Points for Essay 2):

=== ESSAY 1: The 60-Second UX Redesign Pitch (5 Points) ===
Scenario: Choose ONE user: Nanay Elena (Barangay Health Clinic), Leo (School Canteen), or Jules/James Patrick (Media Equipment Lab).
Required 4-Step Structure:
1. "Our user needs..." (Goal, time/budget/physical constraints, barrier)
2. "We changed... because..." (At least two concrete UI/UX fixes connected to user need)
3. "When tested, we observed..." (Realistic hesitation/question during silent peer test)
4. "Our next improvement is..." (Specific revision to fix that friction)
Rubric (5 pts):
- 2 pts: Identifies user goal, real-world constraints, and at least 2 audit flaws fixed.
- 2 pts: Connects UI/microcopy changes to human empathy and explains a realistic peer-testing observation.
- 1 pt: Follows the 4-part pitch structure clearly.

=== ESSAY 2: AI Briefing & Google Workspace Workflow (5 Points) ===
Scenario: Teammate types "Make an invitation email for our professor" for a Campus Tech Seminar and wants to send it without checking.
Required Parts:
1. Rewrite the AI Brief (3 pts): Using Goal + Context + Constraints + Format so AI doesn't invent details.
2. Workflow & Verification (2 pts): Explain why "confident doesn't always mean correct" (AI hallucinations/invented facts) and trace how Google Forms -> Sheets -> Docs -> Human Review -> Gmail & Calendar work together.
`

export function scoreWireframePlacements(placements: Record<string, string>): number {
  let score = 0
  for (const challenge of midtermWireframeChallenges) {
    for (const zone of challenge.dropZones) {
      const placedId = placements[zone.slotId]
      if (!placedId) continue
      if (placedId === zone.correctElementId) {
        score += zone.points
      } else if (
        // Allow Full Name (el_b) and School Email (el_c) in either Slot 32 or Slot 33 if distinct
        (zone.slotId === 'slot_32' && placedId === 'el_c' && placements['slot_33'] === 'el_b') ||
        (zone.slotId === 'slot_33' && placedId === 'el_b' && placements['slot_32'] === 'el_c')
      ) {
        score += zone.points
      }
    }
  }
  return score
}

export function isMidtermRecord(exam: { essay_answer?: string | null; section?: string | null }): boolean {
  if (!exam) return false
  if (exam.essay_answer && exam.essay_answer.startsWith('[EXAM:MIDTERM')) return true
  if (exam.section && exam.section.toUpperCase().includes('MIDTERM')) return true
  return false
}

export function parseExamDetails(exam: {
  mcq_score: number
  ai_score: number | null
  essay_answer?: string | null
  section?: string | null
}) {
  const isMidterm = isMidtermRecord(exam)
  if (!isMidterm) {
    return {
      examType: 'PRELIM' as const,
      part1Mcq: exam.mcq_score,
      part2Dnd: null as number | null,
      objectiveScore: exam.mcq_score,
      essayScore: exam.ai_score,
      totalScore: (exam.mcq_score || 0) + (exam.ai_score || 0),
      displayEssay: exam.essay_answer || ''
    }
  }

  let part1Mcq: number | null = null
  let part2Dnd: number | null = null
  let displayEssay = exam.essay_answer || ''

  const match = displayEssay.match(/^\[EXAM:MIDTERM\|P1:(\d+)\/30\|P2:(\d+)\/10\]\n*/)
  if (match) {
    part1Mcq = parseInt(match[1], 10)
    part2Dnd = parseInt(match[2], 10)
    displayEssay = displayEssay.replace(match[0], '')
  } else {
    displayEssay = displayEssay.replace(/^\[EXAM:MIDTERM\]\n*/, '')
  }

  return {
    examType: 'MIDTERM' as const,
    part1Mcq,
    part2Dnd,
    objectiveScore: exam.mcq_score,
    essayScore: exam.ai_score,
    totalScore: (exam.mcq_score || 0) + (exam.ai_score || 0),
    displayEssay
  }
}

export function formatMidtermEssayAnswer(
  part1McqScore: number,
  part2DndScore: number,
  essay1: string,
  essay2: string
): string {
  return `[EXAM:MIDTERM|P1:${part1McqScore}/30|P2:${part2DndScore}/10]\n\n=== ESSAY 1: 60-Second UX Redesign Pitch ===\n${essay1.trim()}\n\n=== ESSAY 2: AI Briefing & Google Workspace Workflow ===\n${essay2.trim()}`
}
