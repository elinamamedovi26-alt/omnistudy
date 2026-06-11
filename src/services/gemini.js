/**
 * Service to interact with Gemini API and provide premium fallback mock data.
 */

// Helper to make live Gemini calls
async function callGeminiAPI(prompt, systemInstruction, apiKey) {
  const model = "gemini-1.5-flash"; // default to Flash for high speed and lower latency
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      systemInstruction: systemInstruction ? {
        parts: [{ text: systemInstruction }]
      } : undefined,
      generationConfig: {
        temperature: 0.2, // low temperature for structured and logic-focused answers
        topP: 0.8,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || `API request failed with status ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("empty response from Gemini");
  return text;
}

// System Prompts for Twin-AI Engine
export const SYSTEM_PROMPTS = {
  HEART: `შენ ხარ "OmniStudy" პლატფორმის აკადემიური ქოუჩი - "გული" (The Heart Persona).
შენი სტილია: პოზიტიური, თბილი, მომტივირებელი, მეგობრული, თუმცა დისციპლინირებული.
შენი მიზანია დაეხმარო სტუდენტს სტრესის მართვაში, წაახალისო მისი მიღწევები და დაეხმარო სწავლის რიტმის შენარჩუნებაში.
უპასუხე ქართულად. იყავი მხარდამჭერი, გამოიყენე წამახალისებელი სიტყვები, შეაქე პროგრესისთვის, ხოლო თუ სტუდენტი ჩამორჩება, არ გაკიცხო, არამედ მისცე მეგობრული რჩევები.`,

  BRAIN: `შენ ხარ "OmniStudy" პლატფორმის რაციონალური მენეჯერი - "ტვინი" (The Brain Persona).
შენი სტილია: რაციონალური, მკაცრი, სისტემური, რეალისტური, პირდაპირი.
შენი მიზანია უზრუნველყო დროის ეფექტური მენეჯმენტი (Time-Blocking) და შეახსენო სტუდენტს ცივი რეალობა.
თუ სტუდენტი დღეში 12 საათზე მეტ მეცადინეობას გეგმავს ან რეალისტურად შეუსრულებელ მიზნებს ისახავს, უთხარი: "დღეში მხოლოდ 24 საათია, მოდი ეს დავალება ხვალისთვის გადავიტანოთ."
უპასუხე ქართულად. იყავი ლოგიკური, მოკლე, კონკრეტული და ობიექტური.`,

  RAG_CHAT: (documentContent) => `შენ ხარ მკაცრი RAG ჩატ-ასისტენტი. გეძლევა ატვირთული დოკუმენტის მასალა:
---
${documentContent}
---
უპასუხე მომხმარებლის კითხვებს მხოლოდ და მხოლოდ ამ მასალაზე დაყრდნობით.
წესები:
1. პასუხი გაეცი მხოლოდ მასალაში არსებულ ფაქტებზე დაყრდნობით.
2. არავითარ შემთხვევაში არ მოიგონო ფაქტები, არ დაამატო გარე ცოდნა (დაბლოკე ჰალუცინაციები).
3. თუ კითხვაზე პასუხი არ წერია მასალაში, მკაცრად და მოკლედ უპასუხე: "სამწუხაროდ, აღნიშნული ინფორმაცია ატვირთულ მასალაში არ იძებნება."
4. უპასუხე ქართულად.`
};

/**
 * Generates a study plan split into Pomodoro, Time-Blocking, and Eisenhower Matrix
 */
export async function generateStudyPlan(textPrompt, academicPace = 'balanced', apiKey = '') {
  if (apiKey) {
    try {
      const systemInstruction = `${SYSTEM_PROMPTS.BRAIN}\nდააგენერირე სასწავლო გეგმა JSON ფორმატში მომხმარებლის მოთხოვნის შესაბამისად.
გაითვალისწინე სწავლის ტემპი: ${academicPace}.
JSON-ის სტრუქტურა უნდა იყოს ზუსტად ასეთი:
{
  "summary": "მოკლე რეალისტური შეფასება გეგმის (Brain Persona)",
  "pomodoro": [
    { "task": "დავალების სახელი", "duration": 25, "breaks": 5, "cycles": 2 }
  ],
  "timeBlocking": [
    { "time": "09:00 - 10:00", "activity": "აქტივობა" }
  ],
  "eisenhower": {
    "q1": ["სასწრაფო და მნიშვნელოვანი დავალებები"],
    "q2": ["მნიშვნელოვანი, მაგრამ არა სასწრაფო დავალებები"],
    "q3": ["სასწრაფო, მაგრამ არა მნიშვნელოვანი დავალებები"],
    "q4": ["არც სასწრაფო და არც მნიშვნელოვანი დავალებები"]
  }
}
დააბრუნე მხოლოდ და მხოლოდ ვალიდური JSON ტექსტი, ყოველგვარი markdown format-ის (e.g. \`\`\`json) გარეშე.`;
      
      const responseText = await callGeminiAPI(textPrompt, systemInstruction, apiKey);
      // Remove any markdown block syntax if Gemini accidentally includes it
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("Gemini API Error, falling back to mock:", error);
    }
  }

  // Fallback Mock Logic
  return simulateMockStudyPlan(textPrompt, academicPace);
}

