export interface Question {
  id: number
  question: string
  options: string[]
  answer: string
}

export const questions: Question[] = [
  // LESSON 1: Intro to Multimedia
  {
    id: 1,
    question: "A client wants a digital experience where users can choose their own story path, clicking where to go and what happens next. What type of control flow are they asking for?",
    options: ["Linear", "Non-Linear", "Passive", "Typography"],
    answer: "Non-Linear"
  },
  {
    id: 2,
    question: "You are designing an app that combines text, video lectures, and quizzes to make studying more engaging. Which multimedia application does this fall under?",
    options: ["Social Media", "Entertainment", "E-Learning", "Virtual Reality"],
    answer: "E-Learning"
  },
  {
    id: 3,
    question: "During a presentation, you explain that the term 'Multimedia' comes from Latin. What does the root word 'medium' translate to?",
    options: ["Many or multiple", "Middle or carrier of information", "Visual illusion", "Digital sequence"],
    answer: "Middle or carrier of information"
  },
  {
    id: 4,
    question: "A user is clicking through your app, but it feels static and boring. You decide to add the 'illusion of movement' to guide the user's eye and make interactions feel dynamic. What element are you adding?",
    options: ["Video", "Graphics", "Animation", "Audio"],
    answer: "Animation"
  },
  {
    id: 5,
    question: "You are playing a horror video game with incredibly dark and realistic 3D graphics, but you don't feel scared at all. According to the core elements of multimedia, what is likely missing or poorly executed?",
    options: ["Audio (Soundscapes)", "Text (Typography)", "Animation (The Magic)", "Linear Flow"],
    answer: "Audio (Soundscapes)"
  },
  {
    id: 6,
    question: "You sit in a cinema to watch a 2-hour movie. You cannot pause, click, or change the outcome. What type of multimedia experience is this?",
    options: ["Non-Linear", "Active", "Linear", "Authoring"],
    answer: "Linear"
  },
  {
    id: 7,
    question: "Your website's landing page is currently just a massive wall of text. What core element should you integrate to provide immediate visual context and break up the text?",
    options: ["Audio", "Animation", "Graphics (Images)", "Non-Linear Flow"],
    answer: "Graphics (Images)"
  },
  {
    id: 8,
    question: "You need to deliver direct information and set the tone of your content quickly. According to the foundations of multimedia, which is the most basic element to achieve this?",
    options: ["Text (Typography)", "Video", "Animation", "Audio"],
    answer: "Text (Typography)"
  },

  // LESSON 2: Hardware & Software
  {
    id: 9,
    question: "You spend 12 hours editing a video, hit 'Render', and your computer crashes at 99%. What is the most likely cause of this issue?",
    options: ["Your software is outdated.", "Your hardware (muscle) cannot handle the heavy processing.", "You used the wrong font.", "Your audio sample rate is too high."],
    answer: "Your hardware (muscle) cannot handle the heavy processing."
  },
  {
    id: 10,
    question: "An artist wants to draw digital art by capturing human hand movements with high precision. What specific hardware input device should they use?",
    options: ["Studio Condenser Microphone", "Graphic Tablet (like Wacom)", "MIDI Keyboard", "Central Processing Unit"],
    answer: "Graphic Tablet (like Wacom)"
  },
  {
    id: 11,
    question: "You are trying to run Photoshop, Premiere Pro, and a web browser at the same time, but your computer is lagging heavily. Which internal hardware component handles your active workspace and likely needs an upgrade?",
    options: ["GPU", "SSD", "RAM", "Microphone"],
    answer: "RAM"
  },
  {
    id: 12,
    question: "A 3D animator is complaining that rendering 3D video effects takes entirely too long. Which specific hardware component is the heavy lifter for this task?",
    options: ["GPU (Graphics Processing Unit)", "RAM", "SSD", "Audio Sequencer"],
    answer: "GPU (Graphics Processing Unit)"
  },
  {
    id: 13,
    question: "You have edited your audio in FL Studio and created your graphics in Photoshop. What type of software do you need to bring them all together, add interactivity, and package the final project?",
    options: ["Video NLE", "Graphic Editor", "Audio Sequencer", "Authoring Tool"],
    answer: "Authoring Tool"
  },
  {
    id: 14,
    question: "A photographer complains that opening a large folder of high-resolution RAW images takes several minutes on their old hard drive. What hardware upgrade would ensure these files load instantly?",
    options: ["CPU", "GPU", "Solid State Drive (SSD)", "Graphic Tablet"],
    answer: "Solid State Drive (SSD)"
  },
  {
    id: 15,
    question: "You are recording a voiceover for a documentary. What input device acts as the transducer to capture your physical sound waves?",
    options: ["MIDI Keyboard", "Graphic Tablet", "Studio Condenser Microphone", "Audio Sequencer"],
    answer: "Studio Condenser Microphone"
  },
  {
    id: 16,
    question: "You need to cut video clips, arrange them on a timeline, and apply color grading. Which software category should you use?",
    options: ["Graphic Editor", "Video NLE", "Authoring Tool", "Audio Sequencer"],
    answer: "Video NLE"
  },

  // LESSON 3: Text & Typography
  {
    id: 17,
    question: "You are designing a mobile app interface. You want the text to look modern, clean, and minimal. Which typography category should you choose?",
    options: ["Serif", "Sans-Serif", "Typeface", "Raster"],
    answer: "Sans-Serif"
  },
  {
    id: 18,
    question: "A traditional law firm hires you to design their printed letterheads. They want to look authoritative and formal. Which typography category should you choose?",
    options: ["Sans-Serif", "Serif", "Vector", "CMYK"],
    answer: "Serif"
  },
  {
    id: 19,
    question: "Users are complaining that they can't tell the difference between a lowercase 'l' and a number '1' on your website's chosen typeface. What specific design issue is this?",
    options: ["Readability", "Legibility", "Visual Hierarchy", "Whitespace"],
    answer: "Legibility"
  },
  {
    id: 20,
    question: "Your article is legible, but the screen looks cluttered and users feel overwhelmed trying to read it. What design principle should you apply to let the text breathe?",
    options: ["Size (Scale)", "Weight & Color", "Whitespace (Negative space)", "Anti-Aliasing"],
    answer: "Whitespace (Negative space)"
  },
  {
    id: 21,
    question: "You want the headline of your website to naturally tell the user's brain, 'Read me first.' What is the best way to establish this visual hierarchy?",
    options: ["Use a Serif font.", "Increase the Size (Scale) of the text.", "Decrease the Whitespace.", "Change the text to CMYK."],
    answer: "Increase the Size (Scale) of the text."
  },
  {
    id: 22,
    question: "You receive an angry-sounding text message from a friend, but they were actually joking. Why does this happen in digital multimedia?",
    options: ["Text has no body language, so typography becomes the 'voice'.", "The font size was too large.", "The message used a Serif typeface.", "The sender used an active control flow."],
    answer: "Text has no body language, so typography becomes the 'voice'."
  },
  {
    id: 23,
    question: "A client asks you to change the text to 'Arial Bold Italic at 12pt'. Are they specifying a Typeface or a Font?",
    options: ["Typeface", "Font", "Legibility", "Serif"],
    answer: "Font"
  },
  {
    id: 24,
    question: "You are tasked with arranging the text layout for a blog. You make sure the lines aren't too long and the background color isn't too bright. What are you improving?",
    options: ["Legibility", "Readability", "The Typeface Family", "Visual Input"],
    answer: "Readability"
  },

  // LESSON 4: Image Processing
  {
    id: 25,
    question: "A client downloads a tiny logo from a website and prints it on a massive highway billboard. It turns out blurry and blocky. What went wrong?",
    options: ["They printed an RGB image.", "They used a Vector instead of Raster.", "They used a Raster image, which loses quality when stretched.", "They forgot to use Anti-Aliasing."],
    answer: "They used a Raster image, which loses quality when stretched."
  },
  {
    id: 26,
    question: "You are designing a magazine cover that will be printed using physical ink. Which color model must you use so the colors don't look terrible?",
    options: ["RGB", "CMYK", "PPI", "SVG"],
    answer: "CMYK"
  },
  {
    id: 27,
    question: "You are creating UI elements for a new smartphone game. The screen mixes light to produce color. Which color model must you use?",
    options: ["CMYK", "RGB", "DPI", "Lossy"],
    answer: "RGB"
  },
  {
    id: 28,
    question: "You need to export a graphic for a website. It needs to have a transparent background and retain full lossless quality. Which format should you choose?",
    options: [".JPEG", ".SVG", ".PNG", ".CMYK"],
    answer: ".PNG"
  },
  {
    id: 29,
    question: "You need to upload a large photograph to a blog. You want to compress the file size to be smaller, and you don't mind losing a tiny bit of quality. Which format is best?",
    options: [".PNG", ".JPEG", ".SVG", "Vector"],
    answer: ".JPEG"
  },
  {
    id: 30,
    question: "You are designing a company logo that consists of geometric formulas, lines, and curves so it can scale infinitely. What type of image format is this?",
    options: ["Raster", "Vector (.SVG)", "JPEG", "PPI"],
    answer: "Vector (.SVG)"
  },
  {
    id: 31,
    question: "A photograph looks crisp on a standard 72 PPI monitor, but blurry when printed on physical paper. What measurement did you likely fail to account for?",
    options: ["Anti-Aliasing", "RGB", "DPI (Dots Per Inch) needs to be at least 300.", "The image was a vector."],
    answer: "DPI (Dots Per Inch) needs to be at least 300."
  },
  {
    id: 32,
    question: "A developer uses a software trick to blend the jagged edges of a pixelated circle with the background color to make it look smooth. What is this trick called?",
    options: ["Resolution", "Color Grading", "Anti-Aliasing", "Sample Rate"],
    answer: "Anti-Aliasing"
  },

  // LESSON 5: Audio & Video Production
  {
    id: 33,
    question: "You are watching a stunning 4K video of a nature documentary, but the narrator's voice is muffled and crackling. According to the lesson, what is the reality of this situation?",
    options: ["The video resolution is too high.", "Sound is 50% of the picture; a good video with bad audio is unwatchable.", "The framerate is causing audio lag.", "The video is using a non-linear format."],
    answer: "Sound is 50% of the picture; a good video with bad audio is unwatchable."
  },
  {
    id: 34,
    question: "A director wants to shoot a short film and give it a traditional, cinematic feel. What Frame Rate (FPS) should they use?",
    options: ["60fps", "44.1kHz", "24fps", "72 PPI"],
    answer: "24fps"
  },
  {
    id: 35,
    question: "A player is testing a new fast-paced video game, but the motion feels choppy. To achieve ultra-smooth gaming motion, what should the frame rate be?",
    options: ["24fps", "60fps", "1080p", "4K"],
    answer: "60fps"
  },
  {
    id: 36,
    question: "While editing an interview, you notice the subject's lips move, but the voice is heard slightly after. The video looks dubbed. What went wrong?",
    options: ["The Sample Rate is too low.", "The Timeline Synchronization is delayed by a few frames.", "The editor forgot to apply Color Grading.", "The video is in 24fps instead of 60fps."],
    answer: "The Timeline Synchronization is delayed by a few frames."
  },
  {
    id: 37,
    question: "You are editing a thriller movie sequence and want to establish a cold, suspenseful mood. What technique should you use in your NLE?",
    options: ["Layering", "Anti-Aliasing", "Color Grading (e.g., using cold blue)", "Increasing the Sample Rate"],
    answer: "Color Grading (e.g., using cold blue)"
  },
  {
    id: 38,
    question: "You need to record digital audio at standard CD quality, taking snapshots of the audio wave thousands of times per second. What is the standard sample rate?",
    options: ["24fps", "44,100 snapshots per second (44.1kHz)", "1080p", "300 DPI"],
    answer: "44,100 snapshots per second (44.1kHz)"
  },
  {
    id: 39,
    question: "In your editing timeline, you need the audience to see a company logo over the main video. How do you achieve this?",
    options: ["Use a higher resolution.", "Increase the frame rate.", "Stack the logo on the top visual layer using Tracks.", "Adjust the bit depth."],
    answer: "Stack the logo on the top visual layer using Tracks."
  },
  {
    id: 40,
    question: "A Hollywood crew snaps a wooden board in front of the camera before shouting 'Action!'. Why do they do this?",
    options: ["To test the lighting.", "To create a visual and audio cue (a spike on the waveform) to help perfectly sync audio and video.", "To increase the frame rate.", "To convert analog waves into digital vectors."],
    answer: "To create a visual and audio cue (a spike on the waveform) to help perfectly sync audio and video."
  }
];

export const essayQuestion = {
  id: 41,
  title: "Part 2: Essay Section (10 Points)",
  prompt: "Imagine you are hired to develop a Non-Linear E-Learning application for high school students. Based on the 5 lessons, briefly explain: 1) How you will utilize at least three of the core multimedia elements, 2) Why you would choose Sans-Serif typography over Serif for the digital interface, and 3) Why you must use RGB instead of CMYK for your UI assets. (Do not copy-paste from external sources. AI detection is active.)"
};
