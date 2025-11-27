"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  Ticket,
  Trophy,
  Shield,
  CheckCircle2,
  Minus,
  Plus,
  CreditCard,
  Lock,
  Zap,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function Home() {
  const rifa = useQuery(api.landing.getSelectedRifa);
  const inactiveRifas = useQuery(api.landing.getInactiveRifas);
  const [ticketCount, setTicketCount] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Countdown timer state
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const incrementTickets = () => setTicketCount(prev => prev + 1);
  const decrementTickets = () => setTicketCount(prev => Math.max(1, prev - 1));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckout = async () => {
    // Validate form data
    if (!formData.name || !formData.email || !formData.phone) {
      alert("Por favor completa todos los campos");
      return;
    }

    if (!rifa || !rifa._id) {
      alert("No hay rifa seleccionada");
      return;
    }

    setLoading(true);

    try {
      // Create Stripe checkout session
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rifaId: rifa._id,
          ticketCount,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          precio: rifa.precio ?? 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout using the session URL
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received from Stripe");
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert(error.message || "Error al procesar el pago. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    // Set the target date: December 29, 2025, 1:00 PM
    const targetDate = new Date('2025-12-29T13:00:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance > 0) {
        setTimeRemaining({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      {rifa === undefined ? (
        <section className="flex min-h-[600px] items-center justify-center bg-muted">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Cargando rifa...</p>
          </div>
        </section>
      ) : rifa === null ? (
        <section className="flex min-h-[600px] items-center justify-center bg-muted">
          <div className="text-center">
            <Trophy className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-bold">No hay rifas disponibles</h2>
            <p className="text-muted-foreground">Vuelve pronto para nuevas oportunidades de ganar</p>
          </div>
        </section>
      ) : (
        <>
          {/* Hero Section */}
          <section id="current-raffle" className="relative min-h-[700px] w-full overflow-hidden bg-gradient-to-b from-muted to-background">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
              {rifa.image && (
                <>
                  <Image
                    src={rifa.image}
                    alt={rifa.title}
                    fill
                    className="object-cover opacity-20"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
                </>
              )}
            </div>

            {/* Hero Content */}
            <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
              <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                {/* Left Column - Text Content */}
                <div className="flex flex-col justify-center">
                  <Badge className="mb-4 w-fit bg-primary/10 text-primary hover:bg-primary/20">
                    <Sparkles className="mr-2 h-3 w-3" />
                    Rifa Activa
                  </Badge>

                  <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                    {rifa.title}
                  </h1>

                  {rifa.subtitle && (
                    <p className="mb-6 text-xl font-semibold text-primary sm:text-2xl">
                      {rifa.subtitle}
                    </p>
                  )}

                  <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                    {rifa.description}
                  </p>

                  {/* CTA Buttons */}
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <Button
                      size="lg"
                      className="group text-lg font-bold"
                      onClick={() => {
                        document.getElementById("ticket-purchase")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Comprar Boletos Ahora
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="text-lg font-bold"
                      onClick={() => {
                        document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Cómo Funciona
                    </Button>
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <span>Sorteos Verificados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <span>Pago Seguro</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      <span>Ganadores Reales</span>
                    </div>
                  </div>
                </div>

                {/* Right Column - Prize Card */}
                <div className="flex items-center justify-center">
                  <Card className="w-full overflow-hidden border-2 shadow-2xl">
                    <div className="relative aspect-square w-full overflow-hidden bg-muted">
                      {rifa.image && (
                        <Image
                          src={rifa.image}
                          alt={rifa.title}
                          fill
                          className="object-cover"
                          priority
                        />
                      )}
                    </div>
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">29 DIC 2025</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">01:00 PM</span>
                        </div>
                      </div>

                      {/* Countdown Timer */}
                      <div className="mb-4">
                        <p className="mb-3 text-center text-sm font-semibold text-muted-foreground">
                          Tiempo Restante
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="flex flex-col items-center rounded-lg bg-primary/5 p-2">
                            <div className="text-2xl font-black text-primary">{timeRemaining.days}</div>
                            <div className="text-xs text-muted-foreground">Días</div>
                          </div>
                          <div className="flex flex-col items-center rounded-lg bg-primary/5 p-2">
                            <div className="text-2xl font-black text-primary">{timeRemaining.hours}</div>
                            <div className="text-xs text-muted-foreground">Horas</div>
                          </div>
                          <div className="flex flex-col items-center rounded-lg bg-primary/5 p-2">
                            <div className="text-2xl font-black text-primary">{timeRemaining.minutes}</div>
                            <div className="text-xs text-muted-foreground">Min</div>
                          </div>
                          <div className="flex flex-col items-center rounded-lg bg-primary/5 p-2">
                            <div className="text-2xl font-black text-primary">{timeRemaining.seconds}</div>
                            <div className="text-xs text-muted-foreground">Seg</div>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {(rifa.targetGoal) && (
                        <div className="mb-4">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="font-semibold text-muted-foreground">Progreso hacia la meta</span>
                            <span className="font-bold text-primary">
                              {Math.round(((rifa.currentBoletosSold ?? 0) / rifa.targetGoal) * 100)}%
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(((rifa.currentBoletosSold ?? 0) / rifa.targetGoal) * 100, 100)} 
                            className="h-3"
                          />
                          <p className="mt-1 text-xs text-muted-foreground text-center">
                            {rifa.currentBoletosSold ?? 0} de {rifa.targetGoal} boletos vendidos
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Precio por boleto</p>
                          <p className="text-2xl font-black text-primary">RD${rifa.precio ?? 0}</p>
                        </div>
                        <Button
                          size="lg"
                          onClick={() => {
                            document.getElementById("ticket-purchase")?.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          Comprar Ahora
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="bg-muted/50 px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-16 text-center">
                <h2 className="mb-4 text-3xl font-black sm:text-4xl">Cómo Funciona</h2>
                <p className="text-lg text-muted-foreground">
                  Participar es fácil y seguro. Sigue estos simples pasos
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-3">
                {/* Step 1 */}
                <Card className="relative overflow-hidden border-2 transition-shadow hover:shadow-lg">
                  <CardContent className="p-8">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Ticket className="h-8 w-8 text-primary" />
                    </div>
                    <div className="mb-2 text-4xl font-black text-primary">01</div>
                    <h3 className="mb-3 text-xl font-bold">Elige Tus Boletos</h3>
                    <p className="text-muted-foreground">
                      Selecciona la cantidad de boletos que deseas comprar. Más boletos = más oportunidades de ganar.
                    </p>
                  </CardContent>
                </Card>

                {/* Step 2 */}
                <Card className="relative overflow-hidden border-2 transition-shadow hover:shadow-lg">
                  <CardContent className="p-8">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <CreditCard className="h-8 w-8 text-primary" />
                    </div>
                    <div className="mb-2 text-4xl font-black text-primary">02</div>
                    <h3 className="mb-3 text-xl font-bold">Paga con Stripe</h3>
                    <p className="text-muted-foreground">
                      Realiza tu pago de forma segura usando Stripe. Aceptamos tarjetas de crédito y débito.
                    </p>
                  </CardContent>
                </Card>

                {/* Step 3 */}
                <Card className="relative overflow-hidden border-2 transition-shadow hover:shadow-lg">
                  <CardContent className="p-8">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Trophy className="h-8 w-8 text-primary" />
                    </div>
                    <div className="mb-2 text-4xl font-black text-primary">03</div>
                    <h3 className="mb-3 text-xl font-bold">Gana Premios</h3>
                    <p className="text-muted-foreground">
                      Espera el sorteo y cruza los dedos. Anunciamos ganadores públicamente y entregamos premios rápidamente.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Features/Benefits Section */}
          <section className="px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-16 text-center">
                <h2 className="mb-4 text-3xl font-black sm:text-4xl">Por Qué Elegir Sorteos Joropo</h2>
                <p className="text-lg text-muted-foreground">
                  La plataforma de rifas más confiable y transparente
                </p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {/* Feature 1 */}
                <Card className="border-0 shadow-md transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold">Pagos Seguros</h3>
                    <p className="text-muted-foreground">
                      Procesamos todos los pagos a través de Stripe, la plataforma más segura del mundo.
                    </p>
                  </CardContent>
                </Card>

                {/* Feature 2 */}
                <Card className="border-0 shadow-md transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold">Ganadores Verificados</h3>
                    <p className="text-muted-foreground">
                      Publicamos todos nuestros ganadores de forma transparente. Sin trampas, sin secretos.
                    </p>
                  </CardContent>
                </Card>

                {/* Feature 3 */}
                <Card className="border-0 shadow-md transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold">Proceso Transparente</h3>
                    <p className="text-muted-foreground">
                      Sorteos en vivo y verificables. Cada participante tiene las mismas probabilidades de ganar.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Previous Rifas Gallery Section */}
          <section id="winners" className="bg-muted/50 px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="mb-16 text-center">
                <h2 className="mb-4 text-3xl font-black sm:text-4xl">Rifas Anteriores</h2>
                <p className="text-lg text-muted-foreground">
                  Explora nuestras rifas pasadas y sus increíbles premios
                </p>
              </div>

              {inactiveRifas === undefined ? (
                <div className="text-center py-12">
                  <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="text-muted-foreground">Cargando rifas...</p>
                </div>
              ) : inactiveRifas.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No hay rifas anteriores disponibles</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {inactiveRifas.map((previousRifa) => (
                    <Card key={previousRifa._id} className="group overflow-hidden border-2 shadow-lg transition-all hover:shadow-xl">
                      <div className="relative aspect-square w-full overflow-hidden bg-muted">
                        {previousRifa.image && (
                          <Image
                            src={previousRifa.image}
                            alt={previousRifa.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <CardContent className="p-6">
                        <h3 className="mb-2 text-xl font-bold">{previousRifa.title}</h3>
                        {previousRifa.subtitle && (
                          <p className="mb-3 text-sm font-semibold text-primary">{previousRifa.subtitle}</p>
                        )}
                        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
                          {previousRifa.description}
                        </p>
                        {previousRifa.precio && (
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Precio por boleto</span>
                            <span className="font-bold text-primary">RD${previousRifa.precio}</span>
                          </div>
                        )}
                        {previousRifa.targetGoal && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Meta alcanzada</span>
                            <span className="font-semibold">
                              {previousRifa.currentBoletosSold ?? 0} / {previousRifa.targetGoal}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Ticket Purchase Section */}
          <section id="ticket-purchase" className="px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-black sm:text-4xl">Compra Tus Boletos</h2>
                <p className="text-lg text-muted-foreground">
                  Selecciona la cantidad de boletos y procede al pago seguro
                </p>
              </div>

              <Card className="overflow-hidden border-2 shadow-2xl">
                <CardContent className="p-8 sm:p-12">
                  <h3 className="mb-8 text-center text-3xl font-black text-primary">
                    BOLETOS
                  </h3>

                  {/* Ticket Counter */}
                  <div className="mb-8 flex items-center justify-center gap-8">
                    <Button
                      size="lg"
                      onClick={decrementTickets}
                      className="h-16 w-16 rounded-full bg-muted text-2xl font-bold hover:bg-muted/80"
                      disabled={ticketCount <= 1}
                    >
                      <Minus className="h-6 w-6" />
                    </Button>
                    <div className="text-center">
                      <div className="text-6xl font-black">{ticketCount}</div>
                      <div className="mt-2 text-sm uppercase tracking-wide text-muted-foreground">
                        {ticketCount === 1 ? "BOLETO" : "BOLETOS"}
                      </div>
                    </div>
                    <Button
                      size="lg"
                      onClick={incrementTickets}
                      className="h-16 w-16 rounded-full bg-secondary text-2xl font-bold hover:bg-secondary/90"
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  </div>

                  {/* Total Price */}
                  <div className="mb-8 text-center">
                    <p className="mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                      Total a Pagar
                    </p>
                    <div className="text-5xl font-black">
                      RD${(ticketCount * (rifa.precio ?? 0)).toFixed(2)}
                    </div>
                  </div>

                  {/* User Information Form */}
                  {!showForm ? (
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-primary to-primary/80 text-xl font-black hover:from-primary/90 hover:to-primary/70"
                      onClick={() => setShowForm(true)}
                    >
                      <CreditCard className="mr-2 h-6 w-6" />
                      Proceder al Pago Seguro
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Ingresa tu nombre completo"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="tu@email.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+1 (809) 555-0123"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setShowForm(false);
                            setFormData({ name: "", email: "", phone: "" });
                          }}
                          disabled={loading}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="lg"
                          className="flex-1 bg-gradient-to-r from-primary to-primary/80 text-xl font-black hover:from-primary/90 hover:to-primary/70"
                          onClick={handleCheckout}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              Procesando...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-6 w-6" />
                              Pagar con Stripe
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Security Badges */}
                  <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-primary" />
                      <span>Pago 100% seguro procesado por Stripe</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      <span>Tus datos están protegidos con encriptación SSL</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Footer */}
          <footer id="contact" className="border-t bg-muted/50">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <div className="grid gap-8 md:grid-cols-4">
                {/* About */}
                <div className="md:col-span-2">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-primary/20 shadow-sm">
                      <Image 
                        src="/logo.png" 
                        alt="Sorteos Joropo Logo" 
                        fill 
                        className="object-cover"
                      />
                    </div>
                    <span className="text-2xl font-black text-primary">Sorteos Joropo</span>
                  </div>
                  <p className="mb-4 text-muted-foreground">
                    La plataforma de rifas más confiable de República Dominicana. Sorteos transparentes, premios reales, ganadores verificados.
                  </p>
                  <div className="flex gap-4">
                    <Button size="icon" variant="outline">
                      <Facebook className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="outline">
                      <Instagram className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="outline">
                      <Twitter className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Links */}
                <div>
                  <h3 className="mb-4 font-bold">Enlaces</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li><a href="#" className="hover:text-primary">Inicio</a></li>
                    <li><a href="#current-raffle" className="hover:text-primary">Rifas Actuales</a></li>
                    <li><a href="#winners" className="hover:text-primary">Ganadores</a></li>
                    <li><a href="#how-it-works" className="hover:text-primary">Cómo Funciona</a></li>
                  </ul>
                </div>

                {/* Contact */}
                <div>
                  <h3 className="mb-4 font-bold">Contacto</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>info@sorteosjoropo.com</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>+1 (809) 555-0123</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Santo Domingo, RD</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Sorteos Joropo. Todos los derechos reservados.</p>
                <div className="mt-2 flex justify-center gap-4">
                  <a href="#" className="hover:text-primary">Términos y Condiciones</a>
                  <span>•</span>
                  <a href="#" className="hover:text-primary">Política de Privacidad</a>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
