// 初始化語音合成
let speechSynthesis = window.speechSynthesis;
let voices = [];
let currentVoice = null;
let isSpeaking = false;

// 初始化語音列表
function initVoices() {
    voices = speechSynthesis.getVoices();
    const voiceSelect = document.getElementById('voice');
    voiceSelect.innerHTML = '';
    
    // 過濾出中文和英文語音
    const filteredVoices = voices.filter(voice => 
        voice.lang.includes('zh') || voice.lang.includes('en')
    );
    
    filteredVoices.forEach(voice => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})`;
        voiceSelect.appendChild(option);
    });

    // 預設選擇女聲
    const femaleVoice = filteredVoices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('xiaoxiao')
    );
    if (femaleVoice) {
        voiceSelect.value = femaleVoice.name;
        currentVoice = femaleVoice;
    }
}

// 當語音列表加載完成時初始化
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = initVoices;
}

// 生成故事
async function generateNovel() {
    const prompt = document.getElementById('prompt').value.trim();
    if (!prompt) {
        alert('請輸入故事主題或關鍵詞');
        return;
    }

    const output = document.getElementById('output');
    output.textContent = '正在生成故事...';

    try {
        const response = await fetch('https://chat.cloudapi.vip/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-3xXfTusOxeB7iwaH7vUkK9OdUkIG2OeDD5RbPY4QlCXeryD7',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: '你是一個富有想像力的作家。請根據用戶提供的主題創作一個故事，故事應該生動有趣，富有畫面感，並能引發讀者的共鳴。'
                    },
                    {
                        role: 'user',
                        content: `請創作一個關於"${prompt}"的故事，字數在500-800字之間。`
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API請求失敗');
        }

        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
            output.textContent = data.choices[0].message.content;
        } else {
            throw new Error('API返回格式不正確');
        }
    } catch (error) {
        console.error('Error:', error);
        output.textContent = '生成故事時發生錯誤，請稍後再試。\n\n錯誤詳情：' + error.message;
        
        // 如果API調用失敗，顯示一個示例故事
        if (error.message.includes('API')) {
            output.textContent += '\n\n以下是示例故事：\n\n' +
                '在一個寧靜的夜晚，月光溫柔地灑在森林的小徑上。微風輕拂過樹葉，發出沙沙的聲響，就像是大自然在演奏著安眠曲。\n\n' +
                '一隻小兔子正蜷縮在溫暖的窩裡，聽著遠處傳來的溪水聲。它閉上眼睛，感受著這份寧靜。漸漸地，它的呼吸變得平穩，進入了甜美的夢鄉。\n\n' +
                '森林裡的動物們也都安靜下來，享受著這美好的夜晚。星星在天空中閃爍，守護著這片寧靜的土地。\n\n' +
                '願你也能像這片森林一樣，找到屬於自己的寧靜，進入甜美的夢鄉。';
        }
    }
}

// 複製文本
function copyText() {
    const output = document.getElementById('output');
    const text = output.textContent;
    
    if (text && text !== '正在生成故事...') {
        navigator.clipboard.writeText(text).then(() => {
            alert('故事已複製到剪貼簿');
        }).catch(err => {
            console.error('複製失敗:', err);
            alert('複製失敗，請手動複製');
        });
    }
}

// 切換TTS方式
function switchTTS(mode) {
    const browserTTS = document.getElementById('browser-tts');
    const ttsmakerTTS = document.getElementById('ttsmaker-tts');
    const buttons = document.querySelectorAll('.option-btn');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (mode === 'browser') {
        browserTTS.style.display = 'block';
        ttsmakerTTS.style.display = 'none';
    } else {
        browserTTS.style.display = 'none';
        ttsmakerTTS.style.display = 'block';
    }
}

// 更新語速顯示
document.getElementById('rate').addEventListener('input', function(e) {
    document.getElementById('rate-value').textContent = e.target.value;
});

// 更新音量顯示
document.getElementById('volume').addEventListener('input', function(e) {
    document.getElementById('volume-value').textContent = e.target.value;
});

// 朗讀文本
function speak() {
    const text = document.getElementById('output').textContent;
    if (!text || text === '正在生成故事...') {
        alert('請先生成故事');
        return;
    }

    if (isSpeaking) {
        stopSpeaking();
        return;
    }

    const voiceSelect = document.getElementById('voice');
    const rate = document.getElementById('rate').value;
    const volume = document.getElementById('volume').value;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voices.find(voice => voice.name === voiceSelect.value);
    utterance.rate = parseFloat(rate);
    utterance.volume = parseFloat(volume);
    utterance.lang = utterance.voice.lang;

    utterance.onstart = () => {
        isSpeaking = true;
        document.querySelector('button[onclick="speak()"]').textContent = '停止朗讀';
    };

    utterance.onend = () => {
        isSpeaking = false;
        document.querySelector('button[onclick="speak()"]').textContent = '開始朗讀';
    };

    speechSynthesis.speak(utterance);
}

// 停止朗讀
function stopSpeaking() {
    speechSynthesis.cancel();
    isSpeaking = false;
    document.querySelector('button[onclick="speak()"]').textContent = '開始朗讀';
}

// 轉換到TTSMaker
function convertToTTSMaker() {
    const text = document.getElementById('output').textContent;
    if (!text || text === '正在生成故事...') {
        alert('請先生成故事');
        return;
    }

    // 將文本編碼並跳轉到TTSMaker
    const encodedText = encodeURIComponent(text);
    window.open(`https://ttsmaker.com/zh-cn?text=${encodedText}`, '_blank');
}

// 雨聲音頻控制
const rainSound = document.getElementById('rainSound');
const rainSoundToggle = document.getElementById('rainSoundToggle');
let isRainSoundPlaying = false;

// 音頻錯誤處理
rainSound.addEventListener('error', function(e) {
    console.error('音頻加載錯誤:', e);
    alert('音頻文件加載失敗，請檢查文件路徑是否正確。');
});

// 更新雨聲音量
function updateRainVolume() {
    const volume = document.getElementById('rainVolume').value / 100;
    if (rainSound) {
        rainSound.volume = volume;
    }
}

// 切換雨聲
function toggleRainSound() {
    if (!rainSound) {
        console.error('找不到音頻元素');
        return;
    }

    try {
        if (isRainSoundPlaying) {
            rainSound.pause();
            document.getElementById('rainSoundToggle').classList.remove('active');
            document.getElementById('rainSoundToggle').querySelector('.text').textContent = '雨聲';
        } else {
            // 確保音頻從頭開始播放
            rainSound.currentTime = 0;
            const playPromise = rainSound.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    document.getElementById('rainSoundToggle').classList.add('active');
                    document.getElementById('rainSoundToggle').querySelector('.text').textContent = '關閉雨聲';
                }).catch(error => {
                    console.error('播放失敗:', error);
                    alert('音頻播放失敗，請檢查瀏覽器設置或嘗試刷新頁面。');
                });
            }
        }
        
        isRainSoundPlaying = !isRainSoundPlaying;
    } catch (error) {
        console.error('切換雨聲時發生錯誤:', error);
        alert('操作失敗，請刷新頁面重試。');
    }
}

// 初始化雨聲控制
document.getElementById('rainSoundToggle').addEventListener('click', toggleRainSound);
document.getElementById('rainVolume').addEventListener('input', updateRainVolume);

// 設置初始音量
updateRainVolume(); 