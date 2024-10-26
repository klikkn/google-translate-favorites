function addItem({ sl, tl, op }) {
  chrome.storage.sync.get({ items: [] }, function (result) {
    let items = result.items;
    items.push({ sl, tl, op });
    chrome.storage.sync.set({ items: items }, function () {
      displayItems();
    });
  });
}

function removeItem({ sl, tl, op }) {
  chrome.storage.sync.get({ items: [] }, function (result) {
    let items = result.items;
    items = items.filter(item => item.sl !== sl || item.tl !== tl || item.op !== op);
    chrome.storage.sync.set({ items: items }, function () {
      displayItems();
    });
  });
}

function displayItems() {
  const nav = document.querySelector('nav');
  if (!nav) {
    return;
  }

  chrome.storage.sync.get({ items: [] }, function (result) {
    let items = result.items;
    let container = document.createElement('div');
    container.id = 'items-container';
    
    items.forEach(item => {
      let button = document.createElement('button');
      button.textContent = `${item.sl} -> ${item.tl}`;
      button.addEventListener('click', function () {
        updateQueryParams(item.sl, item.tl);
      });
      container.appendChild(button);
    });

    let existingContainer = document.getElementById('items-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    nav.insertAdjacentElement('afterend', container);
  });
}

function updateQueryParams(sl, tl) {
  let url = new URL(window.location);
  url.searchParams.set('sl', sl);
  url.searchParams.set('tl', tl);
  window.location.assign(url)
}

function runOnStart() {
  console.log(1);
  displayItems();
}

if(document.readyState !== 'loading') {
  runOnStart();
}

document.addEventListener('DOMContentLoaded', runOnStart);
document.addEventListener('locationchange', runOnStart);
