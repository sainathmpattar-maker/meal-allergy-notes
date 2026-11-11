async function runSecurityAudit() {
  console.log('--- Starting API Security & Access Control Tests ---');

  // 1. Missing Token -> 401
  const noTokenRes = await fetch('http://localhost:5000/api/events');
  console.log('1. No Token GET /api/events:', noTokenRes.status === 401 ? 'PASS (401)' : `FAIL (${noTokenRes.status})`);

  // 2. Attendee Login
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'attendee1@test.com', password: 'Password123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('2. Attendee Login status:', loginRes.status === 200 ? 'PASS (200)' : `FAIL (${loginRes.status})`);
  console.log('   passwordHash exposed in login response?:', 'passwordHash' in loginData.user ? 'FAIL (Exposed!)' : 'PASS (Not exposed)');

  // 3. /api/auth/me passwordHash check
  const meRes = await fetch('http://localhost:5000/api/auth/me', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const meData = await meRes.json();
  console.log('3. passwordHash exposed in /api/auth/me?:', 'passwordHash' in meData ? 'FAIL (Exposed!)' : 'PASS (Not exposed)');

  // 4. Organiser Endpoint Access Control (Attendee calling POST /api/events) -> 403
  const createEventRes = await fetch('http://localhost:5000/api/events', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Hacked Event', date: new Date().toISOString(), location: 'Secret' })
  });
  console.log('4. Attendee creating event:', createEventRes.status === 403 ? 'PASS (403 Forbidden)' : `FAIL (${createEventRes.status})`);

  // 5. Organiser Endpoint Access Control (Attendee calling flags run) -> 403
  const flagsRunRes = await fetch('http://localhost:5000/api/events/6af4463065db4bbb3143fd50/flags/run', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token }
  });
  console.log('5. Attendee running flags check:', flagsRunRes.status === 403 ? 'PASS (403 Forbidden)' : `FAIL (${flagsRunRes.status})`);

  // 6. Attendee reading registrations of event -> returns only own registration
  // Let's get the event ID first
  const eventsRes = await fetch('http://localhost:5000/api/events', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const events = await eventsRes.json();
  const eventId = events[0]._id;
  
  const attendeeRegsRes = await fetch(`http://localhost:5000/api/events/${eventId}/registrations`, {
    headers: { Authorization: 'Bearer ' + token }
  });
  const attendeeRegs = await attendeeRegsRes.json();
  console.log('6. Attendee fetching event registrations count (must only be 1 - their own):', attendeeRegs.length === 1 ? 'PASS (Only own reg returned)' : `FAIL (Returned ${attendeeRegs.length} records)`);

  // 7. Invalid ObjectId -> 400
  const invalidIdRes = await fetch('http://localhost:5000/api/events/invalid-object-id', {
    headers: { Authorization: 'Bearer ' + token }
  });
  console.log('7. Invalid ObjectId handling:', invalidIdRes.status === 400 ? 'PASS (400 Bad Request)' : `FAIL (${invalidIdRes.status})`);

  // 8. Bad body validation -> 400
  const badBodyRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '', email: 'not-an-email', password: 'short' })
  });
  console.log('8. Bad register body validation:', badBodyRes.status === 400 ? 'PASS (400 Bad Request)' : `FAIL (${badBodyRes.status})`);

  // 9. NoSQL injection in login: {"email": {"$gt": ""}, "password": "Password123"}
  const nosqlRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: { '$gt': '' }, password: 'Password123' })
  });
  console.log('9. NoSQL injection in login:', (nosqlRes.status === 400 || nosqlRes.status === 401) ? `PASS (${nosqlRes.status} Rejected)` : `FAIL (${nosqlRes.status} Allowed!)`);

  // 10. XSS payload in note: <script>alert(1)</script>
  const xssNote = '<script>alert("XSS")</script><img src=x onerror=alert(1)>';
  const saveRegRes = await fetch(`http://localhost:5000/api/events/${eventId}/registrations`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ dietaryPreference: 'vegetarian', allergies: ['dairy'], note: xssNote })
  });
  const savedReg = await saveRegRes.json();
  console.log('10. Note saved without server crash:', saveRegRes.status === 200 ? 'PASS (200)' : `FAIL (${saveRegRes.status})`);
  console.log('    Raw note value stored:', savedReg.note === xssNote ? 'PASS (Stored as plain string, React auto-escapes on render)' : 'FAIL');

  console.log('--- Security Audit Complete ---');
}

runSecurityAudit().catch(console.error);

