// Simple Newsletter Form Handler (Works immediately)
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
            
            // Simulate sending (for now)
            simulateEmailSending(email)
                .then(() => {
                    showMessage('¡Gracias por suscribirte! Te mantendremos informado sobre nuestras novedades.', 'success');
                    form.reset();
                    
                    // Log the email for now (you can check browser console)
                    console.log('📧 Nuevo suscriptor:', email);
                    console.log('📅 Fecha:', new Date().toLocaleString());
                })
                .catch((error) => {
                    console.error('Error:', error);
                    showMessage('Hubo un error al enviar tu suscripción. Por favor, intenta de nuevo.', 'error');
                })
                .finally(() => {
                    // Reset button state
                    submitButton.textContent = 'Suscribirse';
                    submitButton.disabled = false;
                });
        });
    }
    
    function simulateEmailSending(email) {
        return new Promise((resolve) => {
            // Simulate network delay
            setTimeout(() => {
                // Store in localStorage for now (you can retrieve these later)
                const subscribers = JSON.parse(localStorage.getItem('iuvene_subscribers') || '[]');
                subscribers.push({
                    email: email,
                    date: new Date().toISOString(),
                    timestamp: Date.now()
                });
                localStorage.setItem('iuvene_subscribers', JSON.stringify(subscribers));
                
                resolve();
            }, 1500);
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
    
    // Function to get all subscribers (you can call this in browser console)
    window.getNewsletterSubscribers = function() {
        const subscribers = JSON.parse(localStorage.getItem('iuvene_subscribers') || '[]');
        console.table(subscribers);
        return subscribers;
    };
    
    // Function to export subscribers as CSV
    window.exportNewsletterSubscribers = function() {
        const subscribers = JSON.parse(localStorage.getItem('iuvene_subscribers') || '[]');
        if (subscribers.length === 0) {
            console.log('No hay suscriptores para exportar');
            return;
        }
        
        const csvContent = 'data:text/csv;charset=utf-8,' 
            + 'Email,Fecha\n'
            + subscribers.map(sub => `${sub.email},${new Date(sub.date).toLocaleDateString()}`).join('\n');
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'iuvene_newsletter_subscribers.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
});
