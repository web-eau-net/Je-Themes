(function () {
  'use strict';

	  // Utility functions
	  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
	  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

	  // Configuration from PHP
	  const cfg = window.TJ_CONFIG || {};
	  const endpoint = cfg.endpoint || 'https://templatejoomla.com/api/templates/templates.json';
	  const texts = cfg.texts || {};

	  // DOM elements
	  const elContent = $('#tj-content');
	  const elResults = $('#tj-results');
	  const elEmpty = $('#tj-empty');
	  const elError = $('#tj-error');
	  const elInfo = $('#tj-info');
	  const elSearch = $('#tj-search');
	  const elCategory = $('#tj-category');
	  const elVersion = $('#tj-version');
	  const elSort = $('#tj-sort');
	  const elReset = $('#tj-reset');
	  const elLoadMore = $('#tj-load-more');

	  // State
	  let allItems = [];
	  let filteredItems = [];
	  let displayedItems = [];
	  let currentPage = 0;
	  const itemsPerPage = 12; // 4 items per row × 3 rows initially
	  const maxItems = 12000; // Max templates per page - Note Olivier: if so, filters won't work properly

	  let currentMajorJoomlaVersion = 5;
	  const proxy = 'https://corsproxy.io/?'; // or use https://api.allorigins.win/raw?url=

	function toCompatList(raw) {
	  if (!raw) return [];
	  if (Array.isArray(raw)) return raw.filter(Boolean);
	  // If it's a string "Joomla4, Joomla5"
	  return String(raw)
		.split(/[,|]/)
		.map(s => s.trim())
		.filter(Boolean);
	}

	/**
	* Fetch JSON data with fallback URLs
	*/
  function fetchJSON() {
    showLoadingLayer();
    hideMessages();

    const tryUrls = [endpoint];
    let urlIndex = 0;

    function attemptFetch() {
      if (urlIndex >= tryUrls.length) {
        showError();
        hideLoadingLayer();
        return;
      }

      const url = tryUrls[urlIndex++];

      fetch(proxy + encodeURIComponent(url), {
        credentials: 'omit',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          return response.json();
        })
        .then(processData)
        .catch(() => attemptFetch())
        .finally(() => hideLoadingLayer());
    }

    attemptFetch();
  }

  /**
   * Process fetched data
   */
  function processData(data) {
    try {
      // Handle different JSON structures
      if (Array.isArray(data)) {
        allItems = data;
      } else if (data && Array.isArray(data.data)) {
        allItems = data.data;
      } else if (data && Array.isArray(data.templates)) {
        allItems = data.templates;
      } else {
        allItems = [];
      }

      // Limit to max items as specified
      allItems = allItems.slice(0, maxItems);

      // Initialize UI
      buildCategoryOptions();
      applyFilters();
      showContent();
    } catch (error) {
      console.error('Error processing template data:', error);
      showError();
    }

	hideLoadingLayer();
  }

  /**
   * Build category filter options
   */
  function buildCategoryOptions() {
    const categorySet = new Set();

    allItems.forEach(item => {
      let categories = [];

      // Handle different category field structures
      if (Array.isArray(item.category_field)) {
        categories = item.category_field;
      } else if (Array.isArray(item.category)) {
        categories = item.category;
      } else if (Array.isArray(item.categories)) {
        categories = item.categories;
      } else if (typeof item.category === 'string' && item.category) {
        categories = item.category.split(',').map(s => s.trim()).filter(Boolean);
      } else if (typeof item.category_field === 'string' && item.category_field) {
        categories = item.category_field.split(',').map(s => s.trim()).filter(Boolean);
      }

      categories.forEach(cat => {
        if (cat && cat.trim()) {
          categorySet.add(cat.trim());
        }
      });
    });

    // Build options HTML
    const sortedCategories = Array.from(categorySet).sort((a, b) =>
      a.localeCompare(b, 'fr', { sensitivity: 'base' })
    );

    const options = [`<option value="">${texts.allCategories || 'All categories'}</option>`]
      .concat(sortedCategories.map(cat =>
        `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`
      ));

    elCategory.innerHTML = options.join('');
  }

  /**
   * Check if item matches category filter
   */
  function matchesCategory(item, categoryValue) {
    if (!categoryValue) return true;

    let categories = [];

    if (Array.isArray(item.category_field)) {
      categories = item.category_field;
    } else if (Array.isArray(item.category)) {
      categories = item.category;
    } else if (Array.isArray(item.categories)) {
      categories = item.categories;
    } else if (typeof item.category === 'string' && item.category) {
      categories = item.category.split(',').map(s => s.trim());
    } else if (typeof item.category_field === 'string' && item.category_field) {
      categories = item.category_field.split(',').map(s => s.trim());
    }

    return categories.some(cat =>
      String(cat).toLowerCase().trim() === categoryValue.toLowerCase().trim()
    );
  }

  /**
   * Check if item matches search query
   */
  function matchesSearch(item, query) {
    if (!query) return true;

    query = query.toLowerCase();
    const searchableFields = [
      item.name || '',
      item.title || '',
      item.intro_text || '',
      item.description || '',
      item.author_name || '',
      item.author || ''
    ];

    return searchableFields.some(field =>
      String(field).toLowerCase().includes(query)
    );
  }

  /**
   * Check if item matches Joomla version filter
   */
  function matchesJoomlaVersion(item, versionFilter) {
    if (versionFilter === 'all') return true;

    let compatibility = item.compatibility || item.joomla_version || '';

    if (Array.isArray(compatibility)) {
      compatibility = compatibility.join(' ');
    }

    compatibility = String(compatibility).toLowerCase();

    // Check if compatible with current version
    return compatibility.includes(currentMajorJoomlaVersion);
  }

  /**
   * Sort items based on selected criteria
   */
    function sortItems(items, sortBy = 'added') {
    const sorted = [...items];

    switch (sortBy) {
      case 'alpha':
        return sorted.sort((a, b) =>
          (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' })
        );

      case 'updated':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.modified_date || a.updated_date || a.last_update || a.last_modified || 0);
          const dateB = new Date(b.modified_date || b.updated_date || b.last_update || b.last_modified || 0);
          return dateB - dateA; // Most recent first
        });

      case 'added':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.creation_date || a.created_date || a.added_date || a.publish_up || 0);
          const dateB = new Date(b.creation_date || b.created_date || b.added_date || b.publish_up || 0);
          return dateB - dateA; // Most recent first
        });

      default:
        return sorted;
    }
  }

  /**
   * Apply all filters and sorting
   */
  function applyFilters() {
    const searchQuery = (elSearch.value || '').trim();
    const categoryFilter = elCategory.value;
    const versionFilter = elVersion.value;
    const sortBy = elSort.value;

    // Filter items
    filteredItems = allItems.filter(item =>
      matchesCategory(item, categoryFilter) &&
      matchesSearch(item, searchQuery) &&
      matchesJoomlaVersion(item, versionFilter)
    );

    // Sort filtered items
    filteredItems = sortItems(filteredItems, sortBy);

    // Reset pagination
    currentPage = 0;
    displayedItems = [];

    // Render results
    loadMoreItems();
  }

  /**
   * Load more items (pagination)
   */
  function loadMoreItems(event) {
	  if (event) {
	    event.preventDefault();
	    event.stopImmediatePropagation();
	  }

    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const newItems = filteredItems.slice(startIndex, endIndex);

    if (newItems.length > 0) {
      displayedItems = displayedItems.concat(newItems);
      currentPage++;
      renderItems();
    }

    // Show/hide load more button
    const hasMore = endIndex < filteredItems.length;
    elLoadMore.classList.toggle('d-none', !hasMore);

    updateInfo();
  }

  /**
   * Render items to the grid
   */
  function renderItems() {
    if (displayedItems.length === 0) {
      elResults.innerHTML = '';
      showEmpty();
      hideInfo();
      return;
    }

    hideEmpty();

    const cards = displayedItems.map(item => createCard(item));
    elResults.innerHTML = cards.join('');

    // Attach event listeners to action buttons
    $all('[data-tj-action]', elResults).forEach(button => {
      button.addEventListener('click', handleButtonClick);
    });
  }

  /**
   * Handle button clicks
   */
  function handleButtonClick(event) {
    event.preventDefault();
    const url = event.target.getAttribute('data-url');
    const action = event.target.getAttribute('data-tj-action');

    if (url) {
      // Track action if analytics available
      if (window.gtag) {
        window.gtag('event', 'template_action', {
          'action_type': action,
          'template_url': url
        });
      }

      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Create card HTML for a template item
   */
  function createCard(item) {
    const name = escapeHtml(item.name || item.title || 'Template sans nom');
    const author = escapeHtml(item.author_name || item.author || '');
    let image = escapeHtml(item.intro_image || item.image || item.screenshot || '');
    const intro = truncateText(item.intro_text || item.description || '', 120);
    const demoUrl = escapeHtml(item.demo_url || item.demo || '');
    const downloadUrl = escapeHtml(item.download_url || item.download || item.url || '');

    /**let compatibility = item.compatibility || item.joomla_version || '';
    if (Array.isArray(compatibility)) {
      compatibility = compatibility.join(', ');
    }
    compatibility = escapeHtml(compatibility);**/

    const cardParts = [
      '<div class="col">',
      '  <div class="card h-100 shadow-sm template-card">',
    ];

    // Image
    if (image) {
	    image = proxy + encodeURIComponent(image);

      cardParts.push(`    <div class="card-img-top-container">`);
      cardParts.push(`      <img src="${image}" alt="${name}" class="card-img-top" loading="lazy" onerror="this.style.display='none'">`);
      cardParts.push(`    </div>`);
    }

    cardParts.push('    <div class="card-body d-flex flex-column">');

    // Title and author
    cardParts.push(`      <h4 class="card-title mb-2">${name}`);
    if (author) {
      cardParts.push(`      <span class="small"> by ${author}</span>`);
    }
    cardParts.push(`      </h4>`);


	// Compatibility badge(s)
	const compatList = toCompatList(item.compatibility || item.joomla_version);

	if (compatList.length) {
	  cardParts.push(`      <div class="mb-2">`);

	  compatList.forEach(c => {
		const label = String(c).trim();
		const key = label.toLowerCase().replace(/\s+/g, '');

		// mapping version -> classe Bootstrap
		let badgeClass = 'badge bg-light text-dark';
		if (key === 'joomla4' || key === 'j4') badgeClass = 'badge bg-secondary';
		else if (key === 'joomla5' || key === 'j5') badgeClass = 'badge bg-primary';
		else if (key === 'joomla6' || key === 'j6') badgeClass = 'badge bg-info';

		cardParts.push(
		  `        <span class="${badgeClass} me-1 mb-1"><i class="fab fa-joomla"></i> ${escapeHtml(label)}</span>`
		);
	  });

	  cardParts.push(`      </div>`);
	}


    // Description
    if (intro) {
      cardParts.push(`      <p class="card-text text-muted small mb-3 flex-grow-1">${intro}</p>`);
    }

    // Action buttons
    cardParts.push('      <div class="mt-auto">');
    cardParts.push('        <div class="btn-group w-100" role="group">');

    if (demoUrl) {
      cardParts.push(`          <button type="button" class="btn btn-info text-white btn-sm" data-tj-action="demo" data-url="${demoUrl}">`);
      cardParts.push(`            <i class="icon-eye"></i> ${texts.liveDemo || 'Demo'}`);
      cardParts.push('          </button>');
    }

    if (downloadUrl) {
      cardParts.push(`          <button type="button" class="btn btn-primary btn-sm" data-tj-action="download" data-url="${downloadUrl}">`);
      cardParts.push(`            <i class="icon-download"></i> ${texts.learnMore || 'En savoir plus'}`);
      cardParts.push('          </button>');
    }

    cardParts.push('        </div>');
    cardParts.push('      </div>');
    cardParts.push('    </div>');
    cardParts.push('  </div>');
    cardParts.push('</div>');

    return cardParts.join('\n');
  }

  /**
   * Update info display
   */
  function updateInfo() {
    if (filteredItems.length === 0) {
      hideInfo();
      return;
    }

    const totalFiltered = filteredItems.length;
    const totalDisplayed = displayedItems.length;
    const totalAvailable = allItems.length;

    let infoText = `${totalDisplayed} sur ${totalFiltered} template(s)`;
    if (totalFiltered < totalAvailable) {
      infoText += ` (${totalAvailable} au total)`;
    }

    elInfo.textContent = infoText;
    showInfo();
  }

  /**
   * Truncate text to specified length
   */
  function truncateText(text, maxLength) {
    if (!text) return '';
    text = String(text).trim();
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  /**
   * Escape HTML characters
   */
  function escapeHtml(unsafe) {
    if (unsafe == null) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Reset all filters
   */
  function resetFilters() {
    elSearch.value = '';
    elCategory.value = '';
    elVersion.value = 'current';
    elSort.value = 'alpha';
    applyFilters();
  }

  function showLoadingLayer() {
    document.getElementById('tj-container').appendChild(document.createElement('joomla-core-loader'));
  }

  function hideLoadingLayer() {
    const spinnerElement = document.querySelector('#tj-container joomla-core-loader');
    if (spinnerElement) {
      spinnerElement.parentNode.removeChild(spinnerElement);
    }
  }

  function showContent() {
    elContent.classList.remove('d-none');
  }

  function hideContent() {
    elContent.classList.add('d-none');
  }

  function showEmpty() {
    elEmpty.classList.remove('d-none');
  }

  function hideEmpty() {
    elEmpty.classList.add('d-none');
  }

  function showError() {
    elError.classList.remove('d-none');
  }

  function hideError() {
    elError.classList.add('d-none');
  }

  function showInfo() {
    elInfo.classList.remove('d-none');
  }

  function hideInfo() {
    elInfo.classList.add('d-none');
  }

  function hideMessages() {
    hideEmpty();
    hideError();
  }

  // Event listeners
  function initEventListeners() {
    if (elSearch) {
      elSearch.addEventListener('input', debounce(applyFilters, 300));
    }

    if (elCategory) {
      elCategory.addEventListener('change', applyFilters);
    }

    if (elVersion) {
      elVersion.addEventListener('change', applyFilters);
    }

    if (elSort) {
      elSort.addEventListener('change', applyFilters);
    }

    if (elReset) {
      elReset.addEventListener('click', resetFilters);
    }

    if (elLoadMore) {
      elLoadMore.addEventListener('click', loadMoreItems);
    }
  }

  /**
   * Debounce function to limit rapid successive calls
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Initialize the application
   */
  function init() {
	  if (Joomla.getOptions('js-templatejoomla')) {
		  const options = Joomla.getOptions('js-templatejoomla');
		  currentMajorJoomlaVersion = options.version;
	  }
    initEventListeners();
    fetchJSON();
  }

  // Wait for DOM to be ready, then initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already loaded
    init();
  }

})();