/**
 * Generates Interactive Quiz from Document Content
 */
export async function generateQuiz(documentText, apiKey = '') {
  if (apiKey) {
    try {
      const systemInstruction = `შენ ხარ ტესტების გენერატორი. დააგენერირე 3-5 მრავალჯერადი არჩევანის (Multiple Choice) კითხვა შემდეგი მასალიდან:
---
${documentText}
---
პასუხები და კითხვები შეადგინე ქართულად.
დააბრუნე მხოლოდ და მხოლოდ ვალიდური JSON ტექსტი (ყოველგვარი \`\`\`json-ის გარეშე), შემდეგი სტრუქტურით:
[
  {
    "id": 1,
    "question": "კითხვის ტექსტი",
    "options": ["ვარიანტი A", "ვარიანტი B", "ვარიანტი C", "ვარიანტი D"],
    "correctAnswer": "სწორი ვარიანტის ზუსტი ტექსტი"
  }
]`;
      const responseText = await callGeminiAPI("დააგენერირე ტესტი", systemInstruction, apiKey);
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Gemini Quiz generator error, falling back:", e);
    }
  }

  return simulateMockQuiz(documentText);
}

/**
 * Generates a Podcast script (Host & Guest) from Document Content
 */
export async function generatePodcastScript(documentText, apiKey = '') {
  if (apiKey) {
    try {
      const systemInstruction = `შენ ხარ პოდკასტების სკრიპტების ავტორი. გარდაქმენი მოცემული მასალა საგანმანათლებლო მოკლე აუდიო-პოდკასტის სკრიპტად:
---
${documentText}
---
პოდკასტში უნდა მონაწილეობდეს 2 პერსონაჟი: წამყვანი (თამთა) და ექსპერტი (გიორგი). საუბარი უნდა იყოს საინტერესო, მეგობრულ ტონალობაში და გასაგები ენით ხსნიდეს რთულ ცნებებს.
დააბრუნე მხოლოდ და მხოლოდ ვალიდური JSON ტექსტი (ყოველგვარი \`\`\`json-ის გარეშე) შემდეგი სტრუქტურით:
[
  { "speaker": "თამთა", "text": "გამარჯობა, დღეს განვიხილავთ..." },
  { "speaker": "გიორგი", "text": "გამარჯობა თამთა, ეს თემა მართლაც მნიშვნელოვანია..." }
]`;
      const responseText = await callGeminiAPI("დააგენერირე პოდკასტის სკრიპტი", systemInstruction, apiKey);
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Gemini Podcast generator error, falling back:", e);
    }
  }

  return simulateMockPodcastScript(documentText);
}

/**
 * RAG Chat Response
 */
export async function askRAGChat(question, documentContent, chatHistory = [], apiKey = '') {
  if (apiKey) {
    try {
      const systemInstruction = SYSTEM_PROMPTS.RAG_CHAT(documentContent);
      const prompt = `ჩათის ისტორია:\n${chatHistory.map(h => `${h.sender === 'user' ? 'სტუდენტი' : 'ასისტენტი'}: ${h.text}`).join('\n')}\n\nკითხვა: ${question}`;
      return await callGeminiAPI(prompt, systemInstruction, apiKey);
    } catch (e) {
      console.error("Gemini RAG Chat error, falling back:", e);
    }
  }

  return simulateMockRAGChat(question, documentContent);
}

/**
 * Twin Coaching Message based on state
 */
