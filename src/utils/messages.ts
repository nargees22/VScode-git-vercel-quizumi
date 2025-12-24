export const CORRECT_MESSAGES = [
  "Your answer deserves a spot in the next town hall.",
    "Correct — even the audit team wouldn't question that.",
    "That was cleaner than a freshly wiped whiteboard.",
    "Approved faster than a manager saying ‘Let’s close for today.’",
    "Correct — HR would make a poster out of this.",
    "That hit the mark like a perfectly timed long weekend.",
     "Correct — you just made half the leadership deck irrelevant.",
    "That answer was so good it deserves its own Jira ticket.",
    "Right! Even your VPN would approve this instantly.",
    "Spot on — this belongs in the next quarterly report.",
    "Correct — you just outperformed the project timeline.",
    "That was cleaner than your unread emails folder.",
    "You nailed it — even Finance can’t cut this down.",
    "Correct — this deserves an automatic ‘Exceeds Expectations.’"
];

export const INCORRECT_MESSAGES = [
 "Close… but not close enough for a performance bonus.",
    "That answer felt like a Monday morning without coffee.",
    "More off-track than a meeting that ‘should’ve been an email.’",
    "Wrong — but at least you tried, unlike half the project stakeholders.",
    "That was as unexpected as a 5 PM calendar invite.",
    "Missed it — but hey, even servers crash.",
    "That answer took a detour longer than your reimbursement cycle.",
     "Incorrect — this is why status meetings exist.",
    "That answer needs more revision than your last project plan.",
    "Incorrect — not even AI could defend that one.",
    "That was off-track, like a meeting that ‘won’t take more than 5 minutes.’"
];

export const LIFELINE_TIPS = [
 "Don’t waste your Point Doubler on a guess — this isn’t HR’s appraisal lottery.",
 "If you're unsure between four options, a 50:50 won’t save you — only divine intervention will.",
 "Save your lifelines for later… unless your confidence drops faster than your Monday productivity.",
    "Point Doubler works best when you ACTUALLY know the answer — not when you're gambling like month-end sales.",
    "If the leader is pulling away, stop panicking and start doubling. It's not your career, relax.",
    "Using 50:50 on a wild guess is like attending a meeting without reading the agenda — pointless.",
    "Final question? Throw that Point Doubler like you're filing your leave request before a long weekend.",
    "Remember — every time you misuse 50:50, someone in Finance feels personally attacked.",
    "Don’t burn all your lifelines early — this isn't your data pack on the first day of the month.",
    "If you're already last, what are you saving lifelines for? Christmas? Go full send.",
    "Use 50:50 wisely. Wrong timing = same regret as checking emails on a Sunday.",
    "A Point Doubler on a wrong answer hurts more than a surprise 5 PM meeting.",
    "If you're confused, breathe. Then use 50:50. Then still be confused, probably.",
    "Don’t hoard lifelines like your unused vacation days — use them before it’s too late.",
    "When in doubt, wait. Panic decisions never end well — ask any project manager."
];

const getUniqueItem = (items: string[], storageKey: string): string => {
    let usedIndices: number[] = [];
    try {
        usedIndices = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
    } catch (e) {
        usedIndices = [];
    }

    let availableIndices = items
        .map((_, i) => i)
        .filter(i => !usedIndices.includes(i));

    if (availableIndices.length === 0) {
        sessionStorage.removeItem(storageKey);
        usedIndices = [];
        availableIndices = items.map((_, i) => i);
    }

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const item = items[randomIndex];
    
    usedIndices.push(randomIndex);
    sessionStorage.setItem(storageKey, JSON.stringify(usedIndices));

    return item;
};

export const getUniqueMessage = (isCorrect: boolean): string => {
    const messages = isCorrect ? CORRECT_MESSAGES : INCORRECT_MESSAGES;
    const storageKey = isCorrect ? 'usedCorrectMessages' : 'usedIncorrectMessages';
    return getUniqueItem(messages, storageKey);
};

export const getUniqueTip = (): string => {
    return getUniqueItem(LIFELINE_TIPS, 'usedLifelineTips');
};