/* js/app.js
   TravelBuddy — improved LocalStorage auth + UI integration
   - Renders destination cards, packages and testimonials
   - Handles search, login/signup (LocalStorage), modal, bookings and routing
   - Adds: signup/login persistence, updateNavUser(), logoutUser()
*/

const data = {
  destinations:[
    {id:'goa',name:'Goa',img:'assets/images/goa.jpg',short:'Beaches, parties and water sports',best:'Nov - Feb',entryFee:'Free'},
    {id:'jaipur',name:'Jaipur',img:'assets/images/jaipur.jpg',short:'Palaces, forts and rich culture',best:'Oct - Mar',entryFee:'Monuments ~ ₹50-200'},
    {id:'manali',name:'Manali',img:'assets/images/manali.jpg',short:'Mountain views and adventure',best:'Oct - Feb',entryFee:'Free'},
    {id:'kerala',name:'Kerala',img:'assets/images/kerala.jpg',short:'Backwaters and lush greenery',best:'Sep - Mar',entryFee:'Houseboat ~ ₹500+'},
  ],
  packages:[
    {id:'p1',title:'Goa Weekend Escape',price:'₹7,499',duration:'3 Days',itinerary:'Day1:Beach | Day2:Water sports | Day3:Shopping'},
    {id:'p2',title:'Royal Jaipur',price:'₹9,999',duration:'4 Days',itinerary:'Amber Fort, City Palace, Local bazaar'},
    {id:'p3',title:'Manali Adventure',price:'₹12,499',duration:'5 Days',itinerary:'Solang Valley, Rohtang (permit), Trek'},
  ],
  guides:[
    {id:'g1',name:'Ravi Kumar',photo:'assets/images/guide1.jpg',languages:['Hindi','English'],exp:7,rating:4.8},
    {id:'g2',name:'Priya Singh',photo:'assets/images/guide2.jpg',languages:['English','Hindi'],exp:5,rating:4.6}
  ],
  testimonials:[
    {name:'Amit',text:'Amazing experience! TravelBuddy made planning so easy.'},
    {name:'Priya',text:'Great guides and awesome packages.'},
    {name:'Rohit',text:'Value for money and superb customer support.'}
  ]
};

// DOM utilities
const el = sel => document.querySelector(sel);
const els = sel => document.querySelectorAll(sel);

// LocalStorage keys
const LS_USERS_KEY = 'travel_users';           // stores array of users [{name,email,password}]
const LS_LOGGED_IN_KEY = 'travel_logged_in';   // stores current logged in user {name,email}

