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
const getLanguagePair = () => {
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
  const { sl, tl } = getLanguagePair();
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
  gftContainer.style.flexWrap = 'wrap';
  gftContainer.style.gap = '5px';

  const quickLinkList = document.createElement('div');
  quickLinkList.id = 'quick-link-list';
  quickLinkList.style.display = 'flex';
  quickLinkList.style.flexWrap = 'wrap';
  quickLinkList.style.gap = '5px';

  const quickLinkItem = document.createElement('button');
  quickLinkItem.dataset.gtfRole='quick-link-item';
  quickLinkList.style.display = 'flex';
  quickLinkList.style.alignItems = 'center';
  quickLinkItem.style.margin = '0';
  quickLinkItem.style.padding = '5px 5px 5px 10px';
  quickLinkItem.style.height = 'auto';
  quickLinkItem.style.gap = '5px';

  const saveButton = document.createElement('button');
  saveButton.id='save-quick-link';
  saveButton.dataset.gtfRole='save-quick-link';
  quickLinkList.style.display = 'flex';
  quickLinkList.style.alignItems = 'center';
  saveButton.style.margin = '0';
  saveButton.style.padding = '5px 5px 5px 5px';
  saveButton.style.height = 'auto';
  saveButton.style.gap = '5px';

  const removeIcon = document.createElement('div');
  removeIcon.dataset.gtfRole='quick-link-remove';
  removeIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="#1967d2" style="pointer-events: none; position: relative; top: 1px" focusable="false" width="14" height="14" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>';
  removeIcon.style.height = '14px';
  removeIcon.style.width = '14px';
  removeIcon.style.cursor = 'pointer';

  const referenceButton = document.querySelector('nav div[data-is-touch-wrapper=true] > button');
  
  if (referenceButton) {
    saveButton.className = referenceButton.className;
    quickLinkItem.className = referenceButton.className;

    if (saveButton.classList.length > 0) {
      saveButton.classList.remove(saveButton.classList.item(saveButton.classList.length - 1));
    }

    if (quickLinkItem.classList.length > 0) {
      quickLinkItem.classList.remove(quickLinkItem.classList.item(quickLinkItem.classList.length - 1));
    }
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

  const { sl, tl } = getLanguagePair();
  saveButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" style="pointer-events: none;" fill="#1967d2" height="18px" viewBox="0 0 24 24" width="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
    <span style="pointer-events: none;" >${sl}:${tl}<span>
  `;

  gftContainer.appendChild(quickLinkList);
  gftContainer.appendChild(saveButton);
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
      saveLanguagePair()
      .then(() => {
        render({ gftContainer, saveButton, quickLinkList, removeIcon, quickLinkItem });
      });
      break;
    default:
      break;
  }
})

window.navigation.addEventListener("navigate", (event) => {
  render({ gftContainer, saveButton, quickLinkList, removeIcon, quickLinkItem });
})