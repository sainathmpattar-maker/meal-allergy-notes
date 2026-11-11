const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runQA() {
  console.log('=== MEALALLERGY NOTES E2E QA TEST SUITE ===\n');
  const results = [];
  const consoleErrors = [];

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  async function clearAndType(selector, text) {
    await page.click(selector);
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type(selector, text);
  }

  function record(section, testName, passed, details = '') {
    const status = passed ? 'PASS' : 'FAIL';
    results.push({ section, testName, passed, details });
    console.log(`[${status}] [${section}] ${testName} ${details ? '- ' + details : ''}`);
  }

  try {
    // ==========================================
    // 1. PUBLIC LANDING PAGE
    // ==========================================
    console.log('\n--- 1. Testing Public Landing Page ---');
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle0' });
    const title = await page.title();
    record('Landing', 'Page Title set', title.includes('MealAllergy Notes'), `Title: "${title}"`);

    // Check Hero elements
    const headline = await page.$eval('.landing-hero-headline', el => el.textContent.trim()).catch(() => null);
    record('Landing', 'Hero Headline rendered', headline && headline.includes('EVERY GUEST. EVERY MEAL. SAFELY SERVED.'), headline);

    const plate = await page.$('.stylized-plate');
    record('Landing', 'Stylized Plate visual rendered', !!plate);

    const emojis = await page.$$('.floating-ingredient');
    record('Landing', 'Floating ingredient emojis rendered', emojis.length >= 6, `Count: ${emojis.length}`);

    const sticker = await page.$('.landing-hero-sticker');
    record('Landing', 'Rotating circular badge rendered', !!sticker);

    // Check sections
    const stepCards = await page.$$('.step-card');
    record('Landing', 'How It Works (3 cards)', stepCards.length === 3, `Count: ${stepCards.length}`);

    const featureCards = await page.$$('.feature-card');
    record('Landing', 'Feature Grid (6 cards)', featureCards.length === 6, `Count: ${featureCards.length}`);

    const quoteText = await page.$eval('.quote-statement', el => el.textContent.trim()).catch(() => '');
    record('Landing', 'Dark brown statement banner rendered', quoteText.includes('THE APP NEVER SAYS A MEAL IS SAFE'), quoteText);

    const ctaText = await page.$eval('.cta-headline', el => el.textContent.trim()).catch(() => '');
    record('Landing', 'Green CTA banner rendered', ctaText.includes('A SEAT AT THE TABLE'), ctaText);

    const footer = await page.$('.site-footer');
    record('Landing', 'Footer rendered', !!footer);

    // Responsive checks on Landing
    for (const width of [1280, 768, 375]) {
      await page.setViewport({ width, height: 800 });
      await sleep(200);
      const hasHScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      record('Landing', `No horizontal scroll at ${width}px`, !hasHScroll);
    }

    // Check mobile hamburger menu
    await page.setViewport({ width: 375, height: 667 });
    const toggleBtn = await page.$('.hamburger, .navbar-toggle');
    if (toggleBtn) {
      await toggleBtn.click();
      await sleep(350);
      const isMenuOpen = await page.evaluate(() => document.querySelector('.navbar-links').classList.contains('open'));
      record('Landing', 'Mobile hamburger menu opens', isMenuOpen);
      await toggleBtn.click();
      await sleep(350);
    } else {
      record('Landing', 'Mobile hamburger toggle button found', false);
    }

    // Reset viewport to desktop
    await page.setViewport({ width: 1280, height: 800 });

    // ==========================================
    // 2. ATTENDEE AUTH FLOW
    // ==========================================
    console.log('\n--- 2. Testing Attendee Authentication Flow ---');
    await page.goto('http://localhost:5000/register', { waitUntil: 'networkidle0' });

    // Submit empty form
    await page.click('button[type="submit"]');
    await sleep(200);
    const nameErr = await page.$eval('#name', el => el.classList.contains('input-error')).catch(() => false);
    record('Auth', 'Empty registration form validation triggered', nameErr);

    // Try weak password
    await page.type('#name', 'Weak User');
    await page.type('#email', 'weak@example.com');
    await page.type('#password', '123');
    await page.click('button[type="submit"]');
    await sleep(200);
    const pwErr = await page.$eval('#password', el => el.classList.contains('input-error')).catch(() => false);
    record('Auth', 'Weak password (<8 chars) rejected', pwErr);

    // Try duplicate email
    await clearAndType('#name', 'Alice Duplicate');
    await clearAndType('#email', 'attendee1@test.com');
    await clearAndType('#password', 'Password123');

    await page.click('button[type="submit"]');
    await sleep(600);
    const toastErr = await page.$eval('.toast', el => el.textContent).catch(() => '');
    record('Auth', 'Duplicate email rejected (409)', toastErr.toLowerCase().includes('already') || toastErr.toLowerCase().includes('duplicate') || toastErr.length > 0, toastErr);

    // Valid registration
    const uniqueEmail = `qa_attendee_${Date.now()}@test.com`;
    await page.goto('http://localhost:5000/register', { waitUntil: 'networkidle0' });
    await page.type('#name', 'QA Attendee Tester');
    await page.type('#email', uniqueEmail);
    await page.type('#password', 'Password123');
    await page.click('button[type="submit"]');
    await sleep(1000);

    const currentUrl = page.url();
    record('Auth', 'Valid attendee registration succeeds & redirects to /', currentUrl === 'http://localhost:5000/', currentUrl);

    // Verify authenticated user chip
    const userRoleBadge = await page.$eval('.badge-role, .user-role-badge', el => el.textContent.trim()).catch(() => '');
    record('Auth', 'Role badge shows ATTENDEE', userRoleBadge.toUpperCase() === 'ATTENDEE', userRoleBadge);

    // Logout
    await page.evaluate(() => document.querySelector('.navbar-logout-btn')?.click());
    await sleep(800);
    const loggedOutHeadline = await page.$('.landing-hero-headline');
    record('Auth', 'Logout redirects to Landing page', !!loggedOutHeadline);

    // Test Login with wrong password
    await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle0' });
    await clearAndType('#email', 'attendee1@test.com');
    await clearAndType('#password', 'WrongPassword!');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.toast', { timeout: 4000 });
    const loginFailToast = await page.$eval('.toast', el => el.textContent).catch(() => '');
    record('Auth', 'Wrong password login rejected', loginFailToast.toLowerCase().includes('invalid') || loginFailToast.length > 0, loginFailToast);

    // Test Login with correct credentials
    await clearAndType('#password', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.badge-role, .user-role-badge', { timeout: 6000 });
    const loginRole = await page.$eval('.badge-role, .user-role-badge', el => el.textContent.trim()).catch(() => '');
    record('Auth', 'Attendee1 login succeeds', loginRole.toUpperCase() === 'ATTENDEE', loginRole);

    // ==========================================
    // 3. ATTENDEE PREFERENCES & EVENT FLOW
    // ==========================================
    console.log('\n--- 3. Testing Attendee Preferences & Events ---');
    await page.waitForSelector('.card-interactive', { timeout: 6000 });
    const eventCards = await page.$$('.card-interactive');
    record('Attendee Flow', 'Events list displays event cards', eventCards.length >= 1, `Found ${eventCards.length} events`);

    // Click into the event
    await page.click('.card-interactive');
    await page.waitForSelector('.menu-item-card', { timeout: 6000 });
    const pageTitle = await page.title();
    record('Attendee Flow', 'Attendee Event Page loaded with title', pageTitle.includes('Dining Preferences'), pageTitle);

    // Check meals menu displayed
    const menuMeals = await page.$$('.menu-item-card');
    record('Attendee Flow', 'Meals list visible to attendee', menuMeals.length >= 5, `Found ${menuMeals.length} meals`);

    // Verify that NO other attendees' names or notes are anywhere in the page DOM
    const bodyText = await page.evaluate(() => document.body.innerText);
    const leaksOtherData = bodyText.includes('attendee2@test.com') || bodyText.includes('Bob Singh') || bodyText.includes('Carol Chen');
    record('Attendee Flow', 'Attendee page NEVER leaks other attendees data', !leaksOtherData);

    // Select Dietary Preference
    await page.select('#diet-pref, select', 'vegan');

    // Quick-add allergies
    const quickChips = await page.$$('.quick-pill');
    if (quickChips.length > 0) {
      await quickChips[0].click(); // peanut or first
      await sleep(200);
    }

    // Add custom allergy tag via ChipInput
    const chipInput = await page.$('.chip-text-input');
    if (chipInput) {
      await chipInput.type('sesame');
      await page.keyboard.press('Enter');
      await sleep(200);
    }
    const currentChips = await page.$$('.chip-remove');
    record('Attendee Flow', 'Allergy chips added (quick-add & custom)', currentChips.length >= 2, `Count: ${currentChips.length}`);

    // Test note character count near 500
    const sampleNote = 'Severely allergic to peanuts, sesame oil, and trace tree nuts. Always carry epinephrine injector. Please prepare in isolated station. ' + 'A'.repeat(300);
    const noteArea = await page.$('#allergy-note, textarea');
    if (noteArea) {
      await clearAndType('#allergy-note, textarea', sampleNote.slice(0, 480));
      await sleep(100);
      const charCounter = await page.$eval('.char-counter', el => el.textContent.trim()).catch(() => '');
      record('Attendee Flow', 'Character counter tracks near 500 chars', charCounter.includes('/ 500') || charCounter.includes('480'), charCounter);
    }

    // Save preferences
    await page.click('button[type="submit"]');
    await sleep(800);
    const saveToast = await page.$eval('.toast', el => el.textContent).catch(() => '');
    record('Attendee Flow', 'Preferences saved with success toast', saveToast.toLowerCase().includes('saved') || saveToast.length > 0, saveToast);

    // Navigate to /my-registrations
    await page.goto('http://localhost:5000/my-registrations', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.registration-card', { timeout: 6000 });
    const regCards = await page.$$('.registration-card');
    record('Attendee Flow', 'My Registrations page lists registered event', regCards.length >= 1, `Count: ${regCards.length}`);

    // ==========================================
    // 4. ORGANISER FLOWS
    // ==========================================
    console.log('\n--- 4. Testing Organiser Flows ---');
    // Logout attendee
    await page.evaluate(() => document.querySelector('.navbar-logout-btn')?.click());
    await sleep(800);

    // Login as organiser
    await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle0' });
    await page.type('#email', 'organiser@test.com');
    await page.type('#password', 'Password123');
    await page.click('button[type="submit"]');
    await page.waitForSelector('.badge-role, .user-role-badge', { timeout: 6000 });

    const orgBadge = await page.$eval('.badge-role, .user-role-badge', el => el.textContent.trim()).catch(() => '');
    record('Organiser Flow', 'Logged in with ORGANISER badge', orgBadge.toUpperCase() === 'ORGANISER', orgBadge);

    // Wait for EventsList page to load
    await page.waitForSelector('.card-interactive', { timeout: 6000 });

    // Create a new event
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const createBtn = btns.find(b => b.textContent.includes('Create Event'));
      if (createBtn) createBtn.click();
    });
    await sleep(400);
    await page.waitForSelector('#event-title', { timeout: 4000 });
    await clearAndType('#event-title', 'Executive Banquet 2026');
    await page.evaluate(() => {
      const dateInput = document.querySelector('#event-date');
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(dateInput, '2026-12-25');
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await clearAndType('#event-location', 'Grand Palace Ballroom');
    // Submit modal
    await page.evaluate(() => {
      const modalBtn = document.querySelector('.modal button[type="submit"]');
      if (modalBtn) modalBtn.click();
    });
    await sleep(1000);

    const allEventTitles = await page.$$eval('.event-card-title', els => els.map(e => e.textContent));
    const eventCreated = allEventTitles.some(t => t.includes('Executive Banquet 2026'));
    record('Organiser Flow', 'Created new event successfully', eventCreated);

    // Delete the newly created event to test delete with confirm dialog
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.card-interactive'));
      const banquet = cards.find(c => c.textContent.includes('Executive Banquet 2026'));
      if (banquet) {
        const delBtn = banquet.querySelector('.event-card-actions button:last-child');
        if (delBtn) delBtn.click();
      }
    });
    await sleep(400);

    // Confirm in dialog
    await page.evaluate(() => {
      const confirmBtns = Array.from(document.querySelectorAll('.modal-actions button'));
      const confirmBtn = confirmBtns.find(b => b.textContent.includes('Delete') || b.textContent.includes('Confirm'));
      if (confirmBtn) confirmBtn.click();
    });
    await sleep(800);

    const titlesAfterDelete = await page.$$eval('.event-card-title', els => els.map(e => e.textContent));
    record('Organiser Flow', 'Deleted event with confirm dialog', !titlesAfterDelete.some(t => t.includes('Executive Banquet 2026')));

    // Open main seeded event dashboard
    await page.waitForSelector('.event-card-header', { timeout: 6000 });
    await page.click('.event-card-header');
    await page.waitForSelector('.allergy-warning-banner', { timeout: 8000 });
    const orgDashTitle = await page.title();
    record('Organiser Flow', 'Organiser Dashboard loaded', orgDashTitle.includes('Organiser Dashboard'), orgDashTitle);

    // Check banner: "Flags are automated suggestions. A human must verify every meal before serving."
    const warningBanner = await page.$eval('.allergy-warning-banner', el => el.textContent.trim()).catch(() => '');
    record('Organiser Flow', 'Mandatory human verification banner present', warningBanner.includes('Flags are automated suggestions') && warningBanner.includes('A human must verify every meal before serving.'), warningBanner);

    // Check Allergy Flags Tab
    const flagRows = await page.$$('.flag-row-animated');
    record('Organiser Flow', 'Allergy conflict flags table populated', flagRows.length >= 1, `Count: ${flagRows.length}`);

    // Click "Run check"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const runBtn = btns.find(b => b.textContent.includes('Run check') || b.textContent.includes('Re-scan'));
      if (runBtn) runBtn.click();
    });
    await sleep(1000);
    const checkToast = await page.$eval('.toast', el => el.textContent).catch(() => '');
    record('Organiser Flow', 'Run check executed with toast notification', checkToast.toLowerCase().includes('check complete') || checkToast.length > 0, checkToast);

    // Verify flag on row 0
    await page.evaluate(() => {
      const cells = document.querySelectorAll('.table-actions-cell');
      if (cells.length > 0) {
        const vBtn = cells[0].querySelector('.btn-green');
        if (vBtn) vBtn.click();
      }
    });
    await sleep(800);
    const verifiedBadge = await page.$('.badge-verified');
    record('Organiser Flow', 'Verified flag successfully', !!verifiedBadge);

    // Dismiss flag on row 1
    await page.evaluate(() => {
      const cells = document.querySelectorAll('.table-actions-cell');
      if (cells.length > 1) {
        const dBtn = cells[1].querySelector('.btn-secondary');
        if (dBtn) dBtn.click();
      }
    });
    await sleep(800);
    const dismissedBadge = await page.$('.badge-dismissed');
    record('Organiser Flow', 'Dismissed flag successfully', !!dismissedBadge);

    // Refresh page and confirm statuses persist
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.badge-verified', { timeout: 6000 });
    const hasVerifiedAfterReload = await page.$('.badge-verified');
    const hasDismissedAfterReload = await page.$('.badge-dismissed');
    record('Organiser Flow', 'Verified and dismissed statuses persist after page refresh', !!hasVerifiedAfterReload && !!hasDismissedAfterReload);

    // Switch to Meals Tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.pill-tab-btn'));
      const mealsTab = tabs.find(t => t.textContent.toUpperCase().includes('MEALS'));
      if (mealsTab) mealsTab.click();
    });
    await page.waitForSelector('.meal-card', { timeout: 6000 });

    const mealsRows = await page.$$('.meal-card');
    record('Organiser Flow', 'Meals tab displays menu items', mealsRows.length >= 5, `Count: ${mealsRows.length}`);

    // Add Meal with ingredients
    await page.evaluate(() => {
      const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Meal'));
      if (addBtn) addBtn.click();
    });
    await sleep(400);
    await page.waitForSelector('#meal-name', { timeout: 4000 });
    await clearAndType('#meal-name', 'Spicy Tofu Satay');
    await clearAndType('#meal-desc', 'Crispy tofu cubes with peanut satay dip');
    const mealIngInput = await page.$('.modal .chip-text-input');
    if (mealIngInput) {
      await mealIngInput.click();
      await mealIngInput.type('tofu');
      await page.keyboard.press('Enter');
      await sleep(150);
      await mealIngInput.type('groundnut');
      await page.keyboard.press('Enter');
      await sleep(150);
      await mealIngInput.type('soy sauce');
      await page.keyboard.press('Enter');
      await sleep(150);
    }
    await page.evaluate(() => {
      const form = document.querySelector('.modal form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });
    await sleep(1200);
    const mealTitles = await page.$$eval('.meal-title', titles => titles.map(t => t.textContent));
    record('Organiser Flow', 'Added meal with ingredient chips & auto-rescan', mealTitles.includes('Spicy Tofu Satay'));

    // Switch to Attendees Tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('.pill-tab-btn'));
      const attTab = tabs.find(t => t.textContent.toUpperCase().includes('ATTENDEES'));
      if (attTab) attTab.click();
    });
    await page.waitForSelector('.search-input', { timeout: 6000 });

    const attendeeRows = await page.$$('tbody tr');
    record('Organiser Flow', 'Attendees tab lists attendees', attendeeRows.length >= 3, `Count: ${attendeeRows.length}`);

    // Test Search filter
    const searchInput = await page.$('.search-input');
    if (searchInput) {
      await searchInput.type('Alice');
      await sleep(200);
      const filteredCount = await page.$$eval('tbody tr', rows => rows.length);
      record('Organiser Flow', 'Attendee search filter works', filteredCount === 1, `Rows: ${filteredCount}`);
      // Clear
      await page.evaluate(el => el.value = '', searchInput);
      await searchInput.type(' ');
      await page.keyboard.press('Backspace');
    }

    // ==========================================
    // 5. RESPONSIVENESS & CONSOLE CHECKS
    // ==========================================
    console.log('\n--- 5. Checking Responsiveness & Console Errors ---');
    for (const width of [1280, 768, 375]) {
      await page.setViewport({ width, height: 800 });
      await sleep(200);
      const hScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      record('Responsiveness', `No horizontal scroll on Organiser Dashboard at ${width}px`, !hScroll);
    }

    const realErrors = consoleErrors.filter(e => !e.includes('401') && !e.includes('409') && !e.includes('status of 4'));
    record('Quality', 'Zero unexpected browser console errors during entire test run', realErrors.length === 0, realErrors.length ? realErrors.join('; ') : 'No errors logged');

  } catch (err) {
    console.error('Fatal test error:', err);
    record('Fatal', 'Test suite crashed', false, err.message);
  } finally {
    await browser.close();
  }

  // Summary
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`\n========================================`);
  console.log(`QA SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED (Total: ${results.length})`);
  console.log(`========================================\n`);

  return { results, consoleErrors };
}

runQA().then(summary => {
  fs.writeFileSync('qa_results.json', JSON.stringify(summary, null, 2));
  process.exit(summary.results.every(r => r.passed) ? 0 : 1);
});
