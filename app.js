// Steganalysis Application JavaScript
class StegAnalyzer {
    constructor() {
        this.results = [];
        this.isAnalyzing = false;
        this.currentProgress = 0;
        
        this.embeddingMethods = [
            { name: "LSB Replacement", detectability: "High", signature: "lsb_replacement" },
            { name: "LSB Matching", detectability: "Medium", signature: "lsb_matching" },
            { name: "F5", detectability: "Medium", signature: "f5" },
            { name: "Steghide", detectability: "Low-Medium", signature: "steghide" },
            { name: "HUGO", detectability: "Low", signature: "hugo" },
            { name: "DCT-based", detectability: "Medium", signature: "dct_based" }
        ];
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // File upload handling
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        const uploadButton = document.getElementById('uploadButton');
        
        // Upload button click - directly trigger file input
        if (uploadButton && fileInput) {
        uploadButton.addEventListener('click', (e) => {
        e.preventDefault();
        console.log("Choose Files clicked → triggering file input");
        fileInput.click();
    });
}

        
        // Upload zone click (but avoid double-clicking on button)
        if (uploadZone && fileInput) {
            uploadZone.addEventListener('click', (e) => {
                // Only trigger if not clicking the button directly
                if (e.target !== uploadButton && !uploadButton.contains(e.target)) {
                    e.preventDefault();
                    fileInput.click();
                }
            });
        }
        
        // File input change event
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                    this.processFiles(files);
                }
                // Clear the input for re-selection
                e.target.value = '';
            });
        }
        
        // Drag and drop events
        if (uploadZone) {
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.add('dragover');
            });
            
            uploadZone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!uploadZone.contains(e.relatedTarget)) {
                    uploadZone.classList.remove('dragover');
                }
            });
            
            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                e.stopPropagation();
                uploadZone.classList.remove('dragover');
                const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
                if (files.length > 0) {
                    this.processFiles(files);
                }
            });
        }
        
        // Modal handling - Fixed implementation
        this.setupModal();
        
        // Results actions
        const exportBtn = document.getElementById('exportBtn');
        const clearBtn = document.getElementById('clearBtn');
        
        if (exportBtn) {
            exportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportResults();
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearResults();
            });
        }
    }
    
    setupModal() {
        const helpBtn = document.getElementById('helpBtn');
        const helpModal = document.getElementById('helpModal');
        const closeModal = document.getElementById('closeModal');
        const modalOverlay = document.getElementById('modalOverlay');
        
        console.log('Setting up modal...', { helpBtn, helpModal, closeModal, modalOverlay });
        
        if (helpBtn && helpModal) {
            helpBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Help button clicked, showing modal');
                helpModal.classList.remove('hidden');
                helpModal.style.display = 'flex';
            });
        }
        
        if (closeModal && helpModal) {
            closeModal.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button clicked, hiding modal');
                helpModal.classList.add('hidden');
                helpModal.style.display = 'none';
            });
        }
        
        if (modalOverlay && helpModal) {
            modalOverlay.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Modal overlay clicked, hiding modal');
                helpModal.classList.add('hidden');
                helpModal.style.display = 'none';
            });
        }
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && helpModal && !helpModal.classList.contains('hidden')) {
                console.log('Escape pressed, hiding modal');
                helpModal.classList.add('hidden');
                helpModal.style.display = 'none';
            }
        });
    }
    
    async processFiles(files) {
        if (this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        this.showAnalysisPanel();
        
        const totalFiles = files.length;
        let processedFiles = 0;
        
        for (const file of files) {
            try {
                const result = await this.analyzeImage(file);
                this.results.push(result);
                processedFiles++;
                
                this.updateProgress((processedFiles / totalFiles) * 100);
                this.updateResultsDisplay();
                
                // Add small delay to show progress
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.error('Error analyzing file:', file.name, error);
                processedFiles++;
                this.updateProgress((processedFiles / totalFiles) * 100);
            }
        }
        
        this.isAnalyzing = false;
        this.hideAnalysisPanel();
        this.updateBatchSummary();
    }
    
    async analyzeImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const pixels = imageData.data;
                        
                        // Perform steganalysis
                        const analysisResults = this.performSteganalysis(pixels, img.width, img.height);
                        
                        // Create thumbnail
                        const thumbnailCanvas = document.createElement('canvas');
                        const thumbnailCtx = thumbnailCanvas.getContext('2d');
                        thumbnailCanvas.width = 60;
                        thumbnailCanvas.height = 60;
                        thumbnailCtx.drawImage(img, 0, 0, 60, 60);
                        
                        const result = {
                            id: Date.now() + Math.random(),
                            filename: file.name,
                            fileSize: file.size,
                            dimensions: `${img.width}x${img.height}`,
                            thumbnail: thumbnailCanvas.toDataURL(),
                            ...analysisResults,
                            timestamp: new Date().toISOString()
                        };
                        
                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }
    
    performSteganalysis(pixels, width, height) {
        // Chi-Square Test
        const chiSquareResult = this.chiSquareTest(pixels);
        
        // RS Analysis
        const rsResult = this.rsAnalysis(pixels, width, height);
        
        // Histogram Analysis
        const histogramResult = this.histogramAnalysis(pixels);
        
        // Pattern Recognition
        const patternResult = this.patternRecognition(pixels);
        
        // Pairs of Values Analysis
        const pairsResult = this.pairsOfValuesAnalysis(pixels);
        
        // Calculate overall confidence
        const confidence = this.calculateOverallConfidence([
            chiSquareResult,
            rsResult,
            histogramResult,
            patternResult,
            pairsResult
        ]);
        
        // Determine status
        let status, detectedMethod = null;
        if (confidence >= 70) {
            status = 'detected';
            detectedMethod = this.identifyEmbeddingMethod([
                chiSquareResult,
                rsResult,
                histogramResult,
                patternResult
            ]);
        } else if (confidence >= 30) {
            status = 'suspicious';
        } else {
            status = 'clean';
        }
        
        return {
            status,
            confidence,
            detectedMethod,
            details: {
                chiSquare: chiSquareResult,
                rsAnalysis: rsResult,
                histogram: histogramResult,
                patternRecognition: patternResult,
                pairsOfValues: pairsResult
            }
        };
    }
    
    chiSquareTest(pixels) {
        const pairs = {};
        let totalPairs = 0;
        
        // Count pairs of values (LSB analysis)
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            
            // Create pairs for each channel
            [r, g, b].forEach(value => {
                const pair = Math.floor(value / 2) * 2;
                if (!pairs[pair]) pairs[pair] = { even: 0, odd: 0 };
                if (value % 2 === 0) pairs[pair].even++;
                else pairs[pair].odd++;
                totalPairs++;
            });
        }
        
        // Calculate chi-square statistic
        let chiSquare = 0;
        let validPairs = 0;
        
        Object.values(pairs).forEach(pair => {
            if (pair.even + pair.odd > 5) { // Minimum sample size
                const expected = (pair.even + pair.odd) / 2;
                if (expected > 0) {
                    chiSquare += Math.pow(pair.even - expected, 2) / expected;
                    chiSquare += Math.pow(pair.odd - expected, 2) / expected;
                    validPairs++;
                }
            }
        });
        
        // Normalize chi-square value
        if (validPairs > 0) {
            chiSquare = chiSquare / validPairs;
        }
        
        // Convert to confidence score (higher chi-square = more suspicious)
        const confidence = Math.min(100, Math.max(0, (chiSquare - 0.5) * 50));
        
        return {
            method: 'Chi-Square Test',
            score: chiSquare.toFixed(2),
            confidence: confidence.toFixed(1),
            description: confidence > 50 ? 'Anomalous LSB distribution detected' : 'Normal LSB distribution'
        };
    }
    
    rsAnalysis(pixels, width, height) {
        let regularGroups = 0;
        let singularGroups = 0;
        const groupSize = 4;
        
        // Analyze pixel groups
        for (let y = 0; y < height - groupSize + 1; y += groupSize) {
            for (let x = 0; x < width - groupSize + 1; x += groupSize) {
                const group = [];
                for (let dy = 0; dy < groupSize; dy++) {
                    for (let dx = 0; dx < groupSize; dx++) {
                        const idx = ((y + dy) * width + (x + dx)) * 4;
                        if (idx < pixels.length) {
                            group.push(pixels[idx]); // Red channel
                        }
                    }
                }
                
                if (group.length >= 4) {
                    const variance = this.calculateVariance(group);
                    if (variance < 50) singularGroups++;
                    else regularGroups++;
                }
            }
        }
        
        const total = regularGroups + singularGroups;
        const rsRatio = total > 0 ? regularGroups / total : 0.5;
        
        // Expected ratio for clean images is around 0.5-0.7
        const deviation = Math.abs(rsRatio - 0.6);
        const confidence = Math.min(100, deviation * 150);
        
        return {
            method: 'RS Analysis',
            regularGroups,
            singularGroups,
            ratio: rsRatio.toFixed(3),
            confidence: confidence.toFixed(1),
            description: confidence > 50 ? 'Suspicious RS ratio detected' : 'Normal RS ratio'
        };
    }
    
    histogramAnalysis(pixels) {
        const channelHistograms = {
            red: new Array(256).fill(0),
            green: new Array(256).fill(0),
            blue: new Array(256).fill(0)
        };
        
        // Build histograms
        for (let i = 0; i < pixels.length; i += 4) {
            channelHistograms.red[pixels[i]]++;
            channelHistograms.green[pixels[i + 1]]++;
            channelHistograms.blue[pixels[i + 2]]++;
        }
        
        // Analyze for anomalies
        let anomalies = 0;
        const channels = ['red', 'green', 'blue'];
        
        channels.forEach(channel => {
            const hist = channelHistograms[channel];
            for (let i = 0; i < 254; i += 2) {
                const diff = Math.abs(hist[i] - hist[i + 1]);
                const avg = (hist[i] + hist[i + 1]) / 2;
                if (avg > 5 && diff / avg > 0.5) {
                    anomalies++;
                }
            }
        });
        
        const maxAnomalies = 127 * 3; // 127 pairs * 3 channels
        const confidence = Math.min(100, (anomalies / maxAnomalies) * 200);
        
        return {
            method: 'Histogram Analysis',
            anomalies,
            confidence: confidence.toFixed(1),
            description: confidence > 40 ? 'Histogram anomalies detected' : 'Normal histogram distribution'
        };
    }
    
    patternRecognition(pixels) {
        const patterns = {
            lsb_replacement: 0,
            lsb_matching: 0,
            f5: 0,
            steghide: 0,
            hugo: 0,
            dct_based: 0
        };
        
        // Analyze LSB patterns
        let sequentialLSB = 0;
        let randomLSB = 0;
        let evenOddPairs = 0;
        
        for (let i = 0; i < pixels.length - 8; i += 4) {
            const r1 = pixels[i] & 1;
            const r2 = pixels[i + 4] & 1;
            
            if (r1 === r2) sequentialLSB++;
            else randomLSB++;
            
            if (Math.abs((pixels[i] & 1) - (pixels[i + 1] & 1)) === 1) {
                evenOddPairs++;
            }
        }
        
        const total = sequentialLSB + randomLSB;
        if (total > 0) {
            const sequentialRatio = sequentialLSB / total;
            
            // Pattern scoring based on LSB characteristics
            if (sequentialRatio > 0.8) {
                patterns.lsb_replacement = 70;
            } else if (sequentialRatio < 0.2) {
                patterns.lsb_matching = 50;
            }
            
            if (evenOddPairs / (total * 0.25) > 1.5) {
                patterns.f5 = 45;
            }
            
            // Moderate randomness suggests adaptive methods
            if (sequentialRatio > 0.3 && sequentialRatio < 0.7) {
                patterns.steghide = 30;
                patterns.hugo = 25;
                patterns.dct_based = 35;
            }
        }
        
        const maxPattern = Object.keys(patterns).reduce((a, b) => patterns[a] > patterns[b] ? a : b);
        const confidence = patterns[maxPattern];
        
        return {
            method: 'Pattern Recognition',
            patterns,
            detectedPattern: maxPattern,
            confidence: confidence.toFixed(1),
            description: confidence > 30 ? `${maxPattern.replace('_', ' ')} pattern detected` : 'No specific pattern detected'
        };
    }
    
    pairsOfValuesAnalysis(pixels) {
        const pairs = {};
        let totalPixels = 0;
        
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            
            [r, g, b].forEach(value => {
                const pair = Math.floor(value / 2);
                if (!pairs[pair]) pairs[pair] = 0;
                pairs[pair]++;
                totalPixels++;
            });
        }
        
        // Calculate expected vs actual distribution
        let deviation = 0;
        const pairCount = Object.keys(pairs).length;
        if (pairCount > 0) {
            const expected = totalPixels / pairCount;
            Object.values(pairs).forEach(count => {
                deviation += Math.abs(count - expected) / expected;
            });
            deviation = deviation / pairCount;
        }
        
        const confidence = Math.min(100, deviation * 25);
        
        return {
            method: 'Pairs of Values',
            totalPairs: pairCount,
            deviation: deviation.toFixed(2),
            confidence: confidence.toFixed(1),
            description: confidence > 40 ? 'Unusual pair distribution detected' : 'Normal pair distribution'
        };
    }
    
    calculateVariance(values) {
        if (values.length === 0) return 0;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return variance;
    }
    
    calculateOverallConfidence(results) {
        const weights = {
            'Chi-Square Test': 0.3,
            'RS Analysis': 0.25,
            'Histogram Analysis': 0.2,
            'Pattern Recognition': 0.15,
            'Pairs of Values': 0.1
        };
        
        let weightedSum = 0;
        let totalWeight = 0;
        
        results.forEach(result => {
            const weight = weights[result.method] || 0.1;
            weightedSum += parseFloat(result.confidence) * weight;
            totalWeight += weight;
        });
        
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
    
    identifyEmbeddingMethod(results) {
        const patternResult = results.find(r => r.method === 'Pattern Recognition');
        if (patternResult && parseFloat(patternResult.confidence) > 30) {
            const methodName = patternResult.detectedPattern.replace('_', ' ').toUpperCase();
            return methodName;
        }
        
        const chiResult = results.find(r => r.method === 'Chi-Square Test');
        if (chiResult && parseFloat(chiResult.confidence) > 60) {
            return 'LSB REPLACEMENT';
        }
        
        return 'UNKNOWN METHOD';
    }
    
    showAnalysisPanel() {
        const panel = document.getElementById('analysisPanel');
        if (panel) {
            panel.style.display = 'block';
            panel.classList.add('fade-in');
        }
    }
    
    hideAnalysisPanel() {
        const panel = document.getElementById('analysisPanel');
        if (panel) {
            setTimeout(() => {
                panel.style.display = 'none';
                panel.classList.remove('fade-in');
            }, 1000);
        }
    }
    
    updateProgress(progress) {
        this.currentProgress = progress;
        const progressBar = document.getElementById('progressBarFill');
        const progressText = document.getElementById('progressText');
        
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${Math.round(progress)}%`;
    }
    
    updateResultsDisplay() {
        const resultsSection = document.getElementById('resultsSection');
        const resultsGrid = document.getElementById('resultsGrid');
        
        if (resultsSection && resultsGrid) {
            resultsSection.style.display = 'block';
            resultsSection.classList.add('slide-up');
            
            // Clear existing results
            resultsGrid.innerHTML = '';
            
            // Add each result
            this.results.forEach(result => {
                const resultCard = this.createResultCard(result);
                resultsGrid.appendChild(resultCard);
            });
        }
    }
    
    createResultCard(result) {
        const card = document.createElement('div');
        card.className = `result-card result-card--${result.status}`;
        
        const statusIcon = {
            clean: 'fas fa-check-circle status-icon--clean',
            suspicious: 'fas fa-exclamation-triangle status-icon--suspicious', 
            detected: 'fas fa-times-circle status-icon--detected'
        };
        
        const confidenceClass = result.confidence >= 70 ? 'high' : result.confidence >= 30 ? 'medium' : 'low';
        
        card.innerHTML = `
            <div class="result-header">
                <img src="${result.thumbnail}" alt="Thumbnail" class="result-thumbnail">
                <div class="result-info">
                    <h4 class="result-filename">${result.filename}</h4>
                    <div class="result-status">
                        <i class="${statusIcon[result.status]} status-icon"></i>
                        <span>${result.status.charAt(0).toUpperCase() + result.status.slice(1)}</span>
                        ${result.detectedMethod ? `<span class="method-tag">${result.detectedMethod}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="result-body">
                <div class="confidence-section">
                    <div class="confidence-label">Detection Confidence</div>
                    <div class="confidence-bar">
                        <div class="confidence-fill confidence-fill--${confidenceClass}" style="width: ${result.confidence}%"></div>
                    </div>
                    <div class="confidence-value">${result.confidence.toFixed(1)}%</div>
                </div>
                
                <div class="analysis-details">
                    <button class="detail-toggle" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'; this.querySelector('i').style.transform = this.nextElementSibling.style.display === 'none' ? 'rotate(0deg)' : 'rotate(180deg)';">
                        <i class="fas fa-chevron-down" style="transition: transform 0.3s ease;"></i>
                        View Analysis Details
                    </button>
                    <div class="detail-content" style="display: none;">
                        <div class="detail-item">
                            <span class="detail-label">File Size:</span>
                            <span class="detail-value">${this.formatFileSize(result.fileSize)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Dimensions:</span>
                            <span class="detail-value">${result.dimensions}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Chi-Square Score:</span>
                            <span class="detail-value">${result.details.chiSquare.score}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">RS Ratio:</span>
                            <span class="detail-value">${result.details.rsAnalysis.ratio}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Histogram Anomalies:</span>
                            <span class="detail-value">${result.details.histogram.anomalies}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return card;
    }
    
    updateBatchSummary() {
        if (this.results.length <= 1) return;
        
        const batchSummary = document.getElementById('batchSummary');
        if (batchSummary) {
            batchSummary.style.display = 'block';
            
            const stats = this.results.reduce((acc, result) => {
                acc.total++;
                acc[result.status]++;
                return acc;
            }, { total: 0, clean: 0, suspicious: 0, detected: 0 });
            
            const elements = {
                totalImages: document.getElementById('totalImages'),
                cleanImages: document.getElementById('cleanImages'),
                suspiciousImages: document.getElementById('suspiciousImages'),
                detectedImages: document.getElementById('detectedImages')
            };
            
            if (elements.totalImages) elements.totalImages.textContent = stats.total;
            if (elements.cleanImages) elements.cleanImages.textContent = stats.clean;
            if (elements.suspiciousImages) elements.suspiciousImages.textContent = stats.suspicious;
            if (elements.detectedImages) elements.detectedImages.textContent = stats.detected;
        }
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    exportResults() {
        if (this.results.length === 0) {
            alert('No results to export');
            return;
        }
        
        const exportData = {
            timestamp: new Date().toISOString(),
            totalImages: this.results.length,
            summary: this.results.reduce((acc, result) => {
                acc[result.status] = (acc[result.status] || 0) + 1;
                return acc;
            }, {}),
            results: this.results.map(result => ({
                filename: result.filename,
                status: result.status,
                confidence: result.confidence,
                detectedMethod: result.detectedMethod,
                fileSize: result.fileSize,
                dimensions: result.dimensions,
                details: result.details
            }))
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `steganalysis_results_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    clearResults() {
        this.results = [];
        const resultsSection = document.getElementById('resultsSection');
        const batchSummary = document.getElementById('batchSummary');
        const fileInput = document.getElementById('fileInput');
        
        if (resultsSection) resultsSection.style.display = 'none';
        if (batchSummary) batchSummary.style.display = 'none';
        if (fileInput) fileInput.value = '';
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new StegAnalyzer();
});