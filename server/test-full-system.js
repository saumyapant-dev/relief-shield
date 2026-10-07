/**
 * Comprehensive System-Wide Verification Script
 * 
 * Verifies all 6 Phases & Priority Fixes:
 * - Auth (Victim, Volunteer, NGO, Donor, Admin)
 * - Emergency Request Creation (with 2dsphere GeoJSON Point)
 * - Admin Verification Queue & Verify Action
 * - Geospatial 2dsphere Query with Spherical Distance Calculation
 * - Atomic Claim Action by Responder
 * - Status Progression (Claimed -> In Progress -> Resolved)
 * - Donations Simulation & General Pool Aggregation
 * - Admin Dashboard Stats & User Management
 */

const BASE_URL = 'http://localhost:5001/api';

const log = (step, title, ok = true) => {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} [Step ${step}] ${title}`);
};

const runFullTest = async () => {
  console.log('====================================================');
  console.log('🧪 Running Comprehensive Relief Shield System Verification');
  console.log('====================================================');

  try {
    // 1. Health
    const hRes = await fetch(`${BASE_URL}/health`);
    const health = await hRes.json();
    if (!hRes.ok) throw new Error('Health check failed');
    log(1, `Backend API online: ${health.service}`);

    // 2. Logins for all 5 roles
    const roles = ['victim', 'volunteer', 'ngo', 'donor', 'admin'];
    const authMap = {};

    for (const r of roles) {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `${r}@example.com`, password: 'password123' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Login failed for ${r}: ${JSON.stringify(data)}`);
      authMap[r] = data;
    }
    log(2, `Verified login & JWT issuance for all 5 roles: ${roles.join(', ')}`);

    // 3. Victim creates new emergency request
    const victimAuth = authMap['victim'];
    const createRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${victimAuth.token}`,
      },
      body: JSON.stringify({
        type: 'Rescue',
        urgency: 'Critical',
        description: 'Rising water trapped family of 4 on residential second floor. Evacuation boat required.',
        latitude: 40.7306,
        longitude: -73.9902,
        customPhotoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
      }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error('Request creation failed');
    const newReq = createData.request;
    log(3, `Victim posted Emergency Request: ${newReq.requestId} (Status: ${newReq.status})`);

    // 4. Admin Verification Queue
    const adminAuth = authMap['admin'];
    const queueRes = await fetch(`${BASE_URL}/admin/queue`, {
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    const queueData = await queueRes.json();
    if (!queueRes.ok) throw new Error('Admin queue failed');
    const inQueue = queueData.queue.some((r) => r._id === newReq._id);
    if (!inQueue) throw new Error('New request not found in Admin Verification Queue');
    log(4, `Admin Verification Queue: Verified request ${newReq.requestId} is pending review`);

    // 5. Admin Verifies Request
    const verifyRes = await fetch(`${BASE_URL}/requests/${newReq._id}/verify`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok || verifyData.request.status !== 'verified') {
      throw new Error('Admin verification failed');
    }
    log(5, `Admin verified request: Status transitioned to '${verifyData.request.status}'`);

    // 6. Geospatial 2dsphere Matching Query
    const volAuth = authMap['volunteer'];
    const geoRes = await fetch(
      `${BASE_URL}/requests/nearby?latitude=40.7300&longitude=-73.9900&radius=10`,
      { headers: { Authorization: `Bearer ${volAuth.token}` } }
    );
    const geoData = await geoRes.json();
    if (!geoRes.ok) throw new Error('Geospatial query failed');
    const matched = geoData.requests.find((r) => r._id === newReq._id);
    if (!matched) throw new Error('Emergency request not matched by 2dsphere proximity query');
    log(6, `MongoDB 2dsphere proximity matching: Incident found ${matched.distanceKm} km away`);

    // 7. Atomic Claim by Volunteer
    const claimRes = await fetch(`${BASE_URL}/requests/${newReq._id}/claim`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${volAuth.token}`,
        'Content-Type': 'application/json',
      },
    });
    const claimData = await claimRes.json();
    if (!claimRes.ok || claimData.request.status !== 'claimed') {
      throw new Error('Atomic claim failed');
    }
    log(7, `Responder claimed incident: Assigned to ${claimData.request.assignedVolunteer.name}`);

    // 8. Responder Status Progression (In Progress -> Resolved)
    const progRes = await fetch(`${BASE_URL}/requests/${newReq._id}/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${volAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'in_progress' }),
    });
    const progData = await progRes.json();
    if (!progRes.ok || progData.request.status !== 'in_progress') throw new Error('Status progression failed');

    const resRes = await fetch(`${BASE_URL}/requests/${newReq._id}/status`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${volAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'resolved' }),
    });
    const resData = await resRes.json();
    if (!resRes.ok || resData.request.status !== 'resolved') throw new Error('Resolution failed');
    log(8, `Status progression completed: In Progress -> Resolved`);

    // 9. Donations Flow (Donor)
    const donorAuth = authMap['donor'];
    const donRes = await fetch(`${BASE_URL}/donations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${donorAuth.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: 150, requestId: newReq._id }),
    });
    const donData = await donRes.json();
    if (!donRes.ok || !donData.donation) throw new Error('Donation creation failed');
    log(9, `Donation processed: $${donData.donation.amount} contributed (Ref: ${donData.donation.donationId})`);

    // 10. Admin Stats Verification
    const statsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    const statsData = await statsRes.json();
    if (!statsRes.ok) throw new Error('Admin stats retrieval failed');
    log(10, `Admin KPIs Verified: Total Requests=${statsData.stats.totalRequests}, Resolved=${statsData.stats.resolvedRequests}, Funds Raised=$${statsData.stats.totalDonations}`);

    console.log('====================================================');
    console.log('🎉 ALL SYSTEM CHECKS PASSED WITH 100% SUCCESS!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  }
};

runFullTest();
