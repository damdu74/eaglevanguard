import React from "react"

const S = "#111111"   // noir H&G
const SW = 5          // trait épais H&G

// Indicateurs d'échelon (au-dessus du rectangle) — hiérarchie française
export const NATO_SIZES: { value: string; label: string; marker: string }[] = [
  { value: "binome",    label: "Team",              marker: "ø"    },
  { value: "escouade",  label: "Squad",             marker: "●"    },
  { value: "groupe",    label: "Section",           marker: "●●"   },
  { value: "section",   label: "Platoon",           marker: "●●●"  },
  { value: "compagnie", label: "Compagnie",         marker: "|"    },
  { value: "bataillon", label: "Bataillon",         marker: "||"   },
  { value: "regiment",  label: "Régiment",          marker: "|||"  },
  { value: "brigade",   label: "Brigade",           marker: "X"    },
  { value: "division",  label: "Division",          marker: "XX"   },
  { value: "corps",     label: "Corps d'armée",     marker: "XXX"  },
  { value: "armee",     label: "Armée",             marker: "XXXX" },
]

// Types d'unités avec symboles et labels
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

// Modificateurs combinables avec n'importe quel type de base
export const NATO_MODIFIERS: { value: string; label: string }[] = [
  { value: "armored",     label: "Blindé" },
  { value: "wheeled",     label: "Motorisé" },
  { value: "airborne",    label: "Aéroporté" },
  { value: "air_assault", label: "Assaut aérien" },
  { value: "amphibious",  label: "Amphibie" },
  { value: "mountain",    label: "Montagne" },
  { value: "sf",          label: "Forces spéciales" },
  { value: "recon",       label: "Reconnaissance" },
]

const MW = 3.5 // trait modificateur (plus fin que le type de base)

// Symbole du modificateur — exporté pour l'aperçu dans le sélecteur
export function NatoModifierSymbol({ modifier }: { modifier: string }) {
  switch (modifier) {
    case "armored":
      // Ovale (blindé/mécanisé)
      return <ellipse cx="30" cy="20" rx="22" ry="10" fill="none" stroke={S} strokeWidth={MW} />

    case "wheeled":
      // Deux roues en bas (motorisé)
      return <>
        <circle cx="19" cy="30" r="6" fill="none" stroke={S} strokeWidth={MW - 0.5} />
        <circle cx="41" cy="30" r="6" fill="none" stroke={S} strokeWidth={MW - 0.5} />
        <line x1="8"  y1="30" x2="13" y2="30" stroke={S} strokeWidth={MW - 1} strokeLinecap="round" />
        <line x1="47" y1="30" x2="52" y2="30" stroke={S} strokeWidth={MW - 1} strokeLinecap="round" />
        <line x1="25" y1="30" x2="35" y2="30" stroke={S} strokeWidth={MW - 1} strokeLinecap="round" />
      </>

    case "airborne":
      // Arc parabolique en bas (parachute)
      return <path d="M12,34 Q30,18 48,34" fill="none" stroke={S} strokeWidth={MW} strokeLinecap="round" />

    case "air_assault":
      // Rotor d'hélicoptère en haut
      return <>
        <line x1="12" y1="10" x2="48" y2="10" stroke={S} strokeWidth={MW} strokeLinecap="round" />
        <path d="M12,10 Q21,3 30,10 Q39,3 48,10" fill="none" stroke={S} strokeWidth={MW - 0.5} strokeLinecap="round" />
        <line x1="30" y1="10" x2="30" y2="18" stroke={S} strokeWidth={MW - 1} strokeLinecap="round" />
      </>

    case "amphibious":
      // Vague en bas (amphibie)
      return <path d="M8,30 Q16,23 24,30 Q32,37 40,30 Q48,23 52,27" fill="none" stroke={S} strokeWidth={MW} strokeLinecap="round" />

    case "mountain":
      // Triangle montagne en haut
      return <polygon points="30,5 16,22 44,22" fill="none" stroke={S} strokeWidth={MW - 0.5} strokeLinejoin="round" />

    case "sf":
      // Barre horizontale centrale (forces spéciales)
      return <line x1="8" y1="20" x2="52" y2="20" stroke={S} strokeWidth={MW + 1} strokeLinecap="round" />

    case "recon":
      // Jumelles (reconnaissance)
      return <>
        <circle cx="22" cy="26" r="7" fill="none" stroke={S} strokeWidth={MW - 0.5} />
        <circle cx="38" cy="26" r="7" fill="none" stroke={S} strokeWidth={MW - 0.5} />
        <line x1="29" y1="26" x2="31" y2="26" stroke={S} strokeWidth={MW - 0.5} />
      </>

    default:
      return null
  }
}

