import { encode } from "uqr";

interface QrCodeProps {
  value: string;
  //testo per i lettori di schermo
  label: string;
  className?: string;
}

//QR code in SVG, sempre nero su bianco (col tema scuro e in stampa resta leggibile).
//Il bordo bianco di 2 moduli serve ai telefoni per riconoscerlo
export const QrCode = ({ value, label, className }: QrCodeProps) => {
  const { data, size } = encode(value, { ecc: "M", border: 2 });
  const path = data
    .flatMap((row, y) =>
      row.map((dark, x) => (dark ? `M${x} ${y}h1v1h-1z` : "")),
    )
    .join("");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={className}
    >
      <rect width={size} height={size} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  );
};
