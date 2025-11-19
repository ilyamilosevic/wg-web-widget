export class CustomSlider extends HTMLElement {
    static get observedAttributes() {
        return ["value", "min", "max", "step"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.shadowRoot.innerHTML = `
      <style>
        :host {
          width: 100%;
          border-radius: 4px;
          --border-width: 1px;
        }

        * {
        }

        .slider-wrapper {
            position: relative;
            width: 100%;
            padding: 22px;
            background: linear-gradient(180deg, #4F4F4F 0%, #313131 100%);
            border-radius: 4px;
        }

        .slider-container {
          position: relative;
          width: 100%;
          cursor: pointer;
          height: 5px;
        }

        * {
            box-sizing: border-box;
        }

        .slider-underlay {
            border-width: 1px;
            padding: 4px;
            border-radius: 6px;
            background: linear-gradient(180deg, #262626 0%, #303030 100%);
        }

        .slider-track {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #1D1D1F;
          border-radius: 3px;
        }

        .slider-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(to bottom, #FFD100, #997D00);
          border-radius: 3px;
          pointer-events: none;
        }

        .slider-thumb {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 43px;
          height: 44px;
          background-image: url('/assets/slider-dot.png');
          background-repeat: no-repeat;
          background-position: center;
          cursor: grab;
          pointer-events: all;
          z-index: 1;
        }

        .slider-thumb:active {
          cursor: grabbing;
        }
      </style>

        <div class="slider-wrapper">
            <div class="slider-underlay">
                <div class="slider-container">
                    <div class="slider-track"></div>
                    <div class="slider-fill"></div>
                    <div class="slider-thumb"></div>
                </div>
            </div>
        </div>
    `;

        this.container = this.shadowRoot.querySelector(".slider-container");
        this.track = this.shadowRoot.querySelector(".slider-track");
        this.fill = this.shadowRoot.querySelector(".slider-fill");
        this.thumb = this.shadowRoot.querySelector(".slider-thumb");

        this._min = 0;
        this._max = 100;
        this._step = 1;
        this.isDragging = false;

        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleContainerTouchStart = this.handleContainerTouchStart.bind(this);
        this.touchStartX = null;
    }

    connectedCallback() {
        this._min = parseFloat(this.getAttribute("min") || "0");
        this._max = parseFloat(this.getAttribute("max") || "100");
        this._step = parseFloat(this.getAttribute("step") || "1");
        
        // Initialize value from attribute
        if (!this.hasAttribute("value")) {
            this.setAttribute("value", this._min);
        }

        this.thumb.addEventListener("mousedown", this.handleMouseDown);
        this.thumb.addEventListener("touchstart", this.handleTouchStart, { passive: false });
        this.container.addEventListener("click", this.handleClick);
        this.container.addEventListener("touchstart", this.handleContainerTouchStart, { passive: false });
        document.addEventListener("mousemove", this.handleMouseMove);
        document.addEventListener("mouseup", this.handleMouseUp);
        document.addEventListener("touchmove", this.handleTouchMove, { passive: false });
        document.addEventListener("touchend", this.handleTouchEnd);
        document.addEventListener("touchcancel", this.handleTouchEnd);

        this.updatePosition();
    }

    disconnectedCallback() {
        this.thumb.removeEventListener("mousedown", this.handleMouseDown);
        this.thumb.removeEventListener("touchstart", this.handleTouchStart);
        this.container.removeEventListener("click", this.handleClick);
        this.container.removeEventListener("touchstart", this.handleContainerTouchStart);
        document.removeEventListener("mousemove", this.handleMouseMove);
        document.removeEventListener("mouseup", this.handleMouseUp);
        document.removeEventListener("touchmove", this.handleTouchMove);
        document.removeEventListener("touchend", this.handleTouchEnd);
        document.removeEventListener("touchcancel", this.handleTouchEnd);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        if (name === "value") {
            this.updatePosition();
        } else if (name === "min") {
            this._min = parseFloat(newValue || "0");
            this.updatePosition();
        } else if (name === "max") {
            this._max = parseFloat(newValue || "100");
            this.updatePosition();
        } else if (name === "step") {
            this._step = parseFloat(newValue || "1");
        }
    }

    handleMouseDown(e) {
        e.preventDefault();
        this.isDragging = true;
        this.thumb.style.cursor = "grabbing";
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;

        const rect = this.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        this.setValueFromPercentage(percentage);
    }

    handleMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.thumb.style.cursor = "grab";
        }
    }

    handleClick(e) {
        if (e.target === this.thumb) return;

        const rect = this.container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        this.setValueFromPercentage(percentage);
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.isDragging = true;
    }

    handleContainerTouchStart(e) {
        if (e.target === this.thumb) return;
        
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        
        const rect = this.container.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        this.setValueFromPercentage(percentage);
        
        // Start dragging immediately when touching the container
        this.isDragging = true;
    }

    handleTouchMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();

        const touch = e.touches[0];
        const rect = this.container.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        this.setValueFromPercentage(percentage);
    }

    handleTouchEnd(e) {
        if (this.isDragging) {
            this.isDragging = false;
            this.touchStartX = null;
        }
    }

    setValueFromPercentage(percentage) {
        const rawValue = this._min + percentage * (this._max - this._min);
        const steppedValue = Math.round(rawValue / this._step) * this._step;
        const clampedValue = Math.max(this._min, Math.min(this._max, steppedValue));

        this.value = clampedValue;

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: { value: this.value },
                bubbles: true,
            })
        );

        this.dispatchEvent(
            new CustomEvent("input", {
                detail: { value: this.value },
                bubbles: true,
            })
        );
    }

    updatePosition() {
        const currentValue = parseFloat(this.getAttribute("value") || this._min);
        const percentage = (currentValue - this._min) / (this._max - this._min);
        const position = percentage * 100;

        this.fill.style.width = `${position}%`;
        this.thumb.style.left = `${position}%`;
    }

    // Getters and setters for properties
    get min() {
        return this._min;
    }

    set min(newValue) {
        this._min = parseFloat(newValue);
        this.setAttribute("min", this._min);
    }

    get max() {
        return this._max;
    }

    set max(newValue) {
        this._max = parseFloat(newValue);
        this.setAttribute("max", this._max);
    }

    get step() {
        return this._step;
    }

    set step(newValue) {
        this._step = parseFloat(newValue);
        this.setAttribute("step", this._step);
    }

    get value() {
        return parseFloat(this.getAttribute("value") || this._min);
    }

    set value(newValue) {
        const clampedValue = Math.max(this._min, Math.min(this._max, parseFloat(newValue)));
        this.setAttribute("value", clampedValue);
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = value;
    }
}

