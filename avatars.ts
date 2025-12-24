// A collection of simple, fun, colorful, ANIMATED SVG avatars.
// Each SVG is base64 encoded to be used directly in an `img` src attribute.
// The nodding animation is embedded within the SVG.

const svgToDataUrl = (svg: string): string => {
  const style = `
    <style>
      .avatar-head {
        animation: nod 4s ease-in-out infinite;
      }
      @keyframes nod {
        0%, 100% { transform: rotate(0); }
        10% { transform: rotate(5deg); }
        20% { transform: rotate(-3deg); }
        30% { transform: rotate(2deg); }
        40%, 80% { transform: rotate(0); }
      }
    </style>
  `;
  // The <g class="avatar-head"> must be present in the SVG string.
  // The style tag with keyframes will be injected.
  const modifiedSvg = svg.replace('>', `>${style}`);
  const encoded = btoa(modifiedSvg);
  return `data:image/svg+xml;base64,${encoded}`;
};

// New collection of human-like avatars
const avatarSvgs = [
  // 1. Woman with bun
  `<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="36" height="36" rx="18" fill="#FEE2E2"></rect><g class="avatar-head" style="transform-origin: 18px 24px; animation-delay: -0.1s;"><path d="M18 10C12 10 10 16 10 18C10 24.5 13 29 18 29C23 29 26 24.5 26 18C26 16 24 10 18 10Z" fill="#F2C1A5"></path><path d="M18 9C14 9 12 11 12 14V17H24V14C24 11 22 9 18 9Z" fill="#4A3731"></path><circle cx="18" cy="7" r="3" fill="#4A3731"></circle><circle cx="15" cy="19" r="1.5" fill="#4A3731"></circle><circle cx="21" cy="19" r="1.5" fill="#4A3731"></circle><path d="M17 24H19" stroke="#4A3731" stroke-width="1.5" stroke-linecap="round"></path></g></svg>`,
  // 2. Man with glasses
  `<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="36" height="36" rx="18" fill="#FEEAE0"></rect><g class="avatar-head" style="transform-origin: 18px 24px; animation-delay: -0.2s;"><path d="M11 18C11 24.0751 14.134 29 18 29C21.866 29 25 24.0751 25 18C25 11.9249 21.866 7 18 7C14.134 7 11 11.9249 11 18Z" fill="#E4A98E"></path><path d="M11 14C11 11.2386 14.134 9 18 9C21.866 9 25 11.2386 25 14V16H11V14Z" fill="#2D3748"></path><rect x="13" y="17" width="4" height="3" rx="1" fill="none" stroke="#2D3748" stroke-width="1.5"></rect><rect x="19" y="17" width="4" height="3" rx="1" fill="none" stroke="#2D3748" stroke-width="1.5"></rect><line x1="17" y1="18.5" x2="19" y2="18.5" stroke="#2D3748" stroke-width="1.5"></line><path d="M17 24H19" stroke="#2D3748" stroke-width="1.5" stroke-linecap="round"></path></g></svg>`,
  // 3. Woman with curly hair
  `<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="36" height="36" rx="18" fill="#D1FAE5"></rect><g class="avatar-head" style="transform-origin: 18px 24px; animation-delay: -0.3s;"><path d="M11 18C11 24.0751 14.134 29 18 29C21.866 29 25 24.0751 25 18C25 11.9249 21.866 7 18 7C14.134 7 11 11.9249 11 18Z" fill="#A8755B"></path><circle cx="12" cy="14" r="4" fill="#D97706"></circle><circle cx="24" cy="14" r="4" fill="#D97706"></circle><circle cx="18" cy="10" r="5" fill="#D97706"></circle><circle cx="15" cy="19" r="1.5" fill="white"></circle><circle cx="21" cy="19" r="1.5" fill="white"></circle><path d="M17 24H19" stroke="white" stroke-width="1.5" stroke-linecap="round"></path></g></svg>`,
  // 4. Man with beard
  `<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="36" height="36" rx="18" fill="#FEF3C7"></rect><g class="avatar-head" style="transform-origin: 18px 24px; animation-delay: -0.4s;"><path d="M11 18C11 24.0751 14.134 29 18 29C21.866 29 25 24.0751 25 18C25 11.9249 21.866 7 18 7C14.134 7 11 11.9249 11 18Z" fill="#F2C1A5"></path><path d="M11 14C11 11.2386 14.134 9 18 9C21.866 9 25 11.2386 25 14V16H11V14Z" fill="#B45309"></path><path d="M12 22C12 25.866 14.6863 29 18 29C21.3137 29 24 25.866 24 22H12Z" fill="#B45309"></path><circle cx="15" cy="18" r="1" fill="#2D3748"></circle><circle cx="21" cy="18" r="1" fill="#2D3748"></circle><path d="M17 23H19" stroke="#F2C1A5" stroke-width="1.5" stroke-linecap="round"></path></g></svg>`,
  // 5. Woman with hijab
  `<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="36" height="36" rx="18" fill="#F3E8FF"></rect><g class="avatar-head" style="transform-origin: 18px 24px; animation-delay: -0.5s;"><path d="M18 6C11 6 8 13 8 18C8 25 11 30 18 30C25 30 28 25 28 18C28 13 25 6 18 6Z" fill="#A855F7"></path><path d="M18 9C13 9 11 14 11 18C11 23 13 27 18 27C23 27 25 23 25 18C25 14 23 9 18 9Z" fill="#E4A98E"></path><circle cx="15" cy="19" r="1.5" fill="#2D3748"></circle><circle cx="21" cy="19" r="1.5" fill="#2D3748"></circle><path d="M17 24H19" stroke="#2D3748" stroke-width="1.5" stroke-linecap="round"></path></g></svg>`,
  // 6. Man with cap
  `<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="36" height="36" rx="18" fill="#F0F9FF"></rect><g class="avatar-head" style="transform-origin: 18px 24px; animation-delay: -0.6s;"><path d="M11 18C11 24.0751 14.134 29 18 29C21.866 29 25 24.0751 25 18C25 11.9249 21.866 7 18 7C14.134 7 11 11.9249 11 18Z" fill="#A8755B"></path><path d="M10 16C10 11.5817 13.5817 8 18 8C22.4183 8 26 11.5817 26 16V18H10V16Z" fill="#0EA5E9"></path><path d="M26 16H30V14H26V16Z" fill="#0EA5E9"></path><circle cx="15" cy="20" r="1" fill="#1F2937"></circle><circle cx="21" cy="20" r="1" fill="#1F2937"></circle><path d="M17 25C17 24.4477 17.4477 24 18 24C18.5523 24 19 24.4477 19 25" stroke="#1F2937" stroke-width="1.5" stroke-linecap="round"></path></g></svg>`,
  // 7. Woman with short hair
  `<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="36" height="36" rx="18" fill="#FFFBEB"></rect><g class="avatar-head" style="transform-origin: 18px 24px; animation-delay: -0.7s;"><path d="M11 18C11 24.0751 14.134 29 18 29C21.866 29 25 24.0751 25 18C25 11.9249 21.866 7 18 7C14.134 7 11 11.9249 11 18Z" fill="#F2C1A5"></path><path d="M18 8C13 8 11 12 11 15L12 19H24L25 15C25 12 23 8 18 8Z" fill="#FBBF24"></path><circle cx="15" cy="20" r="1.5" fill="#4A3731"></circle><circle cx="21" cy="20" r="1.5" fill="#4A3731"></circle><path d="M17 25H19" stroke="#4A3731" stroke-width="1.5" stroke-linecap="round"></path></g></svg>`,
  // 8. Man with spiked hair
  `<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="36" height="36" rx="18" fill="#ECFDF5"></rect><g class="avatar-head" style="transform-origin: 18px 24px; animation-delay: -0.8s;"><path d="M11 18C11 24.0751 14.134 29 18 29C21.866 29 25 24.0751 25 18C25 11.9249 21.866 7 18 7C14.134 7 11 11.9249 11 18Z" fill="#E4A98E"></path><path d="M12 16L15 8L18 12L21 8L24 16H12Z" fill="#4A5568"></path><circle cx="15" cy="19" r="1" fill="#1F2937"></circle><circle cx="21" cy="19" r="1" fill="#1F2937"></circle><path d="M16 24H20" stroke="#1F2937" stroke-width="1.5" stroke-linecap="round"></path></g></svg>`,
  // 9. Woman with side part
  `<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="36" height="36" rx="18" fill="#FEF2F2"></rect><g class="avatar-head" style="transform-origin: 18px 24px; animation-delay: -0.9s;"><path d="M11 18C11 24.0751 14.134 29 18 29C21.866 29 25 24.0751 25 18C25 11.9249 21.866 7 18 7C14.134 7 11 11.9249 11 18Z" fill="#A8755B"></path><path d="M12 8C12 8 13 18 10 18C13 18 14 8 14 8L25 10C25 10 24 20 26 19C24 20 25 10 25 10L12 8Z" fill="#1F2937"></path><circle cx="15" cy="20" r="1.5" fill="white"></circle><circle cx="21" cy="20" r="1.5" fill="white"></circle><path d="M18 25C18.5523 25 19 24.5523 19 24H17C17 24.5523 17.4477 25 18 25Z" fill="white"></path></g></svg>`,
  // 10. Man with headphones
  `<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="36" height="36" rx="18" fill="#FFF5F0"></rect><g class="avatar-head" style="transform-origin: 18px 24px; animation-delay: -1.0s;"><path d="M11 18C11 24.0751 14.134 29 18 29C21.866 29 25 24.0751 25 18C25 11.9249 21.866 7 18 7C14.134 7 11 11.9249 11 18Z" fill="#F2C1A5"></path><path d="M10 18C10 13.5817 13.5817 10 18 10C22.4183 10 26 13.5817 26 18" stroke="#F37037" stroke-width="3" stroke-linecap="round"></path><rect x="9" y="17" width="4" height="5" rx="2" fill="#F37037"></rect><rect x="23" y="17" width="4" height="5" rx="2" fill="#F37037"></rect><path d="M11 14C11 11.2386 14.134 9 18 9C21.866 9 25 11.2386 25 14H22V12H14V14H11Z" fill="#713F12"></path><circle cx="15" cy="19" r="1" fill="#1F2937"></circle><circle cx="21" cy="19" r="1" fill="#1F2937"></circle><path d="M16 24H20" stroke="#1F2937" stroke-width="1.5" stroke-linecap="round"></path></g></svg>`,
  // 11. Woman with headband
  `<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="36" height="36" rx="18" fill="#F0FDFA"></rect><g class="avatar-head" style="transform-origin: 18px 24px; animation-delay: -1.1s;"><path d="M11 18C11 24.0751 14.134 29 18 29C21.866 29 25 24.0751 25 18C25 11.9249 21.866 7 18 7C14.134 7 11 11.9249 11 18Z" fill="#A8755B"></path><path d="M10 12L12 20H24L26 12C26 9.79086 22.4183 8 18 8C13.5817 8 10 9.79086 10 12Z" fill="#6D28D9"></path><path d="M10 14H26" stroke="#F472B6" stroke-width="2"></path><circle cx="15" cy="20" r="1.5" fill="white"></circle><circle cx="21" cy="20" r="1.5" fill="white"></circle><path d="M17 25H19" stroke="white" stroke-width="1.5" stroke-linecap="round"></path></g></svg>`,
  // 12. Man with mustache
  `<svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="36" height="36" rx="18" fill="#F5F5F4"></rect><g class="avatar-head" style="transform-origin: 18px 24px; animation-delay: -1.2s;"><path d="M11 18C11 24.0751 14.134 29 18 29C21.866 29 25 24.0751 25 18C25 11.9249 21.866 7 18 7C14.134 7 11 11.9249 11 18Z" fill="#E4A98E"></path><path d="M12 12C12 9.79086 14.6863 8 18 8C21.3137 8 24 9.79086 24 12V14H12V12Z" fill="#44403C"></path><path d="M14 22C14 21.4477 15.3431 21 17 21H19C20.6569 21 22 21.4477 22 22C22 22.5523 20.6569 23 19 23H17C15.3431 23 14 22.5523 14 22Z" fill="#44403C"></path><circle cx="15" cy="18" r="1" fill="#1F2937"></circle><circle cx="21" cy="18" r="1" fill="#1F2937"></circle><path d="M18 26C18.5523 26 19 25.5523 19 25H17C17 25.5523 17.4477 26 18 26Z" fill="#1F2937"></path></g></svg>`,
];


export const AVATARS = avatarSvgs.map(svgToDataUrl);