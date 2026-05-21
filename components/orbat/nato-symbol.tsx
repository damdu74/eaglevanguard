import React from "react"

const S = "#1a3c6e"   // couleur OTAN amis (bleu marine)
const SW = 2.2        // épaisseur trait

// Indicateurs de taille OTAN (au-dessus du rectangle)
export const NATO_SIZES: { value: string; label: string; marker: string }[] = [
  { value: "team",      label: "Équipe",    marker: "·" },
  { value: "squad",     label: "Groupe",    marker: "··" },
  { value: "section",   label: "Section",   marker: "I" },
  { value: "platoon",   label: "Peloton",   marker: "II" },
  { value: "company",   label: "Compagnie", marker: "III" },
  { value: "battalion", label: "Bataillon", marker: "X" },
  { value: "regiment",  label: "Régiment",  marker: "XX" },
  { value: "brigade",   label: "Brigade",   marker: "XXX" },
  { value: "division",  label: "Division",  marker: "XXXX" },
  { value: "corps",     label: "Corps",     marker: "XXXXX" },
]

// Types d'unités OTAN avec symboles et labels
export const NATO_TYPES: { value: string; label: string; category: string }[] = [
  // Commandement
  { value: "hq",            label: "Commandement (QG)",       category: "Commandement" },
  { value: "cp",            label: "Poste de commandement",   category: "Commandement" },
  // Infanterie
  { value: "infantry",      label: "Infanterie",              category: "Infanterie" },
  { value: "mechanized",    label: "Infanterie mécanisée",    category: "Infanterie" },
  { value: "motorized",     label: "Infanterie motorisée",    category: "Infanterie" },
  { value: "airborne",      label: "Aéroportée",              category: "Infanterie" },
  { value: "sf",            label: "Forces spéciales",        category: "Infanterie" },
  { value: "sniper",        label: "Tireur d'élite",          category: "Infanterie" },
  // Blindé
  { value: "armor",         label: "Blindé / Char",           category: "Blindé" },
  { value: "recce",         label: "Reconnaissance blindée",  category: "Blindé" },
  { value: "antitank",      label: "Anti-char",               category: "Blindé" },
  // Appui feux
  { value: "artillery",     label: "Artillerie",              category: "Appui feux" },
  { value: "mortar",        label: "Mortier",                 category: "Appui feux" },
  { value: "airdefense",    label: "Défense aérienne",        category: "Appui feux" },
  // Aviation
  { value: "aviation",      label: "Aviation / Hélicoptère",  category: "Aviation" },
  { value: "fixedwing",     label: "Aile fixe",               category: "Aviation" },
  // Soutien
  { value: "engineer",      label: "Génie",                   category: "Soutien" },
  { value: "medical",       label: "Médical / Santé",         category: "Soutien" },
  { value: "logistics",     label: "Logistique / Soutien",    category: "Soutien" },
  { value: "signals",       label: "Transmissions",           category: "Soutien" },
  { value: "mp",            label: "Police militaire",        category: "Soutien" },
  { value: "nbc",           label: "NBC / CBRN",              category: "Soutien" },
  { value: "maintenance",   label: "Maintenance",             category: "Soutien" },
]

