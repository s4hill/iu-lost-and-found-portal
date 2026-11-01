// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    // Mobile menu toggle
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
            }
        });
    }

    // Load statistics on homepage
    if (document.getElementById('statLost')) {
        loadStatistics();
    }

    // Load recent items on homepage
    if (document.getElementById('recentItems')) {
        loadRecentItems();
    }

    // Initialize image preview if exists
    if (document.getElementById('itemImage')) {
        setupImagePreview('itemImage', 'imagePreview');
    }
    
    // Initialize homepage search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn && window.location.pathname === '/' || window.location.pathname === '/index.html') {
        searchBtn.addEventListener('click', performHomeSearch);
        
        // Enter key support for homepage search
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performHomeSearch();
                }
            });
        }
    }
});

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) throw new Error('Failed to load stats');
        
        const data = await response.json();
        
        const statLost = document.getElementById('statLost');
        const statFound = document.getElementById('statFound');
        const statReturned = document.getElementById('statReturned');
        const statReports = document.getElementById('statReports');
        
        if (statLost) statLost.textContent = data.lostItems || 0;
        if (statFound) statFound.textContent = data.foundItems || 0;
        if (statReturned) statReturned.textContent = data.returnedItems || 0;
        if (statReports) statReports.textContent = (data.lostItems + data.foundItems) || 0;
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        // Set default values on error
        const elements = ['statLost', 'statFound', 'statReturned', 'statReports'];
        elements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '0';
        });
    }
}

// Load recent items
async function loadRecentItems() {
    try {
        const [lostResponse, foundResponse] = await Promise.all([
            fetch('/api/lost?limit=3'),
            fetch('/api/found?limit=3')
        ]);
        
        if (!lostResponse.ok || !foundResponse.ok) {
            throw new Error('Failed to load items');
        }
        
        const lostItems = await lostResponse.json();
        const foundItems = await foundResponse.json();
        
        // Combine and sort by date
        const recentItems = [...lostItems, ...foundItems]
            .sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at))
            .slice(0, 6);
        
        displayItems(recentItems, 'recentItems');
        
    } catch (error) {
        console.error('Error loading recent items:', error);
        const container = document.getElementById('recentItems');
        if (container) {
            container.innerHTML = '<p class="error-message">Error loading items. Please refresh the page.</p>';
        }
    }
}

