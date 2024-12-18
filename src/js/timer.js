// 预定义的背景颜色
const themeColors = [
    '#B2EBF2', '#80DEEA',
    '#90CAF9', '#64B5F6',
    '#FFCDD2', '#EF9A9A',
    '#A5D6A7', '#81C784',
    '#B3E5FC', '#81D4FA',
    '#B7E4C7', '#95D9B8',
    '#E1BEE7', '#CE93D8',
    '#F8BBD0', '#F48FB1',
    '#A77BCA', '#6A4C93',
    '#6BAF9A', '#4B8B8B',
    '#F6A6A1', '#F27C7A',
    '#D9C6B2', '#C1A68D',
    '#D9B8A0', '#A78B8D',
    '#BFAF8D', '#A68A6D',
    '#FFCA28', '#FFA000'
];

// 音频文件映射
const bellSounds = {
    bell01: 'https://sounds.insidetimer.com/bell01.wav',
    bell02: 'https://sounds.insidetimer.com/bell02.wav',
    bell03: 'https://sounds.insidetimer.com/bell03.wav',
    bell04: 'https://sounds.insidetimer.com/bell04.wav',
    bell05: 'https://sounds.insidetimer.com/bell05.wav',
    bell06: 'https://sounds.insidetimer.com/bell06.wav',
    bell07: 'https://sounds.insidetimer.com/bell07.wav'

};

let currentInstance = null;

class Timer {
    constructor(presetData = null) {
        // 如果存在当前计时器，先停止和重置它
        if (currentInstance) {
            currentInstance.reset();
            currentInstance.removeEventListeners();
        }

        currentInstance = this;

        this.warmUpTime =  presetData ? presetData.warmUpTime : 0;
        this.durationTime =  presetData ? presetData.durationTime : 60;
        this.intervalTime =  presetData ? presetData.intervalTime : 0;
        this.currentTime = 0;
        this.currentColor = presetData ? presetData.currentColor : '';
        this.isRunning = false;
        this.isPaused = false;
        this.phase = 'ready';
        this.timerInterval = null;
        this.sounds = {
            start: presetData ? presetData.startSound : 'bell01',
            interval: presetData ? presetData.intervalSound : 'bell01'
        };

        // Preload audio files
        this.audioFiles = {};
        Object.keys(bellSounds).forEach(bell => {
            this.audioFiles[bell] = new Audio(bellSounds[bell]);
            const savedVolume = localStorage.getItem('inside-timer-bell-volume');
            if (savedVolume !== null) {
                this.audioFiles[bell].volume = savedVolume / 100;
            } else {
                // 如果没有保存的值，设置默认值为50
                localStorage.setItem('inside-timer-bell-volume', 50);
                this.audioFiles[bell].volume = 0.5;
            }
        });

        this.initializeElements(presetData);
        this.setupEventListeners();
        this.setRandomBackground(presetData);
        this.updateDisplay();
    }

    initializeElements(presetData = null) {
        // Timer displays
        this.timerDisplay = document.getElementById('timerDisplay');
        this.timerScreenDisplay = document.getElementById('timerScreenDisplay');
        // this.phaseDisplay = document.getElementById('phaseDisplay');
        this.timerScreenPhase = document.getElementById('timerScreenPhase');

        // Time inputs and displays
        this.warmUpValue = document.getElementById('warmUpValue');
        this.durationValue = document.getElementById('durationValue');
        this.intervalValue = document.getElementById('intervalValue');
        this.warmUpInput =  document.getElementById('warmUpTime');
        this.durationInput = document.getElementById('durationTime');
        this.intervalInput = document.getElementById('intervalTime');

        if(presetData) {
            this.warmUpInput.value = presetData.warmUpTime;
            this.durationInput.value = presetData.durationTime;
            this.intervalInput.max = presetData.durationTime;
            this.intervalInput.value = presetData.intervalTime;
        }

        
        // Time adjustment buttons
        this.sliderButtons = document.querySelectorAll('.slider');

        // Buttons
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.continueButton = document.getElementById('continueButton');
        this.resetButton = document.getElementById('resetButton');
        this.savePresetButton = document.getElementById('savePreset');

        // Containers
        this.settingsContainer = document.getElementById('settingsContainer');
        this.timerScreen = document.getElementById('timerScreen');
        this.mainContainer = document.getElementById('mainContainer');

        // Sound selects
        this.startSoundSelect = document.getElementById('startSound');
        // this.endSoundSelect = document.getElementById('endSound');
        this.intervalSoundSelect = document.getElementById('intervalSound');
    }