// Symboles intérieurs SVG (viewBox 60×40)
function TypeSymbol({ type }: { type: string }) {
  switch (type) {
    case "hq":
      return <text x="30" y="27" textAnchor="middle" fontSize="16" fontWeight="bold" fill={S} fontFamily="serif">HQ</text>

    case "cp":
      return <text x="30" y="27" textAnchor="middle" fontSize="14" fontWeight="bold" fill={S} fontFamily="serif">PC</text>

    case "infantry":
      return <>
        <line x1="10" y1="6" x2="50" y2="34" stroke={S} strokeWidth={SW + 0.5} />
        <line x1="50" y1="6" x2="10" y2="34" stroke={S} strokeWidth={SW + 0.5} />
      </>

    case "mechanized":
      return <>
        <ellipse cx="30" cy="20" rx="20" ry="9" fill="none" stroke={S} strokeWidth={SW} />
        <line x1="10" y1="6" x2="50" y2="34" stroke={S} strokeWidth={SW} />
        <line x1="50" y1="6" x2="10" y2="34" stroke={S} strokeWidth={SW} />
      </>

    case "motorized":
      return <>
        <rect x="12" y="12" width="36" height="16" rx="2" fill="none" stroke={S} strokeWidth={SW} />
        <line x1="10" y1="6" x2="50" y2="34" stroke={S} strokeWidth={SW} />
        <line x1="50" y1="6" x2="10" y2="34" stroke={S} strokeWidth={SW} />
      </>

    case "airborne":
      return <>
        <line x1="10" y1="6" x2="50" y2="34" stroke={S} strokeWidth={SW} />
        <line x1="50" y1="6" x2="10" y2="34" stroke={S} strokeWidth={SW} />
        <path d="M18,32 Q30,22 42,32" fill="none" stroke={S} strokeWidth={SW} />
      </>

    case "sf":
      return <>
        <line x1="10" y1="6" x2="50" y2="34" stroke={S} strokeWidth={SW + 0.5} />
        <line x1="50" y1="6" x2="10" y2="34" stroke={S} strokeWidth={SW + 0.5} />
        <line x1="8" y1="20" x2="52" y2="20" stroke={S} strokeWidth={SW} />
      </>

    case "sniper":
      return <>
        <circle cx="30" cy="20" r="12" fill="none" stroke={S} strokeWidth={SW} />
        <line x1="18" y1="20" x2="42" y2="20" stroke={S} strokeWidth={SW} />
        <line x1="30" y1="8" x2="30" y2="32" stroke={S} strokeWidth={SW} />
        <circle cx="30" cy="20" r="2" fill={S} />
      </>

    case "armor":
      return <ellipse cx="30" cy="20" rx="22" ry="10" fill="none" stroke={S} strokeWidth={SW} />

    case "recce":
      return <>
        <ellipse cx="30" cy="20" rx="22" ry="10" fill="none" stroke={S} strokeWidth={SW} />
        <line x1="10" y1="6" x2="50" y2="34" stroke={S} strokeWidth={SW - 0.5} />
        <line x1="50" y1="6" x2="10" y2="34" stroke={S} strokeWidth={SW - 0.5} />
      </>

    case "antitank":
      return <>
        <line x1="8" y1="20" x2="52" y2="20" stroke={S} strokeWidth={SW} />
        <path d="M36,10 L52,20 L36,30 Z" fill={S} />
      </>

    case "artillery":
      return <circle cx="30" cy="20" r="13" fill="none" stroke={S} strokeWidth={SW} />

    case "mortar":
      return <>
        <circle cx="30" cy="26" r="8" fill="none" stroke={S} strokeWidth={SW} />
        <line x1="30" y1="5" x2="30" y2="18" stroke={S} strokeWidth={SW} />
      </>

    case "airdefense":
      return <>
        <circle cx="30" cy="26" r="10" fill="none" stroke={S} strokeWidth={SW} />
        <line x1="30" y1="4" x2="30" y2="16" stroke={S} strokeWidth={SW} />
        <line x1="24" y1="10" x2="30" y2="4" stroke={S} strokeWidth={SW} />
        <line x1="36" y1="10" x2="30" y2="4" stroke={S} strokeWidth={SW} />
      </>

    case "aviation":
      return <>
        <line x1="6" y1="18" x2="54" y2="18" stroke={S} strokeWidth={SW} />
        <path d="M6,18 Q18,8 30,18 Q42,8 54,18" fill="none" stroke={S} strokeWidth={SW} />
        <line x1="30" y1="18" x2="30" y2="32" stroke={S} strokeWidth={SW} />
        <line x1="24" y1="32" x2="36" y2="32" stroke={S} strokeWidth={SW} />
      </>

    case "fixedwing":
      return <>
        <line x1="6" y1="20" x2="54" y2="20" stroke={S} strokeWidth={SW} />
        <path d="M22,20 L30,6 L38,20" fill="none" stroke={S} strokeWidth={SW} />
        <path d="M26,20 L30,30 L34,20" fill="none" stroke={S} strokeWidth={SW} />
      </>

    case "engineer":
      return <path d="M8,20 L18,8 L28,20 L38,8 L52,20" fill="none" stroke={S} strokeWidth={SW} strokeLinejoin="round" />

    case "medical":
      return <>
        <rect x="24" y="6" width="12" height="28" fill={S} />
        <rect x="10" y="14" width="40" height="12" fill={S} />
      </>

    case "logistics":
      return <>
        <rect x="14" y="10" width="32" height="20" fill="none" stroke={S} strokeWidth={SW} />
        <line x1="14" y1="22" x2="46" y2="22" stroke={S} strokeWidth={SW - 0.5} />
      </>

    case "signals":
      return <path d="M34,4 L22,22 L31,22 L27,36 L38,18 L29,18 Z" fill={S} />

    case "mp":
      return <text x="30" y="27" textAnchor="middle" fontSize="14" fontWeight="bold" fill={S} fontFamily="serif">MP</text>

    case "nbc":
      return <>
        <circle cx="30" cy="20" r="5" fill="none" stroke={S} strokeWidth={SW - 0.5} />
        <ellipse cx="30" cy="20" rx="15" ry="5" fill="none" stroke={S} strokeWidth={SW - 0.5} />
        <ellipse cx="30" cy="20" rx="15" ry="5" fill="none" stroke={S} strokeWidth={SW - 0.5} transform="rotate(60,30,20)" />
        <ellipse cx="30" cy="20" rx="15" ry="5" fill="none" stroke={S} strokeWidth={SW - 0.5} transform="rotate(120,30,20)" />
      </>

    case "maintenance":
      return <>
        <line x1="20" y1="10" x2="40" y2="30" stroke={S} strokeWidth={SW + 1} strokeLinecap="round" />
        <line x1="40" y1="10" x2="20" y2="30" stroke={S} strokeWidth={SW + 1} strokeLinecap="round" />
        <circle cx="30" cy="20" r="6" fill="white" stroke={S} strokeWidth={SW} />
      </>

    default:
      return <circle cx="30" cy="20" r="8" fill="none" stroke={S} strokeWidth={SW} />
  }
}