// Display items in grid
function displayItems(items, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!items || items.length === 0) {
        container.innerHTML = '<p class="no-items">No items found.</p>';
        return;
    }
    
    container.innerHTML = items.map(item => {
        const date = item.date_lost || item.date_found || 'N/A';
        const location = item.location_lost || item.location_found || 'N/A';
        const status = item.status || 'lost';
        const type = item.date_lost ? 'lost' : 'found';
        const imagePath = item.image_path ? item.image_path : null;
        
        // Only show claim button for found items
        const showClaimButton = (type === 'found' && status === 'found');
        
        return `
        <div class="item-card" data-id="${item.id}" data-type="${type}">
            <div class="item-image">
                ${imagePath 
                    ? `<img src="${imagePath}" alt="${escapeHtml(item.item_name || 'Item')}" onerror="this.src='images/placeholder.png'">` 
                    : `<i class="fas fa-box"></i>`
                }
            </div>
            <span class="item-status status-${status}">${status}</span>
            <div class="item-content">
                <h3 class="item-title">${escapeHtml(item.item_name || 'Unnamed Item')}</h3>
                <span class="item-category">${escapeHtml(item.category || 'Other')}</span>
                <span class="item-type-badge">${type}</span>
                <div class="item-details">
                    <div class="item-detail">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(date)}</span>
                    </div>
                    <div class="item-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${escapeHtml(location)}</span>
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

// View item details
window.viewItemDetails = function(id, type) {
    if (!id || !type) {
        showToast('Invalid item', 'error');
        return;
    }
    window.location.href = `item.html?id=${id}&type=${type}`;
};

// Format date helper
function formatDate(dateString) {
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

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Form validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return true;
    
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    let firstInvalid = null;
    
    inputs.forEach(input => {
        if (!input.value || input.value.trim() === '') {
            input.style.borderColor = '#ff6b6b';
            isValid = false;
            if (!firstInvalid) firstInvalid = input;
            
            // Remove red border on input
            input.addEventListener('input', function() {
                this.style.borderColor = '';
            }, { once: true });
        }
    });
    
    if (!isValid) {
        showToast('Please fill in all required fields', 'error');
        if (firstInvalid) firstInvalid.focus();
    }
    
    return isValid;
}

// Image preview
function setupImagePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!input || !preview) return;
    
    input.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showToast('File size must be less than 5MB', 'error');
                this.value = '';
                return;
            }
            
            // Check file type
            if (!file.type.startsWith('image/')) {
                showToast('Please upload an image file', 'error');
                this.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.src = e.target.result;
                preview.classList.add('show');
            };
            reader.readAsDataURL(file);
        } else {
            preview.classList.remove('show');
        }
    });
}

// Load item details on single item page
async function loadItemDetails(itemId, type) {
    try {
        const response = await fetch(`/api/${type}/${itemId}`);
        if (!response.ok) throw new Error('Item not found');
        
        const item = await response.json();
        
        const container = document.getElementById('itemDetails');
        if (!container) return;
        
        const date = type === 'lost' ? item.date_lost : item.date_found;
        const location = type === 'lost' ? item.location_lost : item.location_found;
        const contactName = type === 'lost' ? item.contact_name : item.finder_name;
        const contactEmail = type === 'lost' ? item.contact_email : item.finder_email;
        const contactPhone = type === 'lost' ? item.contact_phone : item.finder_phone;
        
        container.innerHTML = `
            <div class="item-detail-card">
                <div class="item-detail-image">
                    ${item.image_path 
                        ? `<img src="${item.image_path}" alt="${escapeHtml(item.item_name)}">` 
                        : `<i class="fas fa-box fa-4x"></i>`
                    }
                </div>
                <div class="item-detail-info">
                    <h2>${escapeHtml(item.item_name)}</h2>
                    <p><strong>Category:</strong> ${escapeHtml(item.category || 'N/A')}</p>
                    <p><strong>Description:</strong> ${escapeHtml(item.description || 'No description provided')}</p>
                    <p><strong>Date ${type === 'lost' ? 'Lost' : 'Found'}:</strong> ${formatDate(date)}</p>
                    <p><strong>Location:</strong> ${escapeHtml(location || 'N/A')}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${item.status}">${item.status}</span></p>
                    ${contactName ? `<p><strong>Reporter:</strong> ${escapeHtml(contactName)}</p>` : ''}
                    ${contactEmail ? `<p><strong>Email:</strong> ${escapeHtml(contactEmail)}</p>` : ''}
                    ${contactPhone ? `<p><strong>Phone:</strong> ${escapeHtml(contactPhone)}</p>` : ''}
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading item details:', error);
        const container = document.getElementById('itemDetails');
        if (container) {
            container.innerHTML = '<p class="error-message">Error loading item details. Please try again.</p>';
        }
        showToast('Error loading item details', 'error');
    }
}

// ============ HOMEPAGE SEARCH FUNCTION ============
window.performHomeSearch = function() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const locationFilter = document.getElementById('locationFilter');
    
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim();
    const category = categoryFilter ? categoryFilter.value : '';
    const location = locationFilter ? locationFilter.value : '';
    
    // Build query string
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (category) params.set('category', category);
    if (location) params.set('location', location);
    
    // Redirect to lost page with search params
    window.location.href = `lost.html?${params.toString()}`;
};

// Global search function for backward compatibility
window.searchItems = function() {
    performHomeSearch();
};