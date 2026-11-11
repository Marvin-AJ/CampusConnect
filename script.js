/* CampusConnect — basic JavaScript and browser localStorage */
const startingEvents = [
  {id: 1, name: 'AI & Innovation Summit', category: 'Technology', date: '2026-11-10', time: '10:00', location: 'Main Auditorium', seats: 120, description: 'Explore artificial intelligence and student innovation.'},
  {id: 2, name: 'Campus Hackathon', category: 'Technology', date: '2026-11-14', time: '09:00', location: 'Innovation Lab', seats: 50, description: 'Build exciting projects in teams.'},
  {id: 3, name: 'Music Night', category: 'Cultural', date: '2026-11-18', time: '18:30', location: 'Open Air Theatre', seats: 200, description: 'An evening of student performances.'},
  {id: 4, name: 'UI Design Workshop', category: 'Workshop', date: '2026-11-21', time: '14:00', location: 'Design Studio', seats: 40, description: 'Learn to design beautiful web interfaces.'},
  {id: 5, name: 'Badminton Championship', category: 'Sports', date: '2026-11-25', time: '08:00', location: 'Sports Complex', seats: 32, description: 'Compete with other campus players.'}
];

// Save data only in this browser, not on a shared server.
let events = JSON.parse(localStorage.getItem('campusEvents') || 'null') || startingEvents;
let registrations = JSON.parse(localStorage.getItem('campusRegistrations') || '[]');
let selectedId = null;

function saveData() {
  localStorage.setItem('campusEvents', JSON.stringify(events));
  localStorage.setItem('campusRegistrations', JSON.stringify(registrations));
}

