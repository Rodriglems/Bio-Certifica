import { speak, stopSpeaking } from "./tts";

export const READ_ALOUD_STORAGE_KEY = "biocertifica-read-aloud";

const READABLE_SELECTOR = "[data-speak], label, legend, h1, h2, h3, h4, form p";
const NOT_READABLE_SELECTOR = "button, a, [role='button'], [data-no-speak]";
const TEXT_FIELD_SELECTOR = "input:not([type='radio']):not([type='checkbox']), textarea, select";
const REPEAT_WINDOW_MS = 500;

function textOf(element: Element | null | undefined) {
  return (element?.textContent ?? "").replace(/\s+/g, " ").trim();
}

function questionForField(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  const ownLabel = textOf(field.labels?.[0]) || field.getAttribute("aria-label");
  if (ownLabel) return ownLabel;

  // Muitas perguntas são um <label> solto logo antes do campo, às vezes com um wrapper no meio.
  let current: Element | null = field;
  for (let depth = 0; current && depth < 3; depth++) {
    let sibling = current.previousElementSibling;
    while (sibling) {
      if (sibling.matches("label, legend, h1, h2, h3, h4")) return textOf(sibling);
      sibling = sibling.previousElementSibling;
    }
    current = current.parentElement;
  }

  return "placeholder" in field ? field.placeholder : "";
}

function textToRead(target: Element) {
  const explicit = target.closest("[data-speak]");
  if (explicit) return explicit.getAttribute("data-speak") || textOf(explicit);
  if (target.closest(NOT_READABLE_SELECTOR)) return "";

  const field = target.closest(TEXT_FIELD_SELECTOR) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement
    | null;
  if (field) return questionForField(field);

  return textOf(target.closest(READABLE_SELECTOR));
}

/** Liga a leitura ao tocar em perguntas e opções. Devolve a função que desliga. */
export function installReadAloud() {
  let lastText = "";
  let lastAt = 0;

  const say = (text: string) => {
    const now = Date.now();
    // Tocar em um <label> gera um segundo clique no <input> associado.
    if (text === lastText && now - lastAt < REPEAT_WINDOW_MS) return;
    lastText = text;
    lastAt = now;
    speak(text);
  };

  const handleClick = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const text = textToRead(event.target);
    if (text) say(text);
  };

  const handleChange = (event: Event) => {
    if (event.target instanceof HTMLSelectElement) {
      say(textOf(event.target.selectedOptions[0]));
    }
  };

  // Na captura, o texto é lido antes de o React trocar de tela.
  document.addEventListener("click", handleClick, true);
  document.addEventListener("change", handleChange, true);
  document.documentElement.classList.add("read-aloud");

  return () => {
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("change", handleChange, true);
    document.documentElement.classList.remove("read-aloud");
    stopSpeaking();
  };
}
