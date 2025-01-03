// 检测浏览器是否支持 speechSynthesis API
function checkSpeechSynthesisSupport() {
    return 'speechSynthesis' in window;
}

// 动态加载自定义选项
function loadCustomOptions() {
    const voiceSelect = document.getElementById('voice');
    const customVoices = [
        { value: "Chinese Male", text: "中文男声", lang: "zh-CN", isLocal: false },
        { value: "Chinese Female", text: "中文女声", lang: "zh-CN", isLocal: false },
        { value: "UK English Male", text: "英文男声", lang: "en-GB", isLocal: false },
        { value: "UK English Female", text: "英文女声", lang: "en-GB", isLocal: false }
    ];

    customVoices.forEach((voice, index) => {
        // 检查是否已经有相同 value 的选项
        const existingOption = Array.from(voiceSelect.options).find(option => option.value === voice.value);
        if (!existingOption){
            const option = document.createElement('option');
            option.value = voice.value;
            option.textContent = voice.text;
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('is-local', voice.isLocal);
            voiceSelect.appendChild(option);
        }

    });
    // 默认选中第一个 data-lang 为 en 开头的选项
    setDefaultVoice(voiceSelect);
}

// 加载系统语音列表
function loadSystemVoices() {
    if (checkSpeechSynthesisSupport()) {
        // for ios 等不支持onvoiceschanged的浏览器
        loadCustomOptions();
        speechSynthesis.onvoiceschanged = function() {
            const voices = speechSynthesis.getVoices();
            const voiceSelect = document.getElementById('voice');
            voiceSelect.innerHTML = ''; // 清空现有选项
            if (voices.length > 0) {

                // 添加系统语音选项
                voices.forEach((voice,index) => {
                    const option = document.createElement('option');
                    option.value = voice.name;
                    option.textContent = `${voice.name} (${voice.lang})`;
                    option.setAttribute('data-index', index); // 添加序号属性
                    option.setAttribute('data-lang', voice.lang);
                    option.setAttribute('is-local', true);
                    voiceSelect.appendChild(option);
                });
            }
            // 最后加载自定义选项
            loadCustomOptions();
        };
    } else {
        // 如果不支持 speechSynthesis，直接加载自定义选项
        loadCustomOptions();
    }
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', function() {
    loadSystemVoices();  // 检查并加载语音列表或自定义选项
});

// 默认选中第一个 data-lang 以 'en' 开头的选项
function setDefaultVoice(select) {
    const options = select.options;
    for (let i = 0; i < options.length; i++) {
        const lang = options[i].getAttribute('data-lang');
        if (lang && lang.startsWith('en')) {
            select.selectedIndex = i;  // 设置为选中的索引
            break;// 找到第一个匹配的，退出循环
        }
    }
}

let correctCount = 0;
let streakCount = 0;

function updateStatisticsDisplay() {
    document.getElementById('correctCount').textContent = correctCount;
    document.getElementById('streakCount').textContent = streakCount;
}

function copyBtnClick(){
    gtag('event','Copy_Button_Click',{'time':getCurrentTime()});
    var inputValue = document.getElementById('textInputTwo').value;
    if(inputValue){
        inputValue = inputValue.toUpperCase().trim();
        var text = document.getElementById('textInput').value;
        if(inputValue == text){
            gtag('event','Copy_Correct',{'time':getCurrentTime()});
            showAlert("抄收正确");
            var nextBtn = document.getElementById('nextButton');
            if(nextBtn.style.display){
                correctCount++;
                streakCount++;
            }
            nextBtn.style.display='';
            var showLabel = document.getElementById('show');
            showLabel.textContent=text;
        } else {
            var nextBtn = document.getElementById('nextButton');
            if(nextBtn.style.display){
                streakCount = 0;
            }
            gtag('event','Copy_Mistake',{'time':getCurrentTime()});
            showAlert("抄收错误，你可以重新播放");
        }
    } else {
        showAlert("请输入你听到的呼号");
    }
    updateStatisticsDisplay();
}

function nextBtnClick(){
    gtag('event','Next_Button_Click',{'time':getCurrentTime()});
    gen();
}

function gen() {
    var text = generateRandomString();
    var textInput = document.getElementById('textInput');
    textInput.value = text;
    var nextBtn = document.getElementById('nextButton');
    nextBtn.style.display='none';
    var textInputTwo = document.getElementById('textInputTwo');
    textInputTwo.value='';
    var showLabel = document.getElementById('show');
    showLabel.textContent='??????';
    speakText();
}

