/**
 * Infinite Scroll Module
 */

export class InfiniteScroll {
    constructor(options = {}) {
        this.currentPage = 1;
        this.totalPages = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.cardsGrid = document.querySelector(options.gridSelector || '.cards-grid');
        this.loadingIndicator = document.querySelector(options.loadingSelector || '#loading-indicator');

        // Preserve query parameters
        this.queryParams = {
            q: new URLSearchParams(window.location.search).get('q') || '',
            collection: new URLSearchParams(window.location.search).get('collection') || '',
            price: new URLSearchParams(window.location.search).get('price') || ''
        };

        this.threshold = options.threshold || 200; // pixels from bottom to trigger load
        this.init();
    }

    init() {
        // Initialize with the first page already loaded (from server)
        // Extract page info from data attributes if available
        const container = document.querySelector('[data-current-page]');
        if (container) {
            this.currentPage = parseInt(container.getAttribute('data-current-page')) || 1;
            this.totalPages = parseInt(container.getAttribute('data-total-pages')) || 1;
        }

        this.hasMore = this.currentPage < this.totalPages;

        // Attach scroll listener
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    }

    handleScroll() {
        if (this.isLoading || !this.hasMore) return;

        // Check if user scrolled near the bottom
        const scrollPosition = window.innerHeight + window.scrollY;
        const pageBottom = document.documentElement.scrollHeight;

        if (pageBottom - scrollPosition < this.threshold) {
            this.loadMore();
        }
    }

    async loadMore() {
        if (this.isLoading || !this.hasMore) return;

        this.isLoading = true;

        // Show loading indicator
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'flex';
        }

        try {
            const nextPage = this.currentPage + 1;
            const url = new URL('/api/posts', window.location.origin);
            url.searchParams.set('page', nextPage);
            if (this.queryParams.q) url.searchParams.set('q', this.queryParams.q);
            if (this.queryParams.collection) url.searchParams.set('collection', this.queryParams.collection);
            if (this.queryParams.price) url.searchParams.set('price', this.queryParams.price);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Add new cards to grid
            this.appendCards(data.posts);

            // Update state
            this.currentPage = data.page;
            this.totalPages = data.totalPages;
            this.hasMore = data.hasMore;

        } catch (error) {
            console.error('Error loading more posts:', error);
            this.showError('Error loading more cards. Please try again.');
        } finally {
            this.isLoading = false;

            // Hide loading indicator
            if (this.loadingIndicator) {
                this.loadingIndicator.style.display = 'none';
            }
        }
    }

    appendCards(posts) {
        if (!posts || posts.length === 0) return;

        posts.forEach(post => {
            const cardHTML = `
                <div class="col-lg-4 col-md-6 col-xs-12 mb-4">
                    <div class="pokemon-card">
                        <div class="card-image">
                            <img src="/uploads/${post.imageFilename}" alt="${post.title}" class="card-img">
                            <div class="card-overlay">
                                <a href="/post/${post._id}" class="btn-view-details">See Details</a>
                            </div>
                        </div>
                        <div class="card-content">
                            <h3 class="card-title">${post.title}</h3>
                            <div class="card-collection">${post.coleccion}</div>
                            <div class="card-price">€${post.precio}</div>
                        </div>
                    </div>
                </div>
            `;

            const cardElement = document.createElement('div');
            cardElement.innerHTML = cardHTML;
            this.cardsGrid.appendChild(cardElement.firstElementChild);
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const container = document.querySelector('.store-main');
        if (container) {
            container.insertBefore(errorDiv, container.firstChild);
        }
    }

    // Reset scroll to first page (useful for search/filter changes)
    reset() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.isLoading = false;
        this.hasMore = true;
        this.cardsGrid.innerHTML = '';
    }
}
