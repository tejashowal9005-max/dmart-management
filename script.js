/* =========================================================
   DMart Manager — persistent store console
   Data auto-saves via window.storage (Claude artifact storage).
   Falls back to in-memory-only mode if storage isn't available.
========================================================= */

const STORAGE_KEY = "dmart-store-state-v1";
const PAGE_SIZE = 20;

/* ---------------- ICONS ---------------- */
const ICONS = {
  edit: '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  trash: '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 .9h8a1 1 0 0 0 1-.9l1-13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  toggle: '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M4 8h13M17 8l-3-3m3 3-3 3M20 16H7m0 0 3-3m-3 3 3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

/* ---------------- SEED DATA GENERATION ---------------- */
const PRODUCT_CATALOG = {
  Grocery: { code:"GR", price:[30,550], items:["Basmati Rice 5kg","Toor Dal 1kg","Moong Dal 1kg","Chana Dal 1kg","Sunflower Oil 1L","Mustard Oil 1L","Wheat Atta 5kg","Sugar 1kg","Salt 1kg","Besan 500g","Poha 500g","Rava 500g","Tea Powder 250g","Coffee Powder 200g","Turmeric Powder 100g","Jaggery 500g","Papad Pack","Mixed Pickle 200g"] },
  Dairy: { code:"DA", price:[25,250], items:["Full Cream Milk 1L","Toned Milk 1L","Paneer 200g","Curd 400g","Butter 100g","Ghee 500ml","Cheese Slices 200g","Fresh Cream 200ml","Buttermilk 500ml","Flavoured Yogurt 100g","Milk Powder 500g","Condensed Milk 400g","Ice Cream Tub 500ml"] },
  Produce: { code:"PR", price:[20,90], items:["Tomatoes 1kg","Onions 1kg","Potatoes 1kg","Bananas (dozen)","Apples 1kg","Oranges 1kg","Grapes 500g","Carrots 500g","Cucumber 500g","Spinach Bunch","Cauliflower 1pc","Capsicum 500g","Green Chillies 100g","Ginger-Garlic 250g"] },
  Bakery: { code:"BK", price:[25,90], items:["Multigrain Bread","White Bread","Butter Croissant","Chocolate Muffin","Burger Buns (4pk)","Rusk 200g","Bun Pav (6pk)","Doughnut","Garlic Bread","Cupcake Pack"] },
  Household: { code:"HH", price:[40,350], items:["Dish Wash Liquid","Laundry Detergent 1kg","Floor Cleaner 1L","Toilet Cleaner 500ml","Glass Cleaner 500ml","Air Freshener","Scrub Pads Pack","Garbage Bags Roll","Aluminium Foil","Cling Wrap","Mosquito Repellent","Matchbox Pack","Candles Pack","Tissue Paper Box","Shoe Polish","Hand Wash 250ml","Room Freshener Spray"] },
  Beverages: { code:"BV", price:[25,150], items:["Cola 750ml","Lemon Soda 750ml","Orange Juice 1L","Apple Juice 1L","Mineral Water 1L","Soda Water 750ml","Energy Drink 250ml","Iced Tea 500ml","Coconut Water 200ml","Mango Drink 1L","Instant Coffee Mix","Green Tea Bags","Herbal Tea Bags","Soft Drink Variant Pack"] },
  Snacks: { code:"SN", price:[20,90], items:["Potato Chips 90g","Choco Cookies","Salted Namkeen 200g","Popcorn 100g","Peanuts 200g","Cashew Nuts 100g","Banana Chips 150g","Chocolate Bar","Wafer Biscuits","Energy Bar","Corn Flakes 500g","Muesli 500g","Instant Noodles Pack","Rice Crackers 100g"] },
};
const CATEGORIES = Object.keys(PRODUCT_CATALOG);
const FIRST_NAMES = ["Aarav","Vivaan","Aditya","Ishaan","Kabir","Ananya","Diya","Priya","Kavya","Meera"];
const LAST_NAMES = ["Sharma","Verma","Gupta","Mehta","Nair","Iyer","Reddy","Desai","Kapoor","Joshi"];

function randInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min; }
function pick(arr){ return arr[randInt(0, arr.length-1)]; }

