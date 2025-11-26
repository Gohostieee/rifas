"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Lock, ChevronLeft, ChevronRight, Plus, Pencil, Trophy, Shuffle, X, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

  const ITEMS_PER_PAGE = 10;

  const formatBoletoNumber = (num: number) => {
    return num.toString().padStart(4, '0');
  };
  
  const rifaFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().min(1, "Subtitle is required"),
  description: z.string().min(1, "Description is required"),
  precio: z.coerce.number().min(1, "Price must be at least 1"),
  targetGoal: z.number().min(1, "Target goal must be at least 1"),
  image: z.string().optional(), // Will be set after upload
});

type RifaFormValues = z.infer<typeof rifaFormSchema>;

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRifa, setEditingRifa] = useState<Id<"daily_rifa"> | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedRifaFilter, setSelectedRifaFilter] = useState<Id<"daily_rifa"> | "all">("all");
  const [randomBoleto, setRandomBoleto] = useState<{ _id: Id<"boletos">; number: number; name: string; email: string; phone: string; rifaTitle: string } | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationBoleto, setAnimationBoleto] = useState<{ _id: Id<"boletos">; number: number; name: string; email: string; phone: string; rifaTitle: string } | null>(null);
  const [allBoletosForAnimation, setAllBoletosForAnimation] = useState<Array<{ _id: Id<"boletos">; number: number; name: string; email: string; phone: string; rifaTitle: string }>>([]);
  const [isWinnerSelectionDialogOpen, setIsWinnerSelectionDialogOpen] = useState(false);
  const [selectedRifaForWinner, setSelectedRifaForWinner] = useState<Id<"daily_rifa"> | "">("");
  const [winnerSelectionResult, setWinnerSelectionResult] = useState<{ _id: Id<"boletos">; number: number; name: string; email: string; phone: string; rifaTitle: string } | null>(null);

  // Check if already authenticated (stored in sessionStorage)
  useEffect(() => {
    const authStatus = sessionStorage.getItem("adminAuthenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("adminAuthenticated", "true");
        setPassword("");
      } else {
        setError(data.error || "Invalid password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("adminAuthenticated");
    setCurrentPage(1);
    setSelectedRifaFilter("all");
    setRandomBoleto(null);
  };

  const handleRollRandom = async () => {
    if (selectedRifaFilter === "all") {
      alert("Please select a rifa first to roll a random ticket");
      return;
    }
    
    try {
      const random = await getRandomBoleto({ rifaId: selectedRifaFilter });
      if (random) {
        setRandomBoleto(random);
      } else {
        alert("No boletos found for this rifa");
      }
    } catch (error) {
      console.error("Error getting random boleto:", error);
      alert("Error getting random boleto. Please try again.");
    }
  };

  const handleSetWinner = async (boletoId: Id<"boletos">, isWinner: boolean) => {
    try {
      await setBoletoWinner({ boletoId, isWinner });
      if (isWinner) {
        setRandomBoleto(null); // Clear random boleto when setting winner
      }
    } catch (error) {
      console.error("Error setting winner:", error);
      alert("Error setting winner. Please try again.");
    }
  };

  const handleAnimatedWinnerSelection = async () => {
    if (selectedRifaFilter === "all") {
      alert("Please select a rifa first to pick a winner");
      return;
    }

    try {
      // Get all boletos for the rifa
      const boletos = await getAllBoletosWithRifaInfo({ rifaId: selectedRifaFilter });
      
      if (boletos.length === 0) {
        alert("No boletos found for this rifa");
        return;
      }

      // Shuffle array for random order
      const shuffled = [...boletos].sort(() => Math.random() - 0.5);
      setAllBoletosForAnimation(shuffled);
      setIsAnimating(true);
      setAnimationBoleto(shuffled[0]); // Show first one immediately

      // Pick final winner
      const winnerIndex = Math.floor(Math.random() * shuffled.length);
      const winner = shuffled[winnerIndex];

      // Animation: cycle through boletos with increasing delay
      const startTime = Date.now();
      const duration = 3500; // 3.5 seconds total
      let animationFrameId: number;
      let lastIndex = -1;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        if (progress < 1) {
          // Easing function: cubic ease-out (slow down as we approach the end)
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          
          // Calculate which boleto to show
          // Start fast (many cycles), slow down at the end
          // Total cycles: start with ~20ms per boleto, end with ~200ms per boleto
          const minCycleTime = 20; // Fastest: 20ms per boleto
          const maxCycleTime = 200; // Slowest: 200ms per boleto
          const cycleTime = minCycleTime + (maxCycleTime - minCycleTime) * easedProgress;
          
          const totalCycles = elapsed / cycleTime;
          const index = Math.floor(totalCycles) % shuffled.length;
          
          // Only update if index changed to avoid unnecessary re-renders
          if (index !== lastIndex) {
            setAnimationBoleto(shuffled[index]);
            lastIndex = index;
          }
          
          animationFrameId = requestAnimationFrame(animate);
        } else {
          // Show final winner with celebration effect
          setAnimationBoleto(winner);
          
          // Small delay before setting as winner and closing dialog
          setTimeout(async () => {
            await setBoletoWinner({ boletoId: winner._id, isWinner: true });
            setIsAnimating(false);
            setAnimationBoleto(null);
            setRandomBoleto(null);
            // Reset to page 1 to see the winner at the top
            setCurrentPage(1);
          }, 1500);
        }
      };

      animationFrameId = requestAnimationFrame(animate);
    } catch (error) {
      console.error("Error in animated winner selection:", error);
      alert("Error picking winner. Please try again.");
      setIsAnimating(false);
      setAnimationBoleto(null);
    }
  };

  const handleSpecificWinnerSelection = async () => {
    if (!selectedRifaForWinner) {
      alert("Please select a rifa");
      return;
    }

    try {
      const random = await getRandomBoleto({ rifaId: selectedRifaForWinner as Id<"daily_rifa"> });
      if (random) {
        setWinnerSelectionResult(random);
      } else {
        alert("No boletos found for this rifa");
      }
    } catch (error) {
      console.error("Error getting random boleto:", error);
      alert("Error getting random boleto. Please try again.");
    }
  };

  const confirmWinnerSelection = async () => {
    if (!winnerSelectionResult) return;

    try {
      await setBoletoWinner({ boletoId: winnerSelectionResult._id, isWinner: true });
      setIsWinnerSelectionDialogOpen(false);
      setWinnerSelectionResult(null);
      setSelectedRifaForWinner("");
      // Refresh data
      setCurrentPage(1);
      alert(`Winner confirmed: ${winnerSelectionResult.name} (${formatBoletoNumber(winnerSelectionResult.number)})`);
    } catch (error) {
      console.error("Error setting winner:", error);
      alert("Error setting winner. Please try again.");
    }
  };

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRifaFilter]);

  // Fetch data only if authenticated
  const rifas = useQuery(
    api.admin.getAllRifas,
    isAuthenticated ? {} : "skip"
  );

  const boletosData = useQuery(
    api.admin.getBoletos,
    isAuthenticated
      ? { 
          page: currentPage, 
          pageSize: ITEMS_PER_PAGE,
          rifaId: selectedRifaFilter !== "all" ? selectedRifaFilter : undefined
        }
      : "skip"
  );

  const setSelectedRifa = useMutation(api.admin.setSelectedRifa);
  const createRifa = useMutation(api.admin.createRifa);
  const updateRifa = useMutation(api.admin.updateRifa);
  const generateUploadUrl = useAction(api.admin.generateUploadUrl);
  const setBoletoWinner = useMutation(api.admin.setBoletoWinner);
  const getRandomBoleto = useAction(api.admin.getRandomBoleto);
  const getAllBoletosWithRifaInfo = useAction(api.admin.getAllBoletosWithRifaInfo);

  const form = useForm({
    resolver: zodResolver(rifaFormSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      precio: 300,
      targetGoal: 100,
      image: "",
    },
  });

  const handleApplyRifa = async (rifaId: Id<"daily_rifa">) => {
    try {
      await setSelectedRifa({ rifaId });
    } catch (error) {
      console.error("Error setting selected rifa:", error);
    }
  };

  const handleEditRifa = (rifa: { _id: Id<"daily_rifa">; title: string; subtitle: string; description: string; precio?: number; targetGoal?: number; image: string }) => {
    setEditingRifa(rifa._id);
    setSelectedFile(null);
    setPreviewUrl(null);
    form.reset({
      title: rifa.title,
      subtitle: rifa.subtitle,
      description: rifa.description,
      precio: rifa.precio ?? 300,
      targetGoal: rifa.targetGoal ?? 100,
      image: rifa.image,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsDialogOpen(true);
  };

  const handleAddRifa = () => {
    setEditingRifa(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    form.reset({
      title: "",
      subtitle: "",
      description: "",
      precio: 300,
      targetGoal: 100,
      image: "",
    });
    setIsDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // Clear the image URL field since we're uploading a file
      form.setValue("image", "");
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    // Generate upload URL
    const uploadUrl = await generateUploadUrl();
    
    // Upload file
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });
    
    const { storageId } = await result.json();
    
    // Return storage ID - we'll convert to URL in getAllRifas query
    return storageId;
  };

  const onSubmit = async (values: RifaFormValues) => {
    try {
      setUploading(true);
      
      let imageUrl = values.image || "";
      
      // If a file is selected, upload it first
      if (selectedFile) {
        imageUrl = await uploadFile(selectedFile);
        // Store storage ID - we'll convert to URL in getAllRifas query
      } else if (editingRifa && rifas) {
        // If editing and no new file selected, keep the existing image
        const existingRifa = rifas.find((r) => r._id === editingRifa);
        if (existingRifa) {
          imageUrl = existingRifa.image;
        }
      }
      
      if (!imageUrl) {
        alert("Please upload an image");
        setUploading(false);
        return;
      }
      
      if (editingRifa) {
        await updateRifa({
          rifaId: editingRifa,
          ...values,
          image: imageUrl,
        });
      } else {
        await createRifa({
          ...values,
          image: imageUrl,
        });
      }
      
      setIsDialogOpen(false);
      form.reset();
      setEditingRifa(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error saving rifa:", error);
      alert("Error saving rifa. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Admin Access</CardTitle>
            </div>
            <CardDescription>Enter password to access admin panel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto min-h-screen p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage rifas and boletos</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <Tabs defaultValue="rifas" className="w-full">
        <TabsList>
          <TabsTrigger value="rifas">Rifas</TabsTrigger>
          <TabsTrigger value="boletos">Boletos</TabsTrigger>
        </TabsList>

        <TabsContent value="rifas" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Rifas</CardTitle>
                  <CardDescription>
                    {rifas ? `${rifas.length} rifa(s) found` : "Loading..."}
                  </CardDescription>
                </div>
                <Button onClick={handleAddRifa}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rifa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rifas === undefined ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading rifas...
                </div>
              ) : rifas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No rifas found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Subtitle</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Precio (RD$)</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Selected</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rifas.map((rifa) => (
                      <TableRow key={rifa._id}>
                        <TableCell className="font-medium">{rifa.title}</TableCell>
                        <TableCell>{rifa.subtitle}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {rifa.description}
                        </TableCell>
                        <TableCell className="font-semibold">
                          RD${rifa.precio}
                        </TableCell>
                        <TableCell>
                          <a
                            href={rifa.image}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View Image
                          </a>
                        </TableCell>
                        <TableCell>
                          {rifa.selected ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">
                              Selected
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleApplyRifa(rifa._id)}
                            >
                              Apply
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRifa(rifa)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="boletos" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Boletos</CardTitle>
                  <CardDescription>
                    {boletosData
                      ? `Showing ${boletosData.boletos.length} of ${boletosData.total} boletos`
                      : "Loading..."}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Button 
                    onClick={() => setIsWinnerSelectionDialogOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    Select Winner from Rifa
                  </Button>
                  <div className="flex items-center gap-2">
                    <label htmlFor="rifa-filter" className="text-sm font-medium">
                      Filter by Rifa:
                    </label>
                    <Select
                      value={selectedRifaFilter === "all" ? "all" : selectedRifaFilter}
                      onValueChange={(value) => {
                        setSelectedRifaFilter(value === "all" ? "all" : value as Id<"daily_rifa">);
                        setRandomBoleto(null);
                      }}
                    >
                      <SelectTrigger id="rifa-filter" className="w-[200px]">
                        <SelectValue placeholder="All Rifas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rifas</SelectItem>
                        {rifas?.map((rifa) => (
                          <SelectItem key={rifa._id} value={rifa._id}>
                            {rifa.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedRifaFilter !== "all" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRollRandom}
                        variant="outline"
                        className="gap-2"
                      >
                        <Shuffle className="h-4 w-4" />
                        Roll Random Ticket
                      </Button>
                      <Button
                        onClick={handleAnimatedWinnerSelection}
                        disabled={isAnimating}
                        className="gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold shadow-lg"
                      >
                        <Sparkles className="h-4 w-4" />
                        {isAnimating ? "Picking Winner..." : "Pick Winner (Animated)"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {randomBoleto && (
                <div className="mb-6 rounded-lg border-2 border-primary bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Random Ticket Selected</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Number:</span> {formatBoletoNumber(randomBoleto.number)}
                        </div>
                        <div>
                          <span className="font-medium">Name:</span> {randomBoleto.name}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {randomBoleto.email}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {randomBoleto.phone}
                        </div>
                        <div>
                          <span className="font-medium">Rifa:</span> {randomBoleto.rifaTitle}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleSetWinner(randomBoleto._id, true)}
                        className="gap-2"
                      >
                        <Trophy className="h-4 w-4" />
                        Set as Winner
                      </Button>
                      <Button
                        onClick={() => setRandomBoleto(null)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Animated Winner Selection Dialog */}
              <Dialog open={isAnimating} onOpenChange={() => {}}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
                      Picking the Winner...
                    </DialogTitle>
                    <DialogDescription>
                      Cycling through all tickets to find the lucky winner!
                    </DialogDescription>
                  </DialogHeader>
                  {animationBoleto && (
                    <div className="py-8">
                      <div className="relative rounded-lg border-4 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 p-8 shadow-2xl transition-all duration-75">
                        <div className="absolute top-4 right-4">
                          <Sparkles className="h-8 w-8 text-yellow-500 animate-spin" />
                        </div>
                        <div className="absolute top-4 left-4">
                          <Trophy className="h-8 w-8 text-yellow-500 animate-pulse" />
                        </div>
                        <div className="text-center space-y-4">
                          <div className="text-6xl font-black text-yellow-600 mb-4 transition-all duration-75">
                            {formatBoletoNumber(animationBoleto.number)}
                          </div>
                          <div className="space-y-2">
                            <div className="text-xl font-semibold text-gray-800">
                              {animationBoleto.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {animationBoleto.email}
                            </div>
                            <div className="text-sm text-gray-600">
                              {animationBoleto.phone}
                            </div>
                            <div className="pt-2">
                              <Badge className="bg-yellow-500 text-white text-sm px-3 py-1">
                                {animationBoleto.rifaTitle}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {!animationBoleto && (
                    <div className="py-8 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
                      <p className="mt-4 text-muted-foreground">Preparing...</p>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
              {boletosData === undefined ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading boletos...
                </div>
              ) : boletosData.boletos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No boletos found
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Winner</TableHead>
                        <TableHead>Number</TableHead>
                        <TableHead>Rifa</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boletosData.boletos.map((boleto) => (
                        <TableRow 
                          key={boleto._id}
                          className={boleto.winner ? "bg-yellow-50 dark:bg-yellow-950" : ""}
                        >
                          <TableCell>
                            {boleto.winner ? (
                              <Badge className="bg-yellow-500 text-white">
                                <Trophy className="h-3 w-3 mr-1" />
                                Winner
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatBoletoNumber(boleto.number)}
                          </TableCell>
                          <TableCell>{boleto.rifaTitle}</TableCell>
                          <TableCell>{boleto.name}</TableCell>
                          <TableCell>{boleto.email}</TableCell>
                          <TableCell>{boleto.phone}</TableCell>
                          <TableCell>
                            {boleto.winner ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSetWinner(boleto._id, false)}
                              >
                                Remove Winner
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleSetWinner(boleto._id, true)}
                                className="gap-2"
                              >
                                <Trophy className="h-3 w-3" />
                                Set Winner
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {boletosData.totalPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <Button
                              variant="ghost"
                              size="default"
                              onClick={() => {
                                if (currentPage > 1) {
                                  setCurrentPage(currentPage - 1);
                                }
                              }}
                              disabled={currentPage === 1}
                              className="gap-1 px-2.5 sm:pl-2.5"
                            >
                              <ChevronLeft className="h-4 w-4" />
                              <span className="hidden sm:block">Previous</span>
                            </Button>
                          </PaginationItem>
                          {Array.from({ length: boletosData.totalPages }, (_, i) => i + 1).map(
                            (page) => (
                              <PaginationItem key={page}>
                                <Button
                                  variant={currentPage === page ? "outline" : "ghost"}
                                  size="icon"
                                  onClick={() => setCurrentPage(page)}
                                  className="h-9 w-9"
                                >
                                  {page}
                                </Button>
                              </PaginationItem>
                            )
                          )}
                          <PaginationItem>
                            <Button
                              variant="ghost"
                              size="default"
                              onClick={() => {
                                if (currentPage < boletosData.totalPages) {
                                  setCurrentPage(currentPage + 1);
                                }
                              }}
                              disabled={currentPage === boletosData.totalPages}
                              className="gap-1 px-2.5 sm:pr-2.5"
                            >
                              <span className="hidden sm:block">Next</span>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isWinnerSelectionDialogOpen} onOpenChange={(open) => {
        setIsWinnerSelectionDialogOpen(open);
        if (!open) {
          setWinnerSelectionResult(null);
          setSelectedRifaForWinner("");
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Select Winner from Specific Rifa</DialogTitle>
            <DialogDescription>
              Choose a rifa to pick a random winner from its pool of sold tickets.
            </DialogDescription>
          </DialogHeader>
          
          {!winnerSelectionResult ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="winner-rifa-select" className="text-sm font-medium">
                  Select Rifa
                </label>
                <Select
                  value={selectedRifaForWinner}
                  onValueChange={(value) => setSelectedRifaForWinner(value as Id<"daily_rifa">)}
                >
                  <SelectTrigger id="winner-rifa-select">
                    <SelectValue placeholder="Select a rifa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {rifas?.map((rifa) => (
                      <SelectItem key={rifa._id} value={rifa._id}>
                        {rifa.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleSpecificWinnerSelection} 
                className="w-full"
                disabled={!selectedRifaForWinner}
              >
                <Shuffle className="mr-2 h-4 w-4" />
                Pick Random Winner
              </Button>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="rounded-lg border-2 border-yellow-400 bg-yellow-50 p-6 text-center">
                <Trophy className="mx-auto h-12 w-12 text-yellow-600 mb-2" />
                <h3 className="text-xl font-bold text-yellow-800 mb-1">Winner Selected!</h3>
                <p className="text-yellow-600 mb-4">Please confirm to set this ticket as the winner.</p>
                
                <div className="bg-white rounded-md p-4 shadow-sm border border-yellow-200 text-left text-gray-900">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><span className="font-semibold">Number:</span></div>
                    <div className="font-mono text-lg font-bold">{formatBoletoNumber(winnerSelectionResult.number)}</div>
                    
                    <div><span className="font-semibold">Name:</span></div>
                    <div>{winnerSelectionResult.name}</div>
                    
                    <div><span className="font-semibold">Email:</span></div>
                    <div className="truncate">{winnerSelectionResult.email}</div>
                    
                    <div><span className="font-semibold">Phone:</span></div>
                    <div>{winnerSelectionResult.phone}</div>

                    <div><span className="font-semibold">Rifa:</span></div>
                    <div>{winnerSelectionResult.rifaTitle}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setWinnerSelectionResult(null)}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button 
                  onClick={confirmWinnerSelection}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Confirm Winner
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingRifa ? "Edit Rifa" : "Add New Rifa"}
            </DialogTitle>
            <DialogDescription>
              {editingRifa
                ? "Update the rifa information below."
                : "Fill in the details to create a new rifa."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtitle</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter subtitle" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter description"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="precio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio (RD$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter price"
                        min="1"
                        step="0.01"
                        value={field.value?.toString() ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? undefined : Number(value));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Price per ticket in Dominican Pesos (RD$)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Goal</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter target goal"
                        min="1"
                        step="1"
                        value={field.value?.toString() ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? undefined : Number(value));
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormDescription>
                      Target number of boletos to sell for this rifa
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="cursor-pointer"
                    />
                    {previewUrl && (
                      <div className="mt-2">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-w-full h-48 object-contain rounded-md border"
                        />
                      </div>
                    )}
                    {editingRifa && rifas && rifas.find((r) => r._id === editingRifa)?.image && !previewUrl && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground mb-2">Current image:</p>
                        <img
                          src={rifas.find((r) => r._id === editingRifa)?.image || ""}
                          alt="Current"
                          className="max-w-full h-48 object-contain rounded-md border"
                        />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  {editingRifa
                    ? "Upload a new image to replace the current one, or leave empty to keep the current image."
                    : "Upload an image file for this rifa."}
                </FormDescription>
                <FormMessage />
              </FormItem>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    form.reset();
                    setEditingRifa(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "Uploading..." : editingRifa ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

