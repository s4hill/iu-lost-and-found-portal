// Real-time search functionality
class ItemSearch {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.categoryFilter = document.getElementById('categoryFilter');
        this.locationFilter = document.getElementById('locationFilter');
        this.dateFilter = document.getElementById('dateFilter');
        this.itemsGrid = document.getElementById('itemsGrid');
        this.paginationContainer = document.getElementById('pagination');
        this.currentPage = 1;
        this.itemsPerPage = 9;
        this.debounceTimer = null;
        
        // Determine page type
        const path = window.location.pathname;
        if (path.includes('lost')) {
            this.type = 'lost';
        } else if (path.includes('found')) {
            this.type = 'found';
        } else {
            this.type = 'all'; // For homepage
        }
        
        console.log('Search initialized for:', this.type);
        
        if (this.itemsGrid) {
            this.init();
        }
    }
    
    init() {
        // Get page from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        this.currentPage = parseInt(urlParams.get('page')) || 1;
        
        // Set initial filter values from URL
        if (this.searchInput) this.searchInput.value = urlParams.get('q') || '';
        if (this.categoryFilter) this.categoryFilter.value = urlParams.get('category') || '';
        if (this.locationFilter) this.locationFilter.value = urlParams.get('location') || '';
        if (this.dateFilter) this.dateFilter.value = urlParams.get('sort') || '';
        
        // Add event listeners
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.currentPage = 1;
                    this.search();
                }, 500);
            });
        }
        
        if (this.categoryFilter) {
            this.categoryFilter.addEventListener('change', () => {
                this.currentPage = 1;
                this.search();
            });
        }
        
        if (this.locationFilter) {
            this.locationFilter.addEventListener('change', () => {
                this.currentPage = 1;
                this.search();
            });
        }
        
        if (this.dateFilter) {
            this.dateFilter.addEventListener('change', () => {
                this.currentPage = 1;
                this.search();
            });
        }
        
        // Add search button listener
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                this.currentPage = 1;
                this.search();
            });
        }
        
        // Load initial items
        this.search();
    }
    
    async search() {
        if (!this.itemsGrid) return;
        
        // Show loading
        this.itemsGrid.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        
        const searchTerm = this.searchInput ? this.searchInput.value.trim() : '';
        const category = this.categoryFilter ? this.categoryFilter.value : '';
        const location = this.locationFilter ? this.locationFilter.value : '';
        const sort = this.dateFilter ? this.dateFilter.value : '';
        
        try {
            let response;
            let data;
            
            if (this.type === 'all') {
                // For homepage - search both lost and found
                const [lostRes, foundRes] = await Promise.all([
                    fetch(`/api/lost/search?${this.buildSearchParams(searchTerm, category, location, sort, this.currentPage, this.itemsPerPage)}`),
                    fetch(`/api/found/search?${this.buildSearchParams(searchTerm, category, location, sort, this.currentPage, this.itemsPerPage)}`)
                ]);
                
                const lostData = await lostRes.json();
                const foundData = await foundRes.json();
                
                // Combine and sort items
                const allItems = [...(lostData.items || []), ...(foundData.items || [])];
                const sortedItems = this.sortItems(allItems, sort);
                const totalItems = (lostData.total || 0) + (foundData.total || 0);
                
                data = {
                    items: sortedItems,
                    total: totalItems,
                    page: this.currentPage,
                    totalPages: Math.ceil(totalItems / this.itemsPerPage)
                };
                
            } else {
                // For lost/found pages
                const params = this.buildSearchParams(searchTerm, category, location, sort, this.currentPage, this.itemsPerPage);
                response = await fetch(`/api/${this.type}/search?${params}`);
                data = await response.json();
            }
            
            if (!response || response.ok) {
                // Update URL with search params (without reloading)
                this.updateURL(searchTerm, category, location, sort);
                
                // Display items
                this.displayItems(data.items || [], data.total || 0);
                this.setupPagination(data.total || 0);
            } else {
                throw new Error('Search failed');
            }
            
        } catch (error) {
            console.error('Search error:', error);
            this.itemsGrid.innerHTML = '<p class="error-message">Error loading items. Please try again.</p>';
            if (typeof showToast === 'function') {
                showToast('Error performing search', 'error');
            }
        }
    }
    
    buildSearchParams(searchTerm, category, location, sort, page, limit) {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        
        if (searchTerm) params.append('q', searchTerm);
        if (category) params.append('category', category);
        if (location) params.append('location', location);
        if (sort) params.append('sort', sort);
        
        return params.toString();
    }
    
    sortItems(items, sort) {
        if (sort === 'oldest') {
            return items.sort((a, b) => new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at));
        } else {
            return items.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
        }
    }
    
    updateURL(searchTerm, category, location, sort) {
        const url = new URL(window.location);
        
        if (searchTerm) url.searchParams.set('q', searchTerm);
        else url.searchParams.delete('q');
        
        if (category) url.searchParams.set('category', category);
        else url.searchParams.delete('category');
        
        if (location) url.searchParams.set('location', location);
        else url.searchParams.delete('location');
        
        if (sort) url.searchParams.set('sort', sort);
        else url.searchParams.delete('sort');
        
        if (this.currentPage > 1) url.searchParams.set('page', this.currentPage);
        else url.searchParams.delete('page');
        
        window.history.replaceState({}, '', url);
    }
    
    displayItems(items, total) {
        if (!this.itemsGrid) return;
        
        if (!items || items.length === 0) {
            this.itemsGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search fa-3x"></i>
                    <h3>No items found</h3>
                    <p>Try adjusting your search criteria</p>
                </div>
            `;
            return;
        }
        
        this.itemsGrid.innerHTML = items.map(item => {
            const date = item.date_lost || item.date_found || 'N/A';
            const location = item.location_lost || item.location_found || 'N/A';
            const status = item.status || 'unknown';
            const type = item.date_lost ? 'lost' : 'found';
            const imagePath = item.image_path ? item.image_path : null;
            
            // Only show claim button for found items
            const showClaimButton = (type === 'found' && status === 'found');
            
            return `
            <div class="item-card" data-id="${item.id}" data-type="${type}">
                <div class="item-image">
                    ${imagePath 
                        ? `<img src="${imagePath}" alt="${this.escapeHtml(item.item_name || 'Item')}" onerror="this.src='images/placeholder.png'">` 
                        : `<i class="fas fa-box"></i>`
                    }
                </div>
                <span class="item-status status-${status}">${status}</span>
                <div class="item-content">
                    <h3 class="item-title">${this.escapeHtml(item.item_name || 'Unnamed Item')}</h3>
                    <span class="item-category">${this.escapeHtml(item.category || 'Other')}</span>
                    <div class="item-type-badge">${type}</div>
                    <div class="item-details">
                        <div class="item-detail">
                            <i class="fas fa-calendar"></i>
                            <span>${this.formatDate(date)}</span>
                        </div>
                        <div class="item-detail">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${this.escapeHtml(location)}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <a href="item.html?id=${item.id}&type=${type}" class="btn btn-primary">
                            <i class="fas fa-eye"></i> View
                        </a>
                        ${showClaimButton ? 
                            `<a href="claim.html?itemId=${item.id}&type=${type}" class="btn btn-secondary">
                                <i class="fas fa-hand-paper"></i> Claim
                            </a>` : ''
                        }
                    </div>
                </div>
            </div>
        `}).join('');
    }
    
    setupPagination(totalItems) {
        if (!this.paginationContainer) return;
        
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        
        if (totalPages <= 1) {
            this.paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = '<div class="pagination">';
        
        // Previous button
        paginationHTML += `<button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="window.itemSearch.goToPage(${this.currentPage - 1})">
            <i class="fas fa-chevron-left"></i> Prev
        </button>`;
        
        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="window.itemSearch.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="page-dots">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" 
                onclick="window.itemSearch.goToPage(${i})">${i}</button>`;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="page-dots">...</span>`;
            }
            paginationHTML += `<button class="page-btn" onclick="window.itemSearch.goToPage(${totalPages})">${totalPages}</button>`;
        }
        
        // Next button
        paginationHTML += `<button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
            onclick="window.itemSearch.goToPage(${this.currentPage + 1})">
            Next <i class="fas fa-chevron-right"></i>
        </button>`;
        
        paginationHTML += '</div>';
        this.paginationContainer.innerHTML = paginationHTML;
    }
    
    goToPage(page) {
        this.currentPage = page;
        this.search();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize search
let itemSearch;
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a page with search
    if (document.getElementById('itemsGrid') || document.getElementById('recentItems')) {
        itemSearch = new ItemSearch();
        window.itemSearch = itemSearch; // Make globally available
    }
    
    // Load single item details if on item page
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('itemId');
    const type = window.location.pathname.includes('lost') ? 'lost' : 
                 window.location.pathname.includes('found') ? 'found' : null;
    
    if (itemId && type && typeof loadItemDetails === 'function') {
        loadItemDetails(itemId, type);
    }
});

// Make functions globally available
window.viewItemDetails = function(id, type) {
    if (!id || !type) {
        if (typeof showToast === 'function') {
            showToast('Invalid item', 'error');
        }
        return;
    }
    window.location.href = `item.html?id=${id}&type=${type}`;
};