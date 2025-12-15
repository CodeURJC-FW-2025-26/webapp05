/**
 * Image Upload Module
 * Provides image preview, drag & drop, and removal functionality for forms.
 * 
 * Usage:
 *   initImageUpload({
 *     fileInputId: 'image',
 *     dropZoneId: 'image-drop-zone',
 *     previewContainerId: 'image-preview-container',
 *     previewImageId: 'image-preview',
 *     removeButtonId: 'remove-image-btn',
 *     removeImageInputId: 'removeImage',
 *     existingImageUrl: '/uploads/existing-image.jpg' // optional
 *   });
 */

function initImageUpload(options) {
    const {
        fileInputId,
        dropZoneId,
        previewContainerId,
        previewImageId,
        removeButtonId,
        removeImageInputId,
        existingImageUrl
    } = options;

    const fileInput = document.getElementById(fileInputId);
    const dropZone = document.getElementById(dropZoneId);
    const previewContainer = document.getElementById(previewContainerId);
    const previewImage = document.getElementById(previewImageId);
    const removeButton = document.getElementById(removeButtonId);
    const removeImageInput = document.getElementById(removeImageInputId);

    let currentFile = null;
    let hasExistingImage = !!existingImageUrl;

    // Initialize with existing image if provided
    if (existingImageUrl && previewImage && previewContainer) {
        previewImage.src = existingImageUrl;
        previewContainer.style.display = 'block';
        if (dropZone) {
            dropZone.querySelector('.drop-zone-text')?.classList.add('hidden');
        }
    }

    // File input change handler
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                handleFileSelect(file);
            }
        });
    }

    // Drag & Drop handlers
    if (dropZone) {
        dropZone.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                // Validate it's an image
                if (file.type.startsWith('image/')) {
                    handleFileSelect(file);
                    // Update the file input
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    fileInput.files = dataTransfer.files;
                } else {
                    showDropZoneError('Por favor, selecciona un archivo de imagen válido.');
                }
            }
        });

        // Click on drop zone opens file dialog
        dropZone.addEventListener('click', function (e) {
            if (e.target !== removeButton && !removeButton?.contains(e.target)) {
                fileInput.click();
            }
        });
    }

    // Remove button handler
    if (removeButton) {
        removeButton.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
                clearImage();
            }
        });
    }

    /**
     * Handle file selection - show preview
     */
    function handleFileSelect(file) {
        if (!file.type.startsWith('image/')) {
            showDropZoneError('Por favor, selecciona un archivo de imagen válido.');
            return;
        }

        currentFile = file;
        hasExistingImage = false;

        // Clear removeImage flag since we have a new image
        if (removeImageInput) {
            removeImageInput.value = '';
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = function (e) {
            if (previewImage) {
                previewImage.src = e.target.result;
            }
            if (previewContainer) {
                previewContainer.style.display = 'block';
            }
            if (dropZone) {
                dropZone.querySelector('.drop-zone-text')?.classList.add('hidden');
                dropZone.classList.add('has-preview');
            }
            clearDropZoneError();
        };
        reader.readAsDataURL(file);
    }

    /**
     * Clear the current image
     */
    function clearImage() {
        currentFile = null;

        // Clear file input
        if (fileInput) {
            fileInput.value = '';
        }

        // Hide preview
        if (previewImage) {
            previewImage.src = '';
        }
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
        if (dropZone) {
            dropZone.querySelector('.drop-zone-text')?.classList.remove('hidden');
            dropZone.classList.remove('has-preview');
        }

        // Set removeImage flag if there was an existing image
        if (removeImageInput && hasExistingImage) {
            removeImageInput.value = 'true';
        }

        hasExistingImage = false;
    }

    /**
     * Show error in drop zone
     */
    function showDropZoneError(message) {
        if (dropZone) {
            let errorEl = dropZone.querySelector('.drop-zone-error');
            if (!errorEl) {
                errorEl = document.createElement('div');
                errorEl.className = 'drop-zone-error text-danger';
                dropZone.appendChild(errorEl);
            }
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }
    }

    /**
     * Clear drop zone error
     */
    function clearDropZoneError() {
        if (dropZone) {
            const errorEl = dropZone.querySelector('.drop-zone-error');
            if (errorEl) {
                errorEl.style.display = 'none';
            }
        }
    }

    // Return API for external use
    return {
        handleFileSelect,
        clearImage,
        hasImage: () => currentFile !== null || hasExistingImage,
        getFile: () => currentFile
    };
}

/**
 * Initialize AJAX form submission with validation
 */
function initAjaxForm(options) {
    const {
        formId,
        submitButtonId,
        spinnerId,
        validationRules,
        onSuccess,
        onError
    } = options;

    const form = document.getElementById(formId);
    const submitButton = document.getElementById(submitButtonId);
    const spinner = document.getElementById(spinnerId);

    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Clear previous errors
        form.querySelectorAll('.field-error').forEach(el => el.remove());

        // Run validation
        let hasErrors = false;
        if (validationRules) {
            for (const rule of validationRules) {
                const field = form.querySelector(`[name="${rule.field}"]`);
                const value = field ? (field.value || '').trim() : '';

                if (rule.required && !value) {
                    showFieldError(field, rule.message || `${rule.field} is required`);
                    hasErrors = true;
                } else if (rule.validate && !rule.validate(value, form)) {
                    showFieldError(field, rule.message);
                    hasErrors = true;
                }
            }
        }

        if (hasErrors) return;

        // Show loading state
        if (spinner) spinner.style.display = 'block';
        if (submitButton) submitButton.disabled = true;

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
                if (onSuccess) {
                    onSuccess(result);
                }
            } else {
                if (onError) {
                    onError(result.message || 'An error occurred');
                } else {
                    showFormError(form, result.message || result.errors?.join('; ') || 'An error occurred');
                }
            }
        } catch (error) {
            console.error('Form submission error:', error);
            if (onError) {
                onError('An unexpected error occurred');
            } else {
                showFormError(form, 'An unexpected error occurred');
            }
        } finally {
            if (spinner) spinner.style.display = 'none';
            if (submitButton) submitButton.disabled = false;
        }
    });

    function showFieldError(field, message) {
        if (!field) return;
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-danger small mt-1';
        errorDiv.textContent = message;
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }

    function showFormError(form, message) {
        let errorContainer = form.querySelector('.form-error-container');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'form-error-container alert alert-danger mt-3';
            form.insertBefore(errorContainer, form.firstChild);
        }
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
    }
}
