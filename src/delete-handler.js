/**
 * Delete Handler Module
 * Handles deletion of posts with confirmation dialog and AJAX
 */

export class DeleteHandler {
    constructor(options = {}) {
        this.deleteButtonSelector = options.deleteButtonSelector || '.btn-delete-post';
        this.postId = options.postId;
        this.redirectUrl = options.redirectUrl || '/';
        this.init();
    }

    init() {
        const deleteButton = document.querySelector(this.deleteButtonSelector);
        if (deleteButton) {
            deleteButton.addEventListener('click', (e) => this.handleDelete(e));
        }
    }

    handleDelete(e) {
        e.preventDefault();

        // Show confirmation dialog using Bootstrap Modal
        this.showConfirmationModal();
    }

    showConfirmationModal() {
        // Create modal HTML
        const modalHTML = `
            <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">Confirm Deletion</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>Are you sure you want to delete this card?</p>
                            <p class="text-muted mb-0"><small>This action cannot be undone.</small></p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to DOM if it doesn't exist
        if (!document.getElementById('deleteConfirmModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        // Get modal instance and show it
        const modalElement = document.getElementById('deleteConfirmModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

        // Handle confirm button click
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        confirmBtn.onclick = () => {
            modal.hide();
            this.deletePost();
        };
    }

    async deletePost() {
        try {
            // Show loading indicator
            this.showLoadingIndicator();

            const response = await fetch(`/api/posts/${this.postId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.message || data.error || 'Unknown error occurred';
                throw new Error(errorMessage);
            }

            // Show success message and redirect
            this.showSuccessMessage();
            setTimeout(() => {
                window.location.href = this.redirectUrl;
            }, 2000);

        } catch (error) {
            console.error('Error deleting post:', error);
            this.showErrorModal(error.message);
        }
    }

    showLoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'deleteLoadingIndicator';
        indicator.className = 'position-fixed top-50 start-50 translate-middle text-center';
        indicator.style.zIndex = '9999';
        indicator.innerHTML = `
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Deleting...</span>
            </div>
            <p class="mt-2">Deleting card...</p>
        `;
        document.body.appendChild(indicator);
    }

    hideLoadingIndicator() {
        const indicator = document.getElementById('deleteLoadingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    showSuccessMessage() {
        this.hideLoadingIndicator();
        const alertHTML = `
            <div class="alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3" role="alert" style="z-index: 10000;">
                <strong>Success!</strong> Card deleted successfully. Redirecting...
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        document.body.insertAdjacentHTML('afterbegin', alertHTML);
    }

    showErrorModal(message) {
        this.hideLoadingIndicator();

        // Create error modal HTML
        const errorModalHTML = `
            <div class="modal fade" id="deleteErrorModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-exclamation-circle me-2"></i>Error Deleting Card
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>Something went wrong while deleting the card:</strong></p>
                            <div class="alert alert-danger mb-0" role="alert">
                                ${this.escapeHtml(message)}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-danger" id="retryDeleteBtn">Try Again</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', errorModalHTML);

        // Show modal
        const modalElement = document.getElementById('deleteErrorModal');
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

        // Handle retry button
        const retryBtn = document.getElementById('retryDeleteBtn');
        retryBtn.onclick = () => {
            modal.hide();
            // Remove modal from DOM
            setTimeout(() => {
                modalElement.remove();
            }, 300);
            // Retry deletion
            this.deletePost();
        };

        // Clean up modal when hidden
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
        });
    }

    showErrorMessage(message) {
        this.hideLoadingIndicator();
        const alertHTML = `
            <div class="alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3" role="alert" style="z-index: 10000;">
                <strong>Error!</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        document.body.insertAdjacentHTML('afterbegin', alertHTML);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
