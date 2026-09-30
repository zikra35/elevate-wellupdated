// Sage: the in-app wellness companion.
//
// Runs entirely inside the Node backend so it answers instantly on Railway.
// - Conversations are kept in memory, keyed by conversationId (the client also
//   sends its message history, so a restart only loses server-side memory).
// - Crisis messages always get helplines, whatever else happens.
// - If OPENAI_API_KEY is set, replies come from OpenAI; otherwise (or if that
//   call fails) a rule-based responder answers.

const crypto = require('crypto');
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_TIMEOUT_MS = 12000;

const CONVERSATION_TTL_MS = 6 * 60 * 60 * 1000; // forget idle conversations after 6h
const MAX_CONVERSATIONS = 5000;
const MAX_HISTORY = 30;

const HELPLINES = [
  'Emergency (Rescue): 1122',
  'Umang mental health helpline: 0311-7786264',
];

const CRISIS_REPLY =
  "I'm really sorry you're feeling this way, and I'm glad you told me. Your safety matters most right now.\n\n" +
  "Please reach out for immediate support:\n" +
  HELPLINES.map((h) => `• ${h}`).join('\n') +
  "\n\nIf you're outside Pakistan, please call your local emergency number. " +
  "If you can, contact someone you trust and let them know how you're feeling, and try not to be alone right now. " +
  "I'm here to keep talking with you too. Would you like to tell me what's happening?";

const SYSTEM_PROMPT = `You are Sage, a warm, calm wellness companion inside the Elevate Well app.
- You are not a therapist and do not diagnose or treat. Encourage professional help for serious or ongoing concerns.
- Listen, reflect feelings back, and ask one thoughtful follow-up question at a time.
- Offer small practical coping ideas (breathing, grounding, movement, sleep hygiene, journaling) when useful.
- Keep replies short: 2 to 4 sentences, plain text, no headings.
- Remember what the user already told you in this conversation and refer back to it naturally.
- If the user mentions suicide, self-harm, or being in danger, tell them to call 1122 (Pakistan emergency) or Umang 0311-7786264 right away.`;

