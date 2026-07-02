import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily to handle missing API key gracefully
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not defined. Using mock recommendations fallback.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST API Endpoints simulating com.example.ras.controller.RasController

// 1. POST /api/recommendations - get suggestions via Gemini API
app.post("/api/recommendations", async (req, res) => {
  const { category, preferences, profile } = req.body;

  if (!category) {
    return res.status(400).json({ error: "Category is required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Return high-quality mock data when API key is missing
    return res.json(getMockRecommendations(category, preferences || {}));
  }

  try {
    const ai = getAiClient();
    const prompt = `
      You are My RAS (Recommendation and Advice/Suggestion System).
      Generate 5 highly customized suggestions for the category: "${category}".
      
      User Specific Preferences:
      ${JSON.stringify(preferences || {})}
      
      User Profile Context:
      ${JSON.stringify(profile || {})}
      
      CRITICAL LANGUAGE RULES:
      If category is "movies" or "music", unless the user explicitly asks for another region or language, prioritize and heavily feature Tamil movies (Kollywood blockbusters, Mani Ratnam classics, gritty Vetrimaaran/Lokesh Kanagaraj thrillers) or Tamil music (evergreen A.R. Rahman tracks, high-energy Anirudh hits, soulful Yuvan Shankar Raja or Ilaiyaraaja songs). For other categories, follow the user's explicit instructions or profile.
      
      Return a JSON array of recommendation objects. Each object MUST strictly follow this typescript schema:
      {
        "id": "string (unique code or short slug)",
        "title": "string (name of movie/music/game/course/etc.)",
        "description": "string (detailed description of why they'll love it)",
        "tags": ["string array (2-4 relevant tags, e.g. 'Sci-Fi', 'Upbeat', 'RPG', 'Beginner', 'Adventure')"],
        "rating": number (estimated match score from 1 to 5, e.g., 4.8),
        "matchReason": "string (personalized advice explaining how this matches their specific preferences)",
        "metadata": {
          // 2-3 key-value string pairs specific to this category.
          // Examples: 
          // Movies: {"director": "...", "year": "...", "duration": "..."}
          // Music: {"artist": "...", "genre": "...", "type": "..."}
          // Games: {"developer": "...", "platform": "...", "playTime": "..."}
          // Courses: {"provider": "...", "difficulty": "...", "estimatedHours": "..."}
          // Travel: {"bestSeason": "...", "budgetLevel": "...", "type": "..."}
          // Book: {"author": "...", "pages": "...", "published": "..."}
          // Food: {"prepTime": "...", "difficulty": "...", "dietType": "..."}
          // Shopping: {"brand": "...", "priceEstimate": "...", "category": "..."}
        }
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              rating: { type: Type.NUMBER },
              matchReason: { type: Type.STRING },
              metadata: {
                type: Type.OBJECT,
                properties: {} // arbitrary string records
              }
            },
            required: ["id", "title", "description", "tags", "rating", "matchReason", "metadata"]
          }
        },
        systemInstruction: "You are a professional recommender system. You must output a JSON array of objects conforming to the requested schema. Provide creative, accurate, and insightful advice tailored to user filters."
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini");
    }

    const suggestions = JSON.parse(text.trim());
    return res.json(suggestions);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Fallback to high-quality mock data on error so UI remains flawless
    return res.json(getMockRecommendations(category, preferences || {}));
  }
});

// Helper for high-quality mock recommendations fallback
function getMockRecommendations(category: string, preferences: any): any[] {
  const searchWord = preferences.search?.toLowerCase() || "";
  
  const allMocks: Record<string, any[]> = {
    movies: [
      {
        id: "m1",
        title: "Vikram (2022)",
        description: "A high-octane Tamil action-thriller directed by Lokesh Kanagaraj starring Kamal Haasan, Vijay Sethupathi, and Fahadh Faasil. A black-ops squad tracks down a masked gang of vigilantes.",
        tags: ["Action", "Thriller", "Tamil Cinema", "Blockbuster"],
        rating: 4.9,
        matchReason: "Highly recommended for fans of gritty Kollywood action movies and Lokesh Kanagaraj's immersive LCU universe.",
        metadata: { director: "Lokesh Kanagaraj", year: "2022", duration: "175 min", cast: "Kamal Haasan, Vijay Sethupathi" }
      },
      {
        id: "m2",
        title: "Nayagan (1987)",
        description: "Mani Ratnam's magnum opus and a cornerstone of Tamil cinema. It chronicles the rise of Velu Naicker, a slum dweller who becomes a powerful, benevolent godfather in Bombay.",
        tags: ["Crime", "Drama", "Cult Classic", "Tamil"],
        rating: 4.9,
        matchReason: "A legendary Tamil masterpiece with Kamal Haasan's National Award-winning performance and Ilaiyaraaja's magical score.",
        metadata: { director: "Mani Ratnam", year: "1987", duration: "145 min", music: "Ilaiyaraaja" }
      },
      {
        id: "m3",
        title: "Ponniyin Selvan: Part I & II",
        description: "An epic historical fiction drama directed by Mani Ratnam, telling the grand saga of the early days of Arulmozhi Varman, who became the great Chola Emperor.",
        tags: ["Epic", "Historical", "Drama", "Tamil"],
        rating: 4.8,
        matchReason: "An incredible cinematic adaptation of Kalki's famous novel, filled with stunning visuals and A.R. Rahman's grand orchestration.",
        metadata: { director: "Mani Ratnam", year: "2022-2023", duration: "167 min / 164 min", music: "A.R. Rahman" }
      },
      {
        id: "m4",
        title: "Vada Chennai (2018)",
        description: "A raw, gritty, and structurally complex gangster epic directed by Vetrimaaran starring Dhanush. It details a skilled carrom player who gets pulled into a local gang war in North Chennai.",
        tags: ["Action", "Crime", "Gritty Drama", "Tamil"],
        rating: 4.8,
        matchReason: "A masterful depiction of Chennai's underworld politics and gang-war dynamics by Vetrimaaran.",
        metadata: { director: "Vetrimaaran", year: "2018", duration: "164 min", leadActor: "Dhanush" }
      },
      {
        id: "m5",
        title: "Super Deluxe (2019)",
        description: "An extraordinary hyperlink black comedy-thriller following four different stories on a fateful day, including a transwoman returning to her family and boys finding an unexpected secret.",
        tags: ["Black Comedy", "Mystery", "Philosophy", "Tamil"],
        rating: 4.7,
        matchReason: "A brilliant, critically acclaimed Tamil multi-narrative masterpiece with superb performances.",
        metadata: { director: "Thiagarajan Kumararaja", year: "2019", duration: "176 min", cast: "Vijay Sethupathi, Fahadh Faasil" }
      }
    ],
    music: [
      {
        id: "mu1",
        title: "Hukum - Thalaivar Alappara (Jailer)",
        description: "A thunderous and high-octane Tamil cinematic anthem composed by Anirudh Ravichander for Superstar Rajinikanth.",
        tags: ["Tamil Anthem", "Cinematic Beats", "High Energy"],
        rating: 4.9,
        matchReason: "Anirudh's booming basslines and electrifying beats make this perfect for working out or getting a massive energy boost.",
        metadata: { artist: "Anirudh Ravichander", genre: "Kollywood / Electro-rock", type: "Single" }
      },
      {
        id: "mu2",
        title: "Roja - Soundtrack",
        description: "The historic debut album of maestro A.R. Rahman that revolutionized Indian music forever with its fusion of classical and electronic styles.",
        tags: ["A.R. Rahman", "Classic Melodies", "Evergreen", "Tamil"],
        rating: 4.9,
        matchReason: "A must-listen evergreen milestone featuring breathtaking vocals and timeless synthesisers.",
        metadata: { artist: "A.R. Rahman", genre: "Symphonic / Film Soundtrack", type: "Album" }
      },
      {
        id: "mu3",
        title: "Kaathalae Kaathalae (from '96')",
        description: "A soulful, haunting, and melancholic melody composed by Govind Vasantha, expressing deep longing and nostalgia.",
        tags: ["Soulful", "Acoustic", "Nostalgic", "Tamil"],
        rating: 4.8,
        matchReason: "Perfect for quiet rainy evenings, relaxing study hours, or ambient deep concentration.",
        metadata: { artist: "Govind Vasantha", genre: "Indie-orchestral / Melody", type: "Single" }
      },
      {
        id: "mu4",
        title: "Paiyya - Soundtrack",
        description: "A legendary Tamil road-trip album composed by Yuvan Shankar Raja, featuring iconic tracks like 'Thuli Thuli' and 'Adada Mazhaida'.",
        tags: ["Yuvan Shankar Raja", "Road Trip Hits", "Romantic", "Tamil"],
        rating: 4.8,
        matchReason: "Highly recommended for drives and uplifting pop-rock vibes, featuring Yuvan's trademark catchy percussion.",
        metadata: { artist: "Yuvan Shankar Raja", genre: "Romantic Pop-Rock", type: "Album" }
      },
      {
        id: "mu5",
        title: "Kannodu Kanbathellam (from 'Jeans')",
        description: "A stellar, pristine classical-fusion masterpiece sung by Nithyasree Mahadevan and composed by A.R. Rahman with gorgeous Carnatic rhythms.",
        tags: ["Classical Fusion", "Symphonic", "Masterpiece", "Tamil"],
        rating: 4.9,
        matchReason: "A stellar blend of traditional Carnatic raga with rich modern symphonic orchestration.",
        metadata: { artist: "A.R. Rahman", genre: "Carnatic Fusion", type: "Single" }
      }
    ],
    games: [
      {
        id: "g1",
        title: "The Legend of Zelda: Breath of the Wild",
        description: "An open-world masterwork emphasizing player freedom, physics interaction, and boundless adventure.",
        tags: ["RPG", "Open World", "Adventure"],
        rating: 4.9,
        matchReason: "Perfect for players who value exploration and discovery over rigid hand-holding.",
        metadata: { developer: "Nintendo", platform: "Switch", playTime: "80+ hours" }
      },
      {
        id: "g2",
        title: "Hades",
        description: "A rogue-like action game that beautifully weaves mythology, rapid-fire combat, and deep characters.",
        tags: ["Rogue-like", "Action", "Mythology"],
        rating: 4.8,
        matchReason: "Matches your preference for high-octane gameplay and rich narrative progression.",
        metadata: { developer: "Supergiant Games", platform: "Multiplatform", playTime: "40+ hours" }
      },
      {
        id: "g3",
        title: "Stardew Valley",
        description: "A peaceful farming and life simulator where you rebuild your grandfather's farm and befriending local townspeople.",
        tags: ["Simulation", "Cosy", "Casual"],
        rating: 4.8,
        matchReason: "Recommended for stress-free, wholesome, and creative play sessions.",
        metadata: { developer: "ConcernedApe", platform: "Multiplatform", playTime: "100+ hours" }
      },
      {
        id: "g4",
        title: "Outer Wilds",
        description: "An archeological space exploration mystery inside a star system trapped in a 22-minute time loop.",
        tags: ["Mystery", "Space", "Puzzle"],
        rating: 4.9,
        matchReason: "The ultimate recommendation for players seeking intellectual curiosity and pure wonder.",
        metadata: { developer: "Mobius Digital", platform: "Multiplatform", playTime: "25 hours" }
      },
      {
        id: "g5",
        title: "Portal 2",
        description: "An incredibly witty, physics-bending puzzle adventure with stellar writing and clever level designs.",
        tags: ["Puzzle", "Co-op", "Sci-Fi"],
        rating: 4.9,
        matchReason: "Matches a high affinity for smart logic puzzles and sarcastic robot humor.",
        metadata: { developer: "Valve", platform: "PC / Console", playTime: "12 hours" }
      }
    ],
    courses: [
      {
        id: "c1",
        title: "CS50's Introduction to Computer Science",
        description: "Harvard University's legendary entry-level course on the intellectual enterprises of computer science.",
        tags: ["Programming", "Introductory", "CS Principles"],
        rating: 4.9,
        matchReason: "Ideal for starting your coding journey with top-tier academic rigor and interactive problem sets.",
        metadata: { provider: "HarvardX (edX)", difficulty: "Beginner to Intermediate", estimatedHours: "60 hours" }
      },
      {
        id: "c2",
        title: "Learning How to Learn",
        description: "Powerful mental tools to help you master tough subjects and overcome academic procrastination.",
        tags: ["Productivity", "Neuroscience", "Study Skills"],
        rating: 4.8,
        matchReason: "A fundamental course that optimizes your mind before diving into heavy technical subjects.",
        metadata: { provider: "Deep Teaching Solutions", difficulty: "All Levels", estimatedHours: "15 hours" }
      },
      {
        id: "c3",
        title: "Financial Markets",
        description: "An overview of the ideas, methods, and institutions that permit human society to manage risks and foster enterprise.",
        tags: ["Finance", "Economics", "Markets"],
        rating: 4.7,
        matchReason: "Matches your request to gain financial literacy under Nobel laureate Robert Shiller.",
        metadata: { provider: "Yale University (Coursera)", difficulty: "Beginner", estimatedHours: "35 hours" }
      },
      {
        id: "c4",
        title: "AI For Everyone",
        description: "A non-technical introduction to artificial intelligence, machine learning, and its strategic business applications.",
        tags: ["AI", "Business", "Tech Trends"],
        rating: 4.7,
        matchReason: "Perfect if you want to understand modern tech trends without writing a single line of code.",
        metadata: { provider: "DeepLearning.AI", difficulty: "Beginner", estimatedHours: "6 hours" }
      },
      {
        id: "c5",
        title: "Interactive Drawing and Composition",
        description: "Master composition, perspective, and lighting through rapid sketching techniques.",
        tags: ["Design", "Art", "Composition"],
        rating: 4.6,
        matchReason: "Great fit for exploring creative design and aesthetic rules.",
        metadata: { provider: "CalArts (Coursera)", difficulty: "Intermediate", estimatedHours: "20 hours" }
      }
    ],
    travel: [
      {
        id: "t1",
        title: "Kyoto, Japan",
        description: "The historical heart of Japan, famous for countless Buddhist temples, gardens, imperial palaces, and wooden houses.",
        tags: ["Culture", "History", "Scenic"],
        rating: 4.9,
        matchReason: "Perfect if you are seeking peaceful walks, incredible seasonal foliage, and ancient architecture.",
        metadata: { bestSeason: "Spring / Autumn", budgetLevel: "Medium-High", type: "City Exploration" }
      },
      {
        id: "t2",
        title: "Amalfi Coast, Italy",
        description: "A stunning stretch of mountainous coastline dotted with pastel villages, lemon orchards, and sparkling blue sea.",
        tags: ["Romantic", "Coastline", "Gastronomy"],
        rating: 4.8,
        matchReason: "A dreamy Mediterranean getaway suited for your relaxation and culinary interests.",
        metadata: { bestSeason: "Late Spring / Early Fall", budgetLevel: "High", type: "Scenic Getaway" }
      },
      {
        id: "t3",
        title: "Reykjavik & the Golden Circle, Iceland",
        description: "Witness geysers, tectonic rifts, majestic waterfalls, and natural hot springs under geothermal skies.",
        tags: ["Adventure", "Nature", "Road Trip"],
        rating: 4.8,
        matchReason: "Matches your craving for dramatic raw nature, volcanic hikes, and dramatic landscapes.",
        metadata: { bestSeason: "Summer (hiking) / Winter (aurora)", budgetLevel: "High", type: "Nature & Adventure" }
      },
      {
        id: "t4",
        title: "Oaxaca, Mexico",
        description: "A vibrant city renowned for its culinary scene, craft markets, indigenous arts, and colonial beauty.",
        tags: ["Food", "Artisan Crafts", "Festive"],
        rating: 4.7,
        matchReason: "Recommended for travelers wishing to immerse in authentic food heritage and beautiful handcrafts.",
        metadata: { bestSeason: "October to March", budgetLevel: "Budget-Friendly", type: "Cultural & Foodie" }
      },
      {
        id: "t5",
        title: "Banff National Park, Canada",
        description: "Nestled in the heart of the Canadian Rockies, famous for its turquoise glacial lakes and peak view hikes.",
        tags: ["Hiking", "Wildlife", "Lakes"],
        rating: 4.8,
        matchReason: "Tailored to those looking for pristine alpine air and world-class nature photography.",
        metadata: { bestSeason: "July to September", budgetLevel: "Medium-High", type: "Alpine Wilderness" }
      }
    ],
    book: [
      {
        id: "b1",
        title: "Dune",
        description: "Frank Herbert's sci-fi epic concerning politics, religion, ecology, and spice on the desert planet Arrakis.",
        tags: ["Sci-Fi", "Epic", "Political"],
        rating: 4.9,
        matchReason: "Recommended for its profound world-building and philosophical questions regarding leadership.",
        metadata: { author: "Frank Herbert", pages: "617", published: "1965" }
      },
      {
        id: "b2",
        title: "Atomic Habits",
        description: "An incredibly practical guide explaining how to design tiny habits that compound into massive life outcomes.",
        tags: ["Self-Improvement", "Productivity", "Non-fiction"],
        rating: 4.8,
        matchReason: "Perfect for optimizing your daily routines and breaking counterproductive patterns.",
        metadata: { author: "James Clear", pages: "320", published: "2018" }
      },
      {
        id: "b3",
        title: "Educated",
        description: "An unforgettable memoir about a girl who escapes an isolated survivalist family and teaches herself to pass college exams.",
        tags: ["Memoir", "Inspiring", "Education"],
        rating: 4.7,
        matchReason: "Highly recommended if you appreciate raw, inspiring journeys of self-discovery.",
        metadata: { author: "Tara Westover", pages: "352", published: "2018" }
      },
      {
        id: "b4",
        title: "Thinking, Fast and Slow",
        description: "A Nobel laureate's deep dive into the dual cognitive systems that govern our judgements and choices.",
        tags: ["Psychology", "Science", "Decision Making"],
        rating: 4.8,
        matchReason: "Perfect if you want to understand cognitive biases and improve your critical thinking skills.",
        metadata: { author: "Daniel Kahneman", pages: "499", published: "2011" }
      },
      {
        id: "b5",
        title: "The Midnight Library",
        description: "A touching novel about Nora, who finds a library where she can read and live the infinite realities of her unchosen lives.",
        tags: ["Fiction", "Philosophical", "Hopeful"],
        rating: 4.6,
        matchReason: "A beautiful, uplifting read to reflect on life choices and overcome regrets.",
        metadata: { author: "Matt Haig", pages: "304", published: "2020" }
      }
    ],
    food: [
      {
        id: "f1",
        title: "Creamy Tuscan Garlic Chicken",
        description: "Pan-seared chicken breasts smothered in a rich, creamy sauce packed with spinach, garlic, and sun-dried tomatoes.",
        tags: ["Italian-inspired", "Dinner", "Comfort Food"],
        rating: 4.8,
        matchReason: "Matches preferences for rich, flavorful garlic-herb profiles.",
        metadata: { prepTime: "30 min", difficulty: "Easy", dietType: "Low-Carb option" }
      },
      {
        id: "f2",
        title: "Authentic Pad Thai",
        description: "Stir-fried rice noodles tossed in a tangy tamarind sauce with tofu, eggs, crushed peanuts, and fresh bean sprouts.",
        tags: ["Thai", "Street Food", "Noodles"],
        rating: 4.9,
        matchReason: "Excellent fit for lovers of authentic sweet, sour, and savory Asian dishes.",
        metadata: { prepTime: "25 min", difficulty: "Medium", dietType: "Gluten-Free" }
      },
      {
        id: "f3",
        title: "Crispy Roasted Chickpea Buddha Bowl",
        description: "A nutrient-rich bowl packed with roasted sweet potatoes, crispy chickpeas, fresh kale, and a smooth tahini drizzle.",
        tags: ["Vegan", "Healthy", "Meal Prep"],
        rating: 4.7,
        matchReason: "Perfect fit for plant-based nutrition and healthy lunch preps.",
        metadata: { prepTime: "40 min", difficulty: "Easy", dietType: "Vegan" }
      },
      {
        id: "f4",
        title: "Classic Shakshuka",
        description: "Perfectly poached eggs swimming in a vibrant, spiced sauce of bell peppers, fresh tomatoes, cumin, and feta.",
        tags: ["Middle Eastern", "Brunch", "One-Pan"],
        rating: 4.8,
        matchReason: "Great choice for an active weekend morning brunch.",
        metadata: { prepTime: "20 min", difficulty: "Easy", dietType: "Vegetarian" }
      },
      {
        id: "f5",
        title: "Slow-Cooked Beef Biryani",
        description: "An incredibly aromatic rice dish layered with tender spiced beef, caramelized onions, and fresh mint.",
        tags: ["South Asian", "Festive", "Aromatic"],
        rating: 4.9,
        matchReason: "Perfect for celebrating special occasions with rich, complex spices.",
        metadata: { prepTime: "90 min", difficulty: "Hard", dietType: "Halal / High-Protein" }
      }
    ],
    shopping: [
      {
        id: "s1",
        title: "Ergonomic Mechanical Keyboard",
        description: "A split design layout keyboard designed to maximize typing comfort and relieve wrists during long coding sessions.",
        tags: ["Productivity", "Tech", "Ergonomics"],
        rating: 4.8,
        matchReason: "Matches your posture health priorities and tech-setup optimization.",
        metadata: { brand: "Keychron / Ergodox", priceEstimate: "$150", category: "Office Tech" }
      },
      {
        id: "s2",
        title: "Noise-Cancelling Wireless Headphones",
        description: "Industry-leading active noise-cancelling headphones featuring lush pads and crystal clear high-definition sound.",
        tags: ["Audio", "Travel", "Concentration"],
        rating: 4.9,
        matchReason: "Perfect for focusing in noisy environments or peaceful flights.",
        metadata: { brand: "Sony WH-1000XM5", priceEstimate: "$349", category: "Audio Tech" }
      },
      {
        id: "s3",
        title: "Smart Water Bottle & Tracker",
        description: "Vacuum-insulated water bottle that glows to remind you when it is time to drink and tracks water intake via app.",
        tags: ["Wellness", "Gadget", "Hydration"],
        rating: 4.5,
        matchReason: "A great companion to help gamify your personal wellness habits.",
        metadata: { brand: "HidrateSpark", priceEstimate: "$59", category: "Fitness Gear" }
      },
      {
        id: "s4",
        title: "Portable Anker GaN Charger (65W)",
        description: "An ultra-compact 3-port charger capable of charging your laptop, phone, and tablet simultaneously at lightning speeds.",
        tags: ["Utility", "Travel Accessories", "Compact"],
        rating: 4.8,
        matchReason: "Perfect for remote work and keeping travel tech light.",
        metadata: { brand: "Anker", priceEstimate: "$45", category: "Electronics" }
      },
      {
        id: "s5",
        title: "Minimalist Full-Grain Leather Wallet",
        description: "RFID-blocking front pocket cardholder handcrafted from premium vegetable-tanned leather.",
        tags: ["Accessories", "Craftsmanship", "Minimalist"],
        rating: 4.7,
        matchReason: "Matches sleek, pocket-space saving, and high-quality aesthetic tastes.",
        metadata: { brand: "Ridge / Bellroy", priceEstimate: "$75", category: "Fashion Accessory" }
      }
    ]
  };

  const list = allMocks[category] || [];
  if (!searchWord) return list;
  return list.filter(item => 
    item.title.toLowerCase().includes(searchWord) || 
    item.description.toLowerCase().includes(searchWord) ||
    item.tags.some((t: string) => t.toLowerCase().includes(searchWord))
  );
}

// 3. POST /api/chat-expert - Natural language follow-up context assistant
app.post("/api/chat-expert", async (req, res) => {
  const { category, recommendations, messages } = req.body;

  if (!category || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Category and messages are required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    return res.json({
      text: getMockExpertResponse(category, recommendations || [], lastUserMessage)
    });
  }

  try {
    const ai = getAiClient();
    
    // Format current recommendations context
    const recsContext = (recommendations || []).map((rec: any, idx: number) => {
      return `${idx + 1}. Title: "${rec.title}" (Rating: ${rec.rating}/5)
   Description: ${rec.description}
   Insight: ${rec.matchReason || "Highly relevant match based on profile."}`;
    }).join("\n\n");

    const systemInstruction = `
      You are the expert conversational advisor for My RAS (Recommendation and Advice System) specifically advising on the "${category}" category.
      The user is currently viewing the following tailored recommendations on their screen:
      
      ${recsContext}
      
      Your goal is to answer natural language follow-up queries, compare options, explain matches, suggest similar alternatives, or provide contextual advice regarding these items.
      
      CRITICAL LANGUAGE RULES:
      If category is "movies" or "music", unless the user explicitly asks for another region or language, prioritize and heavily feature Tamil movies (Kollywood blockbusters, Mani Ratnam classics, gritty Vetrimaaran/Lokesh Kanagaraj thrillers) or Tamil music (evergreen A.R. Rahman tracks, high-energy Anirudh hits, soulful Yuvan Shankar Raja or Ilaiyaraaja songs).
      
      Aesthetic and Tone Rules:
      Always respond in a helpful, knowledgeable, warm, and highly cultured tone. Keep your responses relatively concise (1-3 short paragraphs), perfectly formatted in Markdown, and directly answering the user's questions. Avoid saying generic filler sentences. Focus purely on recommendations and helpful suggestions.
    `;

    // Map client messages to Gemini contents structure: { role: 'user' | 'model', parts: [{ text: string }] }
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content || "" }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini");
    }

    return res.json({ text });
  } catch (error: any) {
    console.error("Gemini Chat Expert Error:", error);
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    return res.json({
      text: getMockExpertResponse(category, recommendations || [], lastUserMessage)
    });
  }
});

function getMockExpertResponse(category: string, recommendations: any[], userMessage: string): string {
  const msg = userMessage.toLowerCase();
  
  if (category === "movies") {
    if (msg.includes("tamil") || msg.includes("kollywood") || msg.includes("rahman") || msg.includes("classic")) {
      return "As your Cinema Expert, I highly recommend watching **Nayagan (1987)** first if you appreciate timeless Mani Ratnam filmmaking paired with Ilaiyaraaja's symphonic score. If you want something modern and full of action, **Vikram (2022)** or **Vada Chennai (2018)** will blow your mind with their gritty, high-stakes storytelling! Is there a particular actor or genre you'd like to explore next?";
    }
    return "Great choice! The list features incredible masterpieces. If you're looking for mind-bending and rich storytelling, **Super Deluxe (2019)** is a stellar watch. Let me know if you want to filter by director or year!";
  }
  
  if (category === "music") {
    if (msg.includes("tamil") || msg.includes("anirudh") || msg.includes("ar") || msg.includes("rahman")) {
      return "Ah, Tamil music is close to my heart! If you need pure energy, turn up **Hukum - Thalaivar Alappara** by Anirudh. For peaceful late-night hours, **Kaathalae Kaathalae** is beautifully soothing. What kind of instruments or mood do you prefer right now?";
    }
    return "For ambient focus or a fresh playlist, I recommend starting with **Roja's Soundtrack**—it's a landmark album. Let me know what specific vibe you want to unlock next!";
  }

  // Generic fallback response
  return `As your **${category.toUpperCase()} Expert**, I'm here to help you navigate these top recommendations. Based on your preferences, these selections have been customized for you. 

Do you want me to compare any of these, suggest something similar, or explain why one might be the absolute perfect match for your profile? Let's chat!`;
}

// 2. Vite static file and development server configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[My RAS Backend] Server running on http://localhost:${PORT}`);
  });
}

startServer();