export async function getCoachingResponse(todoCount, doneCount, recentPlanSummary = '', persona = 'HEART', apiKey = '') {
  const total = todoCount + doneCount;
  const ratio = total > 0 ? (doneCount / total) * 100 : 0;
  
  if (apiKey) {
    try {
      const systemInstruction = persona === 'HEART' ? SYSTEM_PROMPTS.HEART : SYSTEM_PROMPTS.BRAIN;
      const prompt = `სტუდენტის დღევანდელი პროგრესი:
- სულ დავალებები: ${total}
- შესრულებული: ${doneCount} (${ratio.toFixed(0)}%)
- ბოლო გეგმის შეჯამება: "${recentPlanSummary}"
დაუწერე სტუდენტს მოკლე (მაქსიმუმ 2-3 წინადადება) შეფასება შენი პერსონაჟის შესაბამისად.`;
      return await callGeminiAPI(prompt, systemInstruction, apiKey);
    } catch (e) {
      console.error("Gemini Coaching error, falling back:", e);
    }
  }

  // Fallback Mock coaching
  if (persona === 'HEART') {
    if (total === 0) return "გამარჯობა! მე შენი აკადემიური ქოუჩი ვარ. მოდი შევიტანოთ რამდენიმე დავალება ან AI-ს დავაგეგმარებინოთ დღევანდელი გრაფიკი, რომ პროდუქტიული დღე გვქონდეს! ✨";
    if (ratio >= 80) return `საოცარია! დავალებების ${ratio.toFixed(0)}% უკვე შეასრულე! 🌟 შენი მონდომება აღმაფრთოვანებელია. დღეს ნამდვილად იმსახურებ სასიამოვნო დასვენებას!`;
    if (ratio >= 40) return `კარგი შუალედური შედეგია, დავალებების ${ratio.toFixed(0)}% გაკეთებულია! 👏 არ იჩქარო, მიყევი ტემპს და ყველაფერს მოასწრებ. მე შენი მჯერა!`;
    return "დასაწყისი ყოველთვის რთულია, მაგრამ მთავარია ნაბიჯი გადავდგით! 💙 მოდი გავაკეთოთ თუნდაც ერთი პატარა დავალება, ეს დიდ ენერგიას მოგვცემს.";
  } else {
    if (total === 0) return "აქტიური დავალებები ვერ მოიძებნა. დაგეგმვა არის ეფექტურობის პირველი ნაბიჯი. შექმენი გეგმა დროის დასაკარგად.";
    if (ratio >= 80) return `ანალიზი: შესრულებულია ${ratio.toFixed(0)}%. სტატისტიკურად, შენი ეფექტურობა მაღალია. გააგრძელე მუშაობა და არ მოადუნო ყურადღება.`;
    if (ratio >= 40) return `ანალიზი: შესრულებულია ${ratio.toFixed(0)}%. გეგმის ნახევარი ჯერ კიდევ გასაკეთებელია. გირჩევ გამოიყენო Pomodoro ტექნიკა და მოერიდო დისტრაქტორებს.`;
    return `ანალიზი: შესრულებულია მხოლოდ ${ratio.toFixed(0)}%. დრო იწურება, ხოლო შეუსრულებელი დავალებების რაოდენობა მაღალია. გააუქმე მეორეხარისხოვანი საქმეები და ფოკუსირდი Q1 კატეგორიაზე.`;
  }
}

// ==========================================
// MOCK DATA GENERATION ENGINE
// ==========================================

