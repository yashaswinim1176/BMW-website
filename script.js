document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('animation-canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    const scrubSlider = document.getElementById('scrub-slider');
    const scrubValue = document.getElementById('scrub-value');
    const phaseDots = document.querySelectorAll('.phase-dot');

    const totalFrames = 80;
    const images = [];
    let loadedCount = 0;
    let targetProgress = 0;
    let currentProgress = 0;

    function getFrameFilename(index) {
        const paddedIndex = String(index).padStart(3, '0');
        return `frame_${paddedIndex}.jpg`;
    }

    function preloadImages() {
        for (let i = 0; i < totalFrames; i++) {
            const img = new Image();
            img.src = getFrameFilename(i);
            img.onload = () => {
                loadedCount++;
                if (i === 0 && currentProgress === 0) {
                    renderFrame(0);
                }
            };
            images.push(img);
        }
    }

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        renderFrame(currentProgress);
    }

    function renderFrame(progress) {
        if (images.length === 0) return;

        let frameIndex = Math.floor(progress * (totalFrames - 1));
        frameIndex = Math.max(0, Math.min(totalFrames - 1, frameIndex));

        let img = images[frameIndex];
        if (!img || !img.complete) {
            for (let i = frameIndex; i >= 0; i--) {
                if (images[i] && images[i].complete) {
                    img = images[i];
                    break;
                }
            }
        }

        if (!img || !img.complete) return;

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const imgWidth = img.naturalWidth || 1920;
        const imgHeight = img.naturalHeight || 1080;

        const imgRatio = imgWidth / imgHeight;
        const canvasRatio = canvasWidth / canvasHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasRatio > imgRatio) {
            drawWidth = canvasWidth;
            drawHeight = canvasWidth / imgRatio;
            offsetX = 0;
            offsetY = (canvasHeight - drawHeight) / 2;
        } else {
            drawHeight = canvasHeight;
            drawWidth = canvasHeight * imgRatio;
            offsetX = (canvasWidth - drawWidth) / 2;
            offsetY = 0;
        }

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

        const patchW = drawWidth * 0.15;
        const patchH = drawHeight * 0.18;
        const patchX = offsetX + drawWidth - patchW;
        const patchY = offsetY + drawHeight - patchH;

        ctx.fillStyle = '#000000';
        ctx.fillRect(patchX, patchY, patchW, patchH);
    }

    function lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    function calculateScrollProgress() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        return maxScroll > 0 ? Math.max(0, Math.min(1, scrollTop / maxScroll)) : 0;
    }

    function updateUI(progress) {
        const percentage = Math.round(progress * 100);
        
        if (scrubSlider && document.activeElement !== scrubSlider) {
            scrubSlider.value = Math.round(progress * 1000);
        }
        if (scrubValue) {
            scrubValue.textContent = `${percentage}%`;
        }

        phaseDots.forEach(dot => {
            const dotProgress = parseFloat(dot.getAttribute('data-progress'));
            if (Math.abs(progress - dotProgress) < 0.12) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function animate() {
        targetProgress = calculateScrollProgress();
        currentProgress = lerp(currentProgress, targetProgress, 0.09);

        renderFrame(currentProgress);
        updateUI(currentProgress);

        requestAnimationFrame(animate);
    }

    if (scrubSlider) {
        scrubSlider.addEventListener('input', (e) => {
            targetProgress = parseFloat(e.target.value) / 1000;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo(0, targetProgress * maxScroll);
        });
    }

    phaseDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const val = parseFloat(dot.getAttribute('data-progress'));
            targetProgress = val;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            window.scrollTo({
                top: val * maxScroll,
                behavior: 'smooth'
            });
        });
    });

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    preloadImages();
    requestAnimationFrame(animate);
});
