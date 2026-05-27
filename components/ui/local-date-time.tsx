"use client"

interface Props {
  iso: string
  options?: Intl.DateTimeFormatOptions
}

export function LocalDate({ iso, options }: Props) {
  return <>{new Date(iso).toLocaleDateString("fr-FR", options)}</>
}

export function LocalTime({ iso, options }: Props) {
  return (
    <>
      {new Date(iso).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        ...options,
      })}
    </>
  )
}
