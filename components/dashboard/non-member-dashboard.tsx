import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CandidatureForm } from "@/components/candidature/candidature-form"
import { Clock, CheckCircle2, XCircle, ClipboardList } from "lucide-react"

interface Application {
  status: string
  message: string | null
  response: string | null
  createdAt: string
}

interface Props {
  displayName: string
  communityName: string
  application: Application | null
}

const STATUS_LABELS: Record<string, string> = {
  PENDING:   "En attente",
  ACCEPTED:  "Acceptée",
  REJECTED:  "Refusée",
  WITHDRAWN: "Retirée",
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING:   "secondary",
  ACCEPTED:  "default",
  REJECTED:  "destructive",
  WITHDRAWN: "outline",
}

export function NonMemberDashboard({ displayName, communityName, application }: Props) {
  const canApply = !application || application.status === "REJECTED" || application.status === "WITHDRAWN"

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Bienvenue, {displayName}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Statut candidature */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-orange-400" />
              Statut de votre candidature
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {!application ? (
              <div className="px-4 py-2.5 border-t">
                <p className="text-sm text-muted-foreground">Aucune candidature soumise.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-2.5 border-t">
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge variant={STATUS_VARIANTS[application.status]}>
                    {STATUS_LABELS[application.status] ?? application.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 border-t">
                  <p className="text-sm text-muted-foreground">Envoyée le</p>
                  <p className="text-sm">{new Date(application.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                {application.status === "PENDING" && (
                  <div className="px-4 py-2.5 border-t">
                    <p className="text-xs text-muted-foreground">
                      Votre candidature est en cours d&apos;examen. Vous serez notifié dès qu&apos;une décision sera prise.
                    </p>
                  </div>
                )}
                {application.status === "ACCEPTED" && (
                  <div className="flex items-center gap-2 px-4 py-2.5 border-t">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <p className="text-sm">Bienvenue dans la communauté !</p>
                  </div>
                )}
                {application.status === "REJECTED" && application.response && (
                  <div className="px-4 py-2.5 border-t">
                    <p className="text-xs text-muted-foreground">{application.response}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Candidature info */}
        {application?.status === "PENDING" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="h-4 w-4 text-blue-400" />
                Votre message
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 p-0">
              {application.message ? (
                <div className="px-4 py-2.5 border-t">
                  <p className="text-sm">{application.message}</p>
                </div>
              ) : (
                <div className="px-4 py-2.5 border-t">
                  <p className="text-sm text-muted-foreground">Aucun message joint.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {application?.status === "REJECTED" && (
          <Card className="border-destructive/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <XCircle className="h-4 w-4 text-destructive" />
                Candidature refusée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0 p-0">
              <div className="px-4 py-2.5 border-t">
                <p className="text-sm text-muted-foreground">
                  Vous pouvez soumettre une nouvelle candidature ci-dessous.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Formulaire */}
      {canApply && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <ClipboardList className="h-4 w-4 text-blue-400" />
              Postuler — {communityName}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <CandidatureForm />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