// -------------------------
// Initialization
// -------------------------
document.addEventListener('DOMContentLoaded', ()=>{
  const yearEl = el('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if (el('#popularDestinations')) renderDestinations();
  if (el('#featuredPackages')) renderPackages();
  if (el('#testimonials')) renderTestimonials();

  initEvents();

  // Update nav if user already logged in
  updateNavUser();
});

// -------------------------
// Renderers
// -------------------------
function renderDestinations(){
  const container = el('#popularDestinations');
  if(!container) return;
  container.innerHTML = '';
  data.destinations.forEach(d=>{
    const card = document.createElement('article');
    card.className = 'card fade-up';
    card.innerHTML = `
      <img class="thumb" src="${d.img}" alt="${d.name}" />
      <div class="body">
        <h3>${d.name}</h3>
        <p>${d.short}</p>
        <p class="small muted">Best time: ${d.best}</p>
        <div style="margin-top:.6rem"><a class="btn" href="destination.html?id=${d.id}">View details</a></div>
      </div>`;
    container.appendChild(card);
  });
}

function renderPackages(){
  const cont = el('#featuredPackages');
  if(!cont) return;
  cont.innerHTML = '';
  data.packages.forEach(p=>{
    const c = document.createElement('div');
    c.className = 'card';
    c.innerHTML = `<div class="body"><h3>${p.title}</h3><p class="small muted">${p.duration} • ${p.price}</p><p>${p.itinerary}</p><div style="margin-top:.6rem;"><button class="btn primary" onclick="bookPackage('${p.id}')">Book Now</button></div></div>`;
    cont.appendChild(c);
  });
}

function renderTestimonials(){
  const cont = el('#testimonials');
  if(!cont) return;
  cont.innerHTML = '';
  data.testimonials.forEach(t=>{
    const d = document.createElement('div');
    d.className = 'card testimonial';
    d.innerHTML = `<div class="body"><strong>${t.name}</strong><p class="small muted">${t.text}</p></div>`;
    cont.appendChild(d);
  });
}

// -------------------------
// Events & UI init
// -------------------------
function initEvents(){
  // Toggle nav for mobile
  const navToggle = el('#navToggle');
  const nav = el('#siteNav');
  if(navToggle && nav){
    navToggle.addEventListener('click', ()=>{
      nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    });
  }

  // Modals
  const authModal = el('#authModal');
  if(el('#loginBtn')) el('#loginBtn').addEventListener('click', ()=>openAuth('login'));
  if(el('#signupBtn')) el('#signupBtn').addEventListener('click', ()=>openAuth('signup'));
  els('[data-close]').forEach(b=>b.addEventListener('click', closeAuth));
  if(authModal) authModal.addEventListener('click', (e)=>{ if(e.target===authModal) closeAuth(); });

  if(el('#doSignup')) el('#doSignup').addEventListener('click', (ev)=>{ ev.preventDefault(); doSignup(); });
  if(el('#doLogin')) el('#doLogin').addEventListener('click', (ev)=>{ ev.preventDefault(); doLogin(); });

  // Logout button (if present)
  const logoutBtn = el('#logoutBtn');
  if(logoutBtn) logoutBtn.addEventListener('click', logoutUser);

  // Search
  if(el('#searchBtn')){
    el('#searchBtn').addEventListener('click', ()=>{
      const q = el('#searchInput').value.trim();
      if(!q) return alert('Type a destination name');
      window.location.href = `destinations.html?q=${encodeURIComponent(q)}`;
    });
  }
}

// -------------------------
// Modal controls
// -------------------------
function openAuth(mode='login'){
  const modal = el('#authModal');
  if(!modal) return;
  modal.setAttribute('aria-hidden','false');
  const loginForm = el('#loginForm');
  const signupForm = el('#signupForm');
  if(loginForm && signupForm){
    loginForm.classList.toggle('hidden', mode !== 'login');
    signupForm.classList.toggle('hidden', mode !== 'signup');
  }
}
function closeAuth(){ const modal = el('#authModal'); if(modal) modal.setAttribute('aria-hidden','true'); }

// -------------------------
// Auth: Signup / Login / Logout
// -------------------------
function doSignup(){
  const name = el('#signupName')?.value?.trim();
  const email = el('#signupEmail')?.value?.trim();
  const pass = el('#signupPass')?.value?.trim();

  if(!name || !email || !pass) {
    alert('Please fill all fields');
    return;
  }

  // basic email validation
  if(!/^\S+@\S+\.\S+$/.test(email)) {
    alert('Please enter a valid email address');
    return;
  }

  // get users array (or empty)
  const users = JSON.parse(localStorage.getItem(LS_USERS_KEY)) || [];

  // check duplicate email
  if(users.some(u => u.email.toLowerCase() === email.toLowerCase())){
    alert('Email already registered. Please log in or use another email.');
    return;
  }

  // create new user and save
  const newUser = { name, email, password: pass };
  users.push(newUser);
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));

  // set logged in user
  localStorage.setItem(LS_LOGGED_IN_KEY, JSON.stringify({ name, email }));

  alert('Account created successfully!');
  closeAuth();
  updateNavUser();
}

function doLogin(){
  const email = el('#loginEmail')?.value?.trim();
  const pass = el('#loginPass')?.value?.trim();

  if(!email || !pass) {
    alert('Enter credentials');
    return;
  }

  const users = JSON.parse(localStorage.getItem(LS_USERS_KEY)) || [];
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);

  if(!found){
    alert('Invalid credentials. Please check email/password or sign up.');
    return;
  }

  // set logged in user
  localStorage.setItem(LS_LOGGED_IN_KEY, JSON.stringify({ name: found.name, email: found.email }));

  alert(`Welcome back, ${found.name}!`);
  closeAuth();
  updateNavUser();
}

function logoutUser(){
  localStorage.removeItem(LS_LOGGED_IN_KEY);
  alert('Logged out successfully');
  updateNavUser();
}

