/* =========================================================
   DMART MANAGER — 100 Products + 100 Customers + Supabase
   Complete Working Version
========================================================= */

/* ---------------- SUPABASE CONNECTION ---------------- */
const SUPABASE_URL = 'https://vgtjojeithkvzqykyecp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_lGfxBNEF2m6d2GZ1DUPEew_t0JiYXYo';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ---------------- GLOBAL STATE ---------------- */
let products = [];
let staff = [];
let customers = [];
let transactions = [];
let txCounter = 1000;
let cart = [];
let currentView = "dashboard";
let posCategory = "";
let editingId = null;
let editingType = null;
const CATEGORIES = ["Grocery", "Dairy", "Produce", "Bakery", "Household", "Beverages", "Snacks", "Personal Care", "Frozen", "Meat"];

/* ---------------- HELPERS ---------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const fmt = n => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const nextId = arr => arr.reduce((m, x) => Math.max(m, x.id), 0) + 1;

function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._h);
    toast._h = setTimeout(() => t.classList.remove("show"), 2200);
}

function todayKey(d) { return d.toISOString().slice(0, 10); }

/* ---------------- SEED: 100 PRODUCTS ---------------- */
function generateProductSeed() {
    const categories = ['Grocery', 'Dairy', 'Produce', 'Bakery', 'Household', 'Beverages', 'Snacks', 'Personal Care', 'Frozen', 'Meat'];
    const names = [
        'Basmati Rice', 'Toor Dal', 'Sunflower Oil', 'Milk', 'Paneer', 'Curd', 'Tomatoes', 'Onions', 'Bananas',
        'Wheat Bread', 'Butter Croissant', 'Dish Wash Liquid', 'Laundry Detergent', 'Cola', 'Orange Juice',
        'Potato Chips', 'Choco Cookies', 'Wheat Flour', 'Sugar', 'Salt', 'Tea Leaves', 'Coffee Powder',
        'Honey', 'Strawberry Jam', 'Peanut Butter', 'Instant Noodles', 'Pasta', 'Tomato Sauce', 'Ketchup',
        'Mayonnaise', 'Cider Vinegar', 'Olive Oil', 'Ghee', 'Butter', 'Cheddar Cheese', 'Greek Yogurt',
        'Cucumber', 'Carrot', 'Cabbage', 'Cauliflower', 'Broccoli', 'Spinach', 'Apple', 'Mango', 'Green Grapes',
        'Watermelon', 'Pineapple', 'Chicken Breast', 'Fish Fillet', 'Eggs', 'Tofu', 'Vanilla Ice Cream',
        'Frozen Pizza', 'Veg Burger Patty', 'Chicken Sausage', 'Smoked Bacon', 'Turkey Ham', 'Salmon',
        'Shrimp', 'Crab', 'Lobster', 'Prawns', 'Squid', 'Oyster', 'Mushroom', 'Truffle', 'Wasabi',
        'Ginger', 'Garlic', 'Green Chili', 'Black Pepper', 'Cinnamon', 'Clove', 'Nutmeg', 'Cumin',
        'Coriander', 'Turmeric', 'Saffron', 'Vanilla Extract', 'Milk Chocolate', 'Candy', 'Chewing Gum',
        'Mints', 'Energy Drink', 'Sports Drink', 'Coconut Water', 'Sparkling Water', 'Lemon Soda',
        'Lemonade', 'Iced Tea', 'Chocolate Shake', 'Fruit Smoothie', 'Juice Box', 'Corn Flakes',
        'Oats', 'Granola', 'Cream Biscuits', 'Salt Crackers', 'Butter Popcorn', 'Soft Pretzels',
        'Nachos', 'Salsa', 'Guacamole', 'Hummus'
    ];
    const products = [];
    for (let i = 0; i < 100; i++) {
        const name = names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : '');
        const category = categories[i % categories.length];
        const price = Math.round((Math.random() * 450 + 15) * 100) / 100;
        const cost = Math.round((price * (0.65 + Math.random() * 0.15)) * 100) / 100;
        const stock = Math.floor(Math.random() * 80) + 10;
        const reorder = Math.floor(Math.random() * 15) + 5;
        const sku = category.substring(0, 2).toUpperCase() + '-' + String(2000 + i).padStart(4, '0');
        products.push({
            product_code: sku,
            name: name,
            category: category,
            price: price,
            cost: cost,
            stock_quantity: stock,
            unit: 'pcs',
            supplier: `Distributor ${Math.floor(Math.random() * 10) + 1}`,
            reorder_level: reorder,
            description: `Fresh ${name}`
        });
    }
    return products;
}