// Symboles intérieurs SVG (viewBox 60×40)
function TypeSymbol({ type }: { type: string }) {
  const sw = SW

  switch (type) {

    // ── Commandement ─────────────────────────────────────────────────────────

    case "hq":
      return <text x="30" y="27" textAnchor="middle" fontSize="17" fontWeight="900"
               fill={S} fontFamily="Arial Black, Arial, sans-serif" letterSpacing="-0.5">HQ</text>

    case "cp":
      return <text x="30" y="27" textAnchor="middle" fontSize="15" fontWeight="900"
               fill={S} fontFamily="Arial Black, Arial, sans-serif">PC</text>

    // ── Infanterie ────────────────────────────────────────────────────────────

    case "infantry":
      // X plein — symbole classique H&G infanterie
      return <>
        <line x1="7" y1="6"  x2="53" y2="34" stroke={S} strokeWidth={sw} strokeLinecap="round" />
        <line x1="53" y1="6" x2="7"  y2="34" stroke={S} strokeWidth={sw} strokeLinecap="round" />
      </>

    case "mechanized":
      // X + ovale (infanterie mécanisée)
      return <>
        <ellipse cx="30" cy="20" rx="19" ry="8" fill="none" stroke={S} strokeWidth={sw - 1} />
        <line x1="7" y1="6"  x2="53" y2="34" stroke={S} strokeWidth={sw - 1} strokeLinecap="round" />
        <line x1="53" y1="6" x2="7"  y2="34" stroke={S} strokeWidth={sw - 1} strokeLinecap="round" />
      </>

    case "motorized":
      // X + rectangle (infanterie motorisée)
      return <>
        <rect x="9" y="11" width="42" height="18" fill="none" stroke={S} strokeWidth={sw - 1} />
        <line x1="7" y1="6"  x2="53" y2="34" stroke={S} strokeWidth={sw - 1} strokeLinecap="round" />
        <line x1="53" y1="6" x2="7"  y2="34" stroke={S} strokeWidth={sw - 1} strokeLinecap="round" />
      </>

    case "airborne":
      // X + arc parabolique en bas (parachutiste — style H&G paratrooper)
      return <>
        <line x1="7" y1="6"  x2="53" y2="34" stroke={S} strokeWidth={sw} strokeLinecap="round" />
        <line x1="53" y1="6" x2="7"  y2="34" stroke={S} strokeWidth={sw} strokeLinecap="round" />
        <path d="M12,33 Q30,17 48,33" fill="none" stroke={S} strokeWidth={sw - 1} strokeLinecap="round" />
      </>

    case "sf":
      return <>
        <line x1="7" y1="6"  x2="53" y2="34" stroke={S} strokeWidth={sw} strokeLinecap="round" />
        <line x1="53" y1="6" x2="7"  y2="34" stroke={S} strokeWidth={sw} strokeLinecap="round" />
        <line x1="7" y1="20" x2="53" y2="20"  stroke={S} strokeWidth={sw - 1} strokeLinecap="round" />
      </>

    case "sniper":
      // Réticule de visée
      return <>
        <circle cx="30" cy="20" r="13" fill="none" stroke={S} strokeWidth={sw - 1} />
        <line x1="17" y1="20" x2="43" y2="20" stroke={S} strokeWidth={sw - 1} />
        <line x1="30" y1="7"  x2="30" y2="33" stroke={S} strokeWidth={sw - 1} />
        <circle cx="30" cy="20" r="3" fill={S} />
      </>

    // ── Blindé ────────────────────────────────────────────────────────────────

    case "armor":
      // Ovale large — symbole classique H&G blindé
      return <ellipse cx="30" cy="20" rx="22" ry="10" fill="none" stroke={S} strokeWidth={sw} />

    case "recce":
      // Ovale + X (reconnaissance blindée)
      return <>
        <ellipse cx="30" cy="20" rx="20" ry="9" fill="none" stroke={S} strokeWidth={sw - 1} />
        <line x1="7" y1="6"  x2="53" y2="34" stroke={S} strokeWidth={sw - 1} strokeLinecap="round" />
        <line x1="53" y1="6" x2="7"  y2="34" stroke={S} strokeWidth={sw - 1} strokeLinecap="round" />
      </>

    case "antitank":
      // Flèche horizontale anti-char
      return <>
        <line x1="7" y1="20" x2="46" y2="20" stroke={S} strokeWidth={sw} strokeLinecap="round" />
        <polygon points="37,11 53,20 37,29" fill={S} />
      </>

    // ── Appui feux ────────────────────────────────────────────────────────────

    case "artillery":
      // Grand cercle
      return <circle cx="30" cy="20" r="14" fill="none" stroke={S} strokeWidth={sw} />

    case "mortar":
      // Cercle + tige verticale
      return <>
        <circle cx="30" cy="27" r="9" fill="none" stroke={S} strokeWidth={sw - 1} />
        <line x1="30" y1="4" x2="30" y2="18" stroke={S} strokeWidth={sw} strokeLinecap="round" />
      </>

    case "airdefense":
      // Cercle + flèche bifurquée vers le haut
      return <>
        <circle cx="30" cy="28" r="9" fill="none" stroke={S} strokeWidth={sw - 1} />
        <line x1="30" y1="4"  x2="30" y2="19" stroke={S} strokeWidth={sw} strokeLinecap="round" />
        <line x1="23" y1="11" x2="30" y2="4"  stroke={S} strokeWidth={sw - 1} strokeLinecap="round" />
        <line x1="37" y1="11" x2="30" y2="4"  stroke={S} strokeWidth={sw - 1} strokeLinecap="round" />
      </>

    // ── Aviation ──────────────────────────────────────────────────────────────

    case "aviation":
      // Rotor + mât + patin (hélicoptère)
      return <>
        <line x1="6"  y1="16" x2="54" y2="16" stroke={S} strokeWidth={sw} strokeLinecap="round" />
        <path d="M6,16 Q18,6 30,16 Q42,6 54,16" fill="none" stroke={S} strokeWidth={sw - 1} strokeLinecap="round" />
        <line x1="30" y1="16" x2="30" y2="32" stroke={S} strokeWidth={sw - 1} strokeLinecap="round" />
        <line x1="23" y1="32" x2="37" y2="32" stroke={S} strokeWidth={sw - 1} strokeLinecap="round" />
      </>

    case "fixedwing":
      // Aile + dérive (avion vu du dessus)
      return <>
        <line x1="6"  y1="22" x2="54" y2="22" stroke={S} strokeWidth={sw} strokeLinecap="round" />
        <polygon points="22,22 30,6 38,22"  fill={S} />
        <polygon points="26,22 30,31 34,22" fill={S} />
      </>

    // ── Soutien ───────────────────────────────────────────────────────────────

    case "engineer":
      // Créneaux (génie)
      return <path d="M7,20 L18,7 L29,20 L40,7 L53,20"
               fill="none" stroke={S} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />

    case "medical":
      // Croix rouge (croix en plein)
      return <>
        <rect x="24" y="5"  width="12" height="30" fill={S} />
        <rect x="9"  y="14" width="42" height="12" fill={S} />
      </>

    case "logistics":
      // Boîte bipartite (soutien)
      return <>
        <rect x="9"  y="10" width="42" height="20" fill="none" stroke={S} strokeWidth={sw - 1} />
        <line x1="9" y1="22" x2="51" y2="22" stroke={S} strokeWidth={sw - 1} />
      </>

    case "signals":
      // Éclair (transmissions)
      return <path d="M35,4 L22,21 L32,21 L27,36 L40,19 L30,19 Z" fill={S} />

    case "mp":
      return <text x="30" y="27" textAnchor="middle" fontSize="16" fontWeight="900"
               fill={S} fontFamily="Arial Black, Arial, sans-serif">MP</text>

    case "nbc":
      // Atome simplifié
      return <>
        <circle cx="30" cy="20" r="5"  fill="none" stroke={S} strokeWidth={sw - 2} />
        <ellipse cx="30" cy="20" rx="16" ry="5" fill="none" stroke={S} strokeWidth={sw - 2} />
        <ellipse cx="30" cy="20" rx="16" ry="5" fill="none" stroke={S} strokeWidth={sw - 2} transform="rotate(60,30,20)" />
        <ellipse cx="30" cy="20" rx="16" ry="5" fill="none" stroke={S} strokeWidth={sw - 2} transform="rotate(120,30,20)" />
      </>

    case "maintenance":
      // X + cercle vide au centre (clé/outil)
      return <>
        <line x1="17" y1="8"  x2="43" y2="32" stroke={S} strokeWidth={sw + 1} strokeLinecap="round" />
        <line x1="43" y1="8"  x2="17" y2="32" stroke={S} strokeWidth={sw + 1} strokeLinecap="round" />
        <circle cx="30" cy="20" r="7" fill="white" stroke={S} strokeWidth={sw - 1} />
      </>

    default:
      return <circle cx="30" cy="20" r="10" fill="none" stroke={S} strokeWidth={sw - 1} />
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
  modifier?: string
}

export function NatoSymbol({ type, size, label, callsign, selected, compact, modifier }: NatoSymbolProps) {
  const sizeMarker = NATO_SIZES.find((s) => s.value === size)?.marker ?? ""
  const borderColor = "#111111"
  const borderWidth = selected ? 4.5 : 3.5
  const fillColor = "white"
  // ●/ø sont des glyphes naturellement plus petits — on grossit leur rendu
  const isCircleMarker = /^[●ø]+$/.test(sizeMarker)

  if (compact) {
    return (
      <div className="flex flex-col items-center select-none shrink-0">
        <div className="h-4 flex items-end justify-center">
          {sizeMarker && (
            <span
              className="font-black"
              style={{ color: "#111111", fontSize: isCircleMarker ? "13px" : "9px" }}
            >
              {sizeMarker}
            </span>
          )}
        </div>
        <svg viewBox="0 0 60 40" width="54" height="36">
          <rect x="1.5" y="1.5" width="57" height="37"
            fill={fillColor} stroke={borderColor} strokeWidth={borderWidth} />
          <TypeSymbol type={type} />
          {modifier && <NatoModifierSymbol modifier={modifier} />}
        </svg>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center select-none">
      {/* Indicateur de taille */}
      <div className="h-5 flex items-end justify-center">
        {sizeMarker && (
          <span
            className="font-black"
            style={{
              color: "#111111",
              fontSize: isCircleMarker ? "17px" : "12px",
              letterSpacing: isCircleMarker ? "1px" : "1px",
            }}
          >
            {sizeMarker}
          </span>
        )}
      </div>

      {/* Rectangle H&G */}
      <svg viewBox="0 0 60 40" width="72" height="48">
        <rect x="1.5" y="1.5" width="57" height="37"
          fill={fillColor} stroke={borderColor} strokeWidth={borderWidth} />
        <TypeSymbol type={type} />
        {modifier && <NatoModifierSymbol modifier={modifier} />}
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
