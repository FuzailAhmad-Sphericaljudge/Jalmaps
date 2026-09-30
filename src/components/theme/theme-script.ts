/**
 * Inline script injected in <head> before paint: reads the theme cookie and
 * sets `color-scheme` + the `.dark` class on <html>, falling back to the
 * system preference. Tiny, dependency-free, runs synchronously — no flash.
 */
export const THEME_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )jalmaps-theme=([^;]*)/);var t=m?JSON.parse(decodeURIComponent(m[1])).theme:null;if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.classList.toggle("dark",t==="dark");document.documentElement.style.colorScheme=t;}catch(e){}})();`;