// -------------------------
// UI: update navigation based on login state
// -------------------------
function updateNavUser(){
  const user = JSON.parse(localStorage.getItem(LS_LOGGED_IN_KEY));
  const userDisplay = el('#userDisplay');
  const loginBtn = el('#loginBtn');
  const signupBtn = el('#signupBtn');
  const logoutBtn = el('#logoutBtn');

  if(userDisplay){
    if(user){
      userDisplay.textContent = `Hello, ${user.name}`;
      userDisplay.style.display = 'inline-block';
    } else {
      userDisplay.textContent = '';
      userDisplay.style.display = 'none';
    }
  }

  if(loginBtn) loginBtn.style.display = user ? 'none' : 'inline-block';
  if(signupBtn) signupBtn.style.display = user ? 'none' : 'inline-block';
  if(logoutBtn) logoutBtn.style.display = user ? 'inline-block' : 'none';
}

// -------------------------
// Booking demo
// -------------------------
function bookPackage(id){
  const p = data.packages.find(x=>x.id===id);
  if(!p) return alert('Package not found');

  // if user not logged in, prompt to login / signup
  const currentUser = JSON.parse(localStorage.getItem(LS_LOGGED_IN_KEY));
  if(!currentUser){
    if(confirm('You need to be logged in to book a package. Open login/signup?')){
      openAuth('login');
    }
    return;
  }

  const name = prompt(`Booking ${p.title} for (your name):`, currentUser.name || '');
  if(name) alert(`Thanks ${name}! We will contact ${currentUser.email} to confirm the booking for ${p.title}. (Demo)`);
}

// -------------------------
// Expose for other pages
// -------------------------
window.travelbuddy = {
  data,
  findDestination: (id)=> data.destinations.find(d=>d.id===id)
};
window.bookPackage = bookPackage;


// -------------------------
// Auth: Signup / Login / Logout (modified to optionally capture phone)
// -------------------------
function doSignup(){
  const name = el('#signupName')?.value?.trim();
  const email = el('#signupEmail')?.value?.trim();
  const pass = el('#signupPass')?.value?.trim();
  // optional phone input (add <input id="signupPhone"> to signup form if you want)
  const phoneInput = el('#signupPhone')?.value?.trim() || '';

  if(!name || !email || !pass) {
    alert('Please fill all fields');
    return;
  }

  if(!/^\S+@\S+\.\S+$/.test(email)) {
    alert('Please enter a valid email address');
    return;
  }

  const users = JSON.parse(localStorage.getItem(LS_USERS_KEY)) || [];
  if(users.some(u => u.email.toLowerCase() === email.toLowerCase())){
    alert('Email already registered. Please log in or use another email.');
    return;
  }

  const newUser = { name, email, password: pass, phone: phoneInput }; // store phone if provided
  users.push(newUser);
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));

  localStorage.setItem(LS_LOGGED_IN_KEY, JSON.stringify({ name, email, phone: phoneInput }));

  alert('Account created successfully!');
  closeAuth();
  updateNavUser();
}

function doLogin(){
  const email = el('#loginEmail')?.value?.trim();
  const pass = el('#loginPass')?.value?.trim();

  if(!email || !pass) {
    alert('Enter credentials');
    return;
  }

  const users = JSON.parse(localStorage.getItem(LS_USERS_KEY)) || [];
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);

  if(!found){
    alert('Invalid credentials. Please check email/password or sign up.');
    return;
  }

  // set logged in user (include phone if present)
  localStorage.setItem(LS_LOGGED_IN_KEY, JSON.stringify({ name: found.name, email: found.email, phone: found.phone || '' }));

  alert(`Welcome back, ${found.name}!`);
  closeAuth();
  updateNavUser();
}

// -------------------------
// UI: update navigation based on login state (modified to keep phone in logged object)
// -------------------------
function updateNavUser(){
  const user = JSON.parse(localStorage.getItem(LS_LOGGED_IN_KEY));
  const userDisplay = el('#userDisplay');
  const loginBtn = el('#loginBtn');
  const signupBtn = el('#signupBtn');
  const logoutBtn = el('#logoutBtn');

  if(userDisplay){
    if(user){
      userDisplay.textContent = `Hello, ${user.name}`;
      userDisplay.style.display = 'inline-block';
    } else {
      userDisplay.textContent = '';
      userDisplay.style.display = 'none';
    }
  }

  if(loginBtn) loginBtn.style.display = user ? 'none' : 'inline-block';
  if(signupBtn) signupBtn.style.display = user ? 'none' : 'inline-block';
  if(logoutBtn) logoutBtn.style.display = user ? 'inline-block' : 'none';
}
