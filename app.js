const products = [
  { id: 'alimento', name: 'Alimento para perros adultos', category: 'Alimento', species: ['Perros'], detail: 'Bolsa de 3 kg', price: 24900 },
  { id: 'juguete', name: 'Pelota con cuerda', category: 'Juguetes', species: ['Perros'], detail: 'Cuerda de algodón', price: 7900 },
  { id: 'cama', name: 'Cucha redonda Nube', category: 'Descanso', species: ['Perros', 'Gatos'], detail: '60 cm de diámetro', price: 32900 },
  { id: 'arnes', name: 'Arnés + correa Lila', category: 'Paseo', species: ['Perros', 'Gatos'], detail: 'Talle S, ajustable', price: 18900 }
];
const money = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const storageKey = 'patitas-cart-v1';
const cart = loadCart();
const dialog = document.querySelector('#cart');
const trigger = document.querySelector('.cart-trigger');
const filters = [...document.querySelectorAll('[data-filter]')];
const speciesLinks = [...document.querySelectorAll('[data-species]')];
const cartStatus = document.querySelector('#cart-status');
let category = 'Todos';
let species = '';

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return new Map(products.flatMap(({ id }) => {
      const qty = saved?.[id];
      return Number.isInteger(qty) && qty > 0 && qty <= 99 ? [[id, qty]] : [];
    }));
  } catch {
    return new Map();
  }
}

function saveCart() {
  try { localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(cart))); }
  catch { /* El carrito sigue disponible durante la visita. */ }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function button(className, label, action, accessibleLabel = label) {
  const node = element('button', className, label);
  node.type = 'button';
  node.setAttribute('aria-label', accessibleLabel);
  node.addEventListener('click', action);
  return node;
}

function renderProducts() {
  const visible = products.filter(product =>
    (category === 'Todos' || product.category === category) && (!species || product.species.includes(species)));
  const list = document.querySelector('#products');
  list.replaceChildren(...visible.map(product => {
    const card = element('article', 'product');
    const photo = element('div', 'product-photo photo-' + product.id);
    photo.setAttribute('role', 'img');
    photo.setAttribute('aria-label', product.name);
    const body = element('div', 'product-body');
    const bottom = element('div', 'product-bottom');
    const add = button('add-button', '+', () => {
      changeQuantity(product.id, 1);
      document.querySelector('#cart-announcement').textContent =
        product.name + ' · ' + cart.get(product.id) + ' en el carrito.';
    }, 'Agregar ' + product.name + ' al carrito');
    bottom.append(element('strong', 'price', money.format(product.price)), add);
    body.append(
      element('p', 'product-category', product.category),
      element('h3', '', product.name),
      element('p', 'product-detail', product.detail),
      bottom
    );
    card.append(photo, body);
    return card;
  }));
  if (!visible.length) list.append(element('p', 'empty-catalog', 'No encontramos productos con esos filtros.'));
  document.querySelector('#catalog-status').textContent =
    visible.length + (visible.length === 1 ? ' producto disponible' : ' productos disponibles');
  document.querySelector('#catalog-subtitle').textContent = species
    ? 'Mostrando productos para ' + species.toLowerCase() + '.'
    : 'Encontrá algo para cada momento del día.';
  for (const filter of filters) filter.setAttribute('aria-pressed', String(filter.dataset.filter === category));
  for (const link of speciesLinks) {
    if (link.dataset.species === species) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
}

function changeQuantity(id, delta) {
  const next = Math.min(99, (cart.get(id) ?? 0) + delta);
  if (next > 0) cart.set(id, next);
  else cart.delete(id);
  cartStatus.textContent = '';
  saveCart();
  renderCart();
}

function renderCart() {
  let total = 0;
  let count = 0;
  const items = products.flatMap(product => {
    const qty = cart.get(product.id);
    if (!qty) return [];
    total += qty * product.price;
    count += qty;

    const row = element('li', 'cart-item');
    const info = element('div', 'cart-info');
    info.append(element('strong', '', product.name), element('span', '', money.format(qty * product.price)));
    const controls = element('div', 'qty');
    const quantityButton = (label, delta, name) => button('qty-button', label, event => {
      const control = event.currentTarget.dataset.control;
      changeQuantity(product.id, delta);
      const next = dialog.querySelector('[data-control="' + control + '"]');
      (next ?? dialog.querySelector('.close')).focus();
    }, name + ' ' + product.name);
    const decrease = quantityButton('−', -1, 'Quitar una unidad de');
    const increase = quantityButton('+', 1, 'Agregar una unidad de');
    decrease.dataset.control = product.id + '-decrease';
    increase.dataset.control = product.id + '-increase';
    controls.append(decrease, element('span', '', String(qty)), increase);
    row.append(info, controls);
    return [row];
  });

  document.querySelector('#cart-items').replaceChildren(...items);
  document.querySelector('#cart-count').textContent = count;
  trigger.setAttribute('aria-label', 'Abrir carrito, ' + count + (count === 1 ? ' producto' : ' productos'));
  document.querySelector('#cart-empty').hidden = count > 0;
  document.querySelector('#cart-summary').hidden = count === 0;
  document.querySelector('#cart-total').textContent = money.format(total);
}

for (const filter of filters) filter.addEventListener('click', () => {
  category = filter.dataset.filter;
  renderProducts();
});
for (const link of speciesLinks) link.addEventListener('click', () => {
  species = link.dataset.species;
  category = 'Todos';
  renderProducts();
});
for (const link of document.querySelectorAll('[data-category]')) link.addEventListener('click', () => {
  species = '';
  category = link.dataset.category;
  renderProducts();
});

trigger.addEventListener('click', () => dialog.showModal());
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
document.querySelector('#order').addEventListener('click', () => {
  if (!cart.size) return;
  cart.clear();
  saveCart();
  renderCart();
  cartStatus.textContent = 'Pedido simulado. No se realizó ningún cobro.';
  cartStatus.tabIndex = -1;
  cartStatus.focus();
});

renderProducts();
renderCart();
