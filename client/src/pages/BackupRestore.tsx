import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Download,
  Upload,
  ArrowLeft,
  AlertTriangle,
  Database,
} from "lucide-react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function BackupRestore() {
  const [, setLocation] = useLocation();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Check if user is admin
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (!user.id || user.role !== "admin") {
    setLocation("/login");
    return null;
  }

  const handleDownloadBackup = async () => {
    setIsDownloading(true);

    try {
      const response = await fetch(`/api/admin/backup?userId=${user.id}`, {
        method: "GET",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to create backup");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to download backup",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/json") {
        toast({
          variant: "destructive",
          title: "Invalid file",
          description: "Please select a valid JSON file",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a backup file",
      });
      return;
    }

    const confirmed = window.confirm(
      "⚠️ WARNING: This will overwrite all products and orders. This cannot be undone! Are you sure you want to continue?"
    );

    if (!confirmed) {
      return;
    }

    setIsRestoring(true);

    try {
      const fileContent = await selectedFile.text();
      const backup = JSON.parse(fileContent);

      const response = await fetch(`/api/admin/restore?userId=${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(backup),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to restore backup");
      }

      toast({
        title: "Success",
        description: `Backup restored successfully! Products: ${result.stats.products}, Orders: ${result.stats.orders}`,
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to restore backup",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Database className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Backup & Restore</h1>
          </div>
          <p className="text-muted-foreground">
            Download backups and restore your data
          </p>
        </div>

        <div className="space-y-6">
          {/* Download Backup Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Download Backup
              </CardTitle>
              <CardDescription>
                Download all products and orders as a JSON file
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleDownloadBackup}
                disabled={isDownloading}
                className="w-full"
                size="lg"
              >
                {isDownloading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isDownloading ? "Creating Backup..." : "Download Backup"}
              </Button>
            </CardContent>
          </Card>

          {/* Restore Backup Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Restore from Backup
              </CardTitle>
              <CardDescription>
                Upload a backup file to restore your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90
                    file:cursor-pointer cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              <Button
                onClick={handleRestoreBackup}
                disabled={isRestoring || !selectedFile}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                {isRestoring && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isRestoring ? "Restoring..." : "Restore from Backup"}
              </Button>
            </CardContent>
          </Card>

          {/* Warning Information */}
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="h-5 w-5" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
              <p>
                <strong>Backup</strong> will download all products and orders as
                a JSON file.
              </p>
              <p>
                <strong>Restore</strong> will overwrite all products and orders.
                Admin credentials are not included in backup/restore.
              </p>
              <p className="font-semibold text-red-600 dark:text-red-400">
                ⚠️ Warning: Restoring cannot be undone!
              </p>
              <p className="text-xs mt-4 text-muted-foreground">
                Note: For safety, create a backup before restoring data. Keep
                your backup files secure and in a safe location.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
