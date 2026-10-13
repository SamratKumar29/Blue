import { chromium } from 'playwright-core';
import os from 'node:os';
const exe = process.env.CHROME_PATH || `${os.homedir()}/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`;
const OUT = process.env.OUT_DIR || 'docs/screens';
const BASE = process.env.BASE_URL || 'http://localhost:8099';
const results = [];
const ok = (name, cond, extra='') => { results.push([cond ? 'PASS' : 'FAIL', name, extra]); };

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
process.on('exit', () => { for (const r of results) console.log(r.join(' ')); console.log('console errors:', errors.length, errors.slice(0,5)); });
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));

await page.goto(BASE);
await page.getByRole('dialog', { name: /set up your blue|Set up/i }).waitFor({ timeout: 8000 }).catch(()=>{});
ok('Permission Center shows on first run', await page.getByText('Set up your Blue').isVisible());
ok('Codebase access: never shown', await page.getByText(/Codebase access/).first().isVisible());
await page.screenshot({ path: `${OUT}/permission-center.png` });
await page.getByRole('radio', { name: 'Laptop awake' }).click();
await page.getByRole('button', { name: 'Start my Blue' }).click();
await page.waitForTimeout(600);
ok('Permission Center gone after start', !(await page.getByText('Set up your Blue').isVisible().catch(()=>false)));
await page.reload(); await page.waitForTimeout(800);
ok('Permission Center does not reappear', !(await page.getByText('Set up your Blue').isVisible().catch(()=>false)));
ok('Greeting visible', await page.getByText(/Good (morning|afternoon|evening), Alex/).isVisible());
await page.screenshot({ path: `${OUT}/home.png` });

// Roundup flow
await page.getByRole('button', { name: /Your day, simplified/ }).click();
await page.getByRole('button', { name: /make it a great day/i }).click();
await page.screenshot({ path: `${OUT}/permission-request.png` });
await page.getByRole('button', { name: 'Allow', exact: true }).click();
await page.getByText('Your day, simplified').nth(1).waitFor({ timeout: 15000 }).catch(()=>{});
const lines = await page.locator('li:has(span.rounded-full)').count();
ok('Roundup shows lines with chips', lines >= 4, `lines=${lines}`);
ok('Roundup banner says offline demo (no model configured)', await page.getByText(/Offline demo mode/).first().isVisible());
await page.screenshot({ path: `${OUT}/roundup.png` });
await page.getByRole('button', { name: 'Done' }).click();

// Tasks + why
await page.goto(BASE + '/tasks'); await page.waitForTimeout(700);
const rows = await page.locator('li input[type=checkbox]').count();
ok('Tasks page shows triaged tasks', rows >= 6, `rows=${rows}`);
await page.getByRole('button', { name: /Why is .*production bug/i }).first().click();
ok('Why? popover shows reason', await page.getByText('Reason:').first().isVisible());
await page.screenshot({ path: `${OUT}/tasks-why.png` });

// Ask senior with writes OFF
await page.getByRole('button', { name: /Ask a senior about .*production bug/i }).first().click();
await page.getByText('Why this person:').waitFor();
ok('Ask senior suggests DevOps (Amir)', (await page.locator('select').nth(1).inputValue()) === 'p2');
await page.getByRole('button', { name: /Review & send/ }).click();
await page.getByText('Write actions are off.').waitFor({ timeout: 5000 }).catch(()=>{});
ok('Write blocked while writing is off', await page.getByText('Write actions are off.').isVisible());
await page.screenshot({ path: `${OUT}/ask-senior-blocked.png` });
await page.getByRole('button', { name: /Turn on writing/ }).click();
await page.getByRole('button', { name: /Review & send/ }).click();
await page.getByRole('alertdialog').waitFor();
ok('Approval dialog says nothing is actually sent', await page.getByText('Demo: nothing is actually sent.').isVisible());
await page.screenshot({ path: `${OUT}/approval.png` });
await page.getByRole('button', { name: 'Approve' }).click();
await page.getByText(/Request sent to/).waitFor({ timeout: 5000 });
ok('Request sent step reached', true);
await page.getByRole('button', { name: /reply \(simulated\)/ }).click();
await page.getByRole('button', { name: 'Accept' }).click();
await page.getByText(/Proposed meeting/).waitFor({ timeout: 6000 });
await page.getByRole('button', { name: /Allow & Schedule/ }).click();
await page.getByRole('alertdialog').waitFor();
await page.getByRole('button', { name: 'Approve' }).click();
await page.getByText(/meeting has been scheduled/).waitFor({ timeout: 5000 });
ok('Meeting scheduled through the gate', true);
await page.screenshot({ path: `${OUT}/meeting-scheduled.png` });
await page.keyboard.press('Escape');