var timerInterval;

function speakBtnClick() {
    gtag('event','Play_Button_Click',{'time':getCurrentTime()});
    speakText();
}

function speakText() {
    var message1 = "CQ CQ CQ，这里是";
    var message2 = "，呼叫频率上的友台，Over!";
    var message3 = "CQ CQ CQ，This Is ";
    var message4 = "，Calling CQ And Standing By，Over!";

    var text = document.getElementById('textInput').value;

    if (text) {
        var mode = document.getElementById('mode').value;
        var voice = document.getElementById('voice');
        var volume = parseFloat(document.getElementById('volume').value);
        var rate = parseFloat(document.getElementById('rate').value);
        var pitch = parseFloat(document.getElementById('pitch').value);

        var amStd = document.getElementById('alpha_mode_STD').checked;
        var amDstd = document.getElementById('alpha_mode_DSTD').checked;
        var amPn = document.getElementById('alpha_mode_PN').checked;
        var amOther = document.getElementById('alpha_mode_OTHER').checked;

        var fullText = phoneticAlphabet(text,amStd,amDstd,amPn,amOther);
        var spkText = splitStringByComma(text);

        // 获取选中的 <option> 元素
        var selectedVoice = voice.options[voice.selectedIndex];
        var isZH = selectedVoice.getAttribute("data-lang").startsWith('zh');
        var isLocal = selectedVoice.getAttribute("is-local");

        var message;
        // var spkText = text;
        if(mode == 'FULL'){
            if(isZH){
                message = message1+spkText+"，"+spkText+"，"+fullText+message2;
            } else {
                message = message3+spkText+"，"+spkText+"，"+fullText+message4;
            }
        } else if(mode == 'SIG') {
            message = fullText
        } else if(mode == 'TWO') {
            message = spkText +"，"+ fullText
        } else if(mode == 'THREE') {
            message = spkText +"，"+spkText +"，"+ fullText
        }

        // 计时器
        var timer = 0;

        if(timerInterval){
            clearInterval(timerInterval);
            timerInterval = null;
        }
        // 启动计时器
        timerInterval = setInterval(function() {
            timer += 0.1;
            document.getElementById('timer').textContent = timer.toFixed(1);
        }, 100);

        if(isLocal === 'true'){
            // 获取可用的语音列表
            const voices = speechSynthesis.getVoices();
            console.log("本地播放:"+message);
            if(speechSynthesis.speaking){
                console.log("本地播放中,取消.");
                speechSynthesis.cancel();
            }
            var utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = rate;
            utterance.volume = volume;
            utterance.pitch = pitch;
            utterance.voice = voices[selectedVoice.getAttribute("data-index")];
            utterance.onstart = function(event) {
                gtag('event','Local_Play_Start',{'time':getCurrentTime()});
                console.log('本地播放开始');
                onStartCallBack();
            };
            utterance.onend = function(event) {
                gtag('event','Local_Play_Finish',{'time':getCurrentTime()});
                console.log('本地播放完成');
                onEndCallBack();
            };
            speechSynthesis.speak(utterance);
        } else {
            console.log("远程播放:"+message);
            if(responsiveVoice.isPlaying()){
                responsiveVoice.cancel();
                stopNoise();
            }
            responsiveVoice.enableEstimationTimeout = false;
            responsiveVoice.enableWindowClickHook();
            responsiveVoice.speak(message, selectedVoice.value, {volume: volume, rate: rate,pitch:pitch,onstart:onRemotePlayStartCallBack, onend: onRemotePlayEndCallBack});
        }
    } else {
        gen();
    }
}


