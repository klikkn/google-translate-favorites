const getItems = async () => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get({ items: [] }, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.items);
      }
    });
  });
};

const setItems = async (items) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ items: items }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

const addItem = async (item) => {
  return getItems().then(items => {
    const isDuplicate = items.some(existingItem => existingItem.sl === item.sl && existingItem.tl === item.tl);
    if (!isDuplicate) {
      items.push(item);
      return setItems(items);
    } else {
      alert('Item already exists');
    }
  }).catch(error => {
    alert('Error adding item:', error);
  });
};

const removeItem = async ({ sl, tl }) => {
  return getItems().then(items => {
    const updatedItems = items.filter(item => item.sl !== sl || item.tl !== tl);
    return setItems(updatedItems);
  }).catch(error => {
    alert('Error removing item:', error);
  });
};

// View Logic
const getQueryParams = () => {
  const url = new URL(window.location);
  return {
    sl: url.searchParams.get('sl'),
    tl: url.searchParams.get('tl'),
  };
};

const setQueryParams = ({sl, tl}) => {
  let url = new URL(window.location);
  url.searchParams.set('sl', sl);
  url.searchParams.set('tl', tl);
  window.location.assign(url);
};

const setLanguagePair = ({sl, tl}) => {
  setQueryParams({sl, tl});
};

const saveLanguagePair = async () => {
  const { sl, tl } = getQueryParams();
  return addItem({ sl, tl });
};

const initDOM = () => {
  const nav = document.querySelector('nav');
  nav.parentElement.style.height = 'auto';
  nav.parentElement.style.flexWrap = 'wrap';

  const gftContainer = document.createElement('div');
  gftContainer.id='gft-container';
  gftContainer.className = nav.className;
  gftContainer.style.width = '100%';
  gftContainer.style.display = 'flex';
  gftContainer.style.gap = '5px';

  const saveButton = document.createElement('button');
  saveButton.id='save-quick-link';
  saveButton.dataset.gtfRole='save-quick-link';
  saveButton.textContent = 'Save language pair';

  const quickLinkList = document.createElement('div');
  quickLinkList.id = 'quick-link-list';
  quickLinkList.style.display = 'flex';
  quickLinkList.style.gap = '5px';

  const quickLinkItem = document.createElement('button');
  quickLinkItem.dataset.gtfRole='quick-link-item';
  quickLinkItem.style.padding = '5px 5px 5px 10px';
  quickLinkItem.style.height = 'auto';

  const removeIcon = document.createElement('div');
  removeIcon.dataset.gtfRole='quick-link-remove';
  removeIcon.innerHTML = '<svg style="pointer-events: none" focusable="false" width="14" height="14" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>';
  removeIcon.style.marginLeft = '5px';
  removeIcon.style.height = '14px';
  removeIcon.style.width = '14px';
  removeIcon.style.cursor = 'pointer';

  const referenceButton = document.querySelector('button[aria-label="Image translation"]');
  if (referenceButton) {
    saveButton.className = referenceButton.className;
    quickLinkItem.className = referenceButton.className;
  }

  nav.parentNode.appendChild(gftContainer);

  return { gftContainer, saveButton, quickLinkList, removeIcon, quickLinkItem };
}

const render = async ({ gftContainer, saveButton, quickLinkList, removeIcon, quickLinkItem }) => {
  const items = await getItems();

  quickLinkList.innerHTML = '';

  items.forEach(({ sl, tl }) => {
    const quickLinkItemClone = quickLinkItem.cloneNode(true);
    quickLinkItemClone.dataset.sl = sl;
    quickLinkItemClone.dataset.tl = tl;
    quickLinkItemClone.textContent = `${sl}:${tl}`;
    quickLinkItemClone.appendChild(removeIcon.cloneNode(true));

    quickLinkList.appendChild(quickLinkItemClone);
  });

  const existingQuickLinkList = document.getElementById(quickLinkList.getAttribute('id'));
  const existingSaveButton = document.getElementById(saveButton.getAttribute('id'));
  
  existingQuickLinkList?.remove();
  existingSaveButton?.remove();

  gftContainer.appendChild(saveButton);
  gftContainer.appendChild(quickLinkList);
}

// Initialization
const { gftContainer, saveButton, quickLinkList, removeIcon, quickLinkItem } = initDOM();

const runOnStart = () => {
  render({ gftContainer, saveButton, quickLinkList, removeIcon, quickLinkItem });
};

if (document.readyState !== 'loading') {
  runOnStart();
}

document.addEventListener('DOMContentLoaded', runOnStart);
document.addEventListener('click', async (event) => {    
  if (!event.target.dataset.gtfRole) {
    return;
  }

  switch(event.target.dataset.gtfRole) {    
    case 'quick-link-remove':      
      removeItem({
        sl: event.target.parentNode.dataset.sl,
        tl: event.target.parentNode.dataset.tl,
      }).then(() => {
        render({ gftContainer, saveButton, quickLinkList, removeIcon, quickLinkItem });
      });
      break;
    case 'quick-link-item':
      setLanguagePair({
        sl: event.target.dataset.sl,
        tl: event.target.dataset.tl,
      })
      break;
    case 'save-quick-link':
      saveLanguagePair().then(() => {
        render({ gftContainer, saveButton, quickLinkList, removeIcon, quickLinkItem });
      });
      break;
    default:
      break;
  }
})