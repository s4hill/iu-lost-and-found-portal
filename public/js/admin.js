// Admin Dashboard
class AdminDashboard {
    constructor() {
        this.currentTab = 'lost';
        this.init();
    }
    
    init() {
        this.loadStats();
        this.setupTabs();
        this.loadTabData('lost');
    }
    
    async loadStats() {
        try {
            const response = await fetch('/api/stats');
            if (!response.ok) throw new Error('Failed to load stats');
            
            const data = await response.json();
            
            document.getElementById('totalLost').textContent = data.lostItems || 0;
            document.getElementById('totalFound').textContent = data.foundItems || 0;
            document.getElementById('totalReturned').textContent = data.returnedItems || 0;
            document.getElementById('totalClaims').textContent = data.pendingClaims || 0;
            
        } catch (error) {
            console.error('Error loading stats:', error);
            // Set default values
            document.getElementById('totalLost').textContent = '0';
            document.getElementById('totalFound').textContent = '0';
            document.getElementById('totalReturned').textContent = '0';
            document.getElementById('totalClaims').textContent = '0';
            
            if (typeof showToast === 'function') {
                showToast('Error loading statistics', 'error');
            }
        }
    }
    
    setupTabs() {
        const tabs = document.querySelectorAll('.admin-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.tab;
                this.loadTabData(this.currentTab);
            });
        });
    }
    
    async loadTabData(tab) {
        const contentDiv = document.getElementById('tabContent');
        if (!contentDiv) return;
        
        contentDiv.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
        
        try {
            switch(tab) {
                case 'lost':
                    await this.loadLostItems(contentDiv);
                    break;
                case 'found':
                    await this.loadFoundItems(contentDiv);
                    break;
                case 'claims':
                    await this.loadClaims(contentDiv);
                    break;
                case 'returned':
                    await this.loadReturnedItems(contentDiv);
                    break;
            }
        } catch (error) {
            console.error('Error loading tab data:', error);
            contentDiv.innerHTML = '<p class="error-message">Error loading data. Please try again.</p>';
            if (typeof showToast === 'function') {
                showToast('Error loading data', 'error');
            }
        }
    }
    
    async loadLostItems(container) {
        try {
            const response = await fetch('/api/lost');
            const items = await response.json();
            
            if (!items || items.length === 0) {
                container.innerHTML = '<p class="no-items">No lost items found.</p>';
                return;
            }
            
            container.innerHTML = `
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Reporter</th>
                                <th>Contact</th>
                                <th>Date Lost</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>#${item.id}</td>
                                    <td>${this.escapeHtml(item.item_name)}</td>
                                    <td>${this.escapeHtml(item.category)}</td>
                                    <td>${this.escapeHtml(item.contact_name || 'N/A')}</td>
                                    <td>
                                        ${item.contact_email ? `<i class="fas fa-envelope"></i> ${this.escapeHtml(item.contact_email)}<br>` : ''}
                                        ${item.contact_phone ? `<i class="fas fa-phone"></i> ${this.escapeHtml(item.contact_phone)}` : ''}
                                    </td>
                                    <td>${this.formatDate(item.date_lost)}</td>
                                    <td>${this.escapeHtml(item.location_lost || 'N/A')}</td>
                                    <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                                    <td class="admin-actions">
                                        <a href="item.html?id=${item.id}&type=lost" class="btn-view" target="_blank">
                                            <i class="fas fa-eye"></i> View
                                        </a>
                                        ${item.status !== 'returned' ? 
                                            `<button class="btn-approve" onclick="adminDashboard.markReturned(${item.id}, 'lost')">
                                                <i class="fas fa-check"></i> Returned
                                            </button>` 
                                            : ''
                                        }
                                        <button class="btn-delete" onclick="adminDashboard.deleteItem(${item.id}, 'lost')">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            console.error('Error loading lost items:', error);
            container.innerHTML = '<p class="error-message">Error loading lost items.</p>';
        }
    }
    
    async loadFoundItems(container) {
        try {
            const response = await fetch('/api/found');
            const items = await response.json();
            
            if (!items || items.length === 0) {
                container.innerHTML = '<p class="no-items">No found items found.</p>';
                return;
            }
            
            container.innerHTML = `
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Item Name</th>
                                <th>Category</th>
                                <th>Finder</th>
                                <th>Contact</th>
                                <th>Date Found</th>
                                <th>Location</th>
                                <th>Security</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>#${item.id}</td>
                                    <td>${this.escapeHtml(item.item_name)}</td>
                                    <td>${this.escapeHtml(item.category)}</td>
                                    <td>${this.escapeHtml(item.finder_name || 'N/A')}</td>
                                    <td>
                                        ${item.finder_email ? `<i class="fas fa-envelope"></i> ${this.escapeHtml(item.finder_email)}<br>` : ''}
                                        ${item.finder_phone ? `<i class="fas fa-phone"></i> ${this.escapeHtml(item.finder_phone)}` : ''}
                                    </td>
                                    <td>${this.formatDate(item.date_found)}</td>
                                    <td>${this.escapeHtml(item.location_found || 'N/A')}</td>
                                    <td>${item.handed_to_security ? '✓ Yes' : '✗ No'}</td>
                                    <td><span class="status-badge status-${item.status}">${item.status}</span></td>
                                    <td class="admin-actions">
                                        <a href="item.html?id=${item.id}&type=found" class="btn-view" target="_blank">
                                            <i class="fas fa-eye"></i> View
                                        </a>
                                        ${item.status !== 'returned' ? 
                                            `<button class="btn-approve" onclick="adminDashboard.markReturned(${item.id}, 'found')">
                                                <i class="fas fa-check"></i> Returned
                                            </button>` 
                                            : ''
                                        }
                                        <button class="btn-delete" onclick="adminDashboard.deleteItem(${item.id}, 'found')">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            console.error('Error loading found items:', error);
            container.innerHTML = '<p class="error-message">Error loading found items.</p>';
        }
    }
    
    async loadClaims(container) {
        try {
            const response = await fetch('/api/claims');
            const claims = await response.json();
            
            if (!claims || claims.length === 0) {
                container.innerHTML = '<p class="no-items">No claims found.</p>';
                return;
            }
            
            // Fetch all items to get their details
            const [lostRes, foundRes] = await Promise.all([
                fetch('/api/lost'),
                fetch('/api/found')
            ]);
            
            const lostItems = await lostRes.json();
            const foundItems = await foundRes.json();
            
            // Create maps for quick lookup
            const lostMap = new Map(lostItems.map(item => [item.id, item]));
            const foundMap = new Map(foundItems.map(item => [item.id, item]));
            
            container.innerHTML = `
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Claim ID</th>
                                <th>Item Details</th>
                                <th>Claimant Info</th>
                                <th>Proof</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${claims.map(claim => {
                                // Get item details
                                const item = claim.item_type === 'lost' 
                                    ? lostMap.get(claim.item_id) 
                                    : foundMap.get(claim.item_id);
                                
                                const itemName = item ? item.item_name : 'Unknown Item';
                                const itemCategory = item ? item.category : 'N/A';
                                
                                return `
                                <tr>
                                    <td>#${claim.id}</td>
                                    <td>
                                        <strong>${this.escapeHtml(itemName)}</strong><br>
                                        <small>Type: ${claim.item_type}</small><br>
                                        <small>Category: ${this.escapeHtml(itemCategory)}</small><br>
                                        <small>Item ID: #${claim.item_id}</small>
                                    </td>
                                    <td>
                                        <strong>${this.escapeHtml(claim.claimant_name)}</strong><br>
                                        <i class="fas fa-envelope"></i> ${this.escapeHtml(claim.claimant_email)}<br>
                                        ${claim.claimant_phone ? `<i class="fas fa-phone"></i> ${this.escapeHtml(claim.claimant_phone)}` : ''}
                                    </td>
                                    <td>
                                        <div class="proof-preview">
                                            ${claim.proof_description ? 
                                                `<p>${this.escapeHtml(claim.proof_description.substring(0, 100))}${claim.proof_description.length > 100 ? '...' : ''}</p>` 
                                                : '<em>No proof provided</em>'
                                            }
                                        </div>
                                    </td>
                                    <td>
                                        ${this.formatDate(claim.created_at || claim.createdAt)}<br>
                                        <small>${this.formatTime(claim.created_at || claim.createdAt)}</small>
                                    </td>
                                    <td><span class="status-badge status-${claim.status}">${claim.status}</span></td>
                                    <td class="admin-actions">
                                        <button class="btn-view" onclick="adminDashboard.viewClaimDetails(${claim.id})">
                                            <i class="fas fa-eye"></i> Details
                                        </button>
                                        ${claim.status === 'pending' ? 
                                            `<button class="btn-approve" onclick="adminDashboard.approveClaim(${claim.id})">
                                                <i class="fas fa-check"></i> Approve
                                            </button>
                                            <button class="btn-reject" onclick="adminDashboard.rejectClaim(${claim.id})">
                                                <i class="fas fa-times"></i> Reject
                                            </button>`
                                            : ''
                                        }
                                    </td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            console.error('Error loading claims:', error);
            container.innerHTML = '<p class="error-message">Error loading claims. Please try again.</p>';
        }
    }
    
    async loadReturnedItems(container) {
        try {
            const [lostRes, foundRes] = await Promise.all([
                fetch('/api/lost'),
                fetch('/api/found')
            ]);
            
            const lostItems = await lostRes.json();
            const foundItems = await foundRes.json();
            
            const returnedLost = lostItems.filter(i => i.status === 'returned');
            const returnedFound = foundItems.filter(i => i.status === 'returned');
            const returnedItems = [...returnedLost, ...returnedFound];
            
            if (returnedItems.length === 0) {
                container.innerHTML = '<p class="no-items">No returned items found.</p>';
                return;
            }
            
            container.innerHTML = `
                <div class="table-responsive">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Item Name</th>
                                <th>Type</th>
                                <th>Category</th>
                                <th>Reporter/ Finder</th>
                                <th>Date</th>
                                <th>Location</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${returnedItems.map(item => {
                                const reporterName = item.contact_name || item.finder_name || 'N/A';
                                return `
                                <tr>
                                    <td>#${item.id}</td>
                                    <td>${this.escapeHtml(item.item_name)}</td>
                                    <td><span class="item-type-badge">${item.date_lost ? 'Lost' : 'Found'}</span></td>
                                    <td>${this.escapeHtml(item.category)}</td>
                                    <td>${this.escapeHtml(reporterName)}</td>
                                    <td>${this.formatDate(item.date_lost || item.date_found)}</td>
                                    <td>${this.escapeHtml(item.location_lost || item.location_found || 'N/A')}</td>
                                    <td><span class="status-badge status-returned">Returned</span></td>
                                </tr>
                            `}).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            console.error('Error loading returned items:', error);
            container.innerHTML = '<p class="error-message">Error loading returned items.</p>';
        }
    }
    
    // View claim details in modal
    async viewClaimDetails(claimId) {
        try {
            const response = await fetch('/api/claims');
            const claims = await response.json();
            const claim = claims.find(c => c.id === claimId);
            
            if (!claim) {
                showToast('Claim not found', 'error');
                return;
            }
            
            // Fetch item details
            const itemResponse = await fetch(`/api/${claim.item_type}/${claim.item_id}`);
            const item = await itemResponse.json();
            
            const modal = document.getElementById('claimModal') || this.createClaimModal();
            
            modal.innerHTML = `
                <div class="modal-content claim-details-modal">
                    <span class="close" onclick="document.getElementById('claimModal').classList.remove('show')">&times;</span>
                    <h3><i class="fas fa-file-alt"></i> Claim Details #${claim.id}</h3>
                    
                    <div class="claim-details-grid">
                        <div class="claim-section">
                            <h4>Claimant Information</h4>
                            <p><strong>Name:</strong> ${this.escapeHtml(claim.claimant_name)}</p>
                            <p><strong>Email:</strong> <a href="mailto:${this.escapeHtml(claim.claimant_email)}">${this.escapeHtml(claim.claimant_email)}</a></p>
                            <p><strong>Phone:</strong> <a href="tel:${this.escapeHtml(claim.claimant_phone)}">${this.escapeHtml(claim.claimant_phone || 'Not provided')}</a></p>
                            <p><strong>Claimed on:</strong> ${this.formatDate(claim.created_at || claim.createdAt)} at ${this.formatTime(claim.created_at || claim.createdAt)}</p>
                        </div>
                        
                        <div class="claim-section">
                            <h4>Item Information</h4>
                            <p><strong>Item:</strong> ${this.escapeHtml(item.item_name)}</p>
                            <p><strong>Type:</strong> ${claim.item_type}</p>
                            <p><strong>Category:</strong> ${this.escapeHtml(item.category)}</p>
                            <p><strong>Date ${claim.item_type === 'lost' ? 'Lost' : 'Found'}:</strong> ${this.formatDate(item.date_lost || item.date_found)}</p>
                            <p><strong>Location:</strong> ${this.escapeHtml(item.location_lost || item.location_found)}</p>
                        </div>
                        
                        <div class="claim-section full-width">
                            <h4>Proof of Ownership</h4>
                            <div class="proof-box">
                                ${claim.proof_description ? 
                                    this.escapeHtml(claim.proof_description) : 
                                    '<em>No proof description provided</em>'
                                }
                            </div>
                        </div>
                        
                        ${claim.item_type === 'found' ? `
                        <div class="claim-section">
                            <h4>Finder Information</h4>
                            <p><strong>Name:</strong> ${this.escapeHtml(item.finder_name || 'N/A')}</p>
                            <p><strong>Email:</strong> ${this.escapeHtml(item.finder_email || 'N/A')}</p>
                            <p><strong>Phone:</strong> ${this.escapeHtml(item.finder_phone || 'N/A')}</p>
                            <p><strong>Handed to Security:</strong> ${item.handed_to_security ? '✓ Yes' : '✗ No'}</p>
                        </div>
                        ` : `
                        <div class="claim-section">
                            <h4>Owner Information</h4>
                            <p><strong>Name:</strong> ${this.escapeHtml(item.contact_name || 'N/A')}</p>
                            <p><strong>Email:</strong> ${this.escapeHtml(item.contact_email || 'N/A')}</p>
                            <p><strong>Phone:</strong> ${this.escapeHtml(item.contact_phone || 'N/A')}</p>
                        </div>
                        `}
                        
                        <div class="claim-section">
                            <h4>Status</h4>
                            <p><span class="status-badge status-${claim.status}">${claim.status}</span></p>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        ${claim.status === 'pending' ? `
                            <button class="btn btn-approve" onclick="adminDashboard.approveClaim(${claim.id})">Approve Claim</button>
                            <button class="btn btn-reject" onclick="adminDashboard.rejectClaim(${claim.id})">Reject Claim</button>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="document.getElementById('claimModal').classList.remove('show')">Close</button>
                    </div>
                </div>
            `;
            
            document.getElementById('claimModal').classList.add('show');
            
        } catch (error) {
            console.error('Error viewing claim details:', error);
            showToast('Error loading claim details', 'error');
        }
    }
    
    // Create claim modal if it doesn't exist
    createClaimModal() {
        const modal = document.createElement('div');
        modal.id = 'claimModal';
        modal.className = 'modal';
        document.body.appendChild(modal);
        return modal;
    }
    
    async markReturned(id, type) {
        if (!confirm('Are you sure you want to mark this item as returned?')) return;
        
        try {
            const response = await fetch(`/api/${type}/${id}/return`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                showToast('Item marked as returned', 'success');
                this.loadStats();
                this.loadTabData(this.currentTab);
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update');
            }
        } catch (error) {
            console.error('Error marking item as returned:', error);
            showToast('Error updating item', 'error');
        }
    }
    
    async deleteItem(id, type) {
        if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;
        
        try {
            const response = await fetch(`/api/${type}/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showToast('Item deleted successfully', 'success');
                this.loadStats();
                this.loadTabData(this.currentTab);
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            showToast('Error deleting item', 'error');
        }
    }
    
    async approveClaim(id) {
        if (!confirm('Approve this claim? This will mark the item as claimed.')) return;
        
        try {
            const response = await fetch(`/api/claims/${id}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                showToast('Claim approved successfully', 'success');
                this.loadTabData('claims');
                this.loadStats();
                
                // Close modal if open
                const modal = document.getElementById('claimModal');
                if (modal) modal.classList.remove('show');
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to approve');
            }
        } catch (error) {
            console.error('Error approving claim:', error);
            showToast('Error approving claim', 'error');
        }
    }
    
    async rejectClaim(id) {
        if (!confirm('Reject this claim?')) return;
        
        try {
            const response = await fetch(`/api/claims/${id}/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                showToast('Claim rejected', 'success');
                this.loadTabData('claims');
                
                // Close modal if open
                const modal = document.getElementById('claimModal');
                if (modal) modal.classList.remove('show');
            } else {
                const data = await response.json();
                throw new Error(data.error || 'Failed to reject');
            }
        } catch (error) {
            console.error('Error rejecting claim:', error);
            showToast('Error rejecting claim', 'error');
        }
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
    
    formatTime(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '';
        }
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize admin dashboard
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    // Check if admin is logged in
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    const loginSection = document.getElementById('loginSection');
    const adminContent = document.getElementById('adminContent');
    
    if (isLoggedIn) {
        if (loginSection) loginSection.style.display = 'none';
        if (adminContent) adminContent.style.display = 'block';
        
        if (document.getElementById('tabContent')) {
            adminDashboard = new AdminDashboard();
        }
    }
});

// Login form submission
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Simple authentication for demo
    if (username === 'admin' && password === 'admin123') {
        sessionStorage.setItem('adminLoggedIn', 'true');
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        showToast('Login successful!', 'success');
        
        // Initialize admin dashboard
        adminDashboard = new AdminDashboard();
    } else {
        showToast('Invalid credentials', 'error');
    }
});

// Global functions
window.logout = function() {
    sessionStorage.removeItem('adminLoggedIn');
    window.location.reload();
};

// Add logout button when logged in
function addLogoutButton() {
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && !document.getElementById('logoutBtn')) {
            const logoutLi = document.createElement('li');
            logoutLi.innerHTML = '<a href="#" id="logoutBtn" onclick="logout(); return false;">Logout</a>';
            navMenu.appendChild(logoutLi);
        }
    }
}

// Check periodically for login state
setInterval(addLogoutButton, 1000);

// Make adminDashboard available globally
window.adminDashboard = adminDashboard;