    setupEventListeners() {
        // Time adjustment buttons
        this.decreaseWarmUpListener = () => this.adjustTime('warmUp', -5);
        this.increaseWarmUpListener = () => this.adjustTime('warmUp', 5);
        this.decreaseDurationListener = () => this.adjustTime('duration', -30);
        this.increaseDurationListener = () => this.adjustTime('duration', 30);
        this.decreaseIntervalListener = () => this.adjustTime('interval', -5);
        this.increaseIntervalListener = () => this.adjustTime('interval', 5);

        document.getElementById('decreaseWarmUp').addEventListener('click', this.decreaseWarmUpListener);
        document.getElementById('increaseWarmUp').addEventListener('click', this.increaseWarmUpListener);
        document.getElementById('decreaseDuration').addEventListener('click', this.decreaseDurationListener);
        document.getElementById('increaseDuration').addEventListener('click', this.increaseDurationListener);
        document.getElementById('decreaseInterval').addEventListener('click', this.decreaseIntervalListener);
        document.getElementById('increaseInterval').addEventListener('click', this.increaseIntervalListener);

        // Range input listeners
        this.warmUpInputListener = () => this.updateTime('warmUp');
        this.durationInputListener = () => this.updateTime('duration');
        this.intervalInputListener = () => this.updateTime('interval');

        this.warmUpInput.addEventListener('input', this.warmUpInputListener);
        this.durationInput.addEventListener('input', this.durationInputListener);
        this.intervalInput.addEventListener('input', this.intervalInputListener);
        
        // Control buttons
        this.startButtonListener = () => this.start();
        this.pauseButtonListener = () => this.pause();
        this.continueButtonListener = () => this.continue();
        this.resetButtonListener = () => this.reset();

        this.startButton.addEventListener('click', this.startButtonListener);
        this.pauseButton.addEventListener('click', this.pauseButtonListener);
        this.continueButton.addEventListener('click', this.continueButtonListener);
        this.resetButton.addEventListener('click', this.resetButtonListener);

        // Sound selects
        this.startSoundSelectListener = (e) => {
            if(e.target.dataset.sound) {
                this.sounds.start = e.target.dataset.sound;
                this.playSound('start');
            }

            this.startSoundSelect.querySelectorAll('button').forEach(button => {
                const currentSound = button.dataset.sound.replace('0', ' ');
                button.innerHTML = currentSound.charAt(0).toUpperCase() + currentSound.slice(1);
                if(button.dataset.sound === this.sounds.start) {
                    button.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                        <path d="M5.85 3.5a.75.75 0 0 0-1.117-1 9.719 9.719 0 0 0-2.348 4.876.75.75 0 0 0 1.479.248A8.219 8.219 0 0 1 5.85 3.5ZM19.267 2.5a.75.75 0 1 0-1.118 1 8.22 8.22 0 0 1 1.987 4.124.75.75 0 0 0 1.48-.248A9.72 9.72 0 0 0 19.266 2.5Z" />
                        <path fill-rule="evenodd" d="M12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.83-1.244.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25ZM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 0 0 4.496 0l.002.1a2.25 2.25 0 1 1-4.5 0Z" clip-rule="evenodd" />
                        </svg>
                    `;
                }
            });
        };
        this.startSoundSelect.addEventListener('click', this.startSoundSelectListener);

        this.intervalSoundSelectListener = (e) => {
            if(e.target.dataset.sound) {
                this.sounds.interval = e.target.dataset.sound;
                this.playSound('interval');
            }

            this.intervalSoundSelect.querySelectorAll('button').forEach(button => {
                const currentSound = button.dataset.sound.replace('0', ' ');
                button.innerHTML = currentSound.charAt(0).toUpperCase() + currentSound.slice(1);
                if(button.dataset.sound === this.sounds.interval) {
                    button.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                        <path d="M5.85 3.5a.75.75 0 0 0-1.117-1 9.719 9.719 0 0 0-2.348 4.876.75.75 0 0 0 1.479.248A8.219 8.219 0 0 1 5.85 3.5ZM19.267 2.5a.75.75 0 1 0-1.118 1 8.22 8.22 0 0 1 1.987 4.124.75.75 0 0 0 1.48-.248A9.72 9.72 0 0 0 19.266 2.5Z" />
                        <path fill-rule="evenodd" d="M12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.83-1.244.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25ZM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 0 0 4.496 0l.002.1a2.25 2.25 0 1 1-4.5 0Z" clip-rule="evenodd" />
                        </svg>
                    `;
                }
            });
        };
        this.intervalSoundSelect.addEventListener('click', this.intervalSoundSelectListener);

        this.savePresetButtonListener = () => {
            const presetSetting = {
                warmUpTime: this.warmUpTime,
                durationTime: this.durationTime,
                intervalTime: this.intervalTime,
                startSound: this.sounds.start,
                intervalSound: this.sounds.interval,
                currentColor: this.currentColor
            };
            addNewPreset(presetSetting);
        };
        this.savePresetButton.addEventListener('click', this.savePresetButtonListener);
    }

