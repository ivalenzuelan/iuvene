// Newsletter Form Handler using EmailJS
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('newsletter-form');
    const messageDiv = document.getElementById('newsletter-message');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = form.querySelector('input[name="email"]').value;
            const submitButton = form.querySelector('button[type="submit"]');
            
            // Show loading state
            submitButton.textContent = 'Enviando...';
            submitButton.disabled = true;
            
            // Send email using EmailJS
            sendEmailWithEmailJS(email)
                .then(() => {
                    showMessage('¡Gracias por suscribirte! Te mantendremos informado sobre nuestras novedades.', 'success');
                    form.reset();
                })
                .catch((error) => {
                    console.error('Error sending email:', error);
                    showMessage('Hubo un error al enviar tu suscripción. Por favor, intenta de nuevo.', 'error');
                })
                .finally(() => {
                    // Reset button state
                    submitButton.textContent = 'Suscribirse';
                    submitButton.disabled = false;
                });
        });
    }
    
    function sendEmailWithEmailJS(email) {
        return new Promise((resolve, reject) => {
            // Initialize EmailJS
            emailjs.init("YOUR_USER_ID"); // Replace with your EmailJS user ID
            
            // EmailJS configuration
            const serviceID = 'YOUR_SERVICE_ID'; // Replace with your EmailJS service ID
            const templateID = 'YOUR_TEMPLATE_ID'; // Replace with your EmailJS template ID
            
            // EmailJS template parameters
            const templateParams = {
                to_email: 'tu-email@dominio.com', // Replace with your email
                from_email: email,
                message: `Nuevo suscriptor al newsletter: ${email}`,
                subject: 'Nuevo suscriptor - IUVENE Newsletter',
                date: new Date().toLocaleDateString('es-ES'),
                time: new Date().toLocaleTimeString('es-ES')
            };
            
            // Send email using EmailJS
            emailjs.send(serviceID, templateID, templateParams)
                .then(function(response) {
                    console.log('SUCCESS!', response.status, response.text);
                    resolve();
                }, function(error) {
                    console.log('FAILED...', error);
                    reject(error);
                });
        });
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
});
