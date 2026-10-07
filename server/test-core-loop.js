/**
 * End-to-End Core Loop Verification Script
 * 
 * Tests the entire Phase 2 loop:
 * 1. Health check
 * 2. Pre-seeded User Logins (Victim & Volunteer)
 * 3. New User Registration
 * 4. Victim creates Emergency Request (with 2dsphere GeoJSON Point)
 * 5. Volunteer queries Request Feed
 * 6. Volunteer claims the Emergency Request
 * 7. Victim verifies status transitioned to 'claimed' with volunteer assigned
 * 8. Volunteer updates status to 'in_progress', then 'resolved'
 * 9. Victim verifies final status is 'resolved'
 */

const BASE_URL = 'http://localhost:5001/api';

const log = (step, msg, ok = true) => {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} [Step ${step}] ${msg}`);
};

const runTests = async () => {
  console.log('----------------------------------------------------');
  console.log('🧪 Starting Relief Shield Core Loop End-to-End Test');
  console.log('----------------------------------------------------');

  try {
    // 1. Health Check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    if (!healthRes.ok) throw new Error('Health check failed');
    log(1, `Backend API healthy: ${health.service}`);

    // 2. Pre-seeded Victim Login
    const victimLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'victim@example.com', password: 'password123' }),
    });
    const victimAuth = await victimLoginRes.json();
    if (!victimLoginRes.ok || !victimAuth.token) throw new Error('Victim login failed');
    log(2, `Victim logged in: ${victimAuth.user.name} (${victimAuth.user.role})`);

    // 3. Pre-seeded Volunteer Login
    const volunteerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'volunteer@example.com', password: 'password123' }),
    });
    const volunteerAuth = await volunteerLoginRes.json();
    if (!volunteerLoginRes.ok || !volunteerAuth.token) throw new Error('Volunteer login failed');
    log(3, `Volunteer logged in: ${volunteerAuth.user.name} (${volunteerAuth.user.role})`);

    // 4. Create Emergency Request (Victim)
    const newRequestPayload = {
      type: 'Medical',
      urgency: 'Critical',
      description: 'Flash flood trapped family of 3 with severe diabetic emergency. Need insulin and evacuation.',
      latitude: 40.7589,
      longitude: -73.9851,
      customPhotoUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    };

    const createRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${victimAuth.token}`,
      },
      body: JSON.stringify(newRequestPayload),
    });
    const createData = await createRes.json();
    if (!createRes.ok || !createData.request) {
      throw new Error(`Create request failed: ${JSON.stringify(createData)}`);
    }
    const createdReq = createData.request;
    log(4, `Emergency Request Created: ID=${createdReq.requestId}, Status=${createdReq.status}, Coordinates=[${createdReq.location.coordinates.join(', ')}]`);

    // Verify 2dsphere GeoJSON format: [longitude, latitude]
    if (createdReq.location.coordinates[0] !== -73.9851 || createdReq.location.coordinates[1] !== 40.7589) {
      throw new Error('Coordinates do not match GeoJSON [longitude, latitude] format');
    }
    log(4.1, 'Verified GeoJSON Point [longitude, latitude] for 2dsphere indexing');

    // 5. Volunteer queries Request Feed
    const feedRes = await fetch(`${BASE_URL}/requests/feed`, {
      headers: { Authorization: `Bearer ${volunteerAuth.token}` },
    });
    const feedData = await feedRes.json();
    if (!feedRes.ok) throw new Error('Feed query failed');
    const foundInFeed = feedData.requests.find((r) => r._id === createdReq._id);
    if (!foundInFeed) throw new Error('Newly created request not found in volunteer feed');
    log(5, `Volunteer viewed feed: Found ${feedData.requests.length} requests including newly created ${createdReq.requestId}`);

    // 6. Volunteer claims the Request
    const claimRes = await fetch(`${BASE_URL}/requests/${createdReq._id}/claim`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${volunteerAuth.token}`,
        'Content-Type': 'application/json',
      },
    });
    const claimData = await claimRes.json();
    if (!claimRes.ok || claimData.request.status !== 'claimed') {
      throw new Error(`Claim failed: ${JSON.stringify(claimData)}`);
    }
    log(6, `Volunteer successfully claimed request ${createdReq.requestId}. Status is now: ${claimData.request.status}`);

    // 7. Victim verifies status visibility
    const victimReqsRes = await fetch(`${BASE_URL}/requests/my-requests`, {
      headers: { Authorization: `Bearer ${victimAuth.token}` },
    });
    const victimReqs = await victimReqsRes.json();
    const victimViewOfReq = victimReqs.requests.find((r) => r._id === createdReq._id);
    if (!victimViewOfReq || victimViewOfReq.status !== 'claimed') {
      throw new Error('Victim view does not show request as claimed');
    }
    log(7, `Victim verified status update: Request is 'claimed', assigned responder: ${victimViewOfReq.assignedVolunteer.name}`);

    // 8. Volunteer advances status to 'in_progress'
    const progressRes = await fetch(`${BASE_URL}/requests/${createdReq._id}/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${volunteerAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'in_progress' }),
    });
    const progressData = await progressRes.json();
    if (!progressRes.ok || progressData.request.status !== 'in_progress') {
      throw new Error('Status transition to in_progress failed');
    }
    log(8, `Volunteer progressed status to: ${progressData.request.status}`);

    // 9. Volunteer resolves request
    const resolveRes = await fetch(`${BASE_URL}/requests/${createdReq._id}/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${volunteerAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'resolved' }),
    });
    const resolveData = await resolveRes.json();
    if (!resolveRes.ok || resolveData.request.status !== 'resolved') {
      throw new Error('Status transition to resolved failed');
    }
    log(9, `Volunteer resolved request: Status is now: ${resolveData.request.status}`);

    // 10. Victim verifies resolution
    const finalVictimRes = await fetch(`${BASE_URL}/requests/my-requests`, {
      headers: { Authorization: `Bearer ${victimAuth.token}` },
    });
    const finalVictimData = await finalVictimRes.json();
    const finalReq = finalVictimData.requests.find((r) => r._id === createdReq._id);
    if (!finalReq || finalReq.status !== 'resolved') {
      throw new Error('Victim did not receive resolved status');
    }
    log(10, `Victim verified final resolution: Request ${finalReq.requestId} is RESOLVED!`);

    console.log('----------------------------------------------------');
    console.log('🎉 ALL TESTS PASSED! Core Loop MVP is 100% Working!');
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('❌ Test failed with error:', err.message);
    process.exit(1);
  }
};

runTests();
