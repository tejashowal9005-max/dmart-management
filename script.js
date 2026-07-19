/* =========================================================
   DMart Manager — now with Supabase cloud storage!
   Products are stored online; everything else is in-memory.
========================================================= */

/* ---------------- SUPABASE CONNECTION ---------------- */
const SUPABASE_URL = 'https://vgtjojeithkvzqykyecp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lGfxBNEF2m6d2GZ1DUPEew_t0JiYXYo';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ---------------- SEED DATA (only for fallback) ---------------- */
// We'll start with an empty array – data will be loaded from Supabase.
let products = [];

/* ---------------- STAFF, CUSTOMERS, TRANSACTIONS (unchanged) ---------------- */
let staff = [
  { id:1, name:"Ananya Rao", role:"Store Manager", status:"on", shift:"9:00 AM – 6:00 PM" },
  { id:2, name:"Vikram Shah", role:"Cashier", status:"on", shift:"9:00 AM – 2:00 PM" },
  { id:3, name:"Priya Nair", role:"Cashier", status:"off", shift:"2:00 PM – 9:00 PM" },
  { id:4, name:"Rohit Verma", role:"Stock Clerk", status:"on", shift:"8:00 AM – 4:00 PM" },
  { id:5, name:"Meera Iyer", role:"Floor Associate", status:"off", shift:"12:00 PM – 8:00 PM" },
];

let customers = [
  { id:1, name:"Sanjay Mehta", phone:"98200 11234", visits:14, spend:8420 },
  { id:2, name:"Kavita Joshi", phone:"98765 44321", visits:7, spend:3110 },
  { id:3, name:"Arjun Desai", phone:"90210 98765", visits:22, spend:15960 },
];

let transactions = [];
let txCounter = 1000;

/* ---------------- STATE (unchanged) ---------------- */
let cart = [];
let currentView = "dashboard";
let posCategory = "";
let editingId = null;
let editingType = null;

const CATEGORIES = ["Grocery","Dairy","Produce","Bakery","Household","Beverages","Snacks"];

/* ---------------- HELPERS (unchanged) ---------------- */
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
const fmt = n => "₹" + n.toLocaleString("en-IN", {minimumFractionDigits:2, maximumFractionDigits:2});
const nextId = arr => arr.reduce((m,x)=>Math.max(m,x.id),0) + 1;

function toast(msg){
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._h);
  toast._h = setTimeout(()=>t.classList.remove("show"), 2200);
}

function todayKey(d){ return d.toISOString().slice(0,10); }

/* ---------------- NAVIGATION (unchanged) ---------------- */
const viewMeta = {
  dashboard: ["Dashboard", "Today's snapshot across your store"],
  billing: ["Billing", "Ring up items and checkout customers"],
  inventory: ["Inventory", "Track stock levels and product details"],
  staff: ["Staff", "Manage schedules and store personnel"],
  customers: ["Customers", "Your regulars and their purchase history"],
  reports: ["Reports", "Sales performance and transaction history"],
};

function switchView(view){
  currentView = view;
  $$(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + view));
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

/* ---------------- SIDEBAR (unchanged) ---------------- */
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
   SUPABASE PRODUCT CRUD FUNCTIONS (NEW)
========================================================= */

// Load products from Supabase and map to local structure
async function loadProducts() {
  try {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('name');
    if (error) throw error;

    // Map Supabase fields to local fields
    products = data.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      sku: p.product_code,          // product_code → sku
      stock: p.stock_quantity,      // stock_quantity → stock
      reorder: p.reorder_level,     // reorder_level → reorder
      price: p.price
    }));

    // Re-render whatever view is active
    renderCurrentView();
    toast('✅ Products loaded from cloud');
    return products;
  } catch (error) {
    console.error('❌ Error loading products:', error);
    // Fallback: use empty array (or we could seed some)
    products = [];
    renderCurrentView();
    toast('⚠️ Could not load products from server');
  }
}

