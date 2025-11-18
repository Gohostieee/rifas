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
import { Lock, ChevronLeft, ChevronRight, Plus, Pencil } from "lucide-react";

const ITEMS_PER_PAGE = 10;

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
  };

  // Fetch data only if authenticated
  const rifas = useQuery(
    api.admin.getAllRifas,
    isAuthenticated ? {} : "skip"
  );

  const boletosData = useQuery(
    api.admin.getBoletos,
    isAuthenticated
      ? { page: currentPage, pageSize: ITEMS_PER_PAGE }
      : "skip"
  );

  const setSelectedRifa = useMutation(api.admin.setSelectedRifa);
  const createRifa = useMutation(api.admin.createRifa);
  const updateRifa = useMutation(api.admin.updateRifa);
  const generateUploadUrl = useAction(api.admin.generateUploadUrl);

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
              <CardTitle>All Boletos</CardTitle>
              <CardDescription>
                {boletosData
                  ? `Showing ${boletosData.boletos.length} of ${boletosData.total} boletos`
                  : "Loading..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                        <TableHead>Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {boletosData.boletos.map((boleto) => (
                        <TableRow key={boleto._id}>
                          <TableCell className="font-medium">
                            {boleto.number}
                          </TableCell>
                          <TableCell>{boleto.name}</TableCell>
                          <TableCell>{boleto.email}</TableCell>
                          <TableCell>{boleto.phone}</TableCell>
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

