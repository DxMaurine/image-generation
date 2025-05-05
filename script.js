document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const promptInput = document.getElementById('prompt');
    const styleSelect = document.getElementById('style');
    const stepsInput = document.getElementById('steps');
    const stepsValue = document.getElementById('steps-value');
    const cfgScaleInput = document.getElementById('cfg-scale');
    const cfgValue = document.getElementById('cfg-value');
    const generateBtn = document.getElementById('generate-btn');
    const downloadBtn = document.getElementById('download-btn');
    const saveBtn = document.getElementById('save-btn');
    const imagePlaceholder = document.getElementById('image-placeholder');
    const historyGrid = document.getElementById('history-grid');
    const loadingModal = document.getElementById('loading-modal');
    
    // Current generated image data
    let currentImage = null;
    
    // Update slider values display
    stepsInput.addEventListener('input', () => {
        stepsValue.textContent = stepsInput.value;
    });
    
    cfgScaleInput.addEventListener('input', () => {
        cfgValue.textContent = cfgScaleInput.value;
    });
    
    // Load history from localStorage
    loadHistory();
    
    // Generate image button click handler
    generateBtn.addEventListener('click', generateImage);
    
    // Download button click handler
    downloadBtn.addEventListener('click', downloadImage);
    
    // Save to history button click handler
    saveBtn.addEventListener('click', saveToHistory);
    
    // Function to generate image using Pollinations API
    async function generateImage() {
        const prompt = promptInput.value.trim();
        if (!prompt) {
            alert('Please enter a prompt');
            return;
        }
        
        // Show loading modal
        loadingModal.classList.add('active');
        
        try {
            const style = styleSelect.value;
            const steps = stepsInput.value;
            const cfgScale = cfgScaleInput.value;
            
            // Construct the API URL with parameters
            const apiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&steps=${steps}&cfgScale=${cfgScale}&style=${style}`;
            
            // Fetch the image
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Failed to generate image');
            
            // Get the image blob
            const blob = await response.blob();
            const imageUrl = URL.createObjectURL(blob);
            
            // Display the image
            displayGeneratedImage(imageUrl, blob);
            
            // Store the current image data
            currentImage = {
                url: imageUrl,
                blob: blob,
                prompt: prompt,
                style: style,
                timestamp: new Date().toISOString()
            };
            
            // Enable download and save buttons
            downloadBtn.disabled = false;
            saveBtn.disabled = false;
            
        } catch (error) {
            console.error('Error generating image:', error);
            alert('Error generating image. Please try again.');
        } finally {
            // Hide loading modal
            loadingModal.classList.remove('active');
        }
    }
    
    // Function to display the generated image
    function displayGeneratedImage(imageUrl, blob) {
        // Clear previous image
        imagePlaceholder.innerHTML = '';
        
        // Create and append the new image
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Generated image';
        imagePlaceholder.appendChild(img);
        
        // Add some styling
        imagePlaceholder.style.border = 'none';
        imagePlaceholder.style.display = 'flex';
        imagePlaceholder.style.alignItems = 'center';
        imagePlaceholder.style.justifyContent = 'center';
    }
    
    // Function to download the generated image
    function downloadImage() {
        if (!currentImage) return;
        
        const a = document.createElement('a');
        a.href = currentImage.url;
        a.download = `ai-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    // Function to save the current image to history
    function saveToHistory() {
        if (!currentImage) return;
        
        // Get existing history from localStorage
        let history = JSON.parse(localStorage.getItem('aiImageHistory') || [];
        
        // Convert blob to base64 for storage
        const reader = new FileReader();
        reader.onload = function() {
            const imageData = {
                prompt: currentImage.prompt,
                style: currentImage.style,
                timestamp: currentImage.timestamp,
                imageData: reader.result
            };
            
            // Add to beginning of array (newest first)
            history.unshift(imageData);
            
            // Limit history to 50 items
            if (history.length > 50) {
                history = history.slice(0, 50);
            }
            
            // Save back to localStorage
            localStorage.setItem('aiImageHistory', JSON.stringify(history));
            
            // Reload history display
            loadHistory();
            
            // Show confirmation
            alert('Image saved to history!');
        };
        
        reader.readAsDataURL(currentImage.blob);
    }
    
    // Function to load and display history
    function loadHistory() {
        // Get history from localStorage
        const history = JSON.parse(localStorage.getItem('aiImageHistory') || '[]');
        
        // Clear current history display
        historyGrid.innerHTML = '';
        
        if (history.length === 0) {
            // Show empty state
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-history';
            emptyDiv.innerHTML = `
                <i class="fas fa-box-open"></i>
                <p>Your generated images will appear here</p>
            `;
            historyGrid.appendChild(emptyDiv);
            return;
        }
        
        // Add each history item to the grid
        history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <img src="${item.imageData}" alt="${item.prompt}">
                <button class="delete-btn" data-index="${index}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Add click event to view larger
            historyItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-btn')) {
                    viewHistoryItem(item);
                }
            });
            
            // Add delete button event
            const deleteBtn = historyItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteHistoryItem(index);
            });
            
            historyGrid.appendChild(historyItem);
        });
    }
    
    // Function to view a history item in the main display
    function viewHistoryItem(item) {
        // Display the image
        imagePlaceholder.innerHTML = `<img src="${item.imageData}" alt="${item.prompt}">`;
        imagePlaceholder.style.border = 'none';
        
        // Set the current image (for download)
        currentImage = {
            url: item.imageData,
            prompt: item.prompt
        };
        
        // Enable download button
        downloadBtn.disabled = false;
        saveBtn.disabled = true; // Can't save already saved image
        
        // Show prompt in input for reference
        promptInput.value = item.prompt;
    }
    
    // Function to delete a history item
    function deleteHistoryItem(index) {
        if (!confirm('Delete this image from history?')) return;
        
        // Get history from localStorage
        let history = JSON.parse(localStorage.getItem('aiImageHistory') || [];
        
        // Remove the item
        history.splice(index, 1);
        
        // Save back to localStorage
        localStorage.setItem('aiImageHistory', JSON.stringify(history));
        
        // Reload history display
        loadHistory();
    }
});