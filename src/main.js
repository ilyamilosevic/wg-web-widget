import './styles.css';
import { Tooltip } from './components/Tooltip';
import { CustomSlider } from './components/CustomSlider';
import { Modal } from './components/Modal';
import { reactive, effect } from './lib/reactive';

customElements.define('wg-tooltip', Tooltip);
customElements.define('wg-slider', CustomSlider);
customElements.define('wg-modal', Modal);

function isMobile() {
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function init() {
    const state = reactive(
        { 
            currentId: 2,
            currentTank: null,
            tanks: {
                1: {
                    name: 'T-34',
                    type: 'standard',
                    points: 100,
                    exp: 100
                },
                2: {
                    name: 'KV-1',
                    type: 'premium',
                    points: 100,
                    exp: 100
                },
                3: {
                    name: 'T-150',
                    type: 'elite',
                    points: 200,
                    exp: 100
                },
                4: {
                    name: 'IS-3',
                    type: 'standard',
                    points: 100,
                    exp: 100
                },
                5: {
                    name: 'ST-1',
                    type: 'standard',
                    points: 100,
                    exp: 100
                },
                6: {
                    name: 'Object-752',
                    type: 'standard',
                    points: 100,
                    exp: 100
                }
            }
        }
    )

    state.currentTank = state.tanks[state.currentId];

    populateTanks(state);

    const mobile = isMobile();

    if (mobile) {
        initMobile(state);
    } else {
        initDesktop(state);
    }
}

function populateTanks(state) {
    const tanksContainer = document.querySelector('.tanks');
    if (!tanksContainer) return;

    const tanksHTML = Object.keys(state.tanks)
        .map(tankId => {
            const tank = state.tanks[tankId];
            return `
                <div class="tank" id="tank-${tankId}" data-id="${tankId}">
                    <img class="tank-image" src="./assets/tank.png" alt="tank ${tank.name}" />
                    <p class="tank-name">${tank.name}</p>
                </div>
            `;
        })
        .join('');

    tanksContainer.innerHTML = tanksHTML;
}

function initDesktop(state) {
    const tooltipContent = document.getElementById('tooltip-content-desktop');
    tooltipContent.classList.remove('hidden');

    const els = {
        root: tooltipContent,
        exp: document.getElementById('exp'),
        points: document.getElementById('points'),
        slider: document.getElementById('battles-slider'),
        type: document.getElementById("form-desktop").elements['tank-type']
    }

    initEffects(els, state);
    initEvents(els, state);    
    initWgTooltip(state);
}

function initMobile(state) {
    const modal = document.getElementById('wg-modal');
    const modalContent = document.getElementById('tooltip-content-mobile');
    const form = document.getElementById('form-mobile');

    if (!modal || !modalContent || !form) {
        return;
    }

    modalContent.classList.remove('hidden');

    const els = {
        root: modalContent,
        exp: document.getElementById('exp-mobile'),
        points: document.getElementById('points-mobile'),
        slider: document.getElementById('battles-slider-mobile'),
        type: form.elements['tank-type-mobile'],
        modal
    }

    initEffects(els, state);
    initEvents(els, state);
    initMobileModal(els, state);
}

function initEffects(els, state) {
    const factor = 3;

    const formulas = {
        standard: points => Math.round(points * factor),
        elite: points => Math.round(points * factor + points * factor * 10 / 100),
        premium: points => Math.round(points * factor + points * factor * 20 / 100)
    }

    effect(() => {
        const currentTank = state.currentTank;

        if (!currentTank) {
            return;
        }

        const formula = formulas[currentTank.type];

        els.exp.innerHTML = formula(currentTank.points);
        els.points.value = currentTank.points;
        els.slider.value = currentTank.points;
        els.type.value = currentTank.type;
    });
}

function initEvents(els, state) {
    els.points.addEventListener('keyup', e => {
        const currentTank = state.tanks[state.currentId];

        if (!currentTank) {
            return;
        }

        state.tanks[state.currentId] = { ...currentTank, points: parseInt(els.points.value) }
        state.currentTank = state.tanks[state.currentId];
    }, false);

    els.slider.addEventListener('change', e => {
        const currentTank = state.tanks[state.currentId];

        if (!currentTank) {
            return;
        }

        state.tanks[state.currentId] = { ...currentTank, points: parseInt(els.slider.value) }
        state.currentTank = state.tanks[state.currentId];
    });

    Array.prototype.forEach.call(els.type, (el) => el.addEventListener('change', e => {
        const currentTank = state.tanks[state.currentId];

        if (!currentTank) {
            return;
        }

        state.tanks[state.currentId] = { ...currentTank, type: e.target.value }
        state.currentTank = state.tanks[state.currentId];
    }));
}

function initWgTooltip(state) {
  const tooltip = document.getElementById('wg-tooltip');
  if (!tooltip) return;

  const tanksContainer = document.querySelector('.tanks');
  if (!tanksContainer) return;

  tanksContainer.addEventListener('mouseenter', (e) => {
    const tank = e.target.closest('.tank');
    if (tank) {
      tooltip.setAttribute('for', tank.id);

      state.currentTank = state.tanks[parseInt(tank.dataset.id)];
      state.currentId = parseInt(tank.dataset.id);

      setTimeout(() => {
        tooltip.show();
      }, 0);
    }
  }, true);
}

function initMobileModal(els, state) {
  const tanksContainer = document.querySelector('.tanks');
  if (!tanksContainer || !els.modal) return;

  tanksContainer.addEventListener('click', (e) => {
    const tank = e.target.closest('.tank');
    if (tank) {
      state.currentTank = state.tanks[parseInt(tank.dataset.id)];
      state.currentId = parseInt(tank.dataset.id);
      els.modal.title = state.currentTank.name;
      els.modal.show();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}