// Add a new product to Supabase
async function addProductToSupabase(product) {
  // Map local fields to Supabase columns
  const supabaseProduct = {
    product_code: product.sku,
    name: product.name,
    category: product.category,
    price: product.price,
    cost: product.price * 0.8,      // approximate cost (adjust as needed)
    stock_quantity: product.stock,
    unit: 'pcs',                    // default
    supplier: '',                   // default
    reorder_level: product.reorder,
    description: ''
  };

  try {
    const { data, error } = await supabaseClient
      .from('products')
      .insert([supabaseProduct])
      .select();
    if (error) throw error;
    // Reload products to get the new id and sync
    await loadProducts();
    toast('✅ Product added to cloud');
    return data;
  } catch (error) {
    console.error('❌ Error adding product:', error);
    toast('❌ Failed to add product');
  }
}

// Update an existing product in Supabase
async function updateProductInSupabase(id, updates) {
  // Map local fields to Supabase columns
  const supabaseUpdates = {
    name: updates.name,
    category: updates.category,
    product_code: updates.sku,
    price: updates.price,
    stock_quantity: updates.stock,
    reorder_level: updates.reorder,
    // cost and others remain as they are
  };

  try {
    const { error } = await supabaseClient
      .from('products')
      .update(supabaseUpdates)
      .eq('id', id);
    if (error) throw error;
    await loadProducts();
    toast('✅ Product updated in cloud');
  } catch (error) {
    console.error('❌ Error updating product:', error);
    toast('❌ Failed to update product');
  }
}

// Delete a product from Supabase
async function deleteProductFromSupabase(id) {
  try {
    const { error } = await supabaseClient
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
    await loadProducts();
    toast('🗑️ Product removed from cloud');
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    toast('❌ Failed to delete product');
  }
}

/* =========================================================
   DASHBOARD (unchanged)
========================================================= */
function renderDashboard(){
  const today = new Date();
  const todaysTx = transactions.filter(t => todayKey(t.time) === todayKey(today));
  const todaysRevenue = todaysTx.reduce((s,t)=>s+t.total,0);
  const lowStock = products.filter(p => p.stock <= p.reorder);
  const onDuty = staff.filter(s => s.status === "on").length;

  $("#statTickets").innerHTML = `
    ${ticket("Today's Sales", fmt(todaysRevenue), `${todaysTx.length} bills`, "flat")}
    ${ticket("Products Tracked", products.length, `${lowStock.length} low stock`, lowStock.length ? "down":"up")}
    ${ticket("Staff On Duty", onDuty + " / " + staff.length, "currently clocked in", "flat")}
    ${ticket("Customers", customers.length, "in loyalty ledger", "flat")}
  `;

  $("#lowStockCount").textContent = lowStock.length + " items";
  $("#lowStockLedger").innerHTML = lowStock.length ? lowStock.slice(0,6).map(p => `
    <div class="ledger-row">
      <div class="lr-main"><strong>${p.name}</strong><small>${p.sku}</small></div>
      <div class="lr-value warn">${p.stock} left</div>
    </div>`).join("") : `<p class="empty-note">Nothing low on stock right now.</p>`;

  const recent = [...transactions].sort((a,b)=>b.time-a.time).slice(0,6);
  $("#txCountToday").textContent = todaysTx.length + " today";
  $("#recentTxLedger").innerHTML = recent.length ? recent.map(t => `
    <div class="ledger-row">
      <div class="lr-main"><strong>Bill #${t.id}</strong><small>${t.time.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})} · ${t.items.length} items</small></div>
      <div class="lr-value">${fmt(t.total)}</div>
    </div>`).join("") : `<p class="empty-note">No transactions yet. Head to Billing to ring up a sale.</p>`;

  renderSalesChart();
}

function ticket(label, value, delta, dir){
  return `<div class="ticket">
    <div class="t-label">${label}</div>
    <div class="t-value">${value}</div>
    <div class="t-delta ${dir}">${delta}</div>
  </div>`;
}

function renderSalesChart(){
  const days = [];
  for(let i=6;i>=0;i--){
    const d = new Date();
    d.setDate(d.getDate()-i);
    days.push(d);
  }
  const totals = days.map(d => transactions.filter(t=>todayKey(t.time)===todayKey(d)).reduce((s,t)=>s+t.total,0));
  const max = Math.max(...totals, 500);
  $("#salesChart").innerHTML = days.map((d,i)=>{
    const h = Math.max(6, Math.round((totals[i]/max)*130));
    return `<div class="bar-col">
      <span class="bar-amt">${totals[i] ? "₹"+Math.round(totals[i]) : ""}</span>
      <div class="bar" style="height:${h}px"></div>
      <span class="bar-label">${d.toLocaleDateString([], {weekday:"short"})}</span>
    </div>`;
  }).join("");
}

