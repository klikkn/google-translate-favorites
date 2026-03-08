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
      showToast('This language pair is already saved.', 'info');
    }
  }).catch(() => {
    showToast('Could not save item. Please try again.', 'error');
  });
};

const removeItem = async ({ sl, tl }) => {
  return getItems().then(items => {
    const updatedItems = items.filter(item => item.sl !== sl || item.tl !== tl);
    return setItems(updatedItems);
  }).catch(() => {
    showToast('Could not remove item. Please try again.', 'error');
  });
};

// View Logic
const getLanguagePair = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const sl = urlParams.get('sl');
  const tl = urlParams.get('tl');

  return { sl, tl };
};

const setQueryParams = ({ sl, tl }) => {
  let url = new URL(window.location);
  url.searchParams.set('sl', sl);
  url.searchParams.set('tl', tl);

  window.location.assign(url);
};

const setLanguagePair = ({ sl, tl }) => {
  setQueryParams({ sl, tl });
};

const saveLanguagePair = async () => {
  const { sl, tl } = getLanguagePair();
  return addItem({ sl, tl });
};

let _toastTimer = null;

const dismissToast = (toast) => {
  toast.classList.remove('gft-toast--visible');
};

const showToast = (message, type = 'info', undoCallback = null) => {
  let toast = document.getElementById('gft-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'gft-toast';
    document.body.appendChild(toast);
  }
  if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }
  toast.className = `gft-toast--${type}`;
  if (undoCallback) {
    toast.innerHTML = `${message}<span class="gft-toast-undo" id="gft-toast-undo-btn">Undo</span>`;
    const undoBtn = toast.querySelector('#gft-toast-undo-btn');
    const handler = () => {
      undoBtn.removeEventListener('click', handler);
      undoCallback();
      dismissToast(toast);
    };
    undoBtn.addEventListener('click', handler);
  } else {
    toast.textContent = message;
  }
  requestAnimationFrame(() => toast.classList.add('gft-toast--visible'));
  _toastTimer = setTimeout(() => dismissToast(toast), undoCallback ? 3000 : 2500);
};

const initDOM = () => {
  const nav = document.querySelector('nav');
  nav.parentElement.style.height = 'auto';
  nav.parentElement.style.flexWrap = 'wrap';
  nav.parentElement.style.justifyContent = 'space-between';

  const gftContainer = document.createElement('div');
  gftContainer.id = 'gft-container';
  gftContainer.className = nav.className;
  gftContainer.style.display = 'flex';
  gftContainer.style.flexWrap = 'wrap';
  gftContainer.style.gap = '5px';

  const quickLinkList = document.createElement('div');
  quickLinkList.id = 'quick-link-list';
  quickLinkList.style.display = 'flex';
  quickLinkList.style.flexWrap = 'wrap';
  quickLinkList.style.gap = '5px';

  const quickLinkItem = document.createElement('button');
  quickLinkItem.dataset.gtfRole = 'quick-link-item';
  quickLinkList.style.display = 'flex';
  quickLinkList.style.alignItems = 'center';
  quickLinkItem.style.margin = '0';
  quickLinkItem.style.padding = '5px 5px 5px 10px';
  quickLinkItem.style.height = 'auto';
  quickLinkItem.style.gap = '5px';
  quickLinkItem.style.borderRadius = '16px';

  const saveButton = document.createElement('button');
  saveButton.id = 'save-quick-link';
  saveButton.dataset.gtfRole = 'save-quick-link';
  quickLinkList.style.display = 'flex';
  quickLinkList.style.alignItems = 'center';
  saveButton.style.margin = '0';
  saveButton.style.padding = '5px';
  saveButton.style.height = 'auto';
  saveButton.style.gap = '0';
  saveButton.style.overflow = 'hidden';
  saveButton.style.transition = 'padding 0.2s ease';

  if (!document.getElementById('gft-styles')) {
    const style = document.createElement('style');
    style.id = 'gft-styles';
    style.textContent = `
      #save-quick-link .gft-label {
        display: inline-block;
        max-width: 0;
        opacity: 0;
        white-space: nowrap;
        overflow: hidden;
        transition: max-width 0.25s ease, opacity 0.2s ease, margin-left 0.2s ease;
        margin-left: 0;
        pointer-events: none;
      }
      #save-quick-link:hover .gft-label {
        max-width: 200px;
        opacity: 1;
        margin-left: 5px;
      }
      #save-quick-link:hover {
        padding: 5px 10px 5px 5px;
      }
      [data-gtf-role="save-quick-link"],
      [data-gtf-role="quick-link-item"] {
        color: #1967d2;
      }
      #gft-toast {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 18px;
        border-radius: 8px;
        font-family: 'Google Sans', Roboto, Arial, sans-serif;
        font-size: 13px;
        color: #fff;
        z-index: 99999;
        opacity: 0;
        transition: opacity 0.2s ease;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        pointer-events: auto;
      }
      #gft-toast.gft-toast--visible { opacity: 1; }
      #gft-toast.gft-toast--info { background-color: #1967d2; }
      #gft-toast.gft-toast--error { background-color: #c5221f; }
      #gft-toast .gft-toast-undo {
        margin-left: 10px;
        cursor: pointer;
        text-decoration: underline;
        font-weight: 600;
      }
    `;
    document.head.appendChild(style);
  }

  const removeIcon = document.createElement('div');
  removeIcon.dataset.gtfRole = 'quick-link-remove';
  removeIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" style="pointer-events: none; flex-shrink: 0;" focusable="false" width="14" height="14" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"></path></svg>';
  removeIcon.style.height = '24px';
  removeIcon.style.width = '24px';
  removeIcon.style.cursor = 'pointer';
  removeIcon.style.display = 'flex';
  removeIcon.style.alignItems = 'center';
  removeIcon.style.justifyContent = 'center';

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

  const bmcLink = document.createElement('a');
  bmcLink.dataset.gtfRole = 'bmc-link';
  bmcLink.href = 'https://buymeacoffee.com/klikkn';
  bmcLink.target = '_blank';
  bmcLink.textContent = '☕';
  bmcLink.style.order = '99';
  bmcLink.style.marginLeft = 'auto';
  // gftContainer.appendChild(bmcLink); // temporary hide the donations

  return { gftContainer, saveButton, quickLinkList, removeIcon, quickLinkItem };
}

