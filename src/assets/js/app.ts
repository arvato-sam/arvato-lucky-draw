import confetti from 'canvas-confetti';
import Slot from '@js/Slot';
import prizes from '../../PrizeList.json';
import SoundEffects from '@js/SoundEffects';

// Initialize slot machine
(() => {
  let totalPrize = 121;
  let prizeIndex = Number(localStorage.getItem("PrizeIndex")) || 0;

  //const fs = require("fs/promises");

  const drawButton = document.getElementById('draw-button') as HTMLButtonElement | null;
  const confirmButton = document.getElementById('confirm-button') as HTMLButtonElement | null;
  const fullscreenButton = document.getElementById('fullscreen-button') as HTMLButtonElement | null;
  const settingsButton = document.getElementById('settings-button') as HTMLButtonElement | null;
  const settingsWrapper = document.getElementById('settings') as HTMLDivElement | null;
  const settingsContent = document.getElementById('settings-panel') as HTMLDivElement | null;
  const settingsSaveButton = document.getElementById('settings-save') as HTMLButtonElement | null;
  const settingsCloseButton = document.getElementById('settings-close') as HTMLButtonElement | null;
  const settingsStorageClearButton = document.getElementById('settings-storage-clear') as HTMLButtonElement | null;
  const winnerButton = document.getElementById('winner-button') as HTMLButtonElement | null;
  const winnerWrapper = document.getElementById('winner') as HTMLDivElement | null;
  const winnerContent = document.getElementById('winner-panel') as HTMLDivElement | null;
  const winnerCloseButton = document.getElementById('winner-close') as HTMLButtonElement | null;
  const sunburstSvg = document.getElementById('sunburst') as HTMLImageElement | null;
  const confettiCanvas = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
  const nameListTextArea = document.getElementById('name-list') as HTMLTextAreaElement | null;
  const winnerListTextArea = document.getElementById('winner-list') as HTMLTextAreaElement | null;
  const prizeNameParagraph = document.getElementById('prize') as HTMLElement | null;
  const removeNameFromListCheckbox = document.getElementById('remove-from-list') as HTMLInputElement | null;
  const enableSoundCheckbox = document.getElementById('enable-sound') as HTMLInputElement | null;

  // Graceful exit if necessary elements are not found
  if (!(
    drawButton
    && confirmButton
    && fullscreenButton
    && settingsButton
    && settingsWrapper
    && settingsContent
    && settingsSaveButton
    && settingsCloseButton
    && settingsStorageClearButton
    && winnerButton
    && winnerWrapper
    && winnerContent
    && winnerCloseButton
    && sunburstSvg
    && confettiCanvas
    && nameListTextArea
    && winnerListTextArea
    && prizeNameParagraph
    && removeNameFromListCheckbox
    && enableSoundCheckbox
  )) {
    console.error('One or more Element ID is invalid. This is possibly a bug.');
    return;
  }

  if (!(confettiCanvas instanceof HTMLCanvasElement)) {
    console.error('Confetti canvas is not an instance of Canvas. This is possibly a bug.');
    return;
  }

  const soundEffects = new SoundEffects();
  const MAX_REEL_ITEMS = 40;
  const CONFETTI_COLORS = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'];
  let confettiAnimationId;

  //First time Prize Name set
  if (prizeNameParagraph instanceof HTMLElement) {
    prizeNameParagraph.innerHTML = '<div>' + (totalPrize - prizeIndex) + ". " + prizes[prizeIndex] + '</div>';
  }
  confirmButton.disabled = true;

  /** Confeetti animation instance */
  const customConfetti = confetti.create(confettiCanvas, {
    resize: true,
    useWorker: true
  });

  //Prize Name show
  const showPrizeName = () => {
    if (prizeNameParagraph instanceof HTMLElement) {
      if (prizeIndex === totalPrize) {
        prizeNameParagraph.innerHTML = '<div>Done</div>';  
      } else {
        prizeNameParagraph.innerHTML = '<div>' + (totalPrize - prizeIndex) + ". " + prizes[prizeIndex] + '</div>';
      }
    }
  }

  const savePersonPrize = async () => {
    let prizeName = prizes[prizeIndex];
    let personName = slot.currentWinnerName;

    let winnerList : any = [];
    if (localStorage.length > 0) {
      if (localStorage.getItem("Winner") !== undefined) {
        winnerList = JSON.parse(localStorage.getItem("Winner") || '[]');
      }
    } 
    winnerList.push({
      PrizeName: prizeName,
      PersonName: personName,
      PrizeNo: prizeIndex
    });
    localStorage.setItem("Winner", JSON.stringify(winnerList));
  }
  
  /** Triggers cconfeetti animation until animation is canceled */
  const confettiAnimation = () => {
    const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
    const confettiScale = Math.max(0.5, Math.min(1, windowWidth / 1100));

    customConfetti({
      particleCount: 1,
      gravity: 0.8,
      spread: 90,
      origin: { y: 0.6 },
      colors: [CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]],
      scalar: confettiScale
    });

    confettiAnimationId = window.requestAnimationFrame(confettiAnimation);
  };

  /** Function to stop the winning animation */
  const stopWinningAnimation = () => {
    if (confettiAnimationId) {
      window.cancelAnimationFrame(confettiAnimationId);
    }
    sunburstSvg.style.display = 'none';
  };

  /**  Function to be trigger before spinning */
  const onSpinStart = () => {
    stopWinningAnimation();
    drawButton.disabled = true;
    settingsButton.disabled = true;
    soundEffects.spin((MAX_REEL_ITEMS - 1) / 10);
  };

  /**  Functions to be trigger after spinning */
  const onSpinEnd = async () => {
    confettiAnimation();
    sunburstSvg.style.display = 'block';
    await soundEffects.win();
    confirmButton.disabled = false;
    drawButton.disabled = false;
    settingsButton.disabled = false;
  };

  /** Slot instance */
  const slot = new Slot({
    reelContainerSelector: '#reel',
    maxReelItems: MAX_REEL_ITEMS,
    onSpinStart,
    onSpinEnd,
    onNameListChanged: stopWinningAnimation
  });

  /** To open the setting page */
  const onSettingsOpen = () => {
    nameListTextArea.value = slot.names.length ? slot.names.join('\n') : '';
    removeNameFromListCheckbox.checked = slot.shouldRemoveWinnerFromNameList;
    enableSoundCheckbox.checked = soundEffects.mute;
    settingsWrapper.style.display = 'block';
  };

  /** To close the setting page */
  const onSettingsClose = () => {
    settingsContent.scrollTop = 0;
    settingsWrapper.style.display = 'none';
  };

  const onSettingsStorageClear = () => {
    localStorage.removeItem("Winner");
    localStorage.removeItem("PrizeIndex");
    settingsContent.scrollTop = 0;
    settingsWrapper.style.display = 'none';
    window.location.reload();
  };

  /** To open the winner page */
  const onWinnerOpen = () => {
    let names = "PrizeNo,PrizeName,PersonName\n";
    let winnerList = JSON.parse(localStorage.getItem("Winner") || '[]');
    winnerList.forEach(winObj => {
      names += (totalPrize - winObj['PrizeNo']) + ',' + winObj['PrizeName'] + ',' + winObj['PersonName'] + '\n';
    });
    winnerListTextArea.value = names;
    winnerWrapper.style.display = 'block';
  };

  /** To close the winner page */
  const onWinnerClose = () => {
    winnerWrapper.scrollTop = 0;
    winnerWrapper.style.display = 'none';
  };

  // Click handler for "Draw" button
  drawButton.addEventListener('click', () => {
    if (!slot.names.length) {
      onSettingsOpen();
      return;
    }

    slot.spin();
  });

  // Click handler for "Confirm" button
  confirmButton.addEventListener('click', () => {
    savePersonPrize();

    prizeIndex = prizeIndex + 1;
    localStorage.setItem("PrizeIndex", prizeIndex.toString());

    console.log("PrizeIndex: " + localStorage.getItem("PrizeIndex"));
    
    let reelContainer = document.querySelector('#reel') as HTMLElement | null;
    if (reelContainer instanceof HTMLElement) {
      reelContainer.classList.add("hidden")
    }
    stopWinningAnimation();
    showPrizeName();

    if (prizeIndex === totalPrize) {
      drawButton.disabled = true;
    }
    confirmButton.disabled = true;
  });

  // Hide fullscreen button when it is not supported
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - for older browsers support
  if (!(document.documentElement.requestFullscreen && document.exitFullscreen)) {
    fullscreenButton.remove();
  }

  // Click handler for "Fullscreen" button
  fullscreenButton.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      return;
    }

    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  });

  // Click handler for "Settings" button
  settingsButton.addEventListener('click', onSettingsOpen);

  // Click handler for "Save" button for setting page
  settingsSaveButton.addEventListener('click', () => {
    slot.names = nameListTextArea.value
      ? nameListTextArea.value.split(/\n/).filter((name) => Boolean(name.trim()))
      : [];
    slot.shouldRemoveWinnerFromNameList = removeNameFromListCheckbox.checked;
    soundEffects.mute = !enableSoundCheckbox.checked;
    onSettingsClose();
  });

  // Click handler for "Discard and close" button for setting page
  settingsCloseButton.addEventListener('click', onSettingsClose);

  // Click handler for "Clear Storage" button for setting page
  settingsStorageClearButton.addEventListener('click', onSettingsStorageClear);

  winnerButton.addEventListener( 'click', onWinnerOpen );

  winnerCloseButton.addEventListener( 'click', onWinnerClose );
})();