/* ---------------- SEED: 100 CUSTOMERS ---------------- */
function generateCustomerSeed() {
    const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Pranav', 'Dhruv', 'Krishna', 'Shaurya',
        'Aadhya', 'Ananya', 'Diya', 'Ishita', 'Kavya', 'Navya', 'Pari', 'Sara', 'Sia', 'Tara',
        'Rohan', 'Amit', 'Suresh', 'Raj', 'Kumar', 'Deepak', 'Sanjay', 'Vikram', 'Anil', 'Sunil',
        'Priya', 'Rina', 'Meera', 'Sneha', 'Pooja', 'Neha', 'Kiran', 'Shilpa', 'Rekha', 'Maya',
        'Karan', 'Ravi', 'Nikhil', 'Varun', 'Harsh', 'Gaurav', 'Jatin', 'Alok', 'Manoj', 'Dinesh'
    ];
    const lastNames = ['Sharma', 'Verma', 'Patel', 'Gupta', 'Kumar', 'Singh', 'Rao', 'Reddy', 'Iyer', 'Nair',
        'Joshi', 'Desai', 'Shah', 'Mehta', 'Agarwal', 'Khanna', 'Malhotra', 'Chopra', 'Bajaj', 'Mittal'
    ];
    const customers = [];
    for (let i = 0; i < 100; i++) {
        const first = firstNames[i % firstNames.length];
        const last = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
        const name = `${first} ${last}`;
        const phone = `98${String(Math.floor(Math.random() * 90000000) + 10000000)}`;
        const visits = Math.floor(Math.random() * 40) + 1;
        const spend = Math.round((visits * (Math.random() * 250 + 50)) * 100) / 100;
        customers.push({ id: i + 1, name, phone, visits, spend });
    }
    return customers;
}

/* ---------------- SEED: 20 STAFF ---------------- */
function generateStaffSeed() {
    const names = ['Rahul', 'Priya', 'Vikram', 'Sneha', 'Arjun', 'Meera', 'Kiran', 'Ravi', 'Anjali', 'Suresh',
        'Deepak', 'Pooja', 'Sanjay', 'Kavita', 'Amit', 'Rina', 'Sunil', 'Neha', 'Raj', 'Maya'
    ];
    const roles = ['Store Manager', 'Cashier', 'Stock Clerk', 'Floor Associate', 'Security', 'Cleaner'];
    const staff = [];
    for (let i = 0; i < 20; i++) {
        const name = names[i % names.length] + ' ' + ['Sharma', 'Verma', 'Patel', 'Gupta', 'Kumar'][i % 5];
        const role = roles[i % roles.length];
        const status = Math.random() > 0.3 ? 'on' : 'off';
        const shifts = ['9:00 AM – 6:00 PM', '9:00 AM – 2:00 PM', '2:00 PM – 9:00 PM', '8:00 AM – 4:00 PM', '12:00 PM – 8:00 PM'];
        const shift = shifts[i % shifts.length];
        staff.push({ id: i + 1, name, role, status, shift });
    }
    return staff;
}

/* ---------------- SEED DATABASE (if empty) ---------------- */
async function seedDatabaseIfNeeded() {
    // Check if products exist in Supabase
    const { count, error } = await supabaseClient
        .from('products')
        .select('*', { count: 'exact', head: true });

    if (error) {
        console.error('Error checking products:', error);
        return;
    }

    if (count === 0) {
        toast('🌱 Seeding 100 products...');
        const seedProducts = generateProductSeed();
        // Insert in batches of 10 to avoid request limit
        for (let i = 0; i < seedProducts.length; i += 10) {
            const batch = seedProducts.slice(i, i + 10);
            const { error: batchError } = await supabaseClient.from('products').insert(batch);
            if (batchError) console.error('Batch insert error:', batchError);
        }
        toast('✅ 100 products seeded!');
    } else {
        console.log(`✅ Products already exist (${count}).`);
    }

    // Seed local customers if empty
    if (customers.length === 0) {
        customers = generateCustomerSeed();
        toast('👥 100 customers loaded');
    }

    // Seed local staff if empty
    if (staff.length === 0) {
        staff = generateStaffSeed();
        toast('👔 Staff loaded');
    }
}

