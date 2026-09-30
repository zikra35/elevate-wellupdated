jest.mock('axios');
delete process.env.OPENAI_API_KEY;
const sage = require('../../services/sage');

const user = (content) => ({ role: 'user', content });

describe('Sage chatbot', () => {
  test.each([
    'I want to kill myself',
    'i dont want to live anymore',
    'thinking about suicide',
    'I have been self-harming',
  ])('crisis message "%s" always gets helplines', async (text) => {
    const r = await sage.chat({ userId: 'u1', messages: [user(text)] });
    expect(r.crisis).toBe(true);
    expect(r.reply).toContain('1122');
    expect(r.reply).toContain('0311-7786264');
  });

  test('normal messages are not flagged as crisis', async () => {
    const r = await sage.chat({ userId: 'u1', messages: [user('I feel anxious about exams')] });
    expect(r.crisis).toBe(false);
    expect(r.source).toBe('sage');
    expect(r.reply.length).toBeGreaterThan(10);
  });

  test('keeps the conversation and remembers the name', async () => {
    const history = [user('hi, my name is ayesha')];
    const first = await sage.chat({ userId: 'u2', messages: history });
    expect(first.conversationId).toBeTruthy();
    expect(first.reply).toContain('Ayesha');

    history.push({ role: 'assistant', content: first.reply }, user('thanks'));
    const second = await sage.chat({ userId: 'u2', conversationId: first.conversationId, messages: history });
    expect(second.conversationId).toBe(first.conversationId);
    expect(second.reply).toContain('Ayesha');
  });

  test('another user cannot continue someone else\'s conversation', async () => {
    const a = await sage.chat({ userId: 'owner', messages: [user('my name is sara')] });
    const b = await sage.chat({ userId: 'intruder', conversationId: a.conversationId, messages: [user('thanks')] });
    expect(b.conversationId).not.toBe(a.conversationId);
    expect(b.reply).not.toContain('Sara');
  });

  test('answers instantly without OpenAI', async () => {
    const start = Date.now();
    await sage.chat({ userId: 'u3', messages: [user('I cant sleep')] });
    expect(Date.now() - start).toBeLessThan(200);
  });
});