await page.goto(BASE + '/outbox'); await page.waitForTimeout(500);
ok('Outbox has the approved message + event', (await page.locator('pre').count()) >= 2, `n=${await page.locator('pre').count()}`);


// ---- Quick actions
await page.goto(BASE + '/'); await page.waitForTimeout(600);
await page.getByRole('button', { name: 'Create Task' }).click();
await page.getByRole('dialog', { name: 'Create task' }).getByRole('textbox').first().fill('Write launch notes');
await page.getByRole('button', { name: 'Add task' }).click();
await page.waitForTimeout(500);
await page.goto(BASE + '/tasks'); await page.waitForTimeout(500);
ok('Create Task adds a manual task', await page.getByText('Write launch notes').first().isVisible());

await page.goto(BASE + '/'); await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Summarize', exact: true }).click();
await page.getByLabel('Text to summarize').fill('The release moved to Friday. QA found two issues in checkout. Legal still needs to approve the banner text. Marketing waits for the final date.');
await page.getByRole('button', { name: 'Summarize', exact: true }).last().click();
await page.waitForTimeout(600);
ok('Summarize returns 3 bullets', (await page.locator('li.bg-blue-50').count()) === 3);
await page.keyboard.press('Escape');

const outboxBefore = await (async () => { await page.goto(BASE + '/outbox'); await page.waitForTimeout(300); return page.locator('pre').count(); })();
await page.goto(BASE + '/'); await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Write', exact: true }).click();
await page.getByPlaceholder(/Ask if we can move/).fill('Ask if we can move the design review to Thursday');
await page.getByRole('button', { name: 'Draft it' }).click();
await page.getByRole('button', { name: /Review & send/ }).waitFor({ timeout: 5000 });
ok('Write produces an editable draft', (await page.locator('textarea').nth(1).inputValue()).length > 20);
await page.getByRole('button', { name: /Review & send/ }).click();
await page.getByRole('alertdialog').waitFor();
await page.getByRole('button', { name: 'Cancel', exact: true }).last().click();
await page.keyboard.press('Escape');
await page.goto(BASE + '/outbox'); await page.waitForTimeout(300);
ok('Cancelled send adds nothing to the outbox', (await page.locator('pre').count()) === outboxBefore);

// ---- Chat: grounded + tone aware
await page.goto(BASE + '/chat'); await page.waitForTimeout(400);
await page.getByRole('button', { name: 'What is our escalation policy?' }).click();
await page.getByText('📄 incident-escalation').waitFor({ timeout: 6000 }).catch(()=>{});
ok('Chat cites the policy document', await page.getByText('📄 incident-escalation').isVisible());
await page.getByLabel('Message to Blue').fill('this is stupid, I am done with this');
await page.getByRole('button', { name: 'Send' }).click();
await page.getByText(/pause|smallest next step/i).first().waitFor({ timeout: 6000 }).catch(()=>{});
ok('Angry message gets a calm, non-judgmental reply', await page.getByText(/frustrating/i).first().isVisible());
ok('No scores or labels in chat', !(await page.getByText(/\bscores?\b|\brating\b|mood:/i).first().isVisible().catch(()=>false)));

// ---- Check-in
await page.goto(BASE + '/'); await page.waitForTimeout(500);
await page.getByRole('button', { name: 'More', exact: true }).click();
await page.getByRole('button', { name: /Wellbeing check-in/ }).click();
await page.getByRole('radio', { name: /Stressed/ }).click();
ok('Check-in gives a supportive reply', await page.getByText(/shrink it/i).isVisible());
await page.getByRole('button', { name: 'Start', exact: true }).click();
await page.waitForTimeout(2300);
const timer = await page.getByRole('timer').innerText();
ok('Focus timer counts down', /^24:5\d$/.test(timer) || /^24:4\d$/.test(timer), timer);
await page.getByRole('button', { name: 'Make it smaller' }).click();
await page.waitForTimeout(500);
ok('Task is broken into 3-5 steps', (await page.locator('ol > li').count()) >= 3);
await page.screenshot({ path: `${OUT}/checkin.png` });
await page.keyboard.press('Escape');