/* ---------------- LOAD PRODUCTS ---------------- */
async function loadProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('products')
            .select('*')
            .order('name');
        if (error) throw error;

        products = data.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            sku: p.product_code,
            stock: p.stock_quantity,
            reorder: p.reorder_level,
            price: p.price
        }));

        renderCurrentView();
        return products;
    } catch (error) {
        console.error('❌ Error loading products:', error);
        products = [];
        renderCurrentView();
        toast('⚠️ Could not load products');
    }
}

/* ---------------- SUPABASE CRUD ---------------- */
async function addProductToSupabase(product) {
    const supabaseProduct = {
        product_code: product.sku,
        name: product.name,
        category: product.category,
        price: product.price,
        cost: product.price * 0.8,
        stock_quantity: product.stock,
        unit: 'pcs',
        supplier: '',
        reorder_level: product.reorder,
        description: ''
    };
    try {
        const { data, error } = await supabaseClient.from('products').insert([supabaseProduct]).select();
        if (error) throw error;
        await loadProducts();
        toast('✅ Product added');
        return data;
    } catch (error) {
        console.error(error);
        toast('❌ Failed to add');
    }
}

async function updateProductInSupabase(id, updates) {
    const supabaseUpdates = {
        name: updates.name,
        category: updates.category,
        product_code: updates.sku,
        price: updates.price,
        stock_quantity: updates.stock,
        reorder_level: updates.reorder,
    };
    try {
        const { error } = await supabaseClient.from('products').update(supabaseUpdates).eq('id', id);
        if (error) throw error;
        await loadProducts();
        toast('✅ Updated');
    } catch (error) {
        console.error(error);
        toast('❌ Update failed');
    }
}

async function deleteProductFromSupabase(id) {
    try {
        const { error } = await supabaseClient.from('products').delete().eq('id', id);
        if (error) throw error;
        await loadProducts();
        toast('🗑️ Removed');
    } catch (error) {
        console.error(error);
        toast('❌ Delete failed');
    }
}

/* ---------------- NAVIGATION ---------------- */
const viewMeta = {
    dashboard: ["Dashboard", "Today's snapshot"],
    billing: ["Billing", "Ring up items"],
    inventory: ["Inventory", "Track stock"],
    staff: ["Staff", "Manage personnel"],
    customers: ["Customers", "Purchase history"],
    reports: ["Reports", "Sales performance"],
};

function switchView(view) {
    currentView = view;
    $$(".view").forEach(v => v.classList.toggle("active", v.id === "view-" + view));
    $$(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.view === view));
    $("#viewTitle").textContent = viewMeta[view][0];
    $("#viewSub").textContent = viewMeta[view][1];
    closeSidebar();
    renderCurrentView();
}

function renderCurrentView() {
    if (currentView === "dashboard") renderDashboard();
    if (currentView === "billing") renderPOS();
    if (currentView === "inventory") renderInventory();
    if (currentView === "staff") renderStaff();
    if (currentView === "customers") renderCustomers();
    if (currentView === "reports") renderReports();
}

function openSidebar() {
    $(".sidebar").classList.add("open");
    let overlay = $(".sidebar-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "sidebar-overlay";
        document.body.appendChild(overlay);
        overlay.addEventListener("click", closeSidebar);
    }
    overlay.classList.add("show");
}

function closeSidebar() {
    $(".sidebar").classList.remove("open");
    const overlay = $(".sidebar-overlay");
    if (overlay) overlay.classList.remove("show");
}