function safe(text) {
  return String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function showEvents() {
  const search = document.getElementById('search').value.toLowerCase();
  const category = document.getElementById('category').value;
  const grid = document.getElementById('eventGrid');
  grid.innerHTML = '';
  let shown = 0;
  for (const item of events) {
    if (category !== 'All' && item.category !== category) continue;
    if (!(item.name + item.description + item.category).toLowerCase().includes(search)) continue;
    shown++;
    const taken = registrations.filter(r => r.eventId === item.id).length;
    const left = Math.max(0, item.seats - taken);
    const emoji = {Technology:'💻', Workshop:'🎨', Cultural:'🎵', Sports:'🏸'}[item.category];
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = '<div class="icon">' + emoji + '</div>' +
      '<span class="tag">' + safe(item.category) + '</span>' +
      '<h3>' + safe(item.name) + '</h3>' +
      '<p>' + safe(item.description) + '</p>' +
      '<p class="details">📅 ' + safe(item.date) + ' • ' + safe(item.time) + '<br>📍 ' + safe(item.location) + '<br>🎟 ' + left + ' seats left</p>' +
      '<div class="card-actions"><button class="join">' + (left ? 'Register' : 'Full') + '</button><button class="edit secondary">Edit</button><button class="delete danger">Delete</button></div>';
    const join = card.querySelector('.join');
    join.disabled = left === 0;
    join.onclick = () => openRegistration(item.id);
    card.querySelector('.edit').onclick = () => editEvent(item.id);
    card.querySelector('.delete').onclick = () => deleteEvent(item.id);
    grid.appendChild(card);
  }
  document.getElementById('noEvents').hidden = shown !== 0;
  document.getElementById('eventCount').textContent = events.length;
  document.getElementById('registrationCount').textContent = registrations.length;
}

function clearFilters() {
  document.getElementById('search').value = '';
  document.getElementById('category').value = 'All';
  showEvents();
}

function openRegistration(id) {
  selectedId = id;
  const item = events.find(e => e.id === id);
  if (!item) return;
  document.getElementById('modalTitle').textContent = 'Register: ' + item.name;
  document.getElementById('modal').hidden = false;
}

function closeModal() {
  document.getElementById('modal').hidden = true;
}

function confirmRegistration(event) {
  event.preventDefault();
  const name = document.getElementById('studentName').value.trim();
  const email = document.getElementById('studentEmail').value.trim().toLowerCase();
  const number = document.getElementById('studentNumber').value.trim();
  const item = events.find(e => e.id === selectedId);
  if (!item) return;
  if (registrations.some(r => r.eventId === item.id && (r.email === email || r.number === number))) {
    alert('This email or registration number is already registered for this event.');
    return;
  }
  if (registrations.filter(r => r.eventId === item.id).length >= item.seats) {
    alert('Sorry, this event is full.');
    closeModal();
    return;
  }
  registrations.push({eventId: item.id, name: name, email: email, number: number});
  saveData();
  closeModal();
  document.querySelector('#modal form').reset();
  showEvents();
  showRegistrations();
  alert('Registration successful for ' + item.name + '!');
}

function showRegistrations() {
  const list = document.getElementById('registrationList');
  list.innerHTML = '';
  if (registrations.length === 0) {
    list.textContent = 'No registrations yet. Choose an event above to get started.';
    return;
  }
  registrations.forEach((r, index) => {
    const item = events.find(e => e.id === r.eventId);
    const row = document.createElement('div');
    row.className = 'registration';
    row.innerHTML = '<strong>' + safe(item ? item.name : 'Removed Event') + '</strong><p>' + safe(r.name) + ' • ' + safe(r.email) + ' • ' + safe(r.number) + '</p><button class="danger">Cancel Registration</button>';
    row.querySelector('button').onclick = () => cancelRegistration(index);
    list.appendChild(row);
  });
}

function cancelRegistration(index) {
  if (!confirm('Cancel this registration?')) return;
  registrations.splice(index, 1);
  saveData(); showEvents(); showRegistrations();
}

function saveEvent(event) {
  event.preventDefault();
  const id = document.getElementById('editId').value;
  const data = {
    id: id ? Number(id) : Date.now(),
    name: document.getElementById('eventName').value.trim(),
    category: document.getElementById('eventCategory').value,
    date: document.getElementById('eventDate').value,
    time: document.getElementById('eventTime').value,
    location: document.getElementById('eventLocation').value.trim(),
    seats: Number(document.getElementById('eventSeats').value),
    description: document.getElementById('eventDescription').value.trim()
  };
  if (id) {
    const existing = events.find(e => e.id === data.id);
    if (!existing) return;
    const taken = registrations.filter(r => r.eventId === data.id).length;
    if (data.seats < taken) { alert('Seats cannot be fewer than existing registrations.'); return; }
    events = events.map(e => e.id === data.id ? data : e);
  } else {
    events.push(data);
  }
  saveData(); resetEventForm(); showEvents(); showRegistrations();
  alert('Event saved successfully!');
}

function editEvent(id) {
  const item = events.find(e => e.id === id);
  if (!item) return;
  document.getElementById('editId').value = item.id;
  document.getElementById('eventName').value = item.name;
  document.getElementById('eventCategory').value = item.category;
  document.getElementById('eventDate').value = item.date;
  document.getElementById('eventTime').value = item.time;
  document.getElementById('eventLocation').value = item.location;
  document.getElementById('eventSeats').value = item.seats;
  document.getElementById('eventDescription').value = item.description;
  document.getElementById('saveButton').textContent = 'Update Event';
  document.getElementById('manage').scrollIntoView();
}

function resetEventForm() {
  document.getElementById('eventForm').reset();
  document.getElementById('editId').value = '';
  document.getElementById('saveButton').textContent = 'Add Event';
}

function deleteEvent(id) {
  if (!confirm('Delete this event and its registrations?')) return;
  events = events.filter(e => e.id !== id);
  registrations = registrations.filter(r => r.eventId !== id);
  saveData(); showEvents(); showRegistrations(); resetEventForm();
}

saveData();
showEvents();
showRegistrations();