    removeEventListeners() {
        document.getElementById('decreaseWarmUp').removeEventListener('click', this.decreaseWarmUpListener);
        document.getElementById('increaseWarmUp').removeEventListener('click', this.increaseWarmUpListener);
        document.getElementById('decreaseDuration').removeEventListener('click', this.decreaseDurationListener);
        document.getElementById('increaseDuration').removeEventListener('click', this.increaseDurationListener);
        document.getElementById('decreaseInterval').removeEventListener('click', this.decreaseIntervalListener);
        document.getElementById('increaseInterval').removeEventListener('click', this.increaseIntervalListener);

        this.warmUpInput.removeEventListener('input', this.warmUpInputListener);
        this.durationInput.removeEventListener('input', this.durationInputListener);
        this.intervalInput.removeEventListener('input', this.intervalInputListener);

        this.startButton.removeEventListener('click', this.startButtonListener);
        this.pauseButton.removeEventListener('click', this.pauseButtonListener);
        this.continueButton.removeEventListener('click', this.continueButtonListener);
        this.resetButton.removeEventListener('click', this.resetButtonListener);

        this.startSoundSelect.removeEventListener('click', this.startSoundSelectListener);
        this.intervalSoundSelect.removeEventListener('click', this.intervalSoundSelectListener);
        this.savePresetButton.removeEventListener('click', this.savePresetButtonListener);
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    updateTime(type) {
        const value = parseInt(this[`${type}Input`].value);
        this[`${type}Time`] = value;
        this.updateDisplay();
    }

    adjustTime(type, change) {
        const input = this[`${type}Input`];
        const newValue = parseInt(input.value) + change;
        if (newValue >= parseInt(input.min) && newValue <= parseInt(input.max)) {
            input.value = newValue;
            this.updateTime(type);
        }
    }

    updateDisplay() {
        // Update interval input max value based on duration
        this.intervalInput.max = this.durationInput.value;
        if (parseInt(this.intervalTime) > parseInt(this.intervalInput.max)) {
            this.intervalInput.value = this.intervalInput.max;
            this.intervalTime = parseInt(this.intervalInput.max);
        }
        // Update slider backgrounds
        this.sliderButtons.forEach(button => {
            const type = button.id.replace('Time', '');
            const value = this[`${type}Time`];
            const max = parseInt(button.max);
            const min = parseInt(button.min);
            
            let percentage;
            if (type === 'warmUp') {
                percentage = ( value / max ) * 100;
            } else if (type === 'duration') {
                percentage = ((value - min) / (max - min)) * 100;
            } else if (type === 'interval') {
                percentage = (value / max) * 100;
            }

            button.style.background = `linear-gradient(to right, ${this.currentColor} 0%, ${this.currentColor} ${percentage}%, rgba(255, 255, 255, 0.2) ${percentage}%, rgba(255, 255, 255, 0.2) 100%)`;
        });
        
        // Update value displays
        this.warmUpValue.textContent = this.formatTime(this.warmUpTime);
        this.durationValue.textContent = this.formatTime(this.durationTime);
        this.intervalValue.textContent = this.formatTime(this.intervalTime);



        // Update main timer display
        if (this.phase === 'warmup' || this.phase === 'meditation' || this.phase === 'finish') {
            this.timerDisplay.textContent = this.formatTime(this.currentTime);
            this.timerScreenDisplay.textContent = this.formatTime(this.currentTime);
        } else {
            this.timerDisplay.textContent = this.formatTime(this.durationTime);
            this.timerScreenDisplay.textContent = this.formatTime(this.durationTime);
        }

        // Update phase display
        let phaseText = this.phase.charAt(0).toUpperCase() + this.phase.slice(1);
        if(phaseText === 'Warmup') {
            phaseText = 'Warm Up'
        }
        // this.phaseDisplay.textContent = phaseText;
        this.timerScreenPhase.textContent = phaseText;
        
    }

    start() {
        console.log('Start', this.warmUpTime, this.durationTime, this.intervalTime);
        document.getElementById('menu-toggle').classList.add('hidden');

        this.isRunning = true;
        this.isPaused = false;
        this.settingsContainer.classList.add('hidden');
        this.timerScreen.classList.remove('hidden');
        
        if (this.warmUpTime > 0) {
            this.phase = 'warmup';
            this.currentTime = this.warmUpTime;
            // this.playSound('start');
        } else {
            this.phase = 'meditation';
            this.currentTime = this.durationTime;
            this.playSound('start');
        }
        
        this.updateDisplay();
        this.startTimer();
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.currentTime > 1) {
                this.currentTime--;
                if (this.phase === 'meditation' && this.intervalTime > 0 && 
                    this.currentTime > 0 && this.currentTime < this.durationTime && 
                    this.currentTime % this.intervalTime === 0) {
                    this.playSound('interval');
                }
            } else {
                if (this.phase === 'warmup') {
                    this.phase = 'meditation';
                    this.currentTime = this.durationTime;
                    this.playSound('start');
                } else {
                    this.playSound('start');
                    this.finish();
                }
            }
            this.updateDisplay();
        }, 1000);
    }

    pause() {
        this.isPaused = true;
        this.pauseButton.classList.add('hidden');
        this.continueButton.classList.remove('hidden');
        this.resetButton.classList.remove('hidden');
        clearInterval(this.timerInterval);
    }

    continue() {
        this.isPaused = false;
        this.pauseButton.classList.remove('hidden');
        this.continueButton.classList.add('hidden');
        this.resetButton.classList.add('hidden');
        this.startTimer();
    }

    finish() {
        this.isRunning = false;
        this.isPaused = false;
        this.phase = 'finish';
        this.currentTime = 0;
        clearInterval(this.timerInterval);
        
        this.resetButton.classList.remove('hidden');
        this.pauseButton.classList.add('hidden');
    }

    reset() {
        console.log('Reset');
        this.isRunning = false;
        this.isPaused = false;
        this.phase = 'ready';
        this.currentTime = 0;
        clearInterval(this.timerInterval);
        
        this.settingsContainer.classList.remove('hidden');
        this.timerScreen.classList.add('hidden');
        this.pauseButton.classList.remove('hidden');
        this.continueButton.classList.add('hidden');
        this.resetButton.classList.add('hidden');
        document.getElementById('menu-toggle').classList.remove('hidden');
        
        this.updateDisplay();
        // this.setRandomBackground();

        // 如果当前重置的是最后一个实例，则清除全局引用
        // if (currentInstance === this) {
        //     currentInstance = null;
        // }
    }

    playSound(type) {
        const audio = this.audioFiles[this.sounds[type]];
        
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
        
        audio.play().catch(error => console.log('Error playing sound:', error));
    }

    setRandomBackground(presetData = null) {
        // set random background
        this.currentColor = presetData ? presetData.currentColor : themeColors[Math.floor(Math.random() * themeColors.length)];
        document.documentElement.style.setProperty('--slider-color', this.currentColor);

        // set default sound
        this.startSoundSelect.querySelectorAll('button').forEach(button => {
            const currentSound = button.dataset.sound.replace('0', ' ');
            button.innerHTML = currentSound.charAt(0).toUpperCase() + currentSound.slice(1);
            const sound = presetData ? presetData.startSound : this.sounds.start;
            if(button.dataset.sound === sound) {
                button.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                    <path d="M5.85 3.5a.75.75 0 0 0-1.117-1 9.719 9.719 0 0 0-2.348 4.876.75.75 0 0 0 1.479.248A8.219 8.219 0 0 1 5.85 3.5ZM19.267 2.5a.75.75 0 1 0-1.118 1 8.22 8.22 0 0 1 1.987 4.124.75.75 0 0 0 1.48-.248A9.72 9.72 0 0 0 19.266 2.5Z" />
                    <path fill-rule="evenodd" d="M12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.83-1.244.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25ZM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 0 0 4.496 0l.002.1a2.25 2.25 0 1 1-4.5 0Z" clip-rule="evenodd" />
                    </svg>
                `;
            }
        });

        this.intervalSoundSelect.querySelectorAll('button').forEach(button => {
            const currentSound = button.dataset.sound.replace('0', ' ');
            button.innerHTML = currentSound.charAt(0).toUpperCase() + currentSound.slice(1);
            const sound = presetData ? presetData.intervalSound : this.sounds.interval;
            if(button.dataset.sound === sound) {
                button.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                    <path d="M5.85 3.5a.75.75 0 0 0-1.117-1 9.719 9.719 0 0 0-2.348 4.876.75.75 0 0 0 1.479.248A8.219 8.219 0 0 1 5.85 3.5ZM19.267 2.5a.75.75 0 1 0-1.118 1 8.22 8.22 0 0 1 1.987 4.124.75.75 0 0 0 1.48-.248A9.72 9.72 0 0 0 19.266 2.5Z" />
                    <path fill-rule="evenodd" d="M12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.83-1.244.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25ZM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 0 0 4.496 0l.002.1a2.25 2.25 0 1 1-4.5 0Z" clip-rule="evenodd" />
                    </svg>
                `;
            }
        });
    }
}

// Initialize timer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    currentInstance = new Timer();
});