/* ---------------- DASHBOARD ---------------- */
function renderDashboard() {
    const today = new Date();
    const todaysTx = transactions.filter(t => todayKey(t.time) === todayKey(today));
    const todaysRevenue = todaysTx.reduce((s, t) => s + t.total, 0);
    const lowStock = products.filter(p => p.stock <= p.reorder);
    const onDuty = staff.filter(s => s.status === "on").length;

    $("#statTickets").innerHTML = `
    ${ticket("Today's Sales", fmt(todaysRevenue), `${todaysTx.length} bills`, "flat")}
    ${ticket("Products", products.length, `${lowStock.length} low stock`, lowStock.length ? "down" : "up")}
    ${ticket("Staff On Duty", onDuty + " / " + staff.length, "clocked in", "flat")}
    ${ticket("Customers", customers.length, "in ledger", "flat")}
  `;

    $("#lowStockLedger").innerHTML = lowStock.length ? lowStock.slice(0, 6).map(p => `
      <div class="ledger-row">
        <div class="lr-main"><strong>${p.name}</strong><small>${p.sku}</small></div>
        <div class="lr-value warn">${p.stock} left</div>
      </div>`).join("") : `<p class="empty-note">All stocked up!</p>`;

    const recent = [...transactions].sort((a, b) => b.time - a.time).slice(0, 6);
    $("#recentTxLedger").innerHTML = recent.length ? recent.map(t => `
      <div class="ledger-row">
        <div class="lr-main"><strong>Bill #${t.id}</strong><small>${t.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${t.items.length} items</small></div>
        <div class="lr-value">${fmt(t.total)}</div>
      </div>`).join("") : `<p class="empty-note">No bills yet.</p>`;

    renderSalesChart();
}

function ticket(label, value, delta, dir) {
    return `<div class="ticket">
    <div class="t-label">${label}</div>
    <div class="t-value">${value}</div>
    <div class="t-delta ${dir}">${delta}</div>
  </div>`;
}

function renderSalesChart() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d);
    }
    const totals = days.map(d => transactions.filter(t => todayKey(t.time) === todayKey(d)).reduce((s, t) => s + t.total, 0));
    const max = Math.max(...totals, 500);
    $("#salesChart").innerHTML = days.map((d, i) => {
        const h = Math.max(6, Math.round((totals[i] / max) * 130));
        return `<div class="bar-col">
      <span class="bar-amt">${totals[i] ? "₹" + Math.round(totals[i]) : ""}</span>
      <div class="bar" style="height:${h}px"></div>
      <span class="bar-label">${d.toLocaleDateString([], { weekday: "short" })}</span>
    </div>`;
    }).join("");
}

