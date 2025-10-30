// Enhanced Newsletter Form Handler with validation and analytics
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('newsletter-form');
    const messageDiv = document.getElementById('newsletter-message');
    
    if (form) {
        // Add real-time email validation
        const emailInput = form.querySelector('input[name="email"]');
        if (emailInput) {
            emailInput.addEventListener('input', validateEmailInput);
            emailInput.addEventListener('blur', validateEmailInput);
        }
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const submitButton = form.querySelector('button[type="submit"]');
            
            // Validate email before submission
            if (!isValidEmail(email)) {
                showMessage('Por favor, ingresa un email válido.', 'error');
                return;
            }
            
            // Check if already subscribed (basic check)
            if (isAlreadySubscribed(email)) {
                showMessage('Este email ya está suscrito a nuestro newsletter.', 'info');
                return;
            }
            
            // Show loading state
            submitButton.textContent = 'Enviando...';
            submitButton.disabled = true;
            submitButton.classList.add('loading');
            
            // Submit to Google Forms
            submitToGoogleForms(email)
                .then(() => {
                    showMessage(NEWSLETTER_CONFIG.SUCCESS_MESSAGE, 'success');
                    form.reset();
                    // Store subscription locally
                    storeSubscription(email);
                    // Track successful subscription
                    trackNewsletterSignup(email);
                })
                .catch((error) => {
                    console.error('Error submitting form:', error);
                    showMessage(NEWSLETTER_CONFIG.ERROR_MESSAGE, 'error');
                })
                .finally(() => {
                    // Reset button state
                    submitButton.textContent = 'Suscribirse';
                    submitButton.disabled = false;
                    submitButton.classList.remove('loading');
                });
        });
    }
    
    function submitToGoogleForms(email) {
        return new Promise((resolve, reject) => {
            try {
                // Method 1: Try using fetch with form data
                const formData = new FormData();
                formData.append(NEWSLETTER_CONFIG.EMAIL_ENTRY_ID, email);
                
                console.log('📧 Submitting email:', email);
                console.log('🔗 Form URL:', NEWSLETTER_CONFIG.FORM_URL);
                console.log('🏷️ Entry ID:', NEWSLETTER_CONFIG.EMAIL_ENTRY_ID);
                
                fetch(NEWSLETTER_CONFIG.FORM_URL, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors'
                })
                .then(() => {
                    console.log('✅ Form submitted successfully via fetch');
                    // Google Forms doesn't return success status, so we assume it worked
                    setTimeout(() => resolve(), 1000);
                })
                .catch((error) => {
                    console.log('⚠️ Fetch method failed, trying alternative:', error);
                    // If fetch fails, try alternative method
                    tryAlternativeMethod(email, resolve, reject);
                });
                
            } catch (error) {
                console.log('⚠️ Fetch method error, trying alternative:', error);
                // If fetch method fails, try alternative
                tryAlternativeMethod(email, resolve, reject);
            }
        });
    }
    
    function tryAlternativeMethod(email, resolve, reject) {
        try {
            console.log('🔄 Trying alternative submission method...');
            
            // Method 2: Create a hidden form and submit it
            const hiddenForm = document.createElement('form');
            hiddenForm.method = 'POST';
            hiddenForm.action = NEWSLETTER_CONFIG.FORM_URL;
            hiddenForm.target = '_blank';
            hiddenForm.style.display = 'none';
            
            // Add email field
            const emailInput = document.createElement('input');
            emailInput.type = 'hidden';
            emailInput.name = NEWSLETTER_CONFIG.EMAIL_ENTRY_ID;
            emailInput.value = email;
            hiddenForm.appendChild(emailInput);
            
            // Add submit button
            const submitInput = document.createElement('input');
            submitInput.type = 'submit';
            submitInput.value = 'Submit';
            hiddenForm.appendChild(submitInput);
            
            // Add to DOM, submit, and remove
            document.body.appendChild(hiddenForm);
            hiddenForm.submit();
            
            console.log('📝 Alternative form submitted');
            
            // Remove form after submission
            setTimeout(() => {
                if (document.body.contains(hiddenForm)) {
                    document.body.removeChild(hiddenForm);
                }
            }, 2000);
            
            // Assume success
            setTimeout(() => resolve(), 1500);
            
        } catch (error) {
            console.error('❌ Alternative method also failed:', error);
            reject(error);
        }
    }
    
    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `newsletter-message ${type}`;
        
        // Hide message after 5 seconds
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'newsletter-message';
        }, 5000);
    }
    
    // Enhanced email validation
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 254;
    }
    
    function validateEmailInput(e) {
        const email = e.target.value.trim();
        const submitButton = document.querySelector('#newsletter-form button[type="submit"]');
        
        if (email.length === 0) {
            e.target.classList.remove('valid', 'invalid');
            if (submitButton) submitButton.disabled = false;
            return;
        }
        
        if (isValidEmail(email)) {
            e.target.classList.remove('invalid');
            e.target.classList.add('valid');
            if (submitButton) submitButton.disabled = false;
        } else {
            e.target.classList.remove('valid');
            e.target.classList.add('invalid');
            if (submitButton) submitButton.disabled = true;
        }
    }
    
    // Simple subscription tracking
    function isAlreadySubscribed(email) {
        const subscriptions = JSON.parse(localStorage.getItem('newsletter-subscriptions') || '[]');
        return subscriptions.includes(email.toLowerCase());
    }
    
    function storeSubscription(email) {
        const subscriptions = JSON.parse(localStorage.getItem('newsletter-subscriptions') || '[]');
        if (!subscriptions.includes(email.toLowerCase())) {
            subscriptions.push(email.toLowerCase());
            localStorage.setItem('newsletter-subscriptions', JSON.stringify(subscriptions));
        }
    }
    
    // Analytics tracking (placeholder - replace with your analytics)
    function trackNewsletterSignup(email) {
        // Google Analytics 4 example
        if (typeof gtag !== 'undefined') {
            gtag('event', 'newsletter_signup', {
                'event_category': 'engagement',
                'event_label': 'newsletter',
                'value': 1
            });
        }
        
        // Facebook Pixel example
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Subscribe');
        }
        
        console.log('Newsletter signup tracked:', email);
    }
    
    function submitToGoogleForms(email) {
        return new Promise((resolve, reject) => {
            try {
                // Enhanced form submission with retry logic
                const maxRetries = 3;
                let retryCount = 0;
                
                function attemptSubmission() {
                    const formData = new FormData();
                    formData.append(NEWSLETTER_CONFIG.EMAIL_ENTRY_ID, email);
                    
                    console.log('📧 Attempting submission:', { email, attempt: retryCount + 1 });
                    
                    fetch(NEWSLETTER_CONFIG.FORM_URL, {
                        method: 'POST',
                        body: formData,
                        mode: 'no-cors'
                    })
                    .then(() => {
                        console.log('✅ Form submitted successfully');
                        resolve();
                    })
                    .catch((error) => {
                        console.log('⚠️ Submission failed:', error);
                        
                        if (retryCount < maxRetries - 1) {
                            retryCount++;
                            console.log(`🔄 Retrying... (${retryCount}/${maxRetries})`);
                            setTimeout(attemptSubmission, 1000 * retryCount);
                        } else {
                            // Try alternative method as final fallback
                            tryAlternativeMethod(email, resolve, reject);
                        }
                    });
                }
                
                attemptSubmission();
                
            } catch (error) {
                console.log('⚠️ Primary method failed, trying alternative:', error);
                tryAlternativeMethod(email, resolve, reject);
            }
        });
    }
    
    function tryAlternativeMethod(email, resolve, reject) {
        try {
            console.log('🔄 Trying alternative submission method...');
            
            // Method 2: Create a hidden iframe for submission
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.name = 'newsletter-frame';
            document.body.appendChild(iframe);
            
            // Create form targeting the iframe
            const hiddenForm = document.createElement('form');
            hiddenForm.method = 'POST';
            hiddenForm.action = NEWSLETTER_CONFIG.FORM_URL;
            hiddenForm.target = 'newsletter-frame';
            hiddenForm.style.display = 'none';
            
            // Add email field
            const emailInput = document.createElement('input');
            emailInput.type = 'hidden';
            emailInput.name = NEWSLETTER_CONFIG.EMAIL_ENTRY_ID;
            emailInput.value = email;
            hiddenForm.appendChild(emailInput);
            
            // Add to DOM and submit
            document.body.appendChild(hiddenForm);
            hiddenForm.submit();
            
            console.log('📝 Alternative form submitted');
            
            // Clean up after submission
            setTimeout(() => {
                if (document.body.contains(hiddenForm)) {
                    document.body.removeChild(hiddenForm);
                }
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 3000);
            
            // Assume success after delay
            setTimeout(() => resolve(), 2000);
            
        } catch (error) {
            console.error('❌ All submission methods failed:', error);
            reject(error);
        }
    }
    
    function showMessage(message, type) {
        if (!messageDiv) return;
        
        messageDiv.textContent = message;
        messageDiv.className = `newsletter-message ${type}`;
        
        // Add animation
        messageDiv.style.transform = 'translateY(-10px)';
        messageDiv.style.opacity = '0';
        
        setTimeout(() => {
            messageDiv.style.transform = 'translateY(0)';
            messageDiv.style.opacity = '1';
        }, 100);
        
        // Hide message after delay
        setTimeout(() => {
            messageDiv.style.transform = 'translateY(-10px)';
            messageDiv.style.opacity = '0';
            
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = 'newsletter-message';
                messageDiv.style.transform = '';
                messageDiv.style.opacity = '';
            }, 300);
        }, type === 'error' ? 6000 : 4000);
    }
    
// End of DOMContentLoaded event listener
});