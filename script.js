document.addEventListener('DOMContentLoaded', () => {
    const audioFileInput = document.getElementById('audio-file');
    const playerContainer = document.getElementById('player-container');
    const audioPlayer = document.getElementById('audio-player');
    const markStartBtn = document.getElementById('mark-start');
    const markEndBtn = document.getElementById('mark-end');
    const startTimeDisplay = document.getElementById('start-time-display');
    const markersList = document.getElementById('markers-list');

    let currentStartTime = null;
    let markers = [];
    let markerIdCounter = 0;
    let timeUpdateListener = null;

    // --- 默认加载测试音频 ---
    const defaultAudioPath = './englishaudio.mp3';
    fetch(defaultAudioPath)
        .then(response => {
            if (!response.ok) {
                throw new Error('测试音频文件加载失败。');
            }
            return response.blob();
        })
        .then(blob => {
            const audioUrl = URL.createObjectURL(blob);
            audioPlayer.src = audioUrl;
            playerContainer.classList.remove('hidden');
            console.log('测试音频加载成功。');
        })
        .catch(error => {
            console.warn(error.message, '请手动上传音频文件。');
        });

    // --- 事件监听 ---

    audioFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const audioUrl = URL.createObjectURL(file);
            audioPlayer.src = audioUrl;
            playerContainer.classList.remove('hidden');
            // 清空之前的标记
            markers = [];
            renderMarkers();
        }
    });

    markStartBtn.addEventListener('click', () => {
        if (currentStartTime === null) {
            // 标记开始
            currentStartTime = audioPlayer.currentTime;
            startTimeDisplay.textContent = currentStartTime.toFixed(2) + 's';
            markStartBtn.textContent = '取消标记';
            markStartBtn.classList.add('is-marking');
        } else {
            // 取消标记
            currentStartTime = null;
            startTimeDisplay.textContent = '0.00s';
            markStartBtn.textContent = '标记开始';
            markStartBtn.classList.remove('is-marking');
        }
    });

    markEndBtn.addEventListener('click', () => {
        const endTime = audioPlayer.currentTime;
        if (currentStartTime !== null && endTime > currentStartTime) {
            markerIdCounter++;
            const newMarker = {
                id: markerIdCounter,
                start: currentStartTime,
                end: endTime
            };
            markers.push(newMarker);
            renderMarkers();

            // 重置标记状态
            currentStartTime = null;
            startTimeDisplay.textContent = '0.00s';
            markStartBtn.textContent = '标记开始';
            markStartBtn.classList.remove('is-marking');
        } else {
            alert('请先标记一个有效的开始时间，并且结束时间必须大于开始时间。');
        }
    });

    markersList.addEventListener('click', (event) => {
        const target = event.target;
        const markerId = target.closest('li')?.dataset.id;

        if (!markerId) return;

        if (target.classList.contains('play-marker') || target.parentElement.classList.contains('play-marker')) {
            playMarker(parseInt(markerId, 10));
        } else if (target.classList.contains('delete-marker') || target.parentElement.classList.contains('delete-marker')) {
            deleteMarker(parseInt(markerId, 10));
        }
    });

    // --- 功能函数 ---

    function renderMarkers() {
        markersList.innerHTML = '';
        markers.forEach(marker => {
            const li = document.createElement('li');
            li.dataset.id = marker.id;
            li.innerHTML = `
                <span class="marker-time">${marker.start.toFixed(2)}s - ${marker.end.toFixed(2)}s</span>
                <div class="marker-controls">
                    <button class="play-marker" title="播放此段">▶️</button>
                    <button class="delete-marker" title="删除此段">🗑️</button>
                </div>
            `;
            markersList.appendChild(li);
        });
    }

    function playMarker(id) {
        const marker = markers.find(m => m.id === id);
        if (!marker) return;

        // 移除之前的监听器，以防万一
        if (timeUpdateListener) {
            audioPlayer.removeEventListener('timeupdate', timeUpdateListener);
        }

        audioPlayer.currentTime = marker.start;
        audioPlayer.play();

        timeUpdateListener = () => {
            if (audioPlayer.currentTime >= marker.end) {
                audioPlayer.pause();
                // 播放结束后移除监听器，避免不必要的计算
                audioPlayer.removeEventListener('timeupdate', timeUpdateListener);
                timeUpdateListener = null;
            }
        };

        audioPlayer.addEventListener('timeupdate', timeUpdateListener);
    }

    function deleteMarker(id) {
        markers = markers.filter(m => m.id !== id);
        renderMarkers();
    }
});