function generateSeedData(){
  // 100 products
  let products = [];
  let id = 1;
  CATEGORIES.forEach(cat=>{
    const def = PRODUCT_CATALOG[cat];
    def.items.forEach((name, i)=>{
      const stock = randInt(2, 85);
      const reorder = randInt(8, 22);
      const price = randInt(def.price[0], def.price[1]);
      products.push({
        id: id++,
        name,
        category: cat,
        sku: `${def.code}-${1001+i}`,
        stock, reorder, price
      });
    });
  });

  // 100 customers (10 first x 10 last names)
  let customers = [];
  let cid = 1;
  FIRST_NAMES.forEach(fn=>{
    LAST_NAMES.forEach(ln=>{
      const visits = randInt(1, 34);
      const spend = Math.round(visits * randInt(180, 650));
      const phoneBody = String(700000000 + ((cid*7919) % 99999999)).padStart(9,'0');
      customers.push({
        id: cid++,
        name: `${fn} ${ln}`,
        phone: `9${phoneBody.slice(0,4)} ${phoneBody.slice(4,9)}`,
        visits, spend
      });
    });
  });

  const staff = [
    { id:1, name:"Ananya Rao", role:"Store Manager", status:"on", shift:"9:00 AM – 6:00 PM" },
    { id:2, name:"Vikram Shah", role:"Cashier", status:"on", shift:"9:00 AM – 2:00 PM" },
    { id:3, name:"Priya Nair", role:"Cashier", status:"off", shift:"2:00 PM – 9:00 PM" },
    { id:4, name:"Rohit Verma", role:"Stock Clerk", status:"on", shift:"8:00 AM – 4:00 PM" },
    { id:5, name:"Meera Iyer", role:"Floor Associate", status:"off", shift:"12:00 PM – 8:00 PM" },
    { id:6, name:"Karan Malhotra", role:"Stock Clerk", status:"on", shift:"10:00 AM – 6:00 PM" },
    { id:7, name:"Sneha Pillai", role:"Cashier", status:"off", shift:"4:00 PM – 10:00 PM" },
  ];

  // ~25 seed transactions across the last 7 days
  let transactions = [];
  let txCounter = 1000;
  for(let t=0;t<25;t++){
    const daysAgo = randInt(0,6);
    const time = new Date();
    time.setDate(time.getDate() - daysAgo);
    time.setHours(randInt(9,20), randInt(0,59), 0, 0);
    const itemCount = randInt(1,5);
    const usedIds = new Set();
    const items = [];
    for(let k=0;k<itemCount;k++){
      const p = pick(products);
      if(usedIds.has(p.id)) continue;
      usedIds.add(p.id);
      const qty = randInt(1,3);
      items.push({ productId:p.id, name:p.name, qty, price:p.price });
    }
    if(!items.length) continue;
    const subtotal = items.reduce((s,i)=>s+i.price*i.qty,0);
    const total = Math.round(subtotal*1.05*100)/100;
    const custId = Math.random() < 0.6 ? pick(customers).id : null;
    transactions.push({
      id: ++txCounter,
      time: time.toISOString(),
      customerId: custId,
      items,
      total,
      cashier: pick(staff).name
    });
  }
  transactions.sort((a,b)=> new Date(a.time) - new Date(b.time));

  return { products, staff, customers, transactions, txCounter };
}

/* ---------------- STATE ---------------- */
let state = { products:[], staff:[], customers:[], transactions:[], txCounter:1000 };
let cart = [];
let currentView = "dashboard";
let posCategory = "";
let editingId = null;
let invPage = 1, custPage = 1;
let storageAvailable = false;
let saveTimer = null;

/* ---------------- HELPERS ---------------- */
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const fmt = n => "₹" + Number(n).toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2});
const nextId = arr => arr.reduce((m,x)=>Math.max(m,x.id),0) + 1;
function todayKey(d){ return new Date(d).toISOString().slice(0,10); }

function toast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._h);
  toast._h = setTimeout(()=>t.classList.remove("show"), 2200);
}

