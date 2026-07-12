import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Building,
  Clock,
  FileText,
  Receipt,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAdmin } from "@/hooks/useAdmin";

const ProRequestsSection = () => {
  const {
    proRequests,
    vatRequests,
    validatePro,
    rejectPro,
    validateVat,
    rejectVat,
    isValidating,
    isRejecting,
    isValidatingVat,
    isRejectingVat,
  } = useAdmin();

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-gold/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gold" />
              Demandes Pro en attente
              {proRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2">{proRequests.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucune demande Pro en attente
              </p>
            ) : (
              <div className="space-y-4">
                {proRequests.map((request) => (
                  <Card key={request.id} className="border-gold/20 bg-card/50 backdrop-blur">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-foreground">{request.company_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{request.email}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              SIRET: <span className="font-mono text-foreground">{request.siret}</span>
                            </span>
                            {request.vat_number && (
                              <span className="text-muted-foreground flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                TVA: <span className="font-mono text-foreground">{request.vat_number}</span>
                              </span>
                            )}
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(request.created_at), "dd MMM yyyy", { locale: fr })}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectPro(request.id)}
                            disabled={isRejecting || isValidating}
                            className="border-destructive/50 text-destructive hover:bg-destructive/10"
                          >
                            {isRejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><XCircle className="h-4 w-4 mr-1" />Refuser</>)}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => validatePro(request.id)}
                            disabled={isValidating || isRejecting}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><CheckCircle className="h-4 w-4 mr-1" />Valider Pro</>)}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              TVA à valider
              {vatRequests.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">
                  {vatRequests.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vatRequests.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucune demande TVA en attente</p>
            ) : (
              <div className="space-y-4">
                {vatRequests.map((request) => (
                  <Card key={request.id} className="border-primary/20 bg-card/50 backdrop-blur">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-foreground">{request.company_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{request.email}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <Receipt className="h-4 w-4 text-primary" />
                            <span className="text-muted-foreground">
                              TVA: <span className="font-mono text-primary font-semibold">{request.vat_number}</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectVat(request.id)}
                            disabled={isRejectingVat || isValidatingVat}
                            className="border-destructive/50 text-destructive hover:bg-destructive/10"
                          >
                            {isRejectingVat ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><XCircle className="h-4 w-4 mr-1" />Refuser</>)}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => validateVat(request.id)}
                            disabled={isValidatingVat || isRejectingVat}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          >
                            {isValidatingVat ? <Loader2 className="h-4 w-4 animate-spin" /> : (<><CheckCircle className="h-4 w-4 mr-1" />Valider TVA</>)}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
};

export default ProRequestsSection;
