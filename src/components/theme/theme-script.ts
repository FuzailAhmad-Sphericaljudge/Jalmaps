/**
 * Inline script injected in <head> before paint: reads the theme cookie and
 * sets `color-scheme` + the `.dark` class on <html>, falling back to the
 * system preference. Tiny, dependency-free, runs synchronously — no flash.
 */
export const THEME_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )jalmaps-theme=([^;]*)/);var t=m?JSON.parse(decodeURIComponent(m[1])).theme:"system";if(t!=="light"&&t!=="dark"&&t!=="system"){t="system";}var e=t==="system"?(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;document.documentElement.classList.toggle("dark",e==="dark");document.documentElement.style.colorScheme=e;var s=document.cookie.match(/(?:^|; )jalmaps-text-size=([^;]*)/);var z=s?decodeURIComponent(s[1]):"normal";if(z==="large"||z==="extraLarge"||z==="normal"){document.documentElement.dataset.textSize=z;}var hc=document.cookie.match(/(?:^|; )jalmaps-high-contrast=([^;]*)/);var isHc=hc?decodeURIComponent(hc[1])==="true":false;document.documentElement.classList.toggle("theme-high-contrast",isHc);document.documentElement.classList.toggle("theme-large-text",z==="large"||z==="extraLarge");}catch(e){}})();`;