/* =========================================================
   BILLING / POS (with stock updates to Supabase)
========================================================= */
function renderPOS(){
  // category chips
  $("#posCategoryChips").innerHTML = ["All", ...CATEGORIES].map(c => {
    const val = c === "All" ? "" : c;
    return `<button class="chip-btn ${posCategory===val?'active':''}" data-cat="${val}">${c}</button>`;
  }).join("");
  $$("#posCategoryChips .chip-btn").forEach(b=>{
    b.addEventListener("click", ()=>{ posCategory = b.dataset.cat; renderPOS(); });
  });

  const q = ($("#posSearch").value || "").toLowerCase();
  const list = products.filter(p =>
    (!posCategory || p.category === posCategory) &&
    (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  );

  $("#posProductGrid").innerHTML = list.map(p => `
    <button class="product-card" data-id="${p.id}" ${p.stock<=0?"disabled":""}>
      <span class="pc-cat">${p.category}</span>
      <span class="pc-name">${p.name}</span>
      <span class="pc-price">${fmt(p.price)}</span>
    </button>`).join("") || `<p class="empty-note">No products match your search.</p>`;

  $$("#posProductGrid .product-card").forEach(b=>{
    b.addEventListener("click", ()=> addToCart(Number(b.dataset.id)));
  });

  // customer select
  const custSel = $("#cartCustomer");
  const currentVal = custSel.value;
  custSel.innerHTML = `<option value="">Walk-in Customer</option>` +
    customers.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
  custSel.value = currentVal;

  renderCart();
}

function addToCart(productId){
  const p = products.find(x=>x.id===productId);
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
  const p = products.find(x=>x.id===productId);
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
      const p = products.find(x=>x.id===c.productId);
      return `<div class="cart-row">
        <div class="cr-name">${p.name}<small>${fmt(p.price)} each</small></div>
        <div class="qty-ctrl">
          <button data-act="dec" data-id="${p.id}">−</button>
          <span>${c.qty}</span>
          <button data-act="inc" data-id="${p.id}">+</button>
        </div>
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
  const subtotal = cart.reduce((s,c)=>{
    const p = products.find(x=>x.id===c.productId);
    return s + p.price*c.qty;
  },0);
  const tax = subtotal * 0.05;
  $("#cartSubtotal").textContent = fmt(subtotal);
  $("#cartTax").textContent = fmt(tax);
  $("#cartTotal").textContent = fmt(subtotal+tax);
}

// MODIFIED: checkout now updates stock in Supabase
async function checkout(){
  if(!cart.length){ toast("Add items before checking out"); return; }
  const subtotal = cart.reduce((s,c)=>{
    const p = products.find(x=>x.id===c.productId);
    return s + p.price*c.qty;
  },0);
  const tax = subtotal*0.05;
  const total = subtotal+tax;
  const custId = $("#cartCustomer").value ? Number($("#cartCustomer").value) : null;
  const cashier = staff.find(s=>s.status==="on")?.name || "Store Staff";

  // Prepare items and update product stocks in Supabase
  const items = [];
  for (const c of cart) {
    const p = products.find(x=>x.id===c.productId);
    // Reduce local stock
    p.stock -= c.qty;
    // Update in Supabase
    await updateProductInSupabase(p.id, {
      name: p.name,
      category: p.category,
      sku: p.sku,
      price: p.price,
      stock: p.stock,
      reorder: p.reorder
    });
    items.push({productId:p.id, name:p.name, qty:c.qty, price:p.price});
  }

  const tx = { id: ++txCounter, time: new Date(), customerId:custId, items, total, cashier };
  transactions.push(tx);

  if(custId){
    const c = customers.find(x=>x.id===custId);
    c.visits++; c.spend += total;
  }

  showReceipt(tx);
  cart = [];
  renderPOS();
  toast("Bill generated successfully");
}

function showReceipt(tx){
  const cust = tx.customerId ? customers.find(c=>c.id===tx.customerId) : null;
  $("#receiptBody").innerHTML = `
    <div class="receipt-line"><span>Bill #</span><span>${tx.id}</span></div>
    <div class="receipt-line"><span>Time</span><span>${tx.time.toLocaleString()}</span></div>
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
   INVENTORY (with Supabase CRUD)
========================================================= */
function renderInventory(){
  const catSel = $("#invCategoryFilter");
  if(!catSel.dataset.built){
    catSel.innerHTML += CATEGORIES.map(c=>`<option value="${c}">${c}</option>`).join("");
    catSel.dataset.built = "1";
  }
  const q = ($("#invSearch").value||"").toLowerCase();
  const cat = catSel.value;
  const list = products.filter(p =>
    (!cat || p.category===cat) &&
    (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  );

  $("#invTableBody").innerHTML = list.map(p=>{
    const low = p.stock <= p.reorder;
    return `<tr>
      <td>${p.name}</td>
      <td class="mono">${p.sku}</td>
      <td>${p.category}</td>
      <td><span class="stock-badge ${low?'low':'ok'}">${p.stock} units</span></td>
      <td class="mono">${p.reorder}</td>
      <td class="mono">${fmt(p.price)}</td>
      <td>
        <div class="row-actions">
          <button class="btn-icon" data-act="edit" data-id="${p.id}" title="Edit">✎</button>
          <button class="btn-icon" data-act="del" data-id="${p.id}" title="Delete">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join("") || `<tr><td colspan="7" class="empty-note">No products found.</td></tr>`;

  $$("#invTableBody [data-act]").forEach(b=>{
    const id = Number(b.dataset.id);
    b.addEventListener("click", ()=>{
      if(b.dataset.act==="edit") openProductModal(id);
      if(b.dataset.act==="del") deleteProduct(id);
    });
  });
}

async function deleteProduct(id){
  const p = products.find(x=>x.id===id);
  if(!confirm(`Remove "${p.name}" from inventory?`)) return;
  await deleteProductFromSupabase(id);
  // loadProducts is called inside deleteProductFromSupabase
}

function openProductModal(id=null){
  editingType = "product";
  editingId = id;
  const p = id ? products.find(x=>x.id===id) : null;
  $("#modalTitle").textContent = p ? "Edit Product" : "Add Product";
  $("#modalBody").innerHTML = `
    <div class="field"><label>Product Name</label><input id="f-name" value="${p?p.name:""}" placeholder="e.g. Basmati Rice 5kg"></div>
    <div class="form-row">
      <div class="field"><label>Category</label>
        <select id="f-cat">${CATEGORIES.map(c=>`<option ${p&&p.category===c?"selected":""}>${c}</option>`).join("")}</select>
      </div>
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
  const name = $("#f-name").value.trim();
  const category = $("#f-cat").value;
  const sku = $("#f-sku").value.trim();
  const stock = Number($("#f-stock").value);
  const reorder = Number($("#f-reorder").value);
  const price = Number($("#f-price").value);
  if(!name || !sku){ toast("Please fill in product name and SKU"); return; }

  if(editingId){
    // Update existing product
    await updateProductInSupabase(editingId, { name, category, sku, stock, reorder, price });
  } else {
    // Add new product
    await addProductToSupabase({ name, category, sku, stock, reorder, price });
  }
  closeModal();
  renderInventory();
  if(currentView==="billing") renderPOS();
}

/* =========================================================
   STAFF (unchanged)
========================================================= */
function renderStaff(){
  const q = ($("#staffSearch").value||"").toLowerCase();
  const list = staff.filter(s=>s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q));
  $("#staffGrid").innerHTML = list.map(s=>`
    <div class="staff-card">
      <div class="sc-top">
        <div class="avatar">${s.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
        <div><strong>${s.name}</strong><small>${s.role}</small></div>
      </div>
      <div class="sc-meta">
        <span>${s.shift}</span>
        <span class="status-dot ${s.status==='on'?'on':'off'}"><span class="dot"></span>${s.status==='on'?'On duty':'Off duty'}</span>
      </div>
      <div class="row-actions" style="margin-top:12px;">
        <button class="btn-icon" data-act="toggle" data-id="${s.id}" title="Toggle status">⇄</button>
        <button class="btn-icon" data-act="edit" data-id="${s.id}" title="Edit">✎</button>
        <button class="btn-icon" data-act="del" data-id="${s.id}" title="Remove">🗑</button>
      </div>
    </div>`).join("") || `<p class="empty-note">No staff found.</p>`;

  $$("#staffGrid [data-act]").forEach(b=>{
    const id = Number(b.dataset.id);
    b.addEventListener("click", ()=>{
      if(b.dataset.act==="edit") openStaffModal(id);
      if(b.dataset.act==="del"){
        if(confirm("Remove this staff member?")){ staff = staff.filter(x=>x.id!==id); renderStaff(); toast("Staff removed"); }
      }
      if(b.dataset.act==="toggle"){
        const s = staff.find(x=>x.id===id);
        s.status = s.status==="on" ? "off" : "on";
        renderStaff();
        renderDashboard();
      }
    });
  });
}

function openStaffModal(id=null){
  editingType="staff"; editingId=id;
  const s = id ? staff.find(x=>x.id===id) : null;
  $("#modalTitle").textContent = s ? "Edit Staff" : "Add Staff";
  $("#modalBody").innerHTML = `
    <div class="field"><label>Full Name</label><input id="f-sname" value="${s?s.name:""}" placeholder="e.g. Rahul Kumar"></div>
    <div class="field"><label>Role</label><input id="f-srole" value="${s?s.role:""}" placeholder="e.g. Cashier"></div>
    <div class="field"><label>Shift</label><input id="f-sshift" value="${s?s.shift:""}" placeholder="e.g. 9:00 AM – 5:00 PM"></div>
    <button class="btn btn-primary btn-block" id="saveStaffBtn">${s?"Save Changes":"Add Staff"}</button>
  `;
  $("#saveStaffBtn").addEventListener("click", ()=>{
    const name = $("#f-sname").value.trim();
    const role = $("#f-srole").value.trim();
    const shift = $("#f-sshift").value.trim();
    if(!name || !role){ toast("Please fill in name and role"); return; }
    if(editingId){
      Object.assign(staff.find(x=>x.id===editingId), {name, role, shift});
      toast("Staff updated");
    } else {
      staff.push({id: nextId(staff), name, role, shift, status:"off"});
      toast("Staff added");
    }
    closeModal(); renderStaff();
  });
  openModal();
}

/* =========================================================
   CUSTOMERS (unchanged)
========================================================= */
function renderCustomers(){
  const q = ($("#custSearch").value||"").toLowerCase();
  const list = customers.filter(c=>c.name.toLowerCase().includes(q) || c.phone.includes(q));
  $("#custTableBody").innerHTML = list.map(c=>`
    <tr>
      <td>${c.name}</td>
      <td class="mono">${c.phone}</td>
      <td class="mono">${c.visits}</td>
      <td class="mono">${fmt(c.spend)}</td>
      <td>
        <div class="row-actions">
          <button class="btn-icon" data-act="edit" data-id="${c.id}" title="Edit">✎</button>
          <button class="btn-icon" data-act="del" data-id="${c.id}" title="Delete">🗑</button>
        </div>
      </td>
    </tr>`).join("") || `<tr><td colspan="5" class="empty-note">No customers found.</td></tr>`;

  $$("#custTableBody [data-act]").forEach(b=>{
    const id = Number(b.dataset.id);
    b.addEventListener("click", ()=>{
      if(b.dataset.act==="edit") openCustomerModal(id);
      if(b.dataset.act==="del"){
        if(confirm("Remove this customer?")){ customers = customers.filter(x=>x.id!==id); renderCustomers(); toast("Customer removed"); }
      }
    });
  });
}

function openCustomerModal(id=null){
  editingType="customer"; editingId=id;
  const c = id ? customers.find(x=>x.id===id) : null;
  $("#modalTitle").textContent = c ? "Edit Customer" : "Add Customer";
  $("#modalBody").innerHTML = `
    <div class="field"><label>Full Name</label><input id="f-cname" value="${c?c.name:""}" placeholder="e.g. Divya Kapoor"></div>
    <div class="field"><label>Phone</label><input id="f-cphone" value="${c?c.phone:""}" placeholder="e.g. 98xxxxxxx"></div>
    <button class="btn btn-primary btn-block" id="saveCustBtn">${c?"Save Changes":"Add Customer"}</button>
  `;
  $("#saveCustBtn").addEventListener("click", ()=>{
    const name = $("#f-cname").value.trim();
    const phone = $("#f-cphone").value.trim();
    if(!name || !phone){ toast("Please fill in name and phone"); return; }
    if(editingId){
      Object.assign(customers.find(x=>x.id===editingId), {name, phone});
      toast("Customer updated");
    } else {
      customers.push({id: nextId(customers), name, phone, visits:0, spend:0});
      toast("Customer added");
    }
    closeModal(); renderCustomers();
  });
  openModal();
}

/* =========================================================
   REPORTS (unchanged)
========================================================= */
function renderReports(){
  const totalRevenue = transactions.reduce((s,t)=>s+t.total,0);
  const avgBill = transactions.length ? totalRevenue/transactions.length : 0;
  const topProduct = (()=>{
    const counts = {};
    transactions.forEach(t=>t.items.forEach(i=>{ counts[i.name]=(counts[i.name]||0)+i.qty; }));
    const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    return entries.length ? `${entries[0][0]} (${entries[0][1]})` : "—";
  })();

  $("#reportTickets").innerHTML = `
    ${ticket("Total Revenue", fmt(totalRevenue), `${transactions.length} bills`, "flat")}
    ${ticket("Average Bill", fmt(avgBill), "per transaction", "flat")}
    ${ticket("Top Seller", topProduct, "by units sold", "up")}
  `;

  const sorted = [...transactions].sort((a,b)=>b.time-a.time);
  $("#txTableBody").innerHTML = sorted.map(t=>{
    const cust = t.customerId ? customers.find(c=>c.id===t.customerId) : null;
    return `<tr>
      <td class="mono">#${t.id}</td>
      <td>${t.time.toLocaleString()}</td>
      <td>${cust ? cust.name : "Walk-in"}</td>
      <td>${t.items.reduce((s,i)=>s+i.qty,0)} units</td>
      <td>${t.cashier}</td>
      <td class="mono">${fmt(t.total)}</td>
    </tr>`;
  }).join("") || `<tr><td colspan="6" class="empty-note">No transactions recorded yet.</td></tr>`;
}

/* =========================================================
   MODAL controls (unchanged)
========================================================= */
function openModal(){ $("#modalBackdrop").classList.add("show"); }
function closeModal(){ $("#modalBackdrop").classList.remove("show"); editingId=null; editingType=null; }

/* =========================================================
   INIT / EVENT WIRING (UPDATED to load products from Supabase)
========================================================= */
function updateClock(){
  const now = new Date();
  $("#shiftClock").textContent = now.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit", second:"2-digit"});
}

async function init(){
  // Load products from Supabase first
  await loadProducts();

  // Then set up event listeners
  $$(".nav-item").forEach(b => b.addEventListener("click", ()=>switchView(b.dataset.view)));
  $$(".bn-item").forEach(b => b.addEventListener("click", ()=>switchView(b.dataset.view)));
  $("#hamburger").addEventListener("click", openSidebar);
  $("#quickBillBtn").addEventListener("click", ()=>switchView("billing"));

  $("#modalClose").addEventListener("click", closeModal);
  $("#modalBackdrop").addEventListener("click", e=>{ if(e.target.id==="modalBackdrop") closeModal(); });
  $("#receiptClose").addEventListener("click", ()=> $("#receiptBackdrop").classList.remove("show"));
  $("#receiptBackdrop").addEventListener("click", e=>{ if(e.target.id==="receiptBackdrop") $("#receiptBackdrop").classList.remove("show"); });

  $("#addProductBtn").addEventListener("click", ()=>openProductModal());
  $("#addStaffBtn").addEventListener("click", ()=>openStaffModal());
  $("#addCustBtn").addEventListener("click", ()=>openCustomerModal());

  $("#invSearch").addEventListener("input", renderInventory);
  $("#invCategoryFilter").addEventListener("change", renderInventory);
  $("#staffSearch").addEventListener("input", renderStaff);
  $("#custSearch").addEventListener("input", renderCustomers);
  $("#posSearch").addEventListener("input", renderPOS);

  $("#checkoutBtn").addEventListener("click", checkout);
  $("#clearCartBtn").addEventListener("click", ()=>{ cart=[]; renderCart(); });

  $("#globalSearch").addEventListener("input", (e)=>{
    const val = e.target.value;
    if(val.length < 2) return;
    switchView("inventory");
    $("#invSearch").value = val;
    renderInventory();
  });

  updateClock();
  setInterval(updateClock, 1000);
  renderDashboard();
}

document.addEventListener("DOMContentLoaded", init);
Connect to Supabase