/* ---------------- PERSISTENCE ---------------- */
function setSyncStatus(mode, label){
  const dot = $("#syncDot");
  const lbl = $("#syncLabel");
  dot.className = "dot " + (mode === "saved" ? "dot--live" : mode === "saving" ? "dot--busy" : "dot--off");
  lbl.textContent = label;
}

async function loadState(){
  storageAvailable = typeof window.storage !== "undefined" && window.storage !== null;
  if(storageAvailable){
    try{
      const result = await window.storage.get(STORAGE_KEY, false);
      if(result && result.value){
        const parsed = JSON.parse(result.value);
        state = parsed;
        setSyncStatus("saved", "All changes saved");
      } else {
        state = generateSeedData();
        await persist(true);
      }
    } catch(err){
      // key doesn't exist yet, or a storage error — seed fresh
      try{
        state = generateSeedData();
        await persist(true);
      } catch(err2){
        storageAvailable = false;
        state = generateSeedData();
        setSyncStatus("off", "Session only (no storage)");
      }
    }
  } else {
    state = generateSeedData();
    setSyncStatus("off", "Session only (no storage)");
  }
}

function persist(immediate){
  if(!storageAvailable) return Promise.resolve();
  if(saveTimer) clearTimeout(saveTimer);
  if(immediate){
    return doSave();
  }
  setSyncStatus("saving", "Saving…");
  return new Promise(resolve=>{
    saveTimer = setTimeout(async ()=>{ await doSave(); resolve(); }, 450);
  });
}