interface NatoSymbolProps {
  type: string
  size?: string
  label: string
  callsign?: string
  isRoot?: boolean
  selected?: boolean
  compact?: boolean
}

export function NatoSymbol({ type, size, label, callsign, isRoot, selected, compact }: NatoSymbolProps) {
  const sizeMarker = NATO_SIZES.find((s) => s.value === size)?.marker ?? ""
  const borderColor = selected ? "#7c3aed" : isRoot ? "#4c1d95" : S
  const fillColor = isRoot ? "#ede9fe" : "white"

  if (compact) {
    return (
      <div className="flex flex-col items-center select-none shrink-0">
        <div className="h-4 flex items-end justify-center">
          {sizeMarker && (
            <span className="text-[9px] font-bold" style={{ color: S }}>
              {sizeMarker}
            </span>
          )}
        </div>
        <svg viewBox="0 0 60 40" width="54" height="36">
          <rect
            x="1.5" y="1.5" width="57" height="37"
            fill={fillColor}
            stroke={borderColor}
            strokeWidth={selected ? 3 : 2.5}
          />
          <TypeSymbol type={type} />
        </svg>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center select-none">
      {/* Indicateur de taille */}
      <div className="h-5 flex items-end justify-center">
        {sizeMarker && (
          <span className="text-xs font-bold tracking-widest" style={{ color: S, letterSpacing: "1px" }}>
            {sizeMarker}
          </span>
        )}
      </div>

      {/* Rectangle OTAN */}
      <svg viewBox="0 0 60 40" width="72" height="48">
        <rect
          x="1.5" y="1.5" width="57" height="37"
          fill={fillColor}
          stroke={borderColor}
          strokeWidth={selected ? 3 : 2.5}
        />
        <TypeSymbol type={type} />
      </svg>

      {/* Label et callsign */}
      <div className="mt-1 text-center max-w-[90px]">
        {callsign && (
          <p className="text-[9px] font-semibold text-muted-foreground leading-none">{callsign}</p>
        )}
        <p className="text-[10px] font-semibold leading-tight truncate">{label}</p>
      </div>
    </div>
  )
}
