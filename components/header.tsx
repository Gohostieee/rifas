"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X, Ticket, Trophy, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Inicio", href: "#", icon: Ticket },
    { name: "Rifas Actuales", href: "#current-raffle", icon: Trophy },
    { name: "Ganadores", href: "#winners", icon: Users },
    { name: "Contacto", href: "#contact", icon: Mail },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-gradient-to-r from-primary via-primary to-primary/90 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-primary/95">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-primary-foreground/20 shadow-md">
            <Image 
              src="/logo.png" 
              alt="Sorteos Joropo Logo" 
              fill 
              className="object-cover"
              priority
            />
          </div>
          <div className="text-xl font-black tracking-tight text-primary-foreground sm:text-2xl">
            <span className="text-2xl sm:text-3xl">Sorteos Joropo</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              className="text-primary-foreground/90 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              asChild
            >
              <a href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </a>
            </Button>
          ))}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="border-t border-primary-foreground/10 bg-primary md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                className="justify-start text-primary-foreground/90 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                asChild
                onClick={() => setMobileMenuOpen(false)}
              >
                <a href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </a>
              </Button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