const alphabetMap = {
    'A': { 'STD': ['Alpha'],'DSTD': ['America'], 'PN': ['America'], 'OTHER': ['Able'] },
    'B': { 'STD': ['Bravo'],'DSTD': ['Boston'], 'PN': ['Boston'], 'OTHER': ['Baker'] },
    'C': { 'STD': ['Charlie'],'DSTD': ['Canada'], 'PN': ['Canada'], 'OTHER': ['China'] },
    'D': { 'STD': ['Delta'],'DSTD': ['Denmark'], 'PN': ['Denmark'], 'OTHER': ['David'] },
    'E': { 'STD': ['Echo'],'DSTD': ['England'], 'PN': ['England'], 'OTHER': ['Easy'] },
    'F': { 'STD': ['Foxtrot'],'DSTD': ['Florida'], 'PN': ['Florida'], 'OTHER': ['Francis'] },
    'G': { 'STD': ['Golf'],'DSTD': ['Germany'], 'PN': ['Germany'], 'OTHER': ['Guatemala'] },
    'H': { 'STD': ['Hotel'],'DSTD': ['Honolulu'], 'PN': ['Honolulu'], 'OTHER': ['Henry'] },
    'I': { 'STD': ['India'],'DSTD': ['Italy'], 'PN': ['Italy'], 'OTHER': ['Indian'] },
    'J': { 'STD': ['Juliet'],'DSTD': ['Japan'], 'PN': ['Japan'], 'OTHER': ['Juliett'] },
    'K': { 'STD': ['Kilo'],'DSTD': ['Kilowatt'], 'PN': ['Kentucky'], 'OTHER': ['King'] },
    'L': { 'STD': ['Lima'],'DSTD': ['London'], 'PN': ['London'], 'OTHER': ['Lucy'] },
    'M': { 'STD': ['Mike'],'DSTD': ['Mexico'], 'PN': ['Mexico'], 'OTHER': ['Mary'] },
    'N': { 'STD': ['November'],'DSTD': ['Norway'], 'PN': ['Norway'], 'OTHER': ['Nancy'] },
    'O': { 'STD': ['Oscar'],'DSTD': ['Ontaria'], 'PN': ['Ontaria'], 'OTHER': ['Ocean'] },
    'P': { 'STD': ['Papa'],'DSTD': ['Peter'], 'PN': ['Paraguay'], 'OTHER': ['Peter'] },
    'Q': { 'STD': ['Quebec'],'DSTD': ['Queen'], 'PN': ['Quebec'], 'OTHER': ['Queen'] },
    'R': { 'STD': ['Romeo'],'DSTD': ['Radio'], 'PN': ['Rotterdam'], 'OTHER': ['Radio'] },
    'S': { 'STD': ['Sierra'],'DSTD': ['Sugar'], 'PN': ['Santiago'], 'OTHER': ['Sugar'] },
    'T': { 'STD': ['Tango'],'DSTD': ['Tokyo'], 'PN': ['Tokyo'], 'OTHER': ['Texas'] },
    'U': { 'STD': ['Uniform'],'DSTD': ['United'], 'PN': ['Uruguay'], 'OTHER': ['United'] },
    'V': { 'STD': ['Victor'],'DSTD': ['Virginia'], 'PN': ['Virginia'], 'OTHER': ['Victoria'] },
    'W': { 'STD': ['Whisky'],'DSTD': ['Washington'], 'PN': ['Washington'], 'OTHER': ['Winnie'] },
    'X': { 'STD': ['X-ray'],'DSTD': ['X-ray'], 'PN': ['X-ray'], 'OTHER': ['X-ray'] },
    'Y': { 'STD': ['Yankee'],'DSTD': ['Yokohama'], 'PN': ['Yokohama'], 'OTHER': ['Yesterday'] },
    'Z': { 'STD': ['Zulu'],'DSTD': ['Zanzibal'], 'PN': ['Zanzibal'], 'OTHER': ['Zebra'] },
    '1': { 'STD': ['One'],'DSTD': ['One'], 'PN': ['One'], 'OTHER': ['One'] },
    '2': { 'STD': ['Two'],'DSTD': ['Two'], 'PN': ['Two'], 'OTHER': ['Two'] },
    '3': { 'STD': ['Three'],'DSTD': ['Three'], 'PN': ['Three'], 'OTHER': ['Three']},
    '4': { 'STD': ['Four'],'DSTD': ['Four'], 'PN': ['Four'], 'OTHER': ['Four'] },
    '5': { 'STD': ['Five'],'DSTD': ['Five'], 'PN': ['Five'], 'OTHER': ['Five'] },
    '6': { 'STD': ['Six'],'DSTD': ['Six'], 'PN': ['Six'], 'OTHER': ['Six'] },
    '7': { 'STD': ['Seven'],'DSTD': ['Seven'], 'PN': ['Seven'], 'OTHER': ['Seven'] },
    '8': { 'STD': ['Eight'],'DSTD': ['Eight'], 'PN': ['Eight'], 'OTHER': ['Eight'] },
    '9': { 'STD': ['Nine'],'DSTD': ['Nine'], 'PN': ['Nine'], 'OTHER': ['Nine'] },
    '0': { 'STD': ['Zero'],'DSTD': ['Zero'], 'PN': ['Zero'], 'OTHER': ['Zero'] }
};

