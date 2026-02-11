const BASE_URL = 'http://localhost:3000/api/clients';

async function test() {
  console.log('--- Testing Client Routes ---');

  // 1. GET ALL
  console.log('1. Fetching all clients...');
  let res = await fetch(BASE_URL);
  if (!res.ok) {
    console.error('Failed to fetch clients:', res.status, res.statusText);
    const text = await res.text();
    console.error('Response:', text);
    return;
  }
  let clients = await res.json();
  console.log(`Response status: ${res.status}`);
  console.log('Current clients count:', clients.length);

  // 1.5. CREATE INVALID (Missing required fields)
  console.log('\n1.5. Creating INVALID client (should fail)...');
  const invalidClientData = {
    alias: 'JuanInvalid'
    // Missing fullName, address, phone
  };
  res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invalidClientData)
  });
  console.log(`Response status: ${res.status} (Expected ~500 or 400)`);
  const errorResp = await res.json();
  console.log('Error Response:', errorResp);

  // 2. CREATE
  console.log('\n2. Creating a new client...');
  const newClientData = {
    fullName: 'Juan Perez',
    alias: 'Juan',
    address: 'Calle Falsa 123',
    phone: '555-1234'
  };
  res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newClientData)
  });
  if (!res.ok) {
    console.error('Failed to create client:', res.status, res.statusText);
    const text = await res.text();
    console.error('Response:', text);
    return;
  }
  const createdClient = await res.json();
  console.log(`Response status: ${res.status}`);
  console.log('Created Client:', createdClient);

  if (!createdClient._id) {
    console.error('Failed to create client!');
    return;
  }
  const clientId = createdClient._id;

  // 3. GET ONE
  console.log(`\n3. Fetching client by ID: ${clientId}...`);
  res = await fetch(`${BASE_URL}/${clientId}`);
  if (!res.ok) {
    console.error('Failed to get client:', res.status, res.statusText);
    const text = await res.text();
    console.error('Response:', text);
    return;
  }
  const fetchedClient = await res.json();
  console.log(`Response status: ${res.status}`);
  console.log('Fetched Client:', fetchedClient);

  // 4. UPDATE
  console.log(`\n4. Updating client ID: ${clientId}...`);
  const updateData = {
    fullName: 'Juan Perez Updated',
    alias: 'Juanito'
  };
  res = await fetch(`${BASE_URL}/${clientId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData)
  });
  if (!res.ok) {
    console.error('Failed to update client:', res.status, res.statusText);
    const text = await res.text();
    console.error('Response:', text);
    return;
  }
  const updatedClient = await res.json();
  console.log(`Response status: ${res.status}`);
  console.log('Updated Client:', updatedClient);

  // 5. VERIFY UPDATE
  console.log(`\n5. Verifying update for client ID: ${clientId}...`);
  res = await fetch(`${BASE_URL}/${clientId}`);
  const verifyClient = await res.json();
  console.log(`Response status: ${res.status}`);
  console.log('Client after update:', verifyClient);

  // 5.5. SEARCH
  console.log('\n5.5. Searching for client "Juanito"...');
  res = await fetch(`${BASE_URL}?search=Juanito`);
  const searchResults = await res.json();
  console.log(`Response status: ${res.status}`);
  console.log('Search results count:', searchResults.length);
  if (searchResults.length > 0) {
    console.log('Found:', searchResults[0].fullName);
  }

  // 6. LIST AGAIN
  console.log('\n6. Fetching all clients again...');
  res = await fetch(BASE_URL);
  clients = await res.json();
  console.log(`Response status: ${res.status}`);
  console.log('Current clients count:', clients.length);
}

test().catch(console.error);
