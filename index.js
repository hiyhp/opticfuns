/* =========================================
   ⚙️ 自动化配置区 (请务必修改这里)
========================================= */
const config = {
    githubUsername: "hiyhp",      // 你的 GitHub 用户名
    githubRepo: "MyWeb",      // 你的仓库名 (是 opticfuns 还是 hiyhp.github.io？请确认)
    folderPath: "Music"           // 音乐文件夹名字
};

/* =========================================
   🎵 全局变量
========================================= */
let songs = []; // 歌曲列表将通过 API 自动填充
let currentSongIndex = 0;
let lyricsData = [];

/* DOM 元素获取 */
const audio = document.getElementById('audio-element');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const songTitle = document.getElementById('song-title');
const songArtist = document.getElementById('song-artist');
const lyricsList = document.querySelector('.lyrics-list');
const lyricsTitle = document.getElementById('lyrics-title');

/* =========================================
   🚀 核心：自动扫描 GitHub 文件夹
========================================= */
async function initMusicPlayer() {
    // 1. 显示加载状态
    songTitle.innerText = "正在扫描歌曲...";
    songArtist.innerText = "连接 GitHub...";
    
    try {
        // 2. 请求 GitHub API 获取文件列表
        const apiUrl = `https://api.github.com/repos/${config.githubUsername}/${config.githubRepo}/contents/${config.folderPath}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`GitHub API 限制或仓库名错误 (代码: ${response.status})`);
        }

        const files = await response.json();

        // 3. 筛选出 mp3 文件
        const mp3Files = files.filter(file => file.name.endsWith('.mp3'));
        
        if (mp3Files.length === 0) {
            songTitle.innerText = "未找到音乐";
            return;
        }

        // 4. 自动构建歌曲列表
        songs = mp3Files.map(file => {
            // 解析文件名：假设格式为 "歌手 - 歌名.mp3"
            const fileName = file.name.replace('.mp3', '');
            const parts = fileName.split('-'); // 按横杠分割
            
            let artist = "未知歌手";
            let title = fileName;

            // 如果文件名里有横杠，就尝试提取歌手和歌名
            if (parts.length >= 2) {
                artist = parts[0].trim();
                title = parts[1].trim();
            }

            // 自动推测 lrc 地址 (假设 lrc 文件名和 mp3 一样)
            const lrcName = file.name.replace('.mp3', '.lrc');
            
            return {
                title: title,
                artist: artist,
                // 使用相对路径，比 API 链接更稳定
                src: `./${config.folderPath}/${file.name}`,
                lrc: `./${config.folderPath}/${lrcName}`
            };
        });

        console.log("成功加载歌曲:", songs);

        // 5. 列表构建完成，开始加载第一首
        loadSong(songs[0]);

    } catch (error) {
        console.error(error);
        songTitle.innerText = "加载失败";
        songArtist.innerText = "请检查 index.js 配置";
        alert("无法自动获取歌曲列表，可能是仓库名填错了，或者 API 超限。\n请按 F12 查看控制台报错。");
    }
}

// 启动程序
initMusicPlayer();

/* =========================================
   以下是标准的播放器逻辑 (无需改动)
========================================= */

// 加载歌曲
function loadSong(song) {
    songTitle.innerText = song.title;
    songArtist.innerText = song.artist;
    lyricsTitle.innerText = song.title;
    audio.src = song.src;

    // 尝试加载歌词
    fetchLyrics(song.lrc);
}

// 读取 LRC 文件
async function fetchLyrics(url) {
    lyricsList.innerHTML = '<li class="loading">歌词加载中...</li>';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("无歌词");
        const text = await response.text();
        lyricsData = parseLRC(text);
        renderLyrics(lyricsData);
    } catch (error) {
        lyricsList.innerHTML = '<li>暂无歌词 / 纯音乐</li>';
        lyricsData = [];
    }
}

// 解析 LRC
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

// 渲染歌词
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

/* 播放控制 */
function updatePlayBtn() {
    if (audio.paused) {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    } else {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    }
}

function togglePlay() {
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
    updatePlayBtn();
}

function prevSong() {
    currentSongIndex--;
    if (currentSongIndex < 0) currentSongIndex = songs.length - 1;
    loadSong(songs[currentSongIndex]);
    audio.play();
    updatePlayBtn();
}

function nextSong() {
    currentSongIndex++;
    if (currentSongIndex > songs.length - 1) currentSongIndex = 0;
    loadSong(songs[currentSongIndex]);
    audio.play();
    updatePlayBtn();
}

playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);
audio.addEventListener('ended', nextSong);

/* 进度与歌词同步 */
audio.addEventListener('timeupdate', () => {
    const { duration, currentTime } = audio;
    if (duration) {
        const percent = (currentTime / duration) * 100;
        progressBar.style.width = `${percent}%`;
    }
    syncLyrics(currentTime);
});

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

progressContainer.addEventListener('click', (e) => {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
});