/* ---------------- BILLING / POS ---------------- */
function renderPOS() {
    $("#posCategoryChips").innerHTML = ["All", ...CATEGORIES].map(c => {
        const val = c === "All" ? "" : c;
        return `<button class="chip-btn ${posCategory === val ? 'active' : ''}" data-cat="${val}">${c}</button>`;
    }).join("");
    $$("#posCategoryChips .chip-btn").forEach(b => {
        b.addEventListener("click", () => { posCategory = b.dataset.cat;
            renderPOS(); });
    });

    const q = ($("#posSearch").value || "").toLowerCase();
    const list = products.filter(p =>
        (!posCategory || p.category === posCategory) &&
        (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    );

    $("#posProductGrid").innerHTML = list.map(p => `
    <button class="product-card" data-id="${p.id}" ${p.stock <= 0 ? "disabled" : ""}>
      <span class="pc-cat">${p.category}</span>
      <span class="pc-name">${p.name}</span>
      <span class="pc-price">${fmt(p.price)}</span>
    </button>`).join("") || `<p class="empty-note">No products.</p>`;

    $$("#posProductGrid .product-card").forEach(b => {
        b.addEventListener("click", () => addToCart(Number(b.dataset.id)));
    });

    const custSel = $("#cartCustomer");
    const currentVal = custSel.value;
    custSel.innerHTML = `<option value="">Walk-in</option>` +
        customers.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
    custSel.value = currentVal;
    renderCart();
}

function addToCart(productId) {
    const p = products.find(x => x.id === productId);
    if (!p || p.stock <= 0) return;
    const line = cart.find(c => c.productId === productId);
    const inCart = line ? line.qty : 0;
    if (inCart >= p.stock) { toast(`Only ${p.stock} left`); return; }
    if (line) line.qty++;
    else cart.push({ productId, qty: 1 });
    renderCart();
}

function changeQty(productId, delta) {
    const line = cart.find(c => c.productId === productId);
    if (!line) return;
    const p = products.find(x => x.id === productId);
    const newQty = line.qty + delta;
    if (newQty <= 0) { cart = cart.filter(c => c.productId !== productId); } else if (newQty > p.stock) { toast(`Only ${p.stock} left`); } else { line.qty = newQty; }
    renderCart();
}

function renderCart() {
    $("#cartCount").textContent = cart.reduce((s, c) => s + c.qty, 0) + " items";
    if (!cart.length) {
        $("#cartList").innerHTML = `<p class="empty-note">Cart is empty.</p>`;
    } else {
        $("#cartList").innerHTML = cart.map(c => {
            const p = products.find(x => x.id === c.productId);
            return `<div class="cart-row">
        <div class="cr-name">${p.name}<small>${fmt(p.price)} each</small></div>
        <div class="qty-ctrl">
          <button data-act="dec" data-id="${p.id}">−</button>
          <span>${c.qty}</span>
          <button data-act="inc" data-id="${p.id}">+</button>
        </div>
        <div class="cr-amt">${fmt(p.price * c.qty)}</div>
        <button class="cr-remove" data-act="rm" data-id="${p.id}">&times;</button>
      </div>`;
        }).join("");
        $$("#cartList [data-act]").forEach(b => {
            const id = Number(b.dataset.id);
            b.addEventListener("click", () => {
                if (b.dataset.act === "inc") changeQty(id, 1);
                if (b.dataset.act === "dec") changeQty(id, -1);
                if (b.dataset.act === "rm") { cart = cart.filter(c => c.productId !== id);
                    renderCart(); }
            });
        });
    }
    const subtotal = cart.reduce((s, c) => { const p = products.find(x => x.id === c.productId); return s + p.price * c.qty; }, 0);
    const tax = subtotal * 0.05;
    $("#cartSubtotal").textContent = fmt(subtotal);
    $("#cartTax").textContent = fmt(tax);
    $("#cartTotal").textContent = fmt(subtotal + tax);
}

async function checkout() {
    if (!cart.length) { toast("Cart empty"); return; }
    const subtotal = cart.reduce((s, c) => { const p = products.find(x => x.id === c.productId); return s + p.price * c.qty; }, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;
    const custId = $("#cartCustomer").value ? Number($("#cartCustomer").value) : null;
    const cashier = staff.find(s => s.status === "on")?.name || "Store Staff";

    const items = [];
    for (const c of cart) {
        const p = products.find(x => x.id === c.productId);
        p.stock -= c.qty;
        await updateProductInSupabase(p.id, {
            name: p.name,
            category: p.category,
            sku: p.sku,
            price: p.price,
            stock: p.stock,
            reorder: p.reorder
        });
        items.push({ productId: p.id, name: p.name, qty: c.qty, price: p.price });
    }

    const tx = { id: ++txCounter, time: new Date(), customerId: custId, items, total, cashier };
    transactions.push(tx);
    if (custId) { const c = customers.find(x => x.id === custId);
        c.visits++;
        c.spend += total; }

    showReceipt(tx);
    cart = [];
    renderPOS();
    toast("Bill generated!");
}

function showReceipt(tx) {
    const cust = tx.customerId ? customers.find(c => c.id === tx.customerId) : null;
    $("#receiptBody").innerHTML = `
    <div class="receipt-line"><span>Bill #</span><span>${tx.id}</span></div>
    <div class="receipt-line"><span>Time</span><span>${tx.time.toLocaleString()}</span></div>
    <div class="receipt-line"><span>Customer</span><span>${cust ? cust.name : "Walk-in"}</span></div>
    <div class="receipt-line"><span>Cashier</span><span>${tx.cashier}</span></div>
    <div class="receipt-divider"></div>
    ${tx.items.map(i => `<div class="receipt-line"><span>${i.name} × ${i.qty}</span><span>${fmt(i.price * i.qty)}</span></div>`).join("")}
    <div class="receipt-divider"></div>
    <div class="receipt-line receipt-total"><span>Total</span><span>${fmt(tx.total)}</span></div>
  `;
    $("#receiptBackdrop").classList.add("show");
}

/* ---------------- INVENTORY ---------------- */
function renderInventory() {
    const catSel = $("#invCategoryFilter");
    if (!catSel.dataset.built) {
        catSel.innerHTML += CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join("");
        catSel.dataset.built = "1";
    }
    const q = ($("#invSearch").value || "").toLowerCase();
    const cat = catSel.value;
    const list = products.filter(p =>
        (!cat || p.category === cat) &&
        (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    );

    $("#invTableBody").innerHTML = list.map(p => {
        const low = p.stock <= p.reorder;
        return `<tr>
      <td>${p.name}</td>
      <td class="mono">${p.sku}</td>
      <td>${p.category}</td>
      <td><span class="stock-badge ${low ? 'low' : 'ok'}">${p.stock} units</span></td>
      <td class="mono">${p.reorder}</td>
      <td class="mono">${fmt(p.price)}</td>
      <td>
        <div class="row-actions">
          <button class="btn-icon" data-act="edit" data-id="${p.id}">✎</button>
          <button class="btn-icon" data-act="del" data-id="${p.id}">🗑</button>
        </div>
      </td>
    </tr>`;
    }).join("") || `<tr><td colspan="7" class="empty-note">No products.</td></tr>`;

    $$("#invTableBody [data-act]").forEach(b => {
        const id = Number(b.dataset.id);
        b.addEventListener("click", () => {
            if (b.dataset.act === "edit") openProductModal(id);
            if (b.dataset.act === "del") deleteProduct(id);
        });
    });
}

async function deleteProduct(id) {
    const p = products.find(x => x.id === id);
    if (!confirm(`Remove "${p.name}"?`)) return;
    await deleteProductFromSupabase(id);
}

function openProductModal(id = null) {
    editingType = "product";
    editingId = id;
    const p = id ? products.find(x => x.id === id) : null;
    $("#modalTitle").textContent = p ? "Edit Product" : "Add Product";
    $("#modalBody").innerHTML = `
    <div class="field"><label>Name</label><input id="f-name" value="${p ? p.name : ""}"></div>
    <div class="form-row">
      <div class="field"><label>Category</label>
        <select id="f-cat">${CATEGORIES.map(c => `<option ${p && p.category === c ? "selected" : ""}>${c}</option>`).join("")}</select>
      </div>
      <div class="field"><label>SKU</label><input id="f-sku" value="${p ? p.sku : ""}"></div>
    </div>
    <div class="form-row">
      <div class="field"><label>Stock</label><input id="f-stock" type="number" value="${p ? p.stock : 0}"></div>
      <div class="field"><label>Reorder</label><input id="f-reorder" type="number" value="${p ? p.reorder : 10}"></div>
    </div>
    <div class="field"><label>Price (₹)</label><input id="f-price" type="number" step="0.01" value="${p ? p.price : 0}"></div>
    <button class="btn btn-primary btn-block" id="saveProductBtn">${p ? "Save" : "Add"}</button>
  `;
    $("#saveProductBtn").addEventListener("click", saveProduct);
    openModal();
}

async function saveProduct() {
    const name = $("#f-name").value.trim();
    const category = $("#f-cat").value;
    const sku = $("#f-sku").value.trim();
    const stock = Number($("#f-stock").value);
    const reorder = Number($("#f-reorder").value);
    const price = Number($("#f-price").value);
    if (!name || !sku) { toast("Name and SKU required"); return; }
    if (editingId) {
        await updateProductInSupabase(editingId, { name, category, sku, stock, reorder, price });
    } else {
        await addProductToSupabase({ name, category, sku, stock, reorder, price });
    }
    closeModal();
    renderInventory();
    if (currentView === "billing") renderPOS();
}

/* ---------------- STAFF ---------------- */
function renderStaff() {
    const q = ($("#staffSearch").value || "").toLowerCase();
    const list = staff.filter(s => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q));
    $("#staffGrid").innerHTML = list.map(s => `
    <div class="staff-card">
      <div class="sc-top">
        <div class="avatar">${s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
        <div><strong>${s.name}</strong><small>${s.role}</small></div>
      </div>
      <div class="sc-meta">
        <span>${s.shift}</span>
        <span class="status-dot ${s.status === 'on' ? 'on' : 'off'}"><span class="dot"></span>${s.status === 'on' ? 'On' : 'Off'}</span>
      </div>
      <div class="row-actions">
        <button class="btn-icon" data-act="toggle" data-id="${s.id}">⇄</button>
        <button class="btn-icon" data-act="edit" data-id="${s.id}">✎</button>
        <button class="btn-icon" data-act="del" data-id="${s.id}">🗑</button>
      </div>
    </div>`).join("") || `<p class="empty-note">No staff.</p>`;

    $$("#staffGrid [data-act]").forEach(b => {
        const id = Number(b.dataset.id);
        b.addEventListener("click", () => {
            if (b.dataset.act === "edit") openStaffModal(id);
            if (b.dataset.act === "del") { if (confirm("Remove?")) { staff = staff.filter(x => x.id !== id);
                    renderStaff();
                    toast("Removed"); } }
            if (b.dataset.act === "toggle") {
                const s = staff.find(x => x.id === id);
                s.status = s.status === "on" ? "off" : "on";
                renderStaff();
                renderDashboard();
            }
        });
    });
}

function openStaffModal(id = null) {
    editingType = "staff";
    editingId = id;
    const s = id ? staff.find(x => x.id === id) : null;
    $("#modalTitle").textContent = s ? "Edit Staff" : "Add Staff";
    $("#modalBody").innerHTML = `
    <div class="field"><label>Name</label><input id="f-sname" value="${s ? s.name : ""}"></div>
    <div class="field"><label>Role</label><input id="f-srole" value="${s ? s.role : ""}"></div>
    <div class="field"><label>Shift</label><input id="f-sshift" value="${s ? s.shift : ""}"></div>
    <button class="btn btn-primary btn-block" id="saveStaffBtn">${s ? "Save" : "Add"}</button>
  `;
    $("#saveStaffBtn").addEventListener("click", () => {
        const name = $("#f-sname").value.trim();
        const role = $("#f-srole").value.trim();
        const shift = $("#f-sshift").value.trim();
        if (!name || !role) { toast("Fill all fields"); return; }
        if (editingId) {
            Object.assign(staff.find(x => x.id === editingId), { name, role, shift });
            toast("Updated");
        } else {
            staff.push({ id: nextId(staff), name, role, shift, status: "off" });
            toast("Added");
        }
        closeModal();
        renderStaff();
    });
    openModal();
}

/* ---------------- CUSTOMERS ---------------- */
function renderCustomers() {
    const q = ($("#custSearch").value || "").toLowerCase();
    const list = customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    $("#custTableBody").innerHTML = list.map(c => `
    <tr>
      <td>${c.name}</td>
      <td class="mono">${c.phone}</td>
      <td class="mono">${c.visits}</td>
      <td class="mono">${fmt(c.spend)}</td>
      <td>
        <div class="row-actions">
          <button class="btn-icon" data-act="edit" data-id="${c.id}">✎</button>
          <button class="btn-icon" data-act="del" data-id="${c.id}">🗑</button>
        </div>
      </td>
    </tr>`).join("") || `<tr><td colspan="5" class="empty-note">No customers.</td></tr>`;

    $$("#custTableBody [data-act]").forEach(b => {
        const id = Number(b.dataset.id);
        b.addEventListener("click", () => {
            if (b.dataset.act === "edit") openCustomerModal(id);
            if (b.dataset.act === "del") { if (confirm("Remove?")) { customers = customers.filter(x => x.id !== id);
                    renderCustomers();
                    toast("Removed"); } }
        });
    });
}

function openCustomerModal(id = null) {
    editingType = "customer";
    editingId = id;
    const c = id ? customers.find(x => x.id === id) : null;
    $("#modalTitle").textContent = c ? "Edit Customer" : "Add Customer";
    $("#modalBody").innerHTML = `
    <div class="field"><label>Name</label><input id="f-cname" value="${c ? c.name : ""}"></div>
    <div class="field"><label>Phone</label><input id="f-cphone" value="${c ? c.phone : ""}"></div>
    <button class="btn btn-primary btn-block" id="saveCustBtn">${c ? "Save" : "Add"}</button>
  `;
    $("#saveCustBtn").addEventListener("click", () => {
        const name = $("#f-cname").value.trim();
        const phone = $("#f-cphone").value.trim();
        if (!name || !phone) { toast("Fill all fields"); return; }
        if (editingId) {
            Object.assign(customers.find(x => x.id === editingId), { name, phone });
            toast("Updated");
        } else {
            customers.push({ id: nextId(customers), name, phone, visits: 0, spend: 0 });
            toast("Added");
        }
        closeModal();
        renderCustomers();
    });
    openModal();
}

/* ---------------- REPORTS ---------------- */
function renderReports() {
    const totalRevenue = transactions.reduce((s, t) => s + t.total, 0);
    const avgBill = transactions.length ? totalRevenue / transactions.length : 0;
    const topProduct = (() => {
        const counts = {};
        transactions.forEach(t => t.items.forEach(i => { counts[i.name] = (counts[i.name] || 0) + i.qty; }));
        const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return entries.length ? `${entries[0][0]} (${entries[0][1]})` : "—";
    })();

    $("#reportTickets").innerHTML = `
    ${ticket("Revenue", fmt(totalRevenue), `${transactions.length} bills`, "flat")}
    ${ticket("Avg Bill", fmt(avgBill), "per transaction", "flat")}
    ${ticket("Top Seller", topProduct, "by units", "up")}
  `;

    const sorted = [...transactions].sort((a, b) => b.time - a.time);
    $("#txTableBody").innerHTML = sorted.map(t => {
        const cust = t.customerId ? customers.find(c => c.id === t.customerId) : null;
        return `<tr>
      <td class="mono">#${t.id}</td>
      <td>${t.time.toLocaleString()}</td>
      <td>${cust ? cust.name : "Walk-in"}</td>
      <td>${t.items.reduce((s, i) => s + i.qty, 0)} units</td>
      <td>${t.cashier}</td>
      <td class="mono">${fmt(t.total)}</td>
    </tr>`;
    }).join("") || `<tr><td colspan="6" class="empty-note">No transactions.</td></tr>`;
}

/* ---------------- MODALS ---------------- */
function openModal() { $("#modalBackdrop").classList.add("show"); }

function closeModal() { $("#modalBackdrop").classList.remove("show");
    editingId = null;
    editingType = null; }

/* ---------------- INIT ---------------- */
function updateClock() {
    const now = new Date();
    $("#shiftClock").textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

async function init() {
    // 1. Seed data if needed
    await seedDatabaseIfNeeded();

    // 2. Load products from Supabase
    await loadProducts();

    // 3. Event Listeners
    $$(".nav-item").forEach(b => b.addEventListener("click", () => switchView(b.dataset.view)));
    $("#hamburger").addEventListener("click", openSidebar);
    $("#quickBillBtn").addEventListener("click", () => switchView("billing"));

    $("#modalClose").addEventListener("click", closeModal);
    $("#modalBackdrop").addEventListener("click", e => { if (e.target.id === "modalBackdrop") closeModal(); });
    $("#receiptClose").addEventListener("click", () => $("#receiptBackdrop").classList.remove("show"));
    $("#receiptBackdrop").addEventListener("click", e => { if (e.target.id === "receiptBackdrop") $("#receiptBackdrop").classList.remove("show"); });

    $("#addProductBtn").addEventListener("click", () => openProductModal());
    $("#addStaffBtn").addEventListener("click", () => openStaffModal());
    $("#addCustBtn").addEventListener("click", () => openCustomerModal());

    $("#invSearch").addEventListener("input", renderInventory);
    $("#invCategoryFilter").addEventListener("change", renderInventory);
    $("#staffSearch").addEventListener("input", renderStaff);
    $("#custSearch").addEventListener("input", renderCustomers);
    $("#posSearch").addEventListener("input", renderPOS);

    $("#checkoutBtn").addEventListener("click", checkout);
    $("#clearCartBtn").addEventListener("click", () => { cart = [];
        renderCart(); });

    $("#globalSearch").addEventListener("input", (e) => {
        const val = e.target.value;
        if (val.length < 2) return;
        switchView("inventory");
        $("#invSearch").value = val;
        renderInventory();
    });

    updateClock();
    setInterval(updateClock, 1000);
    renderDashboard();
}

document.addEventListener("DOMContentLoaded", init);
