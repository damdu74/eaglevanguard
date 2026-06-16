"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CandidatureForm } from "@/components/candidature/candidature-form"
import { Clock, CheckCircle2, XCircle } from "lucide-react"

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

function CandidatureContent({ application, communityName }: { application: Application | null; communityName: string }) {
  const canApply = !application || application.status === "REJECTED" || application.status === "WITHDRAWN"

  if (application?.status === "PENDING") {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Candidature en attente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Statut</span>
            <Badge variant={STATUS_VARIANTS[application.status]}>{STATUS_LABELS[application.status]}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Envoyée le</span>
            <span className="text-sm">{new Date(application.createdAt).toLocaleDateString("fr-FR")}</span>
          </div>
          {application.message && (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <p className="text-xs text-muted-foreground mb-1">Votre message</p>
              <p>{application.message}</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground pt-1">
            Votre candidature est en cours d&apos;examen. Vous serez notifié dès qu&apos;une décision sera prise.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (application?.status === "ACCEPTED") {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-6">
          <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
          <p className="text-sm">Votre candidature a été acceptée. Bienvenue dans la communauté !</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {application?.status === "REJECTED" && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <XCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium">Candidature refusée</p>
              {application.response && (
                <p className="text-xs text-muted-foreground mt-0.5">{application.response}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Vous pouvez soumettre une nouvelle candidature.</p>
            </div>
          </CardContent>
        </Card>
      )}
      {canApply && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rejoindre {communityName}</CardTitle>
          </CardHeader>
          <CardContent>
            <CandidatureForm />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function NonMemberDashboard({ displayName, communityName, application }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Bienvenue, {displayName}</p>
      </div>

      <Tabs defaultValue="candidature">
        <TabsList>
          <TabsTrigger value="candidature">Candidature</TabsTrigger>
        </TabsList>
        <TabsContent value="candidature" className="mt-4 max-w-xl">
          <p className="text-sm text-muted-foreground mb-4">
            Rejoignez {communityName} en soumettant votre candidature.
          </p>
          <CandidatureContent application={application} communityName={communityName} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
