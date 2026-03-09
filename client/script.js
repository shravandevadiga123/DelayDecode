const API_URL = 'http://localhost:5004/api';

const delayForm = document.getElementById('delayForm');
const logTextInput = document.getElementById('logText');
const resultSection = document.getElementById('resultSection');
const loadingSection = document.getElementById('loadingSection');
const errorSection = document.getElementById('errorSection');
const inputSection = document.querySelector('.input-section');

/**
 * Handle form submission
 */
delayForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const logText = logTextInput.value.trim();

    if (!logText) {
        showError('Please enter a delay log');
        return;
    }

    await analyzeDelay(logText);
});

/**
 * Send delay log to backend for analysis
 */
async function analyzeDelay(logText) {
    try {
        // Show loading, hide others
        inputSection.style.display = 'none';
        resultSection.style.display = 'none';
        errorSection.style.display = 'none';
        loadingSection.style.display = 'block';

        const response = await fetch(`${API_URL}/explain`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ logText })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to analyze delay');
        }

        const data = await response.json();

        // Display results
        displayResults(data);
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'An error occurred while analyzing the delay');
    }
}

/**
 * Display analysis results
 */
function displayResults(data) {
    document.getElementById('customerMessage').textContent = data.customerMessage;
    document.getElementById('improvementSuggestion').textContent = data.improvementSuggestion;

    loadingSection.style.display = 'none';
    errorSection.style.display = 'none';
    resultSection.style.display = 'block';
}

/**
 * Show error message
 */
function showError(message) {
    document.getElementById('errorMessage').textContent = message;

    inputSection.style.display = 'block';
    resultSection.style.display = 'none';
    loadingSection.style.display = 'none';
    errorSection.style.display = 'block';
}

/**
 * Reset form and go back to input
 */
function resetForm() {
    logTextInput.value = '';
    inputSection.style.display = 'block';
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';
    loadingSection.style.display = 'none';
    logTextInput.focus();
}

// Focus on textarea on page load
window.addEventListener('load', () => {
    logTextInput.focus();
});
