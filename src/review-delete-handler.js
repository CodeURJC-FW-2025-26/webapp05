/**
 * Review Delete Handler Module
 * Handles deletion of reviews with confirmation and dynamic removal from DOM
 */

export class ReviewDeleteHandler {
    constructor(options = {}) {
        this.deleteButtonSelector = options.deleteButtonSelector || '.btn-delete-review';
        this.reviewContainerSelector = options.reviewContainerSelector || '.review-item';
        this.init();
    }

    init() {
        // Attach click handler to all delete buttons
        document.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest(this.deleteButtonSelector);
            if (deleteBtn) {
                e.preventDefault();
                this.handleDelete(deleteBtn);
            }
        });
    }

    handleDelete(button) {
        const reviewId = button.getAttribute('data-review-id');
        const reviewContainer = button.closest(this.reviewContainerSelector);

        if (!reviewId || !reviewContainer) {
            console.error('Review ID or container not found');
            return;
        }

        // Show confirmation modal
        this.showConfirmationModal(reviewId, reviewContainer);
    }

    showConfirmationModal(reviewId, reviewContainer) {
        // Create modal HTML
        const modalHTML = `
            <div class="modal fade" id="deleteReviewConfirmModal-${reviewId}" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-warning text-dark">
                            <h5 class="modal-title">Delete Review</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>Are you sure you want to delete this review?</p>
                            <p class="text-muted mb-0"><small>This action cannot be undone.</small></p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-danger" id="confirmDeleteReviewBtn-${reviewId}">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Get modal instance and show it
        const modalElement = document.getElementById(`deleteReviewConfirmModal-${reviewId}`);
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

        // Handle confirm button click
        const confirmBtn = document.getElementById(`confirmDeleteReviewBtn-${reviewId}`);
        confirmBtn.onclick = () => {
            modal.hide();
            this.deleteReview(reviewId, reviewContainer, modalElement);
        };

        // Clean up modal when hidden
        modalElement.addEventListener('hidden.bs.modal', () => {
            modalElement.remove();
        });
    }

    async deleteReview(reviewId, reviewContainer, modalElement) {
        try {
            // Show loading indicator
            this.showLoadingIndicator(reviewContainer);

            const response = await fetch(`/api/reviews/${reviewId}`, {
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

            // Fade out and remove the review element
            this.removeReviewElement(reviewContainer);

            // Show success message
            this.showSuccessMessage('Review deleted successfully');

        } catch (error) {
            console.error('Error deleting review:', error);
            this.showErrorModal(error.message, reviewId, reviewContainer);
        } finally {
            // Remove modal
            if (modalElement && modalElement.parentNode) {
                modalElement.remove();
            }
        }
    }

    removeReviewElement(element) {
        // Fade out animation
        element.style.transition = 'opacity 0.3s ease-out';
        element.style.opacity = '0';

        // Remove element after animation
        setTimeout(() => {
            element.remove();

            // Check if no reviews left
            const reviewsContainer = document.querySelector('.reviews-container');
            if (reviewsContainer && reviewsContainer.querySelectorAll('.review-item').length === 0) {
                // Add "no reviews" message
                const noReviewsDiv = document.createElement('div');
                noReviewsDiv.className = 'col-12 text-center';
                noReviewsDiv.style.padding = '20px';
                noReviewsDiv.innerHTML = '<p>No reviews for this card yet. Be the first!</p>';
                reviewsContainer.appendChild(noReviewsDiv);
            }
        }, 300);
    }

    showLoadingIndicator(reviewContainer) {
        const spinner = document.createElement('div');
        spinner.className = 'spinner-border spinner-border-sm text-danger';
        spinner.setAttribute('role', 'status');
        spinner.innerHTML = '<span class="visually-hidden">Deleting...</span>';
        spinner.style.marginLeft = '10px';

        // Add spinner to the review container
        const deleteBtn = reviewContainer.querySelector(this.deleteButtonSelector);
        if (deleteBtn) {
            deleteBtn.disabled = true;
            deleteBtn.insertAdjacentElement('afterend', spinner);
        }
    }

    showSuccessMessage(message) {
        const alertHTML = `
            <div class="alert alert-success alert-dismissible fade show position-fixed bottom-0 end-0 m-3" role="alert" style="z-index: 10000; max-width: 400px;">
                <strong>Success!</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', alertHTML);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            const alert = document.querySelector('.alert-success');
            if (alert) {
                alert.remove();
            }
        }, 3000);
    }

    showErrorModal(message, reviewId, reviewContainer) {
        // Create error modal HTML
        const errorModalId = `deleteReviewErrorModal-${reviewId}`;
        const errorModalHTML = `
            <div class="modal fade" id="${errorModalId}" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-danger text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-exclamation-circle me-2"></i>Error Deleting Review
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>Could not delete the review:</strong></p>
                            <div class="alert alert-danger mb-0" role="alert">
                                ${this.escapeHtml(message)}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-danger" id="retryDeleteReviewBtn-${reviewId}">Try Again</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', errorModalHTML);

        // Show modal
        const modalElement = document.getElementById(errorModalId);
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

        // Handle retry button
        const retryBtn = document.getElementById(`retryDeleteReviewBtn-${reviewId}`);
        retryBtn.onclick = () => {
            modal.hide();
            // Remove modal from DOM
            setTimeout(() => {
                modalElement.remove();
            }, 300);
            // Retry deletion
            this.deleteReview(reviewId, reviewContainer, null);
        };

        // Clean up modal when hidden
        modalElement.addEventListener('hidden.bs.modal', () => {
            // Re-enable delete button
            const deleteBtn = reviewContainer.querySelector(this.deleteButtonSelector);
            if (deleteBtn) {
                deleteBtn.disabled = false;
            }
            // Remove loading spinner
            const spinner = reviewContainer.querySelector('.spinner-border');
            if (spinner) {
                spinner.remove();
            }
            modalElement.remove();
        });
    }

    showErrorMessage(message) {
        const alertHTML = `
            <div class="alert alert-danger alert-dismissible fade show position-fixed bottom-0 end-0 m-3" role="alert" style="z-index: 10000; max-width: 400px;">
                <strong>Error!</strong> ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', alertHTML);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = document.querySelector('.alert-danger');
            if (alert) {
                alert.remove();
            }
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
