"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Ticket, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set loading to false after a brief delay to show the success message
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-20">
      <Card className="w-full max-w-2xl border-2 shadow-2xl">
        <CardContent className="p-8 sm:p-12">
          {loading ? (
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-muted-foreground">Verificando pago...</p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <div className="mb-8 text-center">
                <h1 className="mb-4 text-3xl font-black sm:text-4xl">
                  ¡Pago Exitoso!
                </h1>
                <p className="text-lg text-muted-foreground">
                  Tu compra ha sido procesada correctamente
                </p>
              </div>

              <div className="mb-8 space-y-4 rounded-lg bg-muted/50 p-6">
                <div className="flex items-center gap-3">
                  <Ticket className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-semibold">Boletos Comprados</p>
                    <p className="text-sm text-muted-foreground">
                      Recibirás un correo electrónico con los detalles de tus boletos
                    </p>
                  </div>
                </div>
                {sessionId && (
                  <div className="mt-4 text-xs text-muted-foreground">
                    ID de Sesión: {sessionId}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  asChild
                  variant="outline"
                  className="flex-1"
                >
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Inicio
                  </Link>
                </Button>
                <Button
                  asChild
                  className="flex-1"
                >
                  <Link href="/#winners">
                    Ver Rifas Anteriores
                  </Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

