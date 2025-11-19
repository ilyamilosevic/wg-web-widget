export class Tooltip extends HTMLElement {
  static get observedAttributes() {
    return ["open", "stayOpen", "placement", "boundary-selector", "offset", "for"];
  }

  constructor() {
    super();

    this.attachShadow({ mode: "open" });

    this.shadowRoot.innerHTML = `
        <style>
          :host {
            --bg-color: #2A2A2AE5;

            position: absolute;
            z-index: 1000;
            pointer-events: none;
            display: none;
          }
          
          :host([open]) {
            display: block;
          }
          
          .tooltip {
            position: relative;
            box-sizing: border-box;
            padding: 32px 40px;
            background-color: var(--bg-color);
            border: 1px solid #747474;
            color: #fff;
            font-size: 14px;
            line-height: 1.4;
            width: 672px;
            pointer-events: auto;
          }
          
          .arrow {
            position: absolute;
            width: 0;
            height: 0;
            border-style: solid;
          }

          .arrow[data-placement="top"] {
            bottom: -46px;
            left: 50%;
            transform: translateX(-50%);
            border-width: 46px 33px 0 33px;
            border-color: #747474 transparent transparent transparent;
          }

          .arrow[data-placement="top"]::before {
            content: '';
            position: absolute;
            bottom: 1px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 45px 32.5px 0 32.5px;
            border-color: #2A2A2A transparent transparent transparent;
          }
          
          .arrow[data-placement="bottom"] {
            top: -46px;
            left: 50%;
            transform: translateX(-50%);
            border-width: 0 33px 46px 33px;
            border-color: transparent transparent #747474 transparent;
          }

          .arrow[data-placement="bottom"]::before {
            content: '';
            position: absolute;
            top: 1px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 0 32.5px 45px 32.5px;
            border-color: transparent transparent #2A2A2A transparent;
          }
        </style>
  
        <div class="tooltip">
          <slot></slot>
          <div class="arrow"></div>
        </div>
      `;

    this.tooltipEl = this.shadowRoot.querySelector(".tooltip");
    this.arrowEl = this.shadowRoot.querySelector(".arrow");

    this.stayOpen = this.hasAttribute("stay-open");

    this.targetEl = null;
    this.boundaryEl = null;
    this.eventHandlers = [];
    this.placement = "top";
    this.offset = 45;
    this.hideTimeout = null;
  }

  connectedCallback() {
    this._resolveTarget();

    this._resolveBoundary();

    this._attachEvents();

    this.placement = this.getAttribute("placement") || "top";
    this.offset = parseInt(this.getAttribute("offset") || this.offset, 10);

    if (this.hasAttribute("open")) {
      this.show();
    }
  }

  disconnectedCallback() {
    this._removeEvents();
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === "open") {
      if (newValue !== null) {
        this.show();
      } else {
        this.hide();
      }
    } else if (name === "placement") {
      this.placement = newValue || "auto";
      if (this.hasAttribute("open")) {
        this._updatePosition();
      }
    } else if (name === "boundary-selector") {
      this._resolveBoundary();
      if (this.hasAttribute("open")) {
        this._updatePosition();
      }
    } else if (name === "offset") {
      this.offset = parseInt(newValue || "10", 10);
      if (this.hasAttribute("open")) {
        this._updatePosition();
      }
    } else if (name === "for") {
      this._removeEvents();
      this._resolveTarget();
      this._attachEvents();
      if (this.hasAttribute("open")) {
        this._updatePosition();
      }
    }
  }

  show() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    if (!this.targetEl) {
      this._resolveTarget();
    }
    if (!this.boundaryEl) {
      this._resolveBoundary();
    }

    this.setAttribute("open", "");
    this._updatePosition();
  }

  hide() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    if (this.stayOpen) {
      return;
    }

    this.removeAttribute("open");
  }

  _scheduleHide() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    this.hideTimeout = setTimeout(() => {
      this.hide();
      this.hideTimeout = null;
    }, 100);
  }

  _resolveTarget() {
    const forAttr = this.getAttribute("for");

    this.targetEl = document.getElementById(forAttr);
    if (!this.targetEl) {
      try {
        this.targetEl = document.querySelector(forAttr);
      } catch (e) {
        console.warn("Invalid selector for tooltip target:", forAttr);
      }
    }
  }

  _resolveBoundary() {
    const boundarySelector = this.getAttribute("boundary-selector");
    if (boundarySelector) {
      try {
        this.boundaryEl = document.querySelector(boundarySelector);
        if (!this.boundaryEl) {
          let parent = this.parentElement;
          while (parent && !this.boundaryEl) {
            if (parent.matches && parent.matches(boundarySelector)) {
              this.boundaryEl = parent;
              break;
            }
            parent = parent.parentElement;
          }
        }
      } catch (e) {
        console.warn("Invalid boundary selector:", boundarySelector);
      }
    }

    if (!this.boundaryEl) {
      this.boundaryEl = document.body;
    }
  }

  _attachEvents() {
    if (!this.targetEl) return;

    const showHandler = () => this.show();
    const hideHandler = () => this._scheduleHide();
    const updatePositionHandler = () => {
      if (this.hasAttribute("open")) {
        this._updatePosition();
      }
    };

    this.targetEl.addEventListener("mouseenter", showHandler);
    this.targetEl.addEventListener("mouseleave", hideHandler);

    const tooltipEnterHandler = () => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    };
    const tooltipLeaveHandler = () => {
      this._scheduleHide();
    };

    this.tooltipEl.addEventListener("mouseenter", tooltipEnterHandler);
    this.tooltipEl.addEventListener("mouseleave", tooltipLeaveHandler);

    this.targetEl.addEventListener("focus", showHandler);
    this.targetEl.addEventListener("blur", hideHandler);

    if (this.boundaryEl) {
      this.boundaryEl.addEventListener("scroll", updatePositionHandler);
      window.addEventListener("resize", updatePositionHandler);
    }

    this.eventHandlers = [
      { element: this.targetEl, event: "mouseenter", handler: showHandler },
      { element: this.targetEl, event: "mouseleave", handler: hideHandler },
      { element: this.targetEl, event: "focus", handler: showHandler },
      { element: this.targetEl, event: "blur", handler: hideHandler },
      { element: this.tooltipEl, event: "mouseenter", handler: tooltipEnterHandler },
      { element: this.tooltipEl, event: "mouseleave", handler: tooltipLeaveHandler },
    ];

    if (this.boundaryEl) {
      this.eventHandlers.push(
        { element: this.boundaryEl, event: "scroll", handler: updatePositionHandler },
        { element: window, event: "resize", handler: updatePositionHandler }
      );
    }
  }

  _removeEvents() {
    this.eventHandlers.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventHandlers = [];
  }

  _updatePosition() {
    if (!this.targetEl || !this.boundaryEl || !this.tooltipEl) return;

    const wasHidden = !this.hasAttribute("open");
    if (wasHidden) {
      this.style.visibility = "hidden";
      this.style.display = "block";
    }

    const targetRect = this.targetEl.getBoundingClientRect();
    const tooltipRect = this.tooltipEl.getBoundingClientRect();
    const boundaryRect = this.boundaryEl.getBoundingClientRect();

    let x = 0;
    let y = 0;
    let arrowX = 0;
    let arrowY = 0;
    let finalPlacement = this.placement;

    const preferredPlacement = this.placement;
    const alternativePlacements = ["top", "bottom"].filter(p => p !== preferredPlacement);
    const placementsToTry = [preferredPlacement, ...alternativePlacements];

    let bestPlacement = preferredPlacement;
    let bestScore = -Infinity; 

    for (const placement of placementsToTry) {
      let candidateX, candidateY;

      switch (placement) {
        case "top":
          candidateX = targetRect.left - boundaryRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
          candidateY = targetRect.top - boundaryRect.top - tooltipRect.height - this.offset;
          break;
        case "bottom":
          candidateX = targetRect.left - boundaryRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
          candidateY = targetRect.top - boundaryRect.top + targetRect.height + this.offset;
          break;
      }

      const minX = 0;
      const maxX = boundaryRect.width - tooltipRect.width;
      const minY = 0;
      const maxY = boundaryRect.height - tooltipRect.height;

      const clampedX = Math.max(minX, Math.min(maxX, candidateX));
      const clampedY = Math.max(minY, Math.min(maxY, candidateY));

      const adjustmentX = Math.abs(candidateX - clampedX);
      const adjustmentY = Math.abs(candidateY - clampedY);
      const totalAdjustment = adjustmentX + adjustmentY;

      const isPreferred = placement === preferredPlacement;
      const score = isPreferred ? 100 - totalAdjustment : -totalAdjustment;

      if (score > bestScore) {
        bestScore = score;
        bestPlacement = placement;
        x = clampedX;
        y = clampedY;
      }
    }

    finalPlacement = bestPlacement;

    const targetCenterX = targetRect.left - boundaryRect.left + (targetRect.width / 2);

    arrowX = targetCenterX - x;

    this.style.left = `${x + window.pageXOffset + boundaryRect.left}px`;
    this.style.top = `${y + window.pageYOffset + boundaryRect.top}px`;

    if (wasHidden) {
      this.style.visibility = "";
      this.style.display = "";
    }

    this.arrowEl.setAttribute("data-placement", finalPlacement);

    if (finalPlacement === "top" || finalPlacement === "bottom") {
      this.arrowEl.style.left = `${arrowX}px`;
      this.arrowEl.style.top = "";
      this.arrowEl.style.transform = "translateX(-50%)";
    } else {
      this.arrowEl.style.top = `${arrowY}px`;
      this.arrowEl.style.left = "";
      this.arrowEl.style.transform = "translateY(-50%)";
    }
  }
}