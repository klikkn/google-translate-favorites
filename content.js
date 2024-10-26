async function getItems() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get({ items: [] }, function (result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.items);
      }
    });
  });
}

async function setItems(items) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ items: items }, function () {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

async function addItem(item) {
  return getItems().then(items => {
    items.push(item);
    return setItems(items);
  }).catch(error => {
    console.error('Error adding item:', error);
  });
}

async function removeItem(itemToRemove) {
  return getItems().then(items => {
    const updatedItems = items.filter(item => item.sl !== itemToRemove.sl || item.tl !== itemToRemove.tl);
    return setItems(updatedItems);
  }).catch(error => {
    console.error('Error removing item:', error);
  });
}

async function saveCurrentValues() {
  let url = new URL(window.location);
  let sl = url.searchParams.get('sl');
  let tl = url.searchParams.get('tl');
}

// View Logic
function updateQueryParams(sl, tl) {
  let url = new URL(window.location);
  url.searchParams.set('sl', sl);
  url.searchParams.set('tl', tl);
  window.location.assign(url);
}

async function renderItems() {
  const referenceButton = document.querySelector('button[aria-label="Text translation"]');
  const nav = document.querySelector('nav');
  nav.parentElement.style.height = 'auto';
  nav.parentElement.style.flexWrap = 'wrap';
  if (!nav) {
    return;
  }

  const container = document.createElement('div');
  container.id = 'items-container';
  container.style.display = 'flex';
  container.style.padding = '0 12px';
  container.style.gap = '5px';

  const existingContainer = document.getElementById('items-container');
  if (existingContainer) {
    existingContainer.remove();
  }

  const items = await getItems();

  items.forEach(item => {
    let button = document.createElement('button');
    if (referenceButton) {
      button.className = referenceButton.className;
      button.style.padding = '5px';
      button.style.height = 'auto';
    }

    button.textContent = `${item.sl}:${item.tl}`;
    button.addEventListener('click', function () {
      updateQueryParams(item.sl, item.tl);
    });
    container.appendChild(button);
  });

  nav.insertAdjacentElement('afterend', container);
}

function renderSaveButton() {
  const saveButton = document.createElement('button');
  saveButton.textContent = 'Save';
  saveButton.addEventListener('click', saveCurrentValues);
  
  const referenceButton = document.querySelector('button[aria-label="Text translation"]');
  if (referenceButton) {
    saveButton.className = referenceButton.className;
  }

  const nav = document.querySelector('nav');
  if (nav) {
    nav.insertAdjacentElement('afterend', saveButton);
  }
}

// Initialization
function runOnStart() {
  renderItems();
  renderSaveButton();
}

if (document.readyState !== 'loading') {
  runOnStart();
}

document.addEventListener('DOMContentLoaded', runOnStart);