function phoneticAlphabet(input, STD = false,DSTD = false, PN = false, OTHER = false) {
    return input.split('').map(char => {
        // 检查字符是否存在映射
        if (alphabetMap[char]) {
            let options = [];
            if (STD) options.push('STD');
            if (DSTD) options.push('DSTD');
            if (PN) options.push('PN');
            if (OTHER) options.push('OTHER');

            // 如果没有选定任何选项，则默认选择 'STD'
            if (options.length === 0) options.push('STD');

            // 随机选择一个选项
            const randomChoice = options[Math.floor(Math.random() * options.length)];
            const value = alphabetMap[char][randomChoice];

            // 返回选定的解释法
            return value[Math.floor(Math.random() * value.length)];
        } else {
            // 如果字符没有映射，直接返回字符
            return char;
        }
    }).join('，');
}

function generateRandomString() {
    // 第三位为数字(0-9)
    const thirdDigit = Math.floor(Math.random() * 10);

    // 其余位数为大写字母(A-Z)
    const randomLetter = () => String.fromCharCode(Math.floor(Math.random() * 26) + 'A'.charCodeAt(0));

    let result = '';
    for (let i = 0; i < 5; i++) {
        result += randomLetter();
    }

    // 插入第三位数字
    result = result.slice(0, 2) + thirdDigit + result.slice(2);

    return result;
}

function splitStringByComma(input) {
    // 将输入字符串转换为数组，然后使用 join 方法将每个字符用逗号连接起来
    return input.split('').join('-');
}

function showAlert(message) {
    var alertMessage = document.getElementById('alertMessage');
    alertMessage.textContent = message;
    var alertBox = document.getElementById('customAlert');
    alertBox.style.display = 'flex';
}

function closeAlert() {
    var alertBox = document.getElementById('customAlert');
    alertBox.style.display = 'none';
}

function onStartCallBack(){
    openNoise();
}
function onEndCallBack(){
    if(timerInterval){
        // 停止计时器
        clearInterval(timerInterval);
        timerInterval = null;
    }
    stopNoise();
}

function onRemotePlayStartCallBack(){
    console.log('远程播放开始');
    gtag('event','Remote_Play_Start',{'time':getCurrentTime()});
    onStartCallBack();
}
function onRemotePlayEndCallBack(){
    console.log('远程播放结束');
    gtag('event','Remote_Play_Finish',{'time':getCurrentTime()});
    onEndCallBack();
}

function getCurrentTime() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

// 背噪相关
let audioContext;
let oscillator;
let gainNode;

function openNoise(){
    var noiseSwitch = parseFloat(document.getElementById('noiseVolume').value) != 0;
    if (noiseSwitch && !audioContext) {
        gtag('event','Open_Noise',{'time':getCurrentTime()});
        console.log("开启背噪");
        // 创建一个新的 AudioContext
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // 检查 AudioContext 是否被暂停
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        // 创建一个 ScriptProcessorNode 并连接到输出
        const bufferSize = 4096;
        const scriptNode = audioContext.createScriptProcessor(bufferSize, 1, 1);
        var noiseVolume;
        scriptNode.onaudioprocess = function(event) {
            const outputBuffer = event.outputBuffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                // 生成随机噪音
                outputBuffer[i] = Math.random() * 2 - 1;
            }
            function getCurrentTime() {
                const now = new Date();
            
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const seconds = String(now.getSeconds()).padStart(2, '0');
                const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
            
                return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
            }
            // 随机设置音量
            noiseVolume = Math.random() - (1 - parseFloat(document.getElementById('noiseVolume').value));
            if(noiseVolume < 0){
                noiseVolume = 0;
            }
            gainNode.gain.value = noiseVolume;
        };

        // 创建一个 GainNode 来控制音量
        gainNode = audioContext.createGain();
        scriptNode.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // 创建一个振荡器节点，并将其连接到 ScriptProcessorNode，然后启动它
        oscillator = audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = 440; // A4 音符
        oscillator.connect(scriptNode);
        oscillator.start();

    }
}

function stopNoise() {
    if (audioContext && oscillator) {
        gtag('event','Close_Noise',{'time':getCurrentTime()});
        console.log("关闭背噪");
        oscillator.stop();
        audioContext.close().then(() => {
            audioContext = null;
            oscillator = null;
            gainNode = null;
        });
    }
}


