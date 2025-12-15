/**
 * Edit Card Form Handler
 * Handles AJAX submission, validation, and image management for editing Pokemon cards
 */
document.addEventListener('DOMContentLoaded', function () {
    // Get existing image URL from the preview img element (already set by server template)
    const previewImg = document.getElementById('image-preview');
    const imgSrc = previewImg ? previewImg.getAttribute('src') : '';
    const existingImageUrl = imgSrc && imgSrc.includes('/uploads/') ? imgSrc : null;

    // Initialize image upload with drag & drop
    const imageUploader = initImageUpload({
        fileInputId: 'image',
        dropZoneId: 'image-drop-zone',
        previewContainerId: 'image-preview-container',
        previewImageId: 'image-preview',
        removeButtonId: 'remove-image-btn',
        removeImageInputId: 'removeImage',
        existingImageUrl: existingImageUrl
    });

    // Form submission with AJAX
    const form = document.getElementById('edit-card-form');
    const submitBtn = document.getElementById('submit-btn');
    const spinner = document.getElementById('form-spinner');
    const successMessage = document.getElementById('success-message');

    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Clear previous errors
        form.querySelectorAll('.field-error').forEach(el => el.remove());
        const errorContainer = form.querySelector('.form-error-container');
        if (errorContainer) errorContainer.style.display = 'none';

        // Validate fields
        let hasErrors = false;

        const title = document.getElementById('pokemon_name').value.trim();
        const precio = document.getElementById('price').value.trim();
        const coleccion = document.getElementById('colection').value;
        const releaseDate = document.getElementById('release_date').value;
        const description = document.getElementById('description').value.trim();

        if (!title) {
            showFieldError('pokemon_name', 'El nombre es obligatorio');
            hasErrors = true;
        } else if (!/^[\p{Lu}]/u.test(title)) {
            showFieldError('pokemon_name', 'El nombre debe empezar con mayúscula');
            hasErrors = true;
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

        if (hasErrors) return;

        // Show spinner
        spinner.style.display = 'block';
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
                // Hide form elements and show success message
                form.querySelectorAll('.row').forEach(row => row.style.display = 'none');
                spinner.style.display = 'none';
                successMessage.style.display = 'block';
            } else {
                showFormError(result.message || result.errors?.join('; ') || 'Error al actualizar la carta');
            }
        } catch (error) {
            console.error('Error:', error);
            showFormError('Error inesperado al actualizar la carta');
        } finally {
            spinner.style.display = 'none';
            submitBtn.disabled = false;
        }
    });

    function showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-danger small mt-1';
        errorDiv.textContent = message;
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
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
