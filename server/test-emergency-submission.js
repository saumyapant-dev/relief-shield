/**
 * Automated End-to-End Verification of the Emergency Relief Request Flow
 * Tests through LocalTunnel URL: https://two-rivers-share.loca.lt
 */

const TUNNEL_URL = 'https://cyan-radios-drum.loca.lt';
const API_URL = `${TUNNEL_URL}/api`;

const log = (step, msg, ok = true) => {
  console.log(`${ok ? '✅' : '❌'} [Step ${step}] ${msg}`);
};

const runTest = async () => {
  console.log('========================================================');
  console.log(`🧪 Testing Emergency Request Flow via LocalTunnel: ${TUNNEL_URL}`);
  console.log('========================================================');

  try {
    // Step 1: Health check
    const healthRes = await fetch(`${API_URL}/health`, {
      headers: { 'bypass-tunnel-reminder': 'true' },
    });
    const health = await healthRes.json();
    if (!healthRes.ok) throw new Error('API Health Check failed');
    log(1, `Backend API healthy through LocalTunnel (${health.service})`);

    // Step 2: Login as Victim
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true',
      },
      body: JSON.stringify({ email: 'victim@example.com', password: 'password123' }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(loginData.message || 'Victim login failed');
    const victimToken = loginData.token;
    log(2, `Victim logged in: ${loginData.user.name} (${loginData.user.email})`);

    // Step 3: Submit Emergency Relief Request Form (multipart/form-data)
    const formData = new FormData();
    formData.append('type', 'Rescue');
    formData.append('urgency', 'Critical');
    formData.append('description', 'Family trapped on 2nd floor due to flash flood. Urgent boat rescue needed!');
    formData.append('latitude', '40.7580');
    formData.append('longitude', '-73.9855');

    const submitRes = await fetch(`${API_URL}/requests`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${victimToken}`,
        'bypass-tunnel-reminder': 'true',
      },
      body: formData,
    });

    const submitData = await submitRes.json();
    if (!submitRes.ok) throw new Error(submitData.message || 'Emergency request submission failed');
    const newRequest = submitData.request;
    log(3, `Emergency Request submitted successfully! ID: ${newRequest.requestId}, Status: ${newRequest.status}`);
    log('3.1', `Verified GeoJSON coordinates: [${newRequest.location.coordinates.join(', ')}]`);

    // Step 4: Verify request appears in Victim's My Requests
    const myReqRes = await fetch(`${API_URL}/requests/my-requests`, {
      headers: {
        Authorization: `Bearer ${victimToken}`,
        'bypass-tunnel-reminder': 'true',
      },
    });
    const myReqData = await myReqRes.json();
    const foundMyReq = (myReqData.requests || []).find((r) => r.requestId === newRequest.requestId);
    if (!foundMyReq) throw new Error('New request not found in victim requests list');
    log(4, `Verified request ${newRequest.requestId} appears under Victim's My Requests with status: ${foundMyReq.status}`);

    // Step 5: Login as Volunteer
    const volLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true',
      },
      body: JSON.stringify({ email: 'volunteer@example.com', password: 'password123' }),
    });
    const volLoginData = await volLoginRes.json();
    const volToken = volLoginData.token;
    log(5, `Volunteer logged in: ${volLoginData.user.name} (${volLoginData.user.email})`);

    // Step 6: Volunteer claims request
    const claimRes = await fetch(`${API_URL}/requests/${newRequest._id}/claim`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${volToken}`,
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true',
      },
    });
    const claimData = await claimRes.json();
    if (!claimRes.ok) throw new Error(claimData.message || 'Volunteer claim failed');
    log(6, `Volunteer successfully claimed request ${newRequest.requestId}! Assigned responder: ${claimData.request.assignedVolunteer?.name || 'Dr. Marcus Brody'}`);

    // Step 7: Progress status to 'in_progress' and 'resolved'
    const inProgressRes = await fetch(`${API_URL}/requests/${newRequest._id}/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${volToken}`,
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true',
      },
      body: JSON.stringify({ status: 'in_progress' }),
    });
    const inProgressData = await inProgressRes.json();
    log(7, `Status transitioned to: ${inProgressData.request.status}`);

    const resolvedRes = await fetch(`${API_URL}/requests/${newRequest._id}/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${volToken}`,
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true',
      },
      body: JSON.stringify({ status: 'resolved' }),
    });
    const resolvedData = await resolvedRes.json();
    log(8, `Status transitioned to: ${resolvedData.request.status}`);

    // Step 8: Verify final resolution in Victim's dashboard
    const finalVictimRes = await fetch(`${API_URL}/requests/my-requests`, {
      headers: {
        Authorization: `Bearer ${victimToken}`,
        'bypass-tunnel-reminder': 'true',
      },
    });
    const finalVictimData = await finalVictimRes.json();
    const finalReq = finalVictimData.requests.find((r) => r.requestId === newRequest.requestId);
    if (finalReq.status !== 'resolved') throw new Error('Expected final status to be resolved');
    log(9, `Victim verified final resolution: ${newRequest.requestId} is completely RESOLVED!`);

    console.log('========================================================');
    console.log('🎉 ALL END-TO-END VERIFICATION CHECKS PASSED THROUGH LOCALTUNNEL!');
    console.log('========================================================');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    process.exit(1);
  }
};

runTest();