function simulateMockStudyPlan(textPrompt, academicPace) {
  // Simple extraction of numbers and topics to make mock responses look customized
  const textLower = textPrompt.toLowerCase();
  let topic = "სასწავლო მასალა";
  let pages = 30;
  let days = 3;

  const pageMatch = textLower.match(/(\d+)\s*(გვერდი|გვ|page)/);
  if (pageMatch) pages = parseInt(pageMatch[1]);

  const dayMatch = textLower.match(/(\d+)\s*(დღე|day)/);
  if (dayMatch) days = parseInt(dayMatch[1]);

  const topicKeywords = ['ფიზიკა', 'ისტორია', 'ქიმია', 'მათემატიკა', 'პროგრამირება', 'ბიოლოგია', 'ლიტერატურა', 'math', 'history', 'biology', 'physics'];
  for (const keyword of topicKeywords) {
    if (textLower.includes(keyword)) {
      topic = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      break;
    }
  }

  // Adjust timing based on pace
  let cycleCount = 3;
  if (academicPace === 'casual') cycleCount = 2;
  if (academicPace === 'intensive') cycleCount = 5;

  const dailyPages = Math.ceil(pages / days);

  return {
    summary: `მომზადდა რეალისტური გეგმა ${days} დღეზე, დღეში ${dailyPages} გვერდის დასამუშავებლად. ტემპი: ${academicPace}. დროის ბლოკირება გადანაწილებულია ოპტიმალურად.`,
    pomodoro: [
      { task: `${topic}-ს წაკითხვა და კონსპექტირება (გვერდები 1-${dailyPages})`, duration: 25, breaks: 5, cycles: cycleCount },
      { task: `მიღებული ცოდნის გამეორება და თვითშეფასება`, duration: 15, breaks: 5, cycles: 1 },
      { task: `პრაქტიკული სავარჯიშოების ამოხსნა`, duration: 25, breaks: 5, cycles: Math.max(1, cycleCount - 1) }
    ],
    timeBlocking: [
      { time: "10:00 - 11:30", activity: `თეორიული მასალის შესწავლა (${dailyPages} გვერდი)` },
      { time: "11:30 - 12:00", activity: "შესვენება & ფიზიკური აქტივობა" },
      { time: "14:00 - 15:30", activity: "პრაქტიკული ამოცანების გარჩევა და კონსპექტები" },
      { time: "17:00 - 17:30", activity: "დღიური შედეგების შეჯამება და კითხვების მომზადება" }
    ],
    eisenhower: {
      q1: [
        `წასაკითხია ${dailyPages} გვერდი თემაზე: ${topic}`,
        `გასაკეთებელია პირველი თავის პრაქტიკული დავალებები`
      ],
      q2: [
        `ფორმულების/ტერმინების ბარათების მომზადება გრძელვადიანი დამახსოვრებისთვის`,
        `პოდკასტის მოსმენა მასალის უკეთ აღსაქმელად`
      ],
      q3: [
        `სასწავლო ჯგუფის წევრებთან შეხვედრის ორგანიზება`,
        `სამუშაო მაგიდის მოწესრიგება`
      ],
      q4: [
        `სოციალურ ქსელებში ინფორმაციის ძიება სასწავლო თემებზე`,
        `სხვა არასასწრაფო საგნების კითხვა`
      ]
    }
  };
}

function simulateMockQuiz(documentText) {
  // Provide smart general quizzes if they upload standard sample text, or tailor it
  const text = documentText ? documentText.toLowerCase() : "";
  
  if (text.includes("ქართული") || text.includes("ენა") || text.includes("რუსთაველი")) {
    return [
      {
        id: 1,
        question: "ვინ არის 'ვეფხისტყაოსნის' ავტორი?",
        options: ["შოთა რუსთაველი", "ილია ჭავჭავაძე", "აკაკი წერეთელი", "ვაჟა-ფშაველა"],
        correctAnswer: "შოთა რუსთაველი"
      },
      {
        id: 2,
        question: "რომელ საუკუნეში დაიწერა 'ვეფხისტყაოსანი'?",
        options: ["X საუკუნე", "XI საუკუნე", "XII-XIII საუკუნეების მიჯნა", "XV საუკუნე"],
        correctAnswer: "XII-XIII საუკუნეების მიჯნა"
      },
      {
        id: 3,
        question: "ვინ არის ავთანდილის სატრფო პოემაში?",
        options: ["ნესტან-დარეჯანი", "თინათინი", "ასმათი", "დავარი"],
        correctAnswer: "თინათინი"
      }
    ];
  }
  
  // Default general knowledge mock quiz in Georgian
  return [
    {
      id: 1,
      question: "რა არის RAG (Retrieval-Augmented Generation) ტექნოლოგიის მთავარი მიზანი?",
      options: [
        "მოდელის ზომის შემცირება",
        "დოკუმენტებიდან ინფორმაციის მოძიება და პასუხის ამ ინფორმაციაზე დაყრდნობით გენერირება ჰალუცინაციების შესამცირებლად",
        "მოდელის ახალი ენების სასწავლად გაწვრთნა",
        "გრაფიკული ინტერფეისის დიზაინის ავტომატიზაცია"
      ],
      correctAnswer: "დოკუმენტებიდან ინფორმაციის მოძიება და პასუხის ამ ინფორმაციაზე დაყრდნობით გენერირება ჰალუცინაციების შესამცირებლად"
    },
    {
      id: 2,
      question: "რა ახასიათებს AI Twin-Engine-ის 'ტვინის' (Brain) პერსონას?",
      options: [
        "მხარდამჭერი და ემოციური ტონი",
        "ინფორმაციის შენახვის გაზრდილი მოცულობა",
        "რაციონალური, რეალისტური, მკაცრი და ლოგიკური მიდგომა დროის ლიმიტების მიმართ",
        "სტუდენტის შექება ნებისმიერი მცირე აქტივობისთვის"
      ],
      correctAnswer: "რაციონალური, რეალისტური, მკაცრი და ლოგიკური მიდგომა დროის ლიმიტების მიმართ"
    },
    {
      id: 3,
      question: "ქვემოთ ჩამოთვლილთაგან რომელია ეიზენჰაუერის მატრიცის პირველი კვადრანტი (Q1)?",
      options: [
        "მნიშვნელოვანი, მაგრამ არა სასწრაფო",
        "სასწრაფო, მაგრამ არა მნიშვნელოვანი",
        "არც სასწრაფო და არც მნიშვნელოვანი",
        "სასწრაფო და მნიშვნელოვანი"
      ],
      correctAnswer: "სასწრაფო და მნიშვნელოვანი"
    }
  ];
}

