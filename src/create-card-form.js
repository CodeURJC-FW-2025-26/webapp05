/**
 * Create Card Form Handler
 * Handles AJAX submission and validation for creating new Pokemon cards
 */
document.addEventListener('DOMContentLoaded', function () {
    // Initialize image upload with drag & drop
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

    if (!form) return;

    // Field-level live validation for title + AJAX uniqueness
    const titleInput = document.getElementById('pokemon_name');
    let lastTitleChecked = '';
    let titleAvailable = true;
    if (titleInput) {
        // Clear error as user types when requirement is satisfied
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
                // On request error, keep current state; backend re-validates on submit
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

        // Clear previous errors and invalid styles so we can re-render all errors
        form.querySelectorAll('.field-error').forEach(el => el.remove());
        form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        const dzError = document.querySelector('#image-drop-zone .drop-zone-error');
        if (dzError) dzError.style.display = 'none';
        const errorContainer = form.querySelector('.form-error-container');
        if (errorContainer) errorContainer.style.display = 'none';

        // Validate fields
        let hasErrors = false;

        const title = document.getElementById('pokemon_name').value.trim();
        const precio = document.getElementById('price').value.trim();
        const coleccion = document.getElementById('colection').value;
        const releaseDate = document.getElementById('release_date').value;
        const description = document.getElementById('description').value.trim();
        const imageFile = document.getElementById('image').files[0];

        if (!title) {
            showFieldError('pokemon_name', 'Name is required');
            hasErrors = true;
        } else if (!/^[\p{Lu}]/u.test(title)) {
            showFieldError('pokemon_name', 'Name must start with an uppercase letter');
            hasErrors = true;
        } else {
            // Check uniqueness before submit
            try {
                const r = await fetch(`/api/validate/title?title=${encodeURIComponent(title)}`);
                const data = await r.json();
                if (!data.available) {
                    showFieldError('pokemon_name', 'Title already exists (must be unique)');
                    hasErrors = true;
                }
            } catch (err) {
                // If server error, do not block submit here; backend will validate too
            }
        }

        if (!precio) {
            showFieldError('price', 'Price is required');
            hasErrors = true;
        } else if (parseFloat(precio) <= 0) {
            showFieldError('price', 'Price must be greater than 0');
            hasErrors = true;
        }

        if (!coleccion) {
            showFieldError('colection', 'Select a collection');
            hasErrors = true;
        }

        if (!releaseDate) {
            showFieldError('release_date', 'Release date is required');
            hasErrors = true;
        }

        if (!description) {
            showFieldError('description', 'Description is required');
            hasErrors = true;
        } else if (description.length < 10) {
            showFieldError('description', 'Description must be at least 10 characters');
            hasErrors = true;
        }

        if (!imageFile) {
            showDropZoneError('Image is required');
            hasErrors = true;
        }

        if (hasErrors) return;

        // Show spinner (inline, ensure visible ~0.5s like reviews)
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
                // Redirect will happen in finally after spinner min duration
                window._pendingRedirect = confirmUrl;
            } else {
                showFormError(result.message || result.errors?.join('; ') || 'Error creating the card');
            }
        } catch (error) {
            console.error('Error:', error);
            showFormError('Unexpected error while creating the card');
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

    function clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        field.classList.remove('is-invalid');
        const existing = field.parentNode.querySelector('.invalid-feedback');
        if (existing) existing.remove();
    }

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

    function showFormError(message) {
        let errorContainer = form.querySelector('.form-error-container');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'form-error-container alert alert-danger mt-3';
            form.insertBefore(errorContainer, form.firstChild);
        }
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }
});