const getLanguageName = (code) => {
  try {
    const locale = document.documentElement.lang || chrome.i18n.getUILanguage();
    const languageNames = new Intl.DisplayNames([locale], { type: 'language' });
    return languageNames.of(code);
  } catch (e) {
    return code;
  }
};

const render = async ({ gftContainer, saveButton, quickLinkList, removeIcon, quickLinkItem }) => {
  const items = await getItems();
  const { sl: currentSl, tl: currentTl } = getLanguagePair();

  quickLinkList.innerHTML = '';

  items.forEach(({ sl, tl }) => {
    const quickLinkItemClone = quickLinkItem.cloneNode(true);
    quickLinkItemClone.dataset.sl = sl;
    quickLinkItemClone.dataset.tl = tl;
    quickLinkItemClone.textContent = `${getLanguageName(sl)} ↔ ${getLanguageName(tl)}`;
    quickLinkItemClone.setAttribute('aria-label', `${getLanguageName(sl)} and ${getLanguageName(tl)}`);

    // Style adjustments for text length
    quickLinkItemClone.style.whiteSpace = 'nowrap';

    const removeIconClone = removeIcon.cloneNode(true);
    removeIconClone.setAttribute('aria-label', `Remove ${getLanguageName(sl)} ↔ ${getLanguageName(tl)}`);
    removeIconClone.setAttribute('role', 'button');
    quickLinkItemClone.appendChild(removeIconClone);

    if (sl === currentSl && tl === currentTl) {
      quickLinkItemClone.style.border = '2px solid #1967d2';
      quickLinkItemClone.style.backgroundColor = 'rgba(25, 103, 210, 0.08)';
    }

    quickLinkList.appendChild(quickLinkItemClone);
  });

  if (items.length === 0) {
    const emptyHint = document.createElement('span');
    emptyHint.textContent = 'Save your first language pair \u2192';
    emptyHint.style.fontSize = '12px';
    emptyHint.style.color = '#5f6368';
    emptyHint.style.padding = '6px 10px';
    emptyHint.style.pointerEvents = 'none';
    emptyHint.style.userSelect = 'none';
    quickLinkList.appendChild(emptyHint);
  }

  const existingQuickLinkList = document.getElementById(quickLinkList.getAttribute('id'));
  const existingSaveButton = document.getElementById(saveButton.getAttribute('id'));

  existingQuickLinkList?.remove();
  existingSaveButton?.remove();

  gftContainer.appendChild(quickLinkList);

  if (!items.some(item => item.sl === currentSl && item.tl === currentTl)) {
    saveButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" style="pointer-events: none; flex-shrink: 0;" fill="currentColor" height="18px" viewBox="0 0 24 24" width="18px"><path d="M0 0h24v24H0z" fill="none"/><path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
      <span class="gft-label">${getLanguageName(currentSl)} ↔ ${getLanguageName(currentTl)}</span>
    `;
    saveButton.setAttribute('aria-label', `Save ${getLanguageName(currentSl)} and ${getLanguageName(currentTl)} as favorite`);

    gftContainer.appendChild(saveButton);
  }
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

  switch (event.target.dataset.gtfRole) {
    case 'quick-link-remove':
      {
        const sl = event.target.parentNode.dataset.sl;
        const tl = event.target.parentNode.dataset.tl;
        const pairLabel = `${getLanguageName(sl)} ↔ ${getLanguageName(tl)}`;
        removeItem({ sl, tl }).then(() => {
          render({ gftContainer, saveButton, quickLinkList, removeIcon, quickLinkItem });
          showToast(`Removed ${pairLabel}`, 'info', () => {
            addItem({ sl, tl }).then(() => {
              render({ gftContainer, saveButton, quickLinkList, removeIcon, quickLinkItem });
            });
          });
        });
      }
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
    case 'bmc-link':
      break;
    default:
      break;
  }
})

window.navigation.addEventListener("navigate", (event) => {
  render({ gftContainer, saveButton, quickLinkList, removeIcon, quickLinkItem });
})