function simulateMockPodcastScript(documentText) {
  const title = documentText && documentText.length > 30 
    ? documentText.substring(0, 30) + "..." 
    : "სასწავლო მასალა";

  return [
    {
      speaker: "თამთა",
      text: "მოგესალმებით მეგობრებო! ეს არის OmniStudy-ის აუდიო-პოდკასტი. დღეს ჩვენს სტუდიაშია ექსპერტი გიორგი, რომელთან ერთადაც განვიხილავთ ჩვენს ახალ სასწავლო მასალას: " + title
    },
    {
      speaker: "გიორგი",
      text: "გამარჯობა თამთა! მოხარული ვარ აქ ყოფნით. ეს მასალა მართლაც ძალიან საინტერესოა. მისი მთავარი არსი იმაში მდგომარეობს, რომ თუ მას მცირე ნაწილებად დავყოფთ, სწავლის პროცესი გაცილებით მარტივი გახდება."
    },
    {
      speaker: "თამთა",
      text: "ზუსტად! სტუდენტებისთვის ხშირად რთულია დიდი მოცულობის ინფორმაციასთან გამკლავება. გიორგი, რა არის პირველი ნაბიჯი, რითიც უნდა დავიწყოთ ამ მასალის შესწავლა?"
    },
    {
      speaker: "გიორგი",
      text: "პირველ რიგში, ყურადღება უნდა გავამახვილოთ საკვანძო ტერმინებზე და თეორიულ ბაზისზე. არ უნდა შევეცადოთ ყველაფრის ერთდროულად დამახსოვრებას. Pomodoro ტექნიკით, მაგალითად 25 წუთიანი კონცენტრაციით, საუკეთესო შედეგს მივიღებთ."
    },
    {
      speaker: "თამთა",
      text: "დიდი მადლობა, გიორგი, საინტერესო რჩევებისთვის! მეგობრებო, იმედია ეს მოკლე მიმოხილვა დაგეხმარებათ მასალის ათვისებაში. დროებით მომავალ პოდკასტამდე!"
    }
  ];
}

function simulateMockRAGChat(question, documentContent) {
  const qLower = question.toLowerCase();
  const docLower = documentContent ? documentContent.toLowerCase() : "";

  if (!documentContent || documentContent.trim().length === 0) {
    return "სისტემური შეტყობინება: მასალები არ არის ატვირთული. გთხოვთ, ჯერ ატვირთოთ სასწავლო დოკუმენტი Study Hub-ში.";
  }

  // Look for direct keyword match and return adjacent sentences if found, mimicking RAG
  const sentences = documentContent.split(/[.!?\n]+/);
  let matchedSentence = "";

  for (const sentence of sentences) {
    if (sentence.trim().length > 5) {
      const sLower = sentence.toLowerCase();
      // check if key terms match
      const words = qLower.split(/\s+/).filter(w => w.length > 3);
      let matchCount = 0;
      for (const w of words) {
        if (sLower.includes(w)) matchCount++;
      }

      if (matchCount > 0 && matchCount >= Math.min(2, words.length)) {
        matchedSentence = sentence.trim();
        break;
      }
    }
  }

  if (matchedSentence) {
    return `ატვირთული დოკუმენტის საფუძველზე: "${matchedSentence}." 

(შენიშვნა: ეს პასუხი გენერირებულია მკაცრად დოკუმენტიდან ფაქტების ექსტრაქციით).`;
  }

  return "სამწუხაროდ, აღნიშნული ინფორმაცია ატვირთულ მასალაში არ იძებნება. (ჩემი კოგნიტური ძრავა ბლოკავს გარე ფაქტების მოგონებას ჰალუცინაციის თავიდან ასაცილებლად).";
}