async function doSave(){
  try{
    await window.storage.set(STORAGE_KEY, JSON.stringify(state), false);
    const now = new Date();
    setSyncStatus("saved", "Saved " + now.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"}));
  } catch(err){
    setSyncStatus("off", "Save failed — retrying next change");
  }
}

/* ---------------- NAVIGATION ---------------- */
const viewMeta = {
  dashboard: ["Dashboard", "Today's snapshot across your store"],
  billing: ["Billing", "Ring up items and checkout customers"],
  inventory: ["Inventory", "Track stock levels across 100 products"],
  staff: ["Staff", "Manage schedules and store personnel"],
  customers: ["Customers", "100 regulars and their purchase history"],
  reports: ["Reports", "Sales performance and transaction history"],
};

function switchView(view){
  currentView = view;
  $$(".view").forEach(v => v.classList.remove("active"));
  $("#view-" + view).classList.add("active");
  $$(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  $$(".bn-item").forEach(b => b.classList.toggle("active", b.dataset.view === view));
  $("#viewTitle").textContent = viewMeta[view][0];
  $("#viewSub").textContent = viewMeta[view][1];
  closeSidebar();
  renderCurrentView();
}
function renderCurrentView(){
  if(currentView === "dashboard") renderDashboard();
  if(currentView === "billing") renderPOS();
  if(currentView === "inventory") renderInventory();
  if(currentView === "staff") renderStaff();
  if(currentView === "customers") renderCustomers();
  if(currentView === "reports") renderReports();
}

function openSidebar(){
  $(".sidebar").classList.add("open");
  let overlay = $(".sidebar-overlay");
  if(!overlay){
    overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);
    overlay.addEventListener("click", closeSidebar);
  }
  overlay.classList.add("show");
}
function closeSidebar(){
  $(".sidebar").classList.remove("open");
  const overlay = $(".sidebar-overlay");
  if(overlay) overlay.classList.remove("show");
}

/* =========================================================
   DASHBOARD
========================================================= */
function renderDashboard(){
  const today = new Date();
  const todaysTx = state.transactions.filter(t => todayKey(t.time) === todayKey(today));
  const todaysRevenue = todaysTx.reduce((s,t)=>s+t.total,0);
  const lowStock = state.products.filter(p => p.stock <= p.reorder);
  const onDuty = state.staff.filter(s => s.status === "on").length;

  $("#statTickets").innerHTML = `
    ${ticket("Today's Sales", fmt(todaysRevenue), `${todaysTx.length} bills`, "flat")}
    ${ticket("Products Tracked", state.products.length, `${lowStock.length} low stock`, lowStock.length ? "down":"up")}
    ${ticket("Staff On Duty", onDuty + " / " + state.staff.length, "currently clocked in", "flat")}
    ${ticket("Customers", state.customers.length, "in loyalty ledger", "flat")}
  `;

  $("#lowStockCount").textContent = lowStock.length + " items";
  $("#lowStockLedger").innerHTML = lowStock.length ? lowStock.slice(0,6).map(p => `
    <div class="ledger-row"><div class="lr-main"><strong>${p.name}</strong><small>${p.sku}</small></div><div class="lr-value warn">${p.stock} left</div></div>`).join("")
    : `<p class="empty-note">Nothing low on stock right now.</p>`;

  const recent = [...state.transactions].sort((a,b)=>new Date(b.time)-new Date(a.time)).slice(0,6);
  $("#txCountToday").textContent = todaysTx.length + " today";
  $("#recentTxLedger").innerHTML = recent.length ? recent.map(t => `
    <div class="ledger-row"><div class="lr-main"><strong>Bill #${t.id}</strong><small>${new Date(t.time).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})} · ${t.items.length} items</small></div><div class="lr-value">${fmt(t.total)}</div></div>`).join("")
    : `<p class="empty-note">No transactions yet. Head to Billing to ring up a sale.</p>`;

  renderSalesChart();
}
function ticket(label, value, delta, dir){
  return `<div class="ticket"><div class="t-label">${label}</div><div class="t-value">${value}</div><div class="t-delta ${dir}">${delta}</div></div>`;
}
function renderSalesChart(){
  const days = [];
  for(let i=6;i>=0;i--){ const d = new Date(); d.setDate(d.getDate()-i); days.push(d); }
  const totals = days.map(d => state.transactions.filter(t=>todayKey(t.time)===todayKey(d)).reduce((s,t)=>s+t.total,0));
  const max = Math.max(...totals, 500);
  $("#salesChart").innerHTML = days.map((d,i)=>{
    const h = Math.max(6, Math.round((totals[i]/max)*130));
    return `<div class="bar-col"><span class="bar-amt">${totals[i] ? "₹"+Math.round(totals[i]) : ""}</span><div class="bar" style="height:${h}px"></div><span class="bar-label">${d.toLocaleDateString([], {weekday:"short"})}</span></div>`;
  }).join("");
}

/* =========================================================
   BILLING / POS
========================================================= */
function renderPOS(){
  $("#posCategoryChips").innerHTML = ["All", ...CATEGORIES].map(c => {
    const val = c === "All" ? "" : c;
    return `<button class="chip-btn ${posCategory===val?'active':''}" data-cat="${val}">${c}</button>`;
  }).join("");
  $$("#posCategoryChips .chip-btn").forEach(b=>{
    b.addEventListener("click", ()=>{ posCategory = b.dataset.cat; renderPOS(); });
  });

  const q = ($("#posSearch").value || "").toLowerCase();
  const list = state.products.filter(p =>
    (!posCategory || p.category === posCategory) &&
    (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  );

  $("#posProductGrid").innerHTML = list.map(p => `
    <button class="product-card" data-id="${p.id}" ${p.stock<=0?"disabled":""}>
      <span class="pc-cat">${p.category}</span><span class="pc-name">${p.name}</span><span class="pc-price">${fmt(p.price)}</span>
    </button>`).join("") || `<p class="empty-note">No products match your search.</p>`;

  $$("#posProductGrid .product-card").forEach(b=>{
    b.addEventListener("click", ()=> addToCart(Number(b.dataset.id)));
  });

  const custSel = $("#cartCustomer");
  const currentVal = custSel.value;
  custSel.innerHTML = `<option value="">Walk-in Customer</option>` + state.customers.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  custSel.value = currentVal;

  renderCart();
}
function addToCart(productId){
  const p = state.products.find(x=>x.id===productId);
  if(!p || p.stock<=0) return;
  const line = cart.find(c=>c.productId===productId);
  const inCart = line ? line.qty : 0;
  if(inCart >= p.stock){ toast(`Only ${p.stock} in stock for ${p.name}`); return; }
  if(line) line.qty++; else cart.push({productId, qty:1});
  renderCart();
}
function changeQty(productId, delta){
  const line = cart.find(c=>c.productId===productId);
  if(!line) return;
  const p = state.products.find(x=>x.id===productId);
  const newQty = line.qty + delta;
  if(newQty <= 0){ cart = cart.filter(c=>c.productId!==productId); }
  else if(newQty > p.stock){ toast(`Only ${p.stock} in stock`); }
  else { line.qty = newQty; }
  renderCart();
}
function renderCart(){
  $("#cartCount").textContent = cart.reduce((s,c)=>s+c.qty,0) + " items";
  if(!cart.length){
    $("#cartList").innerHTML = `<p class="empty-note">Cart is empty. Tap a product to add it.</p>`;
  } else {
    $("#cartList").innerHTML = cart.map(c=>{
      const p = state.products.find(x=>x.id===c.productId);
      return `<div class="cart-row">
        <div class="cr-name">${p.name}<small>${fmt(p.price)} each</small></div>
        <div class="qty-ctrl"><button data-act="dec" data-id="${p.id}">−</button><span>${c.qty}</span><button data-act="inc" data-id="${p.id}">+</button></div>
        <div class="cr-amt">${fmt(p.price*c.qty)}</div>
        <button class="cr-remove" data-act="rm" data-id="${p.id}">&times;</button>
      </div>`;
    }).join("");
    $$("#cartList [data-act]").forEach(b=>{
      const id = Number(b.dataset.id);
      b.addEventListener("click", ()=>{
        if(b.dataset.act==="inc") changeQty(id, 1);
        if(b.dataset.act==="dec") changeQty(id, -1);
        if(b.dataset.act==="rm") { cart = cart.filter(c=>c.productId!==id); renderCart(); }
      });
    });
  }
  const subtotal = cart.reduce((s,c)=>{ const p = state.products.find(x=>x.id===c.productId); return s + p.price*c.qty; },0);
  const tax = subtotal * 0.05;
  $("#cartSubtotal").textContent = fmt(subtotal);
  $("#cartTax").textContent = fmt(tax);
  $("#cartTotal").textContent = fmt(subtotal+tax);
}
async function checkout(){
  if(!cart.length){ toast("Add items before checking out"); return; }
  const subtotal = cart.reduce((s,c)=>{ const p = state.products.find(x=>x.id===c.productId); return s + p.price*c.qty; },0);
  const tax = subtotal*0.05;
  const total = Math.round((subtotal+tax)*100)/100;
  const custId = $("#cartCustomer").value ? Number($("#cartCustomer").value) : null;
  const cashier = (state.staff.find(s=>s.status==="on")||{}).name || "Store Staff";

  const items = cart.map(c=>{
    const p = state.products.find(x=>x.id===c.productId);
    p.stock -= c.qty;
    return {productId:p.id, name:p.name, qty:c.qty, price:p.price};
  });

  const tx = { id: ++state.txCounter, time: new Date().toISOString(), customerId:custId, items, total, cashier };
  state.transactions.push(tx);

  if(custId){
    const c = state.customers.find(x=>x.id===custId);
    c.visits++; c.spend = Math.round((c.spend + total)*100)/100;
  }

  showReceipt(tx);
  cart = [];
  renderPOS();
  toast("Bill generated successfully");
  await persist();
}
function showReceipt(tx){
  const cust = tx.customerId ? state.customers.find(c=>c.id===tx.customerId) : null;
  $("#receiptBody").innerHTML = `
    <div class="receipt-line"><span>Bill #</span><span>${tx.id}</span></div>
    <div class="receipt-line"><span>Time</span><span>${new Date(tx.time).toLocaleString()}</span></div>
    <div class="receipt-line"><span>Customer</span><span>${cust ? cust.name : "Walk-in"}</span></div>
    <div class="receipt-line"><span>Cashier</span><span>${tx.cashier}</span></div>
    <div class="receipt-divider"></div>
    ${tx.items.map(i=>`<div class="receipt-line"><span>${i.name} × ${i.qty}</span><span>${fmt(i.price*i.qty)}</span></div>`).join("")}
    <div class="receipt-divider"></div>
    <div class="receipt-line receipt-total"><span>Total</span><span>${fmt(tx.total)}</span></div>
  `;
  $("#receiptBackdrop").classList.add("show");
}

/* =========================================================
   INVENTORY (paginated — 100 products)
========================================================= */
function renderInventory(){
  const catSel = $("#invCategoryFilter");
  if(!catSel.dataset.built){
    catSel.innerHTML += CATEGORIES.map(c=>`<option value="${c}">${c}</option>`).join("");
    catSel.dataset.built = "1";
  }
  const q = ($("#invSearch").value||"").toLowerCase();
  const cat = catSel.value;
  const filtered = state.products.filter(p =>
    (!cat || p.category===cat) &&
    (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if(invPage > totalPages) invPage = totalPages;
  const pageItems = filtered.slice((invPage-1)*PAGE_SIZE, invPage*PAGE_SIZE);

  $("#invTableBody").innerHTML = pageItems.map(p=>{
    const low = p.stock <= p.reorder;
    return `<tr>
      <td>${p.name}</td><td class="mono">${p.sku}</td><td>${p.category}</td>
      <td><span class="stock-badge ${low?'low':'ok'}">${p.stock} units</span></td>
      <td class="mono">${p.reorder}</td><td class="mono">${fmt(p.price)}</td>
      <td><div class="row-actions">
        <button class="btn-icon" data-act="edit" data-id="${p.id}" title="Edit">${ICONS.edit}</button>
        <button class="btn-icon" data-act="del" data-id="${p.id}" title="Delete">${ICONS.trash}</button>
      </div></td>
    </tr>`;
  }).join("") || `<tr><td colspan="7" class="empty-note">No products found.</td></tr>`;

  $("#invPager").innerHTML = `
    <span>${filtered.length} products · page ${invPage} of ${totalPages}</span>
    <div class="row-actions">
      <button id="invPrev" ${invPage<=1?"disabled":""}>Prev</button>
      <button id="invNext" ${invPage>=totalPages?"disabled":""}>Next</button>
    </div>`;
  $("#invPrev").addEventListener("click", ()=>{ invPage--; renderInventory(); });
  $("#invNext").addEventListener("click", ()=>{ invPage++; renderInventory(); });

  $$("#invTableBody [data-act]").forEach(b=>{
    const id = Number(b.dataset.id);
    b.addEventListener("click", ()=>{
      if(b.dataset.act==="edit") openProductModal(id);
      if(b.dataset.act==="del") deleteProduct(id);
    });
  });
}
async function deleteProduct(id){
  const p = state.products.find(x=>x.id===id);
  if(!confirm(`Remove "${p.name}" from inventory?`)) return;
  state.products = state.products.filter(x=>x.id!==id);
  renderInventory();
  toast("Product removed");
  await persist();
}
function openProductModal(id=null){
  editingId = id;
  const p = id ? state.products.find(x=>x.id===id) : null;
  $("#modalTitle").textContent = p ? "Edit Product" : "Add Product";
  $("#modalBody").innerHTML = `
    <div class="field"><label>Product Name</label><input id="f-name" value="${p?p.name:""}" placeholder="e.g. Basmati Rice 5kg"></div>
    <div class="form-row">
      <div class="field"><label>Category</label><select id="f-cat">${CATEGORIES.map(c=>`<option ${p&&p.category===c?"selected":""}>${c}</option>`).join("")}</select></div>
      <div class="field"><label>SKU</label><input id="f-sku" value="${p?p.sku:""}" placeholder="e.g. GR-1010"></div>
    </div>
    <div class="form-row">
      <div class="field"><label>Stock Quantity</label><input id="f-stock" type="number" min="0" value="${p?p.stock:0}"></div>
      <div class="field"><label>Reorder Level</label><input id="f-reorder" type="number" min="0" value="${p?p.reorder:10}"></div>
    </div>
    <div class="field"><label>Price (₹)</label><input id="f-price" type="number" min="0" step="0.01" value="${p?p.price:0}"></div>
    <button class="btn btn-primary btn-block" id="saveProductBtn">${p?"Save Changes":"Add Product"}</button>
  `;
  $("#saveProductBtn").addEventListener("click", saveProduct);
  openModal();
}
async function saveProduct(){
  const
