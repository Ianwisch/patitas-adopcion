const cards = document.querySelector('#cards');
const catalogStatus = document.querySelector('#catalog-status');
const retry = document.querySelector('#retry');
const filters = [...document.querySelectorAll('[data-filter]')];
const dialog = document.querySelector('dialog');
const form = document.querySelector('#adopt');
const formStatus = document.querySelector('#form-status');
const submit = form.querySelector('[type=submit]');
let pets = [];
let selected;
let pending = false;
const fields = [form.elements.name, form.elements.email];

function setFieldError(field, message = '') {
  document.querySelector('#' + field.name + '-error').textContent = message;
  if (message) field.setAttribute('aria-invalid', 'true');
  else field.removeAttribute('aria-invalid');
}

for (const field of fields) {
  field.addEventListener('input', () => setFieldError(field));
}

function useFallback(image) {
  image.addEventListener('error', () => {
    image.removeAttribute('srcset');
    image.src = '/patitas.svg';
  }, { once: true });
  if (image.complete && image.getAttribute('src') && !image.naturalWidth) {
    image.dispatchEvent(new Event('error'));
  }
}

useFallback(document.querySelector('.hero-photo'));

function render(filter) {
  const shown = pets.filter(pet => filter === 'Todas' || pet.type === filter);
  cards.replaceChildren(...shown.map(pet => {
    const card = document.createElement('article');
    card.className = 'card';
    const img = document.createElement('img');
    const photo = 'https://images.unsplash.com/' + pet.photo + '?auto=format&fit=crop&q=80&w=';
    useFallback(img);
    img.width = 720;
    img.height = 436;
    img.sizes = '(max-width:620px) 100vw, 33vw';
    img.srcset = photo + '360 360w, ' + photo + '720 720w';
    img.src = photo + '720';
    img.alt = pet.alt;
    img.loading = 'lazy';

    const info = document.createElement('div');
    info.className = 'card-info';
    const title = document.createElement('h3');
    title.textContent = pet.name;
    const age = document.createElement('span');
    age.className = 'age';
    age.textContent = pet.age;
    const description = document.createElement('p');
    description.textContent = pet.description;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Me interesa';
    button.setAttribute('aria-label', 'Me interesa ' + pet.name);
    button.addEventListener('click', () => {
      selected = pet;
      form.reset();
      for (const field of fields) setFieldError(field);
      submit.hidden = false;
      formStatus.textContent = '';
      document.querySelector('#form-title').textContent = 'Conocé a ' + pet.name;
      dialog.showModal();
    });

    info.append(title, age, description, button);
    card.append(img, info);
    return card;
  }));
  catalogStatus.textContent = shown.length ? 'Mascotas disponibles: ' + shown.length : 'No hay mascotas en esta categoría.';
}

for (const button of filters) {
  button.disabled = true;
  button.addEventListener('click', () => {
    for (const item of filters) item.setAttribute('aria-pressed', String(item === button));
    render(button.dataset.filter);
  });
}

async function loadPets() {
  catalogStatus.textContent = 'Cargando mascotas…';
  retry.hidden = true;
  try {
    const response = await fetch('/api/mascotas');
    if (!response.ok) throw new Error();
    pets = await response.json();
    render('Todas');
    for (const button of filters) button.disabled = false;
  } catch {
    catalogStatus.textContent = 'No pudimos cargar las mascotas.';
    retry.hidden = false;
  }
}

form.querySelector('.close').addEventListener('click', () => { if (!pending) dialog.close(); });
dialog.addEventListener('cancel', event => { if (pending) event.preventDefault(); });
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (pending || submit.hidden || !selected) return;
  formStatus.textContent = '';
  const [name, email] = fields;
  setFieldError(name, name.value.trim() ? '' : 'Ingresá tu nombre.');
  setFieldError(email, email.validity.valid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) ? '' : 'Ingresá un correo válido.');
  const invalid = fields.find(field => field.hasAttribute('aria-invalid'));
  if (invalid) {
    invalid.focus();
    return;
  }
  pending = true;
  submit.disabled = true;
  formStatus.textContent = 'Enviando…';
  try {
    const response = await fetch('/api/solicitudes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...Object.fromEntries(new FormData(form)), petId: selected.id })
    });
    const result = await response.json();
    if (!response.ok) {
      for (const field of fields) setFieldError(field, result.errors?.[field.name]);
      formStatus.textContent = result.error;
      fields.find(field => field.hasAttribute('aria-invalid'))?.focus();
      return;
    }
    formStatus.textContent = '¡Listo! Guardamos tu solicitud para ' + selected.name + '.';
    form.reset();
    submit.hidden = true;
    formStatus.tabIndex = -1;
    formStatus.focus();
  } catch {
    formStatus.textContent = 'No pudimos enviar la solicitud. Probá de nuevo.';
  } finally {
    pending = false;
    submit.disabled = false;
  }
});

retry.addEventListener('click', loadPets);
loadPets();
