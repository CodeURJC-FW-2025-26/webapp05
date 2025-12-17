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
                showFieldError('pokemon_name', 'El nombre es obligatorio');
                return;
            }
            if (!/^[\p{Lu}]/u.test(title)) {
                showFieldError('pokemon_name', 'El nombre debe empezar con mayúscula');
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
                    showFieldError('pokemon_name', 'El título ya existe (debe ser único)');
                } else {
                    clearFieldError('pokemon_name');
                }
            } catch (err) {
                // On request error, keep current state; backend re-validates on submit
            }
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
            showFieldError('pokemon_name', 'El nombre es obligatorio');
            hasErrors = true;
        } else if (!/^[\p{Lu}]/u.test(title)) {
            showFieldError('pokemon_name', 'El nombre debe empezar con mayúscula');
            hasErrors = true;
        } else {
            // Check uniqueness before submit
            try {
                const r = await fetch(`/api/validate/title?title=${encodeURIComponent(title)}`);
                const data = await r.json();
                if (!data.available) {
                    showFieldError('pokemon_name', 'El título ya existe (debe ser único)');
                    hasErrors = true;
                }
            } catch (err) {
                // If server error, do not block submit here; backend will validate too
            }
        }

        if (!precio) {
            showFieldError('price', 'El precio es obligatorio');
            hasErrors = true;
        } else if (parseFloat(precio) <= 0) {
            showFieldError('price', 'El precio debe ser mayor que 0');
            hasErrors = true;
        }

        if (!coleccion) {
            showFieldError('colection', 'Selecciona una colección');
            hasErrors = true;
        }

        if (!releaseDate) {
            showFieldError('release_date', 'La fecha de lanzamiento es obligatoria');
            hasErrors = true;
        }

        if (!description) {
            showFieldError('description', 'La descripción es obligatoria');
            hasErrors = true;
        }

        if (!imageFile) {
            showDropZoneError('La imagen es obligatoria');
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
                showFormError(result.message || result.errors?.join('; ') || 'Error al crear la carta');
            }
        } catch (error) {
            console.error('Error:', error);
            showFormError('Error inesperado al crear la carta');
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
