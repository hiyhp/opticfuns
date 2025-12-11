/* =========================================
   🎵 核心逻辑配置区
========================================= */
const songs = [
    {
        title: "Liekkas",
        artist: "Sofia Jannok",
        // 音乐文件路径
        src: "./Music/Sofia Jannok - Liekkas.mp3",
        // 歌词文件路径
        lrc: "./Music/Sofia Jannok - Liekkas.lrc"
    },
    {
        title: "无言感激",
        artist: "谭咏麟",
        // 音乐文件路径
        src: "./Music/谭咏麟 - 无言感激.mp3",
        // 歌词文件路径
        lrc: "./Music/谭咏麟 - 无言感激.lrc"
    },
    {
        title: "追梦赤子心",
        artist: "GALA",
        // 音乐文件路径
        src: "./Music/GALA - 追梦赤子心.mp3",
        // 歌词文件路径
        lrc: "./Music/GALA - 追梦赤子心.lrc"
    },
    // 将来可以在这里复制上面的格式添加第二首...
];

// 当前播放的歌曲索引
let currentSongIndex = 0;
let lyricsData = [];

/* =========================================
   🏗️ DOM 元素获取
========================================= */
const audio = document.getElementById('audio-element');
const playBtn = document.getElementById('play-btn');
// ✨ 获取新按钮
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');
const lyricsList = document.querySelector('.lyrics-list');
const lyricsTitle = document.getElementById('lyrics-title');

/* =========================================
   🚀 初始化
========================================= */
loadSong(songs[currentSongIndex]);

function loadSong(song) {
    songTitle.innerText = song.title;
    songArtist.innerText = song.artist;
    lyricsTitle.innerText = song.title;
    audio.src = song.src;

    // 加载歌词
    if (song.lrc) {
        fetchLyrics(song.lrc);
    } else {
        lyricsList.innerHTML = '<li>暂无歌词</li>';
        lyricsData = [];
    }
}

// 读取 LRC 文件 (保持不变)
async function fetchLyrics(url) {
    lyricsList.innerHTML = '<li class="loading">正在加载歌词...</li>';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("歌词文件丢失");
        const text = await response.text();
        lyricsData = parseLRC(text);
        renderLyrics(lyricsData);
    } catch (error) {
        console.error(error);
        lyricsList.innerHTML = '<li>暂无歌词 / 纯音乐</li>';
        lyricsData = [];
    }
}

// 解析 LRC (保持不变)
function parseLRC(lrcString) {
    const lines = lrcString.split('\n');
    const result = [];
    lines.forEach(line => {
        const parts = line.split(']');
        const timeStr = parts[0].substring(1);
        const text = parts[1];
        if (timeStr && text) {
            const timeParts = timeStr.split(':');
            const min = parseInt(timeParts[0]);
            const sec = parseFloat(timeParts[1]);
            const time = min * 60 + sec;
            result.push({ time, text: text.trim() });
        }
    });
    return result;
}

// 渲染歌词 (保持不变)
function renderLyrics(data) {
    lyricsList.innerHTML = '';
    const placeholderTop = document.createElement('li');
    placeholderTop.style.height = '50%';
    lyricsList.appendChild(placeholderTop);

    data.forEach((line, index) => {
        const li = document.createElement('li');
        li.innerText = line.text;
        li.dataset.index = index;
        lyricsList.appendChild(li);
    });

    const placeholderBottom = document.createElement('li');
    placeholderBottom.style.height = '50%';
    lyricsList.appendChild(placeholderBottom);
}

/* =========================================
   🎛️ 播放控制与切歌逻辑 (核心更新)
========================================= */

// 播放/暂停
function togglePlay() {
    if (audio.paused) {
        audio.play();
        playBtn.innerText = '❚❚';
    } else {
        audio.pause();
        playBtn.innerText = '▶';
    }
}
playBtn.addEventListener('click', togglePlay);

// ✨ 上一曲逻辑
function prevSong() {
    currentSongIndex--;
    // 如果小于0，跳到最后一首
    if (currentSongIndex < 0) {
        currentSongIndex = songs.length - 1;
    }
    loadSong(songs[currentSongIndex]);
    playMusic(); // 切歌后自动播放
}

// ✨ 下一曲逻辑
function nextSong() {
    currentSongIndex++;
    // 如果超过数组长度，跳回第一首
    if (currentSongIndex > songs.length - 1) {
        currentSongIndex = 0;
    }
    loadSong(songs[currentSongIndex]);
    playMusic(); // 切歌后自动播放
}

// 辅助函数：切歌后强制播放
function playMusic() {
    audio.play();
    playBtn.innerText = '❚❚';
}

// 绑定点击事件
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

// 进度更新与歌词同步 (保持不变)
audio.addEventListener('timeupdate', () => {
    const { duration, currentTime } = audio;
    if (duration) {
        const percent = (currentTime / duration) * 100;
        progressBar.style.width = `${percent}%`;
    }
    syncLyrics(currentTime);
});

// 歌词同步 (保持不变)
function syncLyrics(currentTime) {
    if (lyricsData.length === 0) return;
    let activeIndex = -1;
    for (let i = 0; i < lyricsData.length; i++) {
        if (currentTime >= lyricsData[i].time) {
            activeIndex = i;
        } else {
            break;
        }
    }
    const activeLi = lyricsList.querySelectorAll('li[data-index]')[activeIndex];
    if (activeLi && !activeLi.classList.contains('active')) {
        const prevActive = lyricsList.querySelector('.active');
        if (prevActive) prevActive.classList.remove('active');
        activeLi.classList.add('active');
        activeLi.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// 点击进度条 (保持不变)
progressContainer.addEventListener('click', (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
});

// ✨ 播放结束自动下一首
audio.addEventListener('ended', nextSong);