document.addEventListener('DOMContentLoaded', function () {
    // Initialize image upload with drag & drop and preview/remove controls
    const imageUploader = initImageUpload({
        fileInputId: 'image',
        dropZoneId: 'image-drop-zone',
        previewContainerId: 'image-preview-container',
        previewImageId: 'image-preview',
        removeButtonId: 'remove-image-btn'
    });

    // Form submission with AJAX
    const form = document.getElementById('create-card-form');
    const submitBtn = document.getElementById('submit-btn');
    const spinner = document.getElementById('form-spinner');
    const successMessage = document.getElementById('success-message');
    const viewCardLink = document.getElementById('view-card-link');

    // Bootstrap error modal (used to surface client/server error summaries)
    let errorModal, errorMessageEl;
    const errorModalEl = document.getElementById('errorModal');
    if (errorModalEl && window.bootstrap) {
        errorModal = new bootstrap.Modal(errorModalEl);
        errorMessageEl = document.getElementById('errorMessage');
    }

    if (!form) return;

    // Field-level live validation for title + AJAX uniqueness
    // Rules: required, must start with uppercase letter, and must be unique
    const titleInput = document.getElementById('pokemon_name');
    let lastTitleChecked = '';
    let titleAvailable = true;
    if (titleInput) {
        // Clear error live as soon as current input satisfies the rule
        titleInput.addEventListener('input', function () {
            const title = this.value.trim();
            if (title && /^[\p{Lu}]/u.test(title)) {
                clearFieldError('pokemon_name');
            }
        });

        titleInput.addEventListener('blur', async function () {
            const title = this.value.trim();
            if (!title) {
                showFieldError('pokemon_name', 'Name is required');
                return;
            }
            if (!/^[\p{Lu}]/u.test(title)) {
                showFieldError('pokemon_name', 'Name must start with an uppercase letter');
                return;
            }

            // Only check uniqueness if basic rules pass
            if (title === lastTitleChecked) return;
            lastTitleChecked = title;
            try {
                const r = await fetch(`/api/validate/title?title=${encodeURIComponent(title)}`);
                const data = await r.json();
                titleAvailable = !!data.available;
                if (!titleAvailable) {
                    showFieldError('pokemon_name', 'Title already exists (must be unique)');
                } else {
                    clearFieldError('pokemon_name');
                }
            } catch (err) {
                // Network/endpoint error: keep current state; backend re-validates on submit
            }
        });
    }

    // Live validation: Price (> 0)
    const priceInput = document.getElementById('price');
    if (priceInput) {
        priceInput.addEventListener('input', function () {
            const v = this.value.trim();
            if (v && !isNaN(v) && parseFloat(v) > 0) {
                clearFieldError('price');
            }
        });
        priceInput.addEventListener('blur', function () {
            const v = this.value.trim();
            if (!v) {
                showFieldError('price', 'Price is required');
                return;
            }
            const n = parseFloat(v);
            if (isNaN(n) || n <= 0) {
                showFieldError('price', 'Price must be greater than 0');
                return;
            }
            clearFieldError('price');
        });
    }

    // Live validation: Description (min 10 chars)
    const descInput = document.getElementById('description');
    if (descInput) {
        descInput.addEventListener('input', function () {
            const len = this.value.trim().length;
            if (len >= 10) {
                clearFieldError('description');
            }
        });
        descInput.addEventListener('blur', function () {
            const text = this.value.trim();
            if (!text) {
                showFieldError('description', 'Description is required');
                return;
            }
            if (text.length < 10) {
                showFieldError('description', 'Description must be at least 10 characters');
                return;
            }
            clearFieldError('description');
        });
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Clear previous errors and invalid styles so we can render all current errors
        form.querySelectorAll('.field-error').forEach(el => el.remove());
        form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        const dzError = document.querySelector('#image-drop-zone .drop-zone-error');
        if (dzError) dzError.style.display = 'none';
        const errorContainer = form.querySelector('.form-error-container');
        if (errorContainer) errorContainer.style.display = 'none';

        // Validate fields
        let hasErrors = false;
        const errorsList = [];

        const title = document.getElementById('pokemon_name').value.trim();
        const precio = document.getElementById('price').value.trim();
        const coleccion = document.getElementById('colection').value;
        const releaseDate = document.getElementById('release_date').value;
        const description = document.getElementById('description').value.trim();
        const imageFile = document.getElementById('image').files[0];

        if (!title) {
            const msg = 'Name is required';
            showFieldError('pokemon_name', msg);
            errorsList.push(msg);
            hasErrors = true;
        } else if (!/^[\p{Lu}]/u.test(title)) {
            const msg = 'Name must start with an uppercase letter';
            showFieldError('pokemon_name', msg);
            errorsList.push(msg);
            hasErrors = true;
        } else {
            // Check uniqueness before submit (server confirms as well)
            try {
                const r = await fetch(`/api/validate/title?title=${encodeURIComponent(title)}`);
                const data = await r.json();
                if (!data.available) {
                    const msg = 'Title already exists (must be unique)';
                    showFieldError('pokemon_name', msg);
                    errorsList.push(msg);
                    hasErrors = true;
                }
            } catch (err) {
                // If request fails, do not block submit here; backend will validate too
            }
        }

        if (!precio) {
            const msg = 'Price is required';
            showFieldError('price', msg);
            errorsList.push(msg);
            hasErrors = true;
        } else if (parseFloat(precio) <= 0) {
            const msg = 'Price must be greater than 0';
            showFieldError('price', msg);
            errorsList.push(msg);
            hasErrors = true;
        }

        if (!coleccion) {
            const msg = 'Select a collection';
            showFieldError('colection', msg);
            errorsList.push(msg);
            hasErrors = true;
        }

        if (!releaseDate) {
            const msg = 'Release date is required';
            showFieldError('release_date', msg);
            errorsList.push(msg);
            hasErrors = true;
        }

        if (!description) {
            const msg = 'Description is required';
            showFieldError('description', msg);
            errorsList.push(msg);
            hasErrors = true;
        } else if (description.length < 10) {
            const msg = 'Description must be at least 10 characters';
            showFieldError('description', msg);
            errorsList.push(msg);
            hasErrors = true;
        }

        if (!imageFile) {
            const msg = 'Image is required';
            showDropZoneError(msg);
            errorsList.push(msg);
            hasErrors = true;
        }

        if (hasErrors) {
            if (errorModal && errorMessageEl) {
                if (errorsList.length > 1) {
                    // Multiple errors: render a bulleted list inside the modal
                    const listHtml = '<p><strong>Please fix the following errors:</strong></p><ul class="text-start">' +
                        errorsList.map(e => `<li>${e}</li>`).join('') +
                        '</ul>';
                    errorMessageEl.innerHTML = listHtml;
                } else if (errorsList.length === 1) {
                    // Single error: show the text directly
                    errorMessageEl.textContent = errorsList[0];
                } else {
                    // Edge case: hasErrors=true but no items in the list
                    errorMessageEl.textContent = 'Please fix the highlighted errors in the form.';
                }
                errorModal.show();
            }
            return;
        }

        // Show spinner (inline). Keep visible for ~0.5s minimum for UX consistency
        spinner.style.display = 'block';
        const spinnerShownAt = Date.now();
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);

            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (result.success) {
                // Keep the form visible; show spinner briefly then redirect to confirmation page
                const postId = result.postId;
                const detailUrl = result.createdPostUrl || (postId ? ('/post/' + postId) : '/');
                const confirmUrl = `/confirm?message=${encodeURIComponent('Card created successfully.')}&returnUrl=${encodeURIComponent(detailUrl)}&createdPostUrl=${encodeURIComponent(detailUrl)}`;
                // Redirect happens in finally after spinner min duration
                window._pendingRedirect = confirmUrl;
            } else {
                const msg = result.message || result.errors?.join('; ') || 'Error creating the card';
                if (errorModal && errorMessageEl) {
                    errorMessageEl.textContent = msg;
                    errorModal.show();
                }
            }
        } catch (error) {
            console.error('Error:', error);
            const msg = 'Unexpected error while creating the card';
            if (errorModal && errorMessageEl) {
                errorMessageEl.textContent = msg;
                errorModal.show();
            }
        } finally {
            const elapsed = Date.now() - spinnerShownAt;
            const hide = () => {
                spinner.style.display = 'none';
                submitBtn.disabled = false;
                if (window._pendingRedirect) {
                    const url = window._pendingRedirect;
                    window._pendingRedirect = null;
                    window.location.href = url;
                }
            };
            if (elapsed < 500) {
                setTimeout(hide, 500 - elapsed);
            } else {
                hide();
            }
        }
    });

    // Renders an error below a field using Bootstrap styles
    function showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        field.classList.add('is-invalid');
        const existing = field.parentNode.querySelector('.invalid-feedback');
        if (existing) existing.remove();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback d-block';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    // Clears error state and feedback for a field
    function clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        field.classList.remove('is-invalid');
        const existing = field.parentNode.querySelector('.invalid-feedback');
        if (existing) existing.remove();
    }

    // Shows an error message inside the image drop zone
    function showDropZoneError(message) {
        const dropZone = document.getElementById('image-drop-zone');
        let errorEl = dropZone.querySelector('.drop-zone-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'drop-zone-error text-danger';
            dropZone.appendChild(errorEl);
        }
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
});
