/**
 * Contract Document Upload Component
 * 
 * Handles file uploads for contract supporting documents including
 * legal documents, specifications, templates, and proof of work.
 */

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/use-wallet";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  File, 
  FileText, 
  Image, 
  X, 
  Download,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";

interface ContractDocument {
  id: number;
  contractId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string;
  uploadedBy: string;
  description?: string;
  documentType: string;
  uploadedAt: string;
}

interface DocumentUploadProps {
  contractId: number;
  disabled?: boolean;
}

const DOCUMENT_TYPES = [
  { value: 'contract_template', label: 'Contract Template' },
  { value: 'legal_document', label: 'Legal Document' },
  { value: 'specification', label: 'Technical Specification' },
  { value: 'proof_of_work', label: 'Proof of Work' },
  { value: 'compliance_cert', label: 'Compliance Certificate' },
  { value: 'financial_statement', label: 'Financial Statement' },
  { value: 'identity_verification', label: 'Identity Verification' },
  { value: 'other', label: 'Other' }
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png', 
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

export function ContractDocumentUpload({ contractId, disabled = false }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    description: '',
    documentType: 'legal_document'
  });

  const { toast } = useToast();
  const { address } = useWallet();
  const queryClient = useQueryClient();

  // Fetch existing documents
  const { data: documents = [], isLoading } = useQuery<ContractDocument[]>({
    queryKey: [`/api/contracts/${contractId}/documents`],
    enabled: !!contractId
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (documentData: any) => {
      const response = await fetch(`/api/contracts/${contractId}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contractId}/documents`] });
      setUploadForm({ description: '', documentType: 'legal_document' });
      toast({
        title: "Document uploaded",
        description: "Supporting document has been attached to the contract."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload document",
        variant: "destructive"
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await fetch(`/api/contracts/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uploaderAddress: address })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Delete failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contracts/${contractId}/documents`] });
      toast({
        title: "Document deleted",
        description: "Supporting document has been removed."
      });
    }
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || !address) return;

    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "File size must be less than 10MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, Word documents, images, and text files are allowed",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:mime;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const documentData = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: base64,
        uploadedBy: address,
        description: uploadForm.description || undefined,
        documentType: uploadForm.documentType
      };

      await uploadMutation.mutateAsync(documentData);
    } catch (error) {
      toast({
        title: "Upload error",
        description: "Failed to process file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [disabled, address, uploadForm, uploadMutation, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || uploading,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    }
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const downloadDocument = (doc: ContractDocument) => {
    try {
      const byteCharacters = atob(doc.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: doc.fileType });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the document",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading documents...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Supporting Documents</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Type and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="document-type">Document Type</Label>
              <Select 
                value={uploadForm.documentType} 
                onValueChange={(value) => setUploadForm(prev => ({ ...prev, documentType: value }))}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the document"
                disabled={disabled}
              />
            </div>
          </div>

          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
              ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Uploading document...</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports PDF, Word docs, images, and text files (max 10MB)
                  </p>
                </>
              )}
            </div>
          </div>

          {!disabled && !address && (
            <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Connect your wallet to upload documents</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Attached Documents ({documents.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(doc.fileType)}
                    <div>
                      <p className="font-medium text-sm">{doc.fileName}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-xs">
                          {DOCUMENT_TYPES.find(t => t.value === doc.documentType)?.label || doc.documentType}
                        </Badge>
                        {doc.description && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-32">{doc.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(doc)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    {doc.uploadedBy === address && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {documents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No Documents Attached</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Upload supporting documents to strengthen your contract
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}