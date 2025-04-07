const O=function(){const t=navigator.userAgent;return t.indexOf("Firefox")>-1?"firefox":t.indexOf("Edge")>-1||t.indexOf("Edg")>-1?"edge":t.indexOf("Chrome")>-1?"chrome":t.indexOf("Safari")>-1?"safari":"unknown"}(),g=typeof browser<"u"?browser:chrome;let c=!1,u=null,i=null,s=null,r=null,p=null;function A(e,t){let o;return function(...n){clearTimeout(o),o=setTimeout(()=>e.apply(this,n),t)}}g.runtime.onMessage.addListener((e,t,o)=>(e.type==="ACTIVATE_SELECTION"&&(k(e.selectionType),o({success:!0})),e.type==="DEACTIVATE_SELECTION"&&(x(),o({success:!0})),e.type==="CHECK_COMPATIBILITY"&&o({success:!0,browser:O,isCompatible:!0,version:"1.0.0"}),!0));function k(e){X(),u=e,c=!0,i||D(),i.classList.remove("hidden"),document.body.classList.add("bolt-zapper-selection-mode"),e==="error"?(i.classList.add("bolt-zapper-error-selection"),i.classList.remove("bolt-zapper-code-selection")):(i.classList.add("bolt-zapper-code-selection"),i.classList.remove("bolt-zapper-error-selection")),document.addEventListener("click",C),document.addEventListener("keydown",L),s||I(),document.addEventListener("mouseover",T),document.addEventListener("mouseout",M),document.addEventListener("mousemove",v)}function x(){p&&(p.disconnect(),p=null),c=!1,u=null,i&&i.classList.add("hidden"),s&&s.classList.add("hidden"),document.querySelectorAll(".bolt-zapper-highlight").forEach(t=>t.classList.remove("bolt-zapper-highlight")),r=null,document.body.classList.remove("bolt-zapper-selection-mode"),document.removeEventListener("click",C),document.removeEventListener("keydown",L),document.removeEventListener("mouseover",T),document.removeEventListener("mouseout",M),document.removeEventListener("mousemove",v)}function D(){if(!document.getElementById("bolt-zapper-styles")){const t=document.createElement("style");t.id="bolt-zapper-styles",t.textContent=`
      .bolt-zapper-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        pointer-events: none;
        background: rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      
      .bolt-zapper-overlay.hidden {
        display: none;
      }
      
      .bolt-zapper-message {
        background: #1e1e2e;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        margin-bottom: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        pointer-events: none;
      }
      
      .bolt-zapper-error-selection .bolt-zapper-message {
        border-left: 4px solid #f43f5e;
      }
      
      .bolt-zapper-code-selection .bolt-zapper-message {
        border-left: 4px solid #3b82f6;
      }
      
      .bolt-zapper-selection-mode * {
        cursor: crosshair !important;
      }
      
      .bolt-zapper-highlight {
        outline: 2px dashed #f43f5e !important;
        outline-offset: 2px !important;
        position: relative;
      }
      
      .bolt-zapper-code-selection .bolt-zapper-highlight {
        outline: 2px dashed #3b82f6 !important;
      }

      .bolt-zapper-tooltip {
        position: fixed;
        background: #1e1e2e;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        pointer-events: none;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        transition: opacity 0.2s ease;
      }

      .bolt-zapper-tooltip.hidden {
        opacity: 0;
        visibility: hidden;
      }

      .bolt-zapper-error-selection .bolt-zapper-tooltip {
        border-left: 3px solid #f43f5e;
      }

      .bolt-zapper-code-selection .bolt-zapper-tooltip {
        border-left: 3px solid #3b82f6;
      }

      .bolt-zapper-pulse {
        animation: bolt-zapper-pulse 1.5s infinite;
      }

      @keyframes bolt-zapper-pulse {
        0% {
          outline-color: rgba(244, 63, 94, 0.6);
        }
        50% {
          outline-color: rgba(244, 63, 94, 1);
        }
        100% {
          outline-color: rgba(244, 63, 94, 0.6);
        }
      }

      .bolt-zapper-code-selection .bolt-zapper-pulse {
        animation: bolt-zapper-pulse-blue 1.5s infinite;
      }

      @keyframes bolt-zapper-pulse-blue {
        0% {
          outline-color: rgba(59, 130, 246, 0.6);
        }
        50% {
          outline-color: rgba(59, 130, 246, 1);
        }
        100% {
          outline-color: rgba(59, 130, 246, 0.6);
        }
      }
    `,document.head.appendChild(t)}i=document.createElement("div"),i.className="bolt-zapper-overlay hidden";const e=document.createElement("div");e.className="bolt-zapper-message",e.textContent="Click on an element to select it. Press ESC to cancel.",i.appendChild(e),document.body.appendChild(i)}function I(){s=document.createElement("div"),s.className="bolt-zapper-tooltip hidden",document.body.appendChild(s)}const v=A(R,50);function z(e,t,o){if(!s||!c)return;const n=e.textContent.trim(),a=n.length>100?n.substring(0,100)+"...":n;let l="";u==="error"?l=`Error message preview: ${a}`:l=`Code preview: ${a}`,s.textContent!==l&&(s.textContent=l),s.classList.remove("hidden");const d=s.getBoundingClientRect(),E=window.innerWidth,N=window.innerHeight;let f=t+15,m=o+15;f+d.width>E&&(f=E-d.width-10),m+d.height>N&&(m=o-d.height-10),s.style.transform=`translate(${f}px, ${m}px)`}function C(e){e.preventDefault(),e.stopPropagation();const t=e.target;let o="";u==="error"?o=S(t):o=B(t),t.classList.add("bolt-zapper-pulse"),setTimeout(()=>{t.classList.remove("bolt-zapper-pulse")},1e3),g.runtime.sendMessage({type:"SELECTION_COMPLETE",selectionType:u,content:o}),x()}function S(e){if(b(e))return e.textContent.trim();const t=e.textContent.trim();if(y(t))return t;let o=e,n=null,a=0;const l=10;for(;o&&o!==document.body&&a<l;){if(b(o)||y(o.textContent)){n=o;break}o=o.parentElement,a++}return n?n.textContent.trim():t}function b(e){const t=e.className.toLowerCase(),o=e.id?e.id.toLowerCase():"",n=e.getAttribute("role");return t.includes("error")||t.includes("exception")||t.includes("fail")||o.includes("error")||n==="alert"||e.hasAttribute("aria-errormessage")||e.getAttribute("aria-invalid")==="true"}const P=new RegExp("error|exception|failed|failure|invalid|undefined|null|cannot|unable to|not found|TypeError|ReferenceError|SyntaxError|RangeError","i");function y(e){return P.test(e)}function B(e){let t=_(e);if(t)return t.textContent.trim();const o=e.textContent.trim();return H(o),o}function _(e){if(h(e))return e;let t=e,o=0;const n=10;for(;t&&t!==document.body&&o<n;){if(h(t))return t;t=t.parentElement,o++}const a=document.querySelectorAll('pre, code, .code, [class*="code"], [class*="syntax"]');for(let l=0;l<a.length;l++){const d=a[l];if(d.contains(e))return d}return null}function h(e){const t=e.tagName.toLowerCase(),o=e.className.toLowerCase();return t==="pre"||t==="code"||o.includes("code")||o.includes("syntax")||o.includes("highlight")||e.hasAttribute("data-language")||e.hasAttribute("data-lang")}const w=[/[{\[\(].*[}\]\)]/,/function\s+\w+\s*\(.*\)/,/const\s+|let\s+|var\s+/,/=>/,/import\s+.*from\s+/,/class\s+\w+/,/if\s*\(.*\)/,/for\s*\(.*\)/,/\w+\s*=\s*\w+/,/return\s+\w+/];function H(e){for(let t=0;t<w.length;t++)if(w[t].test(e))return!0;return!1}function L(e){e.key==="Escape"&&(x(),g.runtime.sendMessage({type:"SELECTION_CANCELLED"}))}function T(e){c&&(r&&r!==e.target&&r.classList.remove("bolt-zapper-highlight"),e.target.classList.add("bolt-zapper-highlight"),r=e.target,z(e.target,e.clientX,e.clientY))}function M(e){c&&(!e.relatedTarget||!e.target.contains(e.relatedTarget))&&(e.target.classList.remove("bolt-zapper-highlight"),e.target===r&&(r=null))}function R(e){!c||!r||z(r,e.clientX,e.clientY)}function X(){window.location.hostname!=="bolt.new"&&!window.location.hostname.endsWith(".bolt.new")||(p&&p.disconnect(),p=new MutationObserver(W),p.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","id","style"]}))}function W(e){c&&r&&(document.contains(r)||(r=null));for(const t of e)t.type==="childList"&&c&&t.addedNodes.forEach(o=>{o.nodeType===Node.ELEMENT_NODE&&(u==="error"&&b(o)||u==="code"&&h(o))&&(o.classList.add("bolt-zapper-highlight"),r=o)})}