// ---- Regroup persists + celebration
await page.goto(BASE + '/tasks'); await page.waitForTimeout(500);
await page.getByRole('button', { name: /Move "Write launch notes"/ }).click();
await page.getByRole('menuitem', { name: 'Needs senior help' }).click();
await page.waitForTimeout(400);
await page.reload(); await page.waitForTimeout(700);
const card = page.locator('div.bg-white', { has: page.getByRole('button', { name: /Needs senior help/ }) }).first();
ok('Manual regroup persists after reload', await card.getByText('Write launch notes').isVisible());
await page.getByRole('checkbox', { name: /Mark "Write launch notes" done/ }).click();
await page.getByText('Task Completed!').waitFor({ timeout: 6000 }).catch(()=>{});
ok('Completing a task shows specific praise', await page.getByText(/You closed/).first().isVisible());
await page.screenshot({ path: `${OUT}/celebrate.png` });
await page.keyboard.press('Escape');

// ---- Roundup badge at 09:05 (fresh profile: no roundup yet today)
{
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p2 = await ctx2.newPage();
  await p2.goto(BASE);
  await p2.getByRole('radio', { name: 'Laptop awake' }).click();
  await p2.getByRole('button', { name: 'Start my Blue' }).click();
  await p2.waitForTimeout(600);
  await p2.goto(BASE + '/?settings=1&demo=1'); await p2.waitForTimeout(600);
  await p2.getByRole('radio', { name: 'Work hours only' }).click();
  await p2.keyboard.press('Escape');
  await p2.getByRole('button', { name: '09:05' }).click();
  await p2.waitForTimeout(500);
  await p2.getByRole('button', { name: /Open Blue menu/ }).hover();
  ok('Bubble offers the roundup in preroll', await p2.getByRole('button', { name: "Here's your roundup" }).isVisible());
  await p2.screenshot({ path: `${OUT}/bubble.png` });
  await ctx2.close();
}

// Settings / privacy
await page.goto(BASE + '/?settings=1'); await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/settings.png` });
await page.getByRole('button', { name: 'Privacy & Data' }).click();
ok('Audit log has blocked entry', await page.getByText('Blocked').first().isVisible());
ok('Audit log has excluded codebase entry', await page.getByText(/excluded: codebase content/).first().isVisible());
await page.screenshot({ path: `${OUT}/privacy.png` });
await page.keyboard.press('Escape');

// Pause
await page.goto(BASE + '/chat'); await page.waitForTimeout(500);
await page.getByRole('button', { name: /Open Blue menu/ }).hover();
await page.getByRole('button', { name: /Pause Blue/ }).click();
await page.getByLabel('Message to Blue').fill('hello');
await page.getByRole('button', { name: 'Send' }).click();
await page.getByText('Blue is paused.').first().waitFor({ timeout: 4000 }).catch(()=>{});
ok('Paused Blue refuses to answer', await page.getByText(/Blue is paused/).first().isVisible());

// Resume via settings, then demo clock sleeping
await page.goto(BASE + '/?settings=1'); await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Privacy & Data' }).click();
await page.getByRole('switch', { name: 'Pause Blue' }).click();
await page.waitForTimeout(500);
ok('Resume persisted', (await page.getByRole('switch', { name: 'Pause Blue' }).getAttribute('aria-checked')) === 'false');
await page.keyboard.press('Escape');
await page.goto(BASE + '/?settings=1&demo=1'); await page.waitForTimeout(700);
await page.getByRole('radio', { name: 'Work hours only' }).click();
await page.keyboard.press('Escape');
await page.getByRole('button', { name: '19:00' }).click();
await page.waitForTimeout(500);
ok('Sleeping card at 19:00', await page.getByText(/resting outside your work hours/).isVisible(), (await page.getByRole('region', { name: 'Demo clock' }).innerText()).replace(/\n/g,' '));
await page.screenshot({ path: `${OUT}/sleeping.png` });
await page.getByRole('button', { name: '09:05' }).click();
await page.waitForTimeout(500);
ok('Preroll/active at 09:05 shows dashboard', await page.getByText(/Good (morning|afternoon|evening)/).isVisible().catch(()=>false));

// Clear my Blue
await page.goto(BASE + '/?settings=1'); await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Privacy & Data' }).click();
await page.getByRole('button', { name: 'Clear my Blue' }).click();
await page.getByRole('button', { name: 'Yes, clear' }).click();
await page.waitForTimeout(800);
ok('Clear my Blue returns to Permission Center', await page.getByText('Set up your Blue').isVisible());

for (const r of results) console.log(r.join(' | '));
console.log('CONSOLE ERRORS:', errors.length, errors.slice(0,5));
await browser.close();
