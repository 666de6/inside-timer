// 预定义的背景颜色
const themeColors = [
    '#73c8dd',
    '#3eaed1',
    '#0277a2',
    '#81966d',
    '#b7dffd',
    '#5f94ae',
    '#9be1cd',
    '#62a999',
    '#86a8b2'
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

class Timer {
    constructor() {
        this.warmUpTime = 0;
        this.durationTime = 60;
        this.intervalTime = 0;
        this.currentTime = 0;
        this.currentColor = '';
        this.isRunning = false;
        this.isPaused = false;
        this.phase = 'ready';
        this.timerInterval = null;
        this.sounds = {
            start: 'bell01',
            end: 'bell01',
            interval: 'bell01'
        };

        // Preload audio files
        this.audioFiles = {};
        Object.keys(bellSounds).forEach(bell => {
            this.audioFiles[bell] = new Audio(bellSounds[bell]);
        });

        this.initializeElements();
        this.setupEventListeners();
        this.updateDisplay();
        this.setRandomBackground();
    }

    initializeElements() {
        // Timer displays
        this.timerDisplay = document.getElementById('timerDisplay');
        this.timerScreenDisplay = document.getElementById('timerScreenDisplay');
        // this.phaseDisplay = document.getElementById('phaseDisplay');
        this.timerScreenPhase = document.getElementById('timerScreenPhase');

        // Time inputs and displays
        this.warmUpValue = document.getElementById('warmUpValue');
        this.durationValue = document.getElementById('durationValue');
        this.intervalValue = document.getElementById('intervalValue');
        this.warmUpInput = document.getElementById('warmUpTime');
        this.durationInput = document.getElementById('durationTime');
        this.intervalInput = document.getElementById('intervalTime');

        
        // Time adjustment buttons
        this.sliderButtons = document.querySelectorAll('.slider');

        // Buttons
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.continueButton = document.getElementById('continueButton');
        this.resetButton = document.getElementById('resetButton');

        // Containers
        this.settingsContainer = document.getElementById('settingsContainer');
        this.timerScreen = document.getElementById('timerScreen');
        this.mainContainer = document.getElementById('mainContainer');

        // Sound selects
        this.startSoundSelect = document.getElementById('startSound');
        this.endSoundSelect = document.getElementById('endSound');
        this.intervalSoundSelect = document.getElementById('intervalSound');
    }

    setupEventListeners() {
        // Time adjustment buttons
        document.getElementById('decreaseWarmUp').addEventListener('click', () => this.adjustTime('warmUp', -5));
        document.getElementById('increaseWarmUp').addEventListener('click', () => this.adjustTime('warmUp', 5));
        document.getElementById('decreaseDuration').addEventListener('click', () => this.adjustTime('duration', -30));
        document.getElementById('increaseDuration').addEventListener('click', () => this.adjustTime('duration', 30));
        document.getElementById('decreaseInterval').addEventListener('click', () => this.adjustTime('interval', -5));
        document.getElementById('increaseInterval').addEventListener('click', () => this.adjustTime('interval', 5));

        // Range input listeners
        this.warmUpInput.addEventListener('input', () => this.updateTime('warmUp'));
        this.durationInput.addEventListener('input', () => this.updateTime('duration'));
        this.intervalInput.addEventListener('input', () => this.updateTime('interval'));

        // Control buttons
        this.startButton.addEventListener('click', () => this.start());
        this.pauseButton.addEventListener('click', () => this.pause());
        this.continueButton.addEventListener('click', () => this.continue());
        this.resetButton.addEventListener('click', () => this.reset());

        // Sound selects
        this.startSoundSelect.addEventListener('click', (e) => {
            if(e.target.dataset.sound) {
                this.sounds.start = e.target.dataset.sound;
                this.playSound('start');
            }

            this.startSoundSelect.querySelectorAll('button').forEach(button => {
                button.style.backgroundColor = '';
                if(button.dataset.sound === this.sounds.start) {
                    button.style.backgroundColor = this.currentColor;
                }
            });
            
        });
        this.endSoundSelect.addEventListener('click', (e) => {
            if(e.target.dataset.sound) {
                this.sounds.end = e.target.dataset.sound;
                this.playSound('end');
            }

            this.endSoundSelect.querySelectorAll('button').forEach(button => {
                button.style.backgroundColor = '';
                if(button.dataset.sound === this.sounds.end) {
                    button.style.backgroundColor = this.currentColor;
                }
            });
        });
        this.intervalSoundSelect.addEventListener('click', (e) => {
            if(e.target.dataset.sound) {
                this.sounds.interval = e.target.dataset.sound;
                this.playSound('interval');
            }

            this.intervalSoundSelect.querySelectorAll('button').forEach(button => {
                button.style.backgroundColor = '';
                if(button.dataset.sound === this.sounds.interval) {
                    button.style.backgroundColor = this.currentColor;
                }
            });
        });
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
                percentage = ((value - min) / (this.durationTime - min)) * 100;
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
                    this.playSound('end');
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
        
        this.updateDisplay();
        // this.setRandomBackground();
    }

    playSound(type) {
        const audio = this.audioFiles[this.sounds[type]];
        
        if (!audio.paused) {
            audio.pause();
            audio.currentTime = 0;
        }
        
        audio.play().catch(error => console.log('Error playing sound:', error));
    }

    setRandomBackground() {
        // if (this.currentColor) {
        //     this.mainContainer.style.background = this.currentColor;
        // }
        const newColor = themeColors[Math.floor(Math.random() * themeColors.length)];
        // this.mainContainer.style.background = newColor;
        this.currentColor = newColor;
        this.mainContainer.style.setProperty('--slider-color', this.currentColor);
        // default sound
        this.startSoundSelect.querySelectorAll('button').forEach(button => {
            button.style.backgroundColor = '';
            if(button.dataset.sound === this.sounds.start) {
                button.style.backgroundColor = this.currentColor;
            }
        });

        this.endSoundSelect.querySelectorAll('button').forEach(button => {
            button.style.backgroundColor = '';
            if(button.dataset.sound === this.sounds.end) {
                button.style.backgroundColor = this.currentColor;
            }
        });

        this.intervalSoundSelect.querySelectorAll('button').forEach(button => {
            button.style.backgroundColor = '';
            if(button.dataset.sound === this.sounds.interval) {
                button.style.backgroundColor = this.currentColor;
            }
        });
    }
}

// Initialize timer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Timer();
});
