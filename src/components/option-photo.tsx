import { getOptionPhoto } from "../lib/option-images";

export function OptionPhoto({ label }: { label: string }) {
  const src = getOptionPhoto(label);
  if (!src) return null;
  return <img src={src} alt="" loading="lazy" decoding="async" className="option-photo" />;
}
