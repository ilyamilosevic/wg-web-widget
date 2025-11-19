export class Modal extends HTMLElement {
  static get observedAttributes() {
    return ["open"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000;
        }

        :host([open]) {
          display: block;
        }

        * {
          box-sizing: border-box;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
          padding: 0;
          align-items: stretch;
        }

        .modal-container {
          position: relative;
          background-color: #2A2A2A;
          border: 1px solid #747474;
          border-radius: 4px;
          max-width: 100%;
          max-height: 100%;
          overflow-y: auto;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          border-radius: 0;
          border: none;
        }

        .modal-content {
          padding: 0 20px 20px;
        }

        .modal-header {
          width: 100%;
          height: 56px;
          top: 0;
          left: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 22px 20px 0;
        }

        .modal-close {
          background: #454540;
          color: #fff;
          cursor: pointer;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
          padding: 4px;
          border: none;
          border-radius: 4px;
        }

        .modal-title {
          font-family: Arial;
          font-weight: 700;
          font-style: bold;
          font-size: 28px;
          color: #B9B9B9;
        }

        .modal-close:hover {
          opacity: 0.7;
        }

        ::slotted(*) {
          display: block;
        }
      </style>

      <div class="modal-overlay">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title">T-34</div>
            <button class="modal-close" aria-label="Close">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 16 16"><path fill="#f9f5e1" fill-rule="evenodd" d="M6.095 8 .378 13.717a1.347 1.347 0 0 0 1.905 1.905L8 9.905l5.717 5.717a1.347 1.347 0 0 0 1.905-1.905L9.905 8l5.717-5.717A1.347 1.347 0 0 0 13.717.378L8 6.095 2.283.378A1.347 1.347 0 0 0 .378 2.283z" clip-rule="evenodd"/></svg>
            </button>
          </div>
          <div class="modal-content">
            <slot></slot>
          </div>
        </div>
      </div>
    `;

    this.overlay = this.shadowRoot.querySelector(".modal-overlay");
    this.closeButton = this.shadowRoot.querySelector(".modal-close");
    this.titleElement = this.shadowRoot.querySelector(".modal-title");

    this.handleClose = this.handleClose.bind(this);
    this.handleOverlayClick = this.handleOverlayClick.bind(this);
  }

  connectedCallback() {
    this.closeButton.addEventListener("click", this.handleClose);
    this.overlay.addEventListener("click", this.handleOverlayClick);

    if (this.hasAttribute("open")) {
      this.show();
    }
  }

  disconnectedCallback() {
    this.closeButton.removeEventListener("click", this.handleClose);
    this.overlay.removeEventListener("click", this.handleOverlayClick);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === "open") {
      if (newValue !== null) {
        this.show();
      } else {
        this.hide();
      }
    }
  }

  handleClose(e) {
    e.stopPropagation();
    this.hide();
  }

  handleOverlayClick(e) {
    if (e.target === this.overlay) {
      this.hide();
    }
  }

  show() {
    this.setAttribute("open", "");
    document.body.style.overflow = "hidden";
  }

  hide() {
    this.removeAttribute("open");
    document.body.style.overflow = "";
  }
}

