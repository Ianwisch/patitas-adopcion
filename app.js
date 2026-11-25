const cards = document.querySelector('#cards');
const catalogStatus = document.querySelector('#catalog-status');
const filters = [...document.querySelectorAll('[data-filter]')];
const dialog = document.querySelector('dialog');
const form = document.querySelector('#adopt');
const formStatus = document.querySelector('#form-status');
const submit = form.querySelector('[type=submit]');
let pets = [];
let selected;
let pending = false;

function render(filter) {
  const shown = pets.filter(pet => filter === 'Todas' || pet.type === filter);
  cards.replaceChildren(...shown.map(pet => {
    const card = document.createElement('article');
    card.className = 'card';
    const img = document.createElement('img');
    img.src = 'https://images.unsplash.com/' + pet.photo + '?auto=format&fit=crop&w=720&q=82';
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
      submit.hidden = false;
      formStatus.textContent = '';
      document.querySelector('#form-title').textContent = 'Conocé a ' + pet.name;
      dialog.showModal();
    });

    info.append(title, age, description, button);
    card.append(img, info);
    return card;
  }));
  catalogStatus.textContent = shown.length ? '' : 'No hay mascotas en esta categoría.';
  catalogStatus.hidden = shown.length > 0;
}

for (const button of filters) {
  button.disabled = true;
  button.addEventListener('click', () => {
    for (const item of filters) item.setAttribute('aria-pressed', String(item === button));
    render(button.dataset.filter);
  });
}

async function loadPets() {
  try {
    const response = await fetch('/api/mascotas');
    if (!response.ok) throw new Error();
    pets = await response.json();
    render('Todas');
    for (const button of filters) button.disabled = false;
  } catch {
    catalogStatus.textContent = 'No pudimos cargar las mascotas. Recargá la página para volver a intentar.';
  }
}

form.querySelector('.close').addEventListener('click', () => { if (!pending) dialog.close(); });
dialog.addEventListener('cancel', event => { if (pending) event.preventDefault(); });
form.addEventListener('submit', async event => {
  event.preventDefault();
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
      formStatus.textContent = result.error;
      return;
    }
    formStatus.textContent = '¡Listo! Guardamos tu solicitud para ' + selected.name + '.';
    form.reset();
    submit.hidden = true;
  } catch {
    formStatus.textContent = 'No pudimos enviar la solicitud. Probá de nuevo.';
  } finally {
    pending = false;
    submit.disabled = false;
  }
});

loadPets();