const CRISIS_PATTERNS = [
  /\bkill(ing)?\s+(my\s*self|me)\b/i,
  /\bsuicid/i,
  /\bend\s+(my|it)\s+(life|all)\b/i,
  /\bwant\s+to\s+die\b/i,
  /\b(don'?t|do not)\s+want\s+to\s+(live|be alive|exist)\b/i,
  /\bself[-\s]?harm/i,
  /\b(cut|hurt|harm)(ting)?\s+my\s*self\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
  /\bbetter\s+off\s+(dead|without me)\b/i,
  /\boverdose\b/i,
  /\bkhudkushi\b/i,
];

function isCrisis(text) {
  return CRISIS_PATTERNS.some((re) => re.test(text || ''));
}

// Topic -> keywords + reply variants. Replies may use {name}.
const TOPICS = [
  {
    key: 'greeting',
    match: /^(hi|hello|hey|salam|assalam|good (morning|afternoon|evening))\b/i,
    replies: [
      "Hi{name}, I'm Sage. How are you feeling today, honestly?",
      "Hello{name}! It's good to see you. What's on your mind right now?",
    ],
  },
  {
    key: 'anxiety',
    match: /\b(anxious|anxiety|panic|nervous|worried|worry|overthink|scared|fear)/i,
    replies: [
      "Anxiety can make everything feel urgent. Let's slow it down together: breathe in for 4, hold for 4, out for 6, a few times. What is the worry that keeps coming back?",
      "That sounds really uncomfortable{name}. Try grounding for a moment: name 5 things you can see, 4 you can touch, 3 you can hear. When did you first notice feeling this way today?",
      "Worry often tries to solve tomorrow's problems today. Is this something you can act on now, or something you'd like to set down for a while?",
    ],
  },
  {
    key: 'stress',
    match: /\b(stress|stressed|overwhelm|pressure|burn(ed|t)?\s*out|too much|deadline|exam|workload)/i,
    replies: [
      "It sounds like a lot is landing on you at once. If you listed everything on your plate, which one thing would make the biggest difference if it were done?",
      "Feeling stretched thin is exhausting{name}. Even a 5-minute break with a short walk or some slow breathing can reset your nervous system. What's weighing on you most?",
      "Pressure like that can make it hard to think clearly. Would it help to break things into smaller steps together?",
    ],
  },
  {
    key: 'sad',
    match: /\bnot\s+(good|great|okay|ok|fine|happy|well)\b|\b(sad|down|depress|unhappy|cry|crying|empty|hopeless|low|miserable|hurt)/i,
    replies: [
      "I'm sorry you're feeling this way{name}. It's okay to not be okay. Do you know what's been bringing this feeling on?",
      "That sounds heavy. You don't have to carry it alone. What would feel even a little bit comforting right now?",
      "Thank you for trusting me with this. If this low mood has lasted for weeks, talking to a counsellor could really help. What's been the hardest part lately?",
    ],
  },
  {
    key: 'sleep',
    match: /\b(sleep|insomnia|tired|exhausted|can'?t sleep|awake|fatigue|nap)/i,
    replies: [
      "Poor sleep affects everything. A few things that help: a fixed wake time, dim screens an hour before bed, and a short wind-down routine. What does your evening usually look like?",
      "Being tired all the time is draining{name}. Is it trouble falling asleep, staying asleep, or not getting enough hours?",
      "When your mind races at night, try writing tomorrow's to-do list before bed, then some slow 4-7-8 breathing. What tends to keep you up?",
    ],
  },
  {
    key: 'anger',
    match: /\b(angry|anger|mad|furious|frustrat|annoy|irritat|rage)/i,
    replies: [
      "Anger usually tells us something important was crossed. What happened that brought this up?",
      "That sounds really frustrating{name}. Before responding to anyone, it can help to move your body or take ten slow breaths. What would you like to happen next?",
    ],
  },
  {
    key: 'lonely',
    match: /\b(lonely|alone|isolated|no friends|nobody|left out)/i,
    replies: [
      "Feeling lonely can hurt a lot. Is there one person, even someone you haven't spoken to in a while, you could send a short message to today?",
      "I'm glad you're talking to me{name}. Loneliness is more common than it feels. When do you notice it most?",
    ],
  },
  {
    key: 'relationships',
    match: /\b(friend|family|parent|mother|father|mom|dad|partner|boyfriend|girlfriend|husband|wife|relationship|breakup|fight)/i,
    replies: [
      "Relationships can bring up so much. How are you feeling about what happened with them?",
      "That sounds complicated{name}. What do you wish they understood about how you feel?",
    ],
  },
  {
    key: 'motivation',
    match: /\b(motivat|lazy|procrastinat|can'?t focus|unfocused|stuck|no energy)/i,
    replies: [
      "Motivation often follows action rather than coming first. What's the smallest possible step you could take in the next 10 minutes?",
      "Feeling stuck is frustrating{name}. Try a 25-minute focus block with a 5-minute break, and be kind to yourself if it's not perfect. What are you trying to get started on?",
    ],
  },
  {
    key: 'breathing',
    match: /\b(breath|breathe|calm down|relax|meditat)/i,
    replies: [
      "Let's try one together: breathe in through your nose for 4, hold for 7, and out slowly through your mouth for 8. Repeat 4 times. You can also use the Breathing tab for a guided version. How do you feel after?",
      "Box breathing is simple: in for 4, hold 4, out 4, hold 4. A few rounds can settle your body. Want to tell me what's making you tense?",
    ],
  },
  {
    key: 'positive',
    match: /\b(good|great|happy|better|fine|okay|ok|amazing|excited|proud|grateful)\b/i,
    replies: [
      "I'm really glad to hear that{name}! What's been going well for you?",
      "That's lovely. Noticing good moments helps them stick. What made today feel that way?",
    ],
  },
  {
    key: 'thanks',
    match: /\b(thank|thanks|shukriya|appreciate)/i,
    replies: [
      "You're very welcome{name}. I'm here whenever you want to talk.",
      "Anytime{name}. Taking time to look after yourself matters. Is there anything else on your mind?",
    ],
  },
];

const FOLLOW_UPS = [
  "I hear you. Can you tell me a bit more about that?",
  "Thank you for sharing that{name}. How has it been affecting your day-to-day?",
  "That makes sense. What do you think would help you feel even slightly better right now?",
  "I'm listening. What feels most important to talk about?",
  "It sounds like this matters to you. What have you tried so far?",
];

// conversationId -> { userId, messages: [{role, content}], name, topics: [], used: Set, updatedAt }
const conversations = new Map();

function pruneConversations() {
  const now = Date.now();
  for (const [id, conv] of conversations) {
    if (now - conv.updatedAt > CONVERSATION_TTL_MS) conversations.delete(id);
  }
  while (conversations.size > MAX_CONVERSATIONS) {
    conversations.delete(conversations.keys().next().value);
  }
}

function getConversation(conversationId, userId, clientMessages) {
  pruneConversations();
  let conv = conversationId ? conversations.get(conversationId) : null;
  if (conv && conv.userId !== userId) conv = null; // never share across users

  if (!conv) {
    conversationId = crypto.randomUUID();
    conv = { userId, messages: [], name: null, topics: [], used: new Set(), updatedAt: Date.now() };
    // Seed from the history the client sent (e.g. after a server restart)
    for (const m of clientMessages.slice(0, -1)) {
      if ((m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') {
        conv.messages.push({ role: m.role, content: m.content.slice(0, 2000) });
        if (m.role === 'user') rememberFacts(conv, m.content);
      }
    }
    conversations.set(conversationId, conv);
  }
  return { conversationId, conv };
}

function rememberFacts(conv, text) {
  const nameMatch = text.match(/\b(?:my name is|i am called|call me)\s+([A-Za-z][A-Za-z'-]{1,20})/i);
  if (nameMatch) conv.name = nameMatch[1][0].toUpperCase() + nameMatch[1].slice(1);
  for (const topic of TOPICS) {
    if (!['greeting', 'thanks', 'positive'].includes(topic.key) && topic.match.test(text)) {
      if (!conv.topics.includes(topic.key)) conv.topics.push(topic.key);
    }
  }
}

function pick(conv, options) {
  const fresh = options.filter((o) => !conv.used.has(o));
  const choice = (fresh.length ? fresh : options)[Math.floor(Math.random() * (fresh.length || options.length))];
  conv.used.add(choice);
  return choice.replace('{name}', conv.name ? `, ${conv.name}` : '');
}

const TOPIC_LABELS = {
  anxiety: 'feeling anxious',
  stress: 'feeling under pressure',
  sad: 'feeling low',
  sleep: 'trouble with sleep',
  anger: 'feeling frustrated',
  lonely: 'feeling lonely',
  relationships: 'something with the people close to you',
  motivation: 'feeling stuck',
};

function ruleBasedReply(conv, text) {
  const trimmed = text.trim();
  const nameJustGiven = /\b(?:my name is|i am called|call me)\b/i.test(trimmed);
  if (nameJustGiven && conv.name) {
    return `It's nice to meet you, ${conv.name}. How are you feeling today?`;
  }

  // Prefer the most specific topic (greeting/positive/thanks only if nothing else matches)
  const matches = TOPICS.filter((t) => t.match.test(trimmed));
  const specific = matches.find((t) => !['greeting', 'positive', 'thanks'].includes(t.key));
  const topic = specific || matches[0];
  if (topic) return pick(conv, topic.replies);

  // Refer back to something the user told us earlier
  const earlier = conv.topics.filter((k) => TOPIC_LABELS[k]);
  if (earlier.length && conv.messages.length > 2 && Math.random() < 0.5) {
    const label = TOPIC_LABELS[earlier[earlier.length - 1]];
    return `Earlier you mentioned ${label}. Is that connected to what you're sharing now?`;
  }
  return pick(conv, FOLLOW_UPS);
}

async function openAiReply(conv) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: OPENAI_MODEL,
      temperature: 0.7,
      max_tokens: 300,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...conv.messages.slice(-MAX_HISTORY)],
    },
    {
      timeout: OPENAI_TIMEOUT_MS,
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    }
  );
  const reply = response.data?.choices?.[0]?.message?.content?.trim();
  if (!reply) throw new Error('Empty OpenAI response');
  return reply;
}

/**
 * Produce Sage's reply.
 * @param {object} args
 * @param {string} args.userId
 * @param {string} [args.conversationId]
 * @param {Array<{role: string, content: string}>} args.messages  full client history, last one is the user's
 */
async function chat({ userId, conversationId, messages }) {
  const last = messages[messages.length - 1];
  const text = String(last.content || '').slice(0, 2000);
  const { conversationId: id, conv } = getConversation(conversationId, userId, messages);

  conv.messages.push({ role: 'user', content: text });
  rememberFacts(conv, text);

  let reply;
  let source;
  if (isCrisis(text)) {
    reply = CRISIS_REPLY;
    source = 'sage-safety';
  } else if (OPENAI_API_KEY) {
    try {
      reply = await openAiReply(conv);
      source = 'openai';
      // Belt and braces: if the model missed a crisis cue in context, still add helplines
      if (conv.messages.slice(-4).some((m) => m.role === 'user' && isCrisis(m.content)) && !reply.includes('1122')) {
        reply += `\n\nIf you're in danger, please call ${HELPLINES.join(' or ')}.`;
      }
    } catch (error) {
      console.warn('[Sage] OpenAI failed, using built-in replies:', error.message);
    }
  }
  if (!reply) {
    reply = ruleBasedReply(conv, text);
    source = 'sage';
  }

  conv.messages.push({ role: 'assistant', content: reply });
  if (conv.messages.length > MAX_HISTORY * 2) conv.messages.splice(0, conv.messages.length - MAX_HISTORY * 2);
  conv.updatedAt = Date.now();

  return { reply, conversationId: id, source, crisis: source === 'sage-safety' };
}

module.exports = { chat, isCrisis, HELPLINES };
