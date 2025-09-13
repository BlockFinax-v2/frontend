import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  Download, 
  Share2, 
  Eye, 
  Lock, 
  Unlock, 
  Calendar, 
  Clock, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Copy,
  QrCode,
  FileCheck,
  Globe,
  Users
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  blockchainHash?: string;
  isHashed: boolean;
  accessLevel: 'public' | 'private' | 'restricted';
  viewCount: number;
  downloadCount: number;
  expiryDate?: Date;
  maxViews?: number;
  isVerified: boolean;
  hash: string;
  tags: string[];
  sharedWith: string[];
  category: 'invoice' | 'contract' | 'certificate' | 'shipping' | 'insurance' | 'other';
}

interface AccessLink {
  id: string;
  documentId: string;
  url: string;
  accessType: 'view' | 'download' | 'both';
  expiryDate?: Date;
  maxUses?: number;
  currentUses: number;
  password?: string;
  isActive: boolean;
  createdDate: Date;
}

export default function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Commercial Invoice INV-2024-001.pdf',
      type: 'application/pdf',
      size: 245760,
      uploadDate: new Date('2024-01-15'),
      blockchainHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
      isHashed: true,
      accessLevel: 'restricted',
      viewCount: 12,
      downloadCount: 3,
      expiryDate: new Date('2024-06-15'),
      maxViews: 50,
      isVerified: true,
      hash: '0x1a2b3c...',
      tags: ['invoice', 'urgent', 'verified'],
      sharedWith: ['buyer@company.com', 'bank@finance.com'],
      category: 'invoice'
    },
    {
      id: '2',
      name: 'Bill of Lading BOL-2024-001.pdf',
      type: 'application/pdf',
      size: 512000,
      uploadDate: new Date('2024-01-20'),
      isHashed: false,
      accessLevel: 'private',
      viewCount: 5,
      downloadCount: 1,
      isVerified: false,
      hash: '0x4d5e6f...',
      tags: ['shipping', 'pending'],
      sharedWith: [],
      category: 'shipping'
    }
  ]);

  const [accessLinks, setAccessLinks] = useState<AccessLink[]>([
    {
      id: '1',
      documentId: '1',
      url: 'https://blockfinax.app/doc/view/abc123',
      accessType: 'view',
      expiryDate: new Date('2024-03-01'),
      maxUses: 10,
      currentUses: 3,
      isActive: true,
      createdDate: new Date('2024-01-15')
    }
  ]);

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [hashDialogOpen, setHashDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [accessPassword, setAccessPassword] = useState('');
  const [remainingViewTime, setRemainingViewTime] = useState(0);
  const [verificationHash, setVerificationHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<{ isValid: boolean; document?: Document; message: string } | null>(null);
  const [linkAccessType, setLinkAccessType] = useState<'view' | 'download' | 'both'>('view');
  const [linkExpiryDate, setLinkExpiryDate] = useState('');
  const [linkMaxUses, setLinkMaxUses] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [showLinkPreview, setShowLinkPreview] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    for (const file of Array.from(files)) {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const newDocument: Document = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        uploadDate: new Date(),
        isHashed: false,
        accessLevel: 'private',
        viewCount: 0,
        downloadCount: 0,
        isVerified: false,
        hash: `0x${Math.random().toString(16).substr(2, 8)}...`,
        tags: [],
        sharedWith: [],
        category: 'other'
      };

      setDocuments(prev => [...prev, newDocument]);
    }

    setIsUploading(false);
    setUploadProgress(0);
    toast({
      title: "Documents uploaded successfully",
      description: `${files.length} document(s) uploaded and ready for management.`
    });
  };

  const handleHashDocument = async (documentId: string) => {
    // Generate a secure hash for blockchain verification
    const timestamp = Date.now();
    const randomSalt = Math.random().toString(36).substr(2, 8);
    const hashInput = `${documentId}-${timestamp}-${randomSalt}`;
    
    // Create a browser-compatible hash
    const encoder = new TextEncoder();
    const data = encoder.encode(hashInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const blockchainHash = `0x${hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substr(0, 40)}`;
    
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { ...doc, isHashed: true, blockchainHash, isVerified: true }
        : doc
    ));
    
    toast({
      title: "Document hashed to blockchain",
      description: "Document hash has been registered on the blockchain for verification."
    });
    setHashDialogOpen(false);
  };

  const generateAccessLink = () => {
    if (!selectedDocument) return;

    const linkId = Math.random().toString(36).substr(2, 8);
    const newLink: AccessLink = {
      id: Date.now().toString(),
      documentId: selectedDocument.id,
      url: `https://blockfinax.app/doc/${linkAccessType}/${linkId}`,
      accessType: linkAccessType,
      expiryDate: linkExpiryDate ? new Date(linkExpiryDate) : undefined,
      maxUses: linkMaxUses ? parseInt(linkMaxUses) : undefined,
      currentUses: 0,
      password: linkPassword || undefined,
      isActive: true,
      createdDate: new Date()
    };

    setAccessLinks(prev => [...prev, newLink]);
    
    // Set generated link for preview
    setGeneratedLink(newLink.url);
    setShowLinkPreview(true);
    
    // Copy to clipboard
    navigator.clipboard.writeText(newLink.url);
    
    toast({
      title: "Access link generated",
      description: `Secure ${linkAccessType} link created and copied to clipboard.`
    });
  };

  const handleViewDocument = (document: Document) => {
    setViewingDocument(document);
    setViewDialogOpen(true);
    
    // Update view count
    setDocuments(prev => prev.map(doc => 
      doc.id === document.id 
        ? { ...doc, viewCount: doc.viewCount + 1 }
        : doc
    ));

    // Set viewing session time (default 30 minutes)
    setRemainingViewTime(30 * 60); // 30 minutes in seconds
    
    // Start countdown timer
    const timer = setInterval(() => {
      setRemainingViewTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setViewDialogOpen(false);
          toast({
            title: "View session expired",
            description: "The document viewing session has ended for security."
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const validateDocumentAccess = (document: Document, password?: string): boolean => {
    if (document.accessLevel === 'public') return true;
    if (document.accessLevel === 'private') return true; // Owner access
    if (document.accessLevel === 'restricted') {
      // Check if password required and matches
      return password === 'demo123'; // Demo password
    }
    return false;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const verifyDocumentHash = (hash: string) => {
    if (!hash.trim()) {
      setVerificationResult({
        isValid: false,
        message: "Please enter a hash to verify"
      });
      return;
    }

    // Check if hash exists in our documents or blockchain
    const foundDocument = documents.find(doc => 
      doc.hash === hash || doc.blockchainHash === hash
    );

    if (foundDocument) {
      setVerificationResult({
        isValid: true,
        document: foundDocument,
        message: `Document verified! Hash matches: ${foundDocument.name}`
      });
      toast({
        title: "Document verified",
        description: "The document hash is valid and matches blockchain records."
      });
    } else {
      // Simulate blockchain verification
      setVerificationResult({
        isValid: false,
        message: "Hash not found in blockchain records. Document may not be registered or hash is invalid."
      });
      toast({
        title: "Verification failed",
        description: "Document hash not found in blockchain records.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDocument = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDocument = () => {
    if (!documentToDelete) return;
    
    // Remove document from documents list
    setDocuments(prev => prev.filter(doc => doc.id !== documentToDelete.id));
    
    // Remove associated access links
    setAccessLinks(prev => prev.filter(link => link.documentId !== documentToDelete.id));
    
    toast({
      title: "Document deleted",
      description: `"${documentToDelete.name}" has been permanently deleted.`
    });
    
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
    setViewDialogOpen(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryColor = (category: Document['category']) => {
    const colors = {
      invoice: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      contract: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      certificate: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      shipping: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      insurance: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[category];
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight">Document Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Upload, tokenize, and manage trade documents with secure access controls
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} className="flex items-center space-x-2 w-full sm:w-auto">
          <Upload className="h-4 w-4" />
          <span>Upload Documents</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading documents...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-10 sm:h-12">
          <TabsTrigger value="documents" className="text-xs sm:text-sm">Documents</TabsTrigger>
          <TabsTrigger value="access-links" className="text-xs sm:text-sm">Access Links</TabsTrigger>
          <TabsTrigger value="verify" className="text-xs sm:text-sm">Verify Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-3 sm:space-y-4">
          <div className="grid gap-3 sm:gap-4">
            {documents.map((document) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
                    <div className="flex items-start space-x-3 sm:space-x-4 min-w-0 flex-1">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg shrink-0">
                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base truncate">{document.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 sm:space-x-4 text-xs sm:text-sm text-muted-foreground mt-1">
                          <span>{formatFileSize(document.size)}</span>
                          <span className="hidden sm:inline">{document.uploadDate.toLocaleDateString()}</span>
                          <Badge className={`${getCategoryColor(document.category)} text-xs`}>
                            {document.category}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          {document.isHashed ? (
                            <Badge variant="secondary" className="flex items-center space-x-1">
                              <Shield className="h-3 w-3" />
                              <span>Blockchain Hash</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not Hashed</Badge>
                          )}
                          {document.isVerified ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>Verified</span>
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="flex items-center space-x-1">
                              <AlertCircle className="h-3 w-3" />
                              <span>Pending</span>
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{document.viewCount} views</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Download className="h-3 w-3" />
                            <span>{document.downloadCount} downloads</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{document.sharedWith.length} shared</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!document.isHashed && (
                        <Dialog open={hashDialogOpen} onOpenChange={setHashDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedDocument(document)}>
                              <Shield className="h-4 w-4 mr-1" />
                              Hash to Blockchain
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Hash Document to Blockchain</DialogTitle>
                              <DialogDescription>
                                Create a secure blockchain hash for this document to enable verification by other users.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Document Name</Label>
                                <Input value={selectedDocument?.name || ''} disabled />
                              </div>
                              <div className="space-y-2">
                                <Label>Document Hash</Label>
                                <Input value={selectedDocument?.hash || ''} disabled />
                              </div>
                              <div className="space-y-2">
                                <Label>Verification Purpose</Label>
                                <Textarea placeholder="Enter purpose for blockchain verification..." />
                              </div>
                              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-sm text-blue-800">
                                  <strong>Note:</strong> Once hashed to the blockchain, other users can verify this document's authenticity by checking the hash on the blockchain.
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => setHashDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={() => handleHashDocument(document.id)}>
                                Hash to Blockchain
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedDocument(document)}>
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Share Document</DialogTitle>
                            <DialogDescription>
                              Generate secure access links with custom permissions and expiration.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Access Type</Label>
                                <Select value={linkAccessType} onValueChange={(value: 'view' | 'download' | 'both') => setLinkAccessType(value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="view">View Only</SelectItem>
                                    <SelectItem value="download">Download Only</SelectItem>
                                    <SelectItem value="both">View & Download</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label>Expiry Date</Label>
                                <Input 
                                  type="date" 
                                  value={linkExpiryDate}
                                  onChange={(e) => setLinkExpiryDate(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Max Uses</Label>
                                <Input 
                                  type="number" 
                                  placeholder="Leave empty for unlimited"
                                  value={linkMaxUses}
                                  onChange={(e) => setLinkMaxUses(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Password (Optional)</Label>
                                <Input 
                                  type="password" 
                                  placeholder="Set access password"
                                  value={linkPassword}
                                  onChange={(e) => setLinkPassword(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch 
                                checked={requireEmailVerification}
                                onCheckedChange={setRequireEmailVerification}
                              />
                              <Label>Require email verification</Label>
                            </div>

                            {showLinkPreview && (
                              <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                  <h4 className="font-semibold text-green-800 dark:text-green-200">Link Generated Successfully</h4>
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm text-green-700 dark:text-green-300">Secure Access Link:</Label>
                                  <div className="flex items-center space-x-2">
                                    <Input 
                                      value={generatedLink} 
                                      readOnly 
                                      className="bg-white dark:bg-gray-800 text-sm"
                                    />
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        navigator.clipboard.writeText(generatedLink);
                                        toast({
                                          title: "Copied to clipboard",
                                          description: "Access link copied successfully."
                                        });
                                      }}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-xs text-green-700 dark:text-green-300">
                                    <div>
                                      <span className="font-medium">Access Type:</span> {linkAccessType}
                                    </div>
                                    <div>
                                      <span className="font-medium">Expires:</span> {linkExpiryDate || 'Never'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Max Uses:</span> {linkMaxUses || 'Unlimited'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Password:</span> {linkPassword ? 'Protected' : 'None'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => {
                              setShareDialogOpen(false);
                              setShowLinkPreview(false);
                              setGeneratedLink('');
                              setLinkAccessType('view');
                              setLinkExpiryDate('');
                              setLinkMaxUses('');
                              setLinkPassword('');
                              setRequireEmailVerification(false);
                            }}>
                              {showLinkPreview ? 'Close' : 'Cancel'}
                            </Button>
                            {!showLinkPreview && (
                              <Button onClick={generateAccessLink}>
                                Generate Link
                              </Button>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="outline" size="sm" onClick={() => handleViewDocument(document)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="access-links" className="space-y-4">
          <div className="grid gap-4">
            {accessLinks.map((link) => {
              const document = documents.find(d => d.id === link.documentId);
              return (
                <Card key={link.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{document?.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <Badge variant={link.isActive ? 'default' : 'secondary'}>
                            {link.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <span>Access: {link.accessType}</span>
                          <span>Uses: {link.currentUses}/{link.maxUses || '∞'}</span>
                          {link.expiryDate && (
                            <span>Expires: {link.expiryDate.toLocaleDateString()}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <code className="bg-muted px-2 py-1 rounded text-xs">{link.url}</code>
                          <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(link.url)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <QrCode className="h-4 w-4 mr-1" />
                          QR Code
                        </Button>
                        <Button variant="outline" size="sm">
                          Revoke
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="verify" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Document Verification</span>
              </CardTitle>
              <CardDescription>
                Verify the authenticity of documents by checking their blockchain hash. Enter a hash provided by another user to verify document integrity.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Document Hash</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter document hash (e.g., 0x1a2b3c...)"
                      value={verificationHash}
                      onChange={(e) => setVerificationHash(e.target.value)}
                    />
                    <Button onClick={() => verifyDocumentHash(verificationHash)}>
                      <FileCheck className="h-4 w-4 mr-2" />
                      Verify
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Copy and paste the hash from a shared document link or verification email
                  </p>
                </div>

                {verificationResult && (
                  <div className={`p-4 rounded-lg border ${
                    verificationResult.isValid 
                      ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                      : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  }`}>
                    <div className="flex items-start space-x-3">
                      {verificationResult.isValid ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h3 className={`font-semibold ${
                          verificationResult.isValid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                        }`}>
                          {verificationResult.isValid ? 'Document Verified' : 'Verification Failed'}
                        </h3>
                        <p className={`text-sm ${
                          verificationResult.isValid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                        }`}>
                          {verificationResult.message}
                        </p>
                        
                        {verificationResult.isValid && verificationResult.document && (
                          <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                            <h4 className="font-medium mb-2">Document Details:</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Name:</span>
                                <p className="font-medium">{verificationResult.document.name}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Category:</span>
                                <Badge className={getCategoryColor(verificationResult.document.category)}>
                                  {verificationResult.document.category}
                                </Badge>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Upload Date:</span>
                                <p>{verificationResult.document.uploadDate.toLocaleDateString()}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Status:</span>
                                <div className="flex space-x-2">
                                  {verificationResult.document.isHashed && (
                                    <Badge variant="secondary">Blockchain Hash</Badge>
                                  )}
                                  {verificationResult.document.isVerified && (
                                    <Badge className="bg-green-100 text-green-800">Verified</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">How Document Verification Works</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                      <h4 className="font-medium">Hash Generation</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      When a document is uploaded, a unique hash is created and stored on the blockchain
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                      <h4 className="font-medium">Share Hash</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Document owners can share the hash with others for verification purposes
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                      <h4 className="font-medium">Verify Authenticity</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Recipients can verify the document's authenticity by checking the hash on the blockchain
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Try Verification</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Test the verification system with these sample hashes:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                    <code className="text-xs">0x1a2b3c4d5e6f7890abcdef1234567890abcdef12</code>
                    <Button size="sm" variant="outline" onClick={() => setVerificationHash('0x1a2b3c4d5e6f7890abcdef1234567890abcdef12')}>
                      Use Hash
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                    <code className="text-xs">0x4d5e6f...</code>
                    <Button size="sm" variant="outline" onClick={() => setVerificationHash('0x4d5e6f...')}>
                      Use Hash
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Viewer Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>{viewingDocument?.name}</span>
                {viewingDocument?.isVerified && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1 text-orange-600">
                  <Clock className="h-4 w-4" />
                  <span>Session: {formatTime(remainingViewTime)}</span>
                </div>
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>{viewingDocument?.accessLevel}</span>
                </Badge>
              </div>
            </DialogTitle>
            <DialogDescription>
              Secure document viewing session with time-limited access. Document hash: {viewingDocument?.hash}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {viewingDocument?.accessLevel === 'restricted' && !validateDocumentAccess(viewingDocument, accessPassword) ? (
              <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <Lock className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Document Access Required</h3>
                <p className="text-muted-foreground text-center">
                  This document requires password authentication to view.
                </p>
                <div className="space-y-3 w-full max-w-sm">
                  <div className="space-y-2">
                    <Label>Access Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter access password"
                      value={accessPassword}
                      onChange={(e) => setAccessPassword(e.target.value)}
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      if (validateDocumentAccess(viewingDocument, accessPassword)) {
                        toast({
                          title: "Access granted",
                          description: "You can now view the document."
                        });
                      } else {
                        toast({
                          title: "Access denied",
                          description: "Invalid password. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Unlock Document
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Demo password: demo123
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Document Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-xs text-muted-foreground">File Size</Label>
                    <div className="font-medium">{formatFileSize(viewingDocument?.size || 0)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Upload Date</Label>
                    <div className="font-medium">{viewingDocument?.uploadDate.toLocaleDateString()}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <Badge className={getCategoryColor(viewingDocument?.category || 'other')}>
                      {viewingDocument?.category}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Blockchain Hash</Label>
                    <code className="text-xs bg-background px-1 rounded">{viewingDocument?.hash}</code>
                  </div>
                </div>

                {/* Document Viewer */}
                <div className="border rounded-lg overflow-hidden bg-white">
                  <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Document Preview</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => viewingDocument && handleDeleteDocument(viewingDocument)}
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  <div className="h-96 flex items-center justify-center bg-gray-100">
                    {viewingDocument?.type === 'application/pdf' ? (
                      <div className="text-center space-y-4">
                        <FileText className="h-16 w-16 text-blue-500 mx-auto" />
                        <div>
                          <h3 className="font-semibold">PDF Document</h3>
                          <p className="text-sm text-muted-foreground">
                            {viewingDocument.category === 'invoice' && 'Commercial Invoice - Trade Document'}
                            {viewingDocument.category === 'shipping' && 'Bill of Lading - Shipping Document'}
                            {viewingDocument.category === 'contract' && 'Trade Contract - Legal Document'}
                            {viewingDocument.category === 'certificate' && 'Certificate - Verification Document'}
                            {viewingDocument.category === 'insurance' && 'Insurance Certificate - Coverage Document'}
                            {viewingDocument.category === 'other' && 'Trade Document'}
                          </p>
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                            <strong>Document Content Preview:</strong><br/>
                            {viewingDocument.category === 'invoice' && (
                              <>Invoice Number: INV-2024-001<br/>
                              Amount: $45,750.00 USD<br/>
                              Payment Terms: Net 30 days<br/>
                              Goods: Electronic Components - 500 units</>
                            )}
                            {viewingDocument.category === 'shipping' && (
                              <>Bill of Lading: BOL-2024-001<br/>
                              Vessel: MV Trade Express<br/>
                              Port of Loading: Shanghai<br/>
                              Port of Discharge: Los Angeles</>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto" />
                        <div>
                          <h3 className="font-semibold">Document Preview</h3>
                          <p className="text-sm text-muted-foreground">
                            Preview not available for this file type
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Session Information */}
                <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Secure Viewing Session</span>
                  </div>
                  <div className="text-sm text-orange-700">
                    Time remaining: {formatTime(remainingViewTime)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Delete Document</span>
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to permanently delete this document?
            </DialogDescription>
          </DialogHeader>
          
          {documentToDelete && (
            <div className="py-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{documentToDelete.name}</h4>
                    <div className="flex items-center space-x-3 text-sm text-muted-foreground mt-1">
                      <span>{formatFileSize(documentToDelete.size)}</span>
                      <span>{documentToDelete.uploadDate.toLocaleDateString()}</span>
                      <Badge className={getCategoryColor(documentToDelete.category)}>
                        {documentToDelete.category}
                      </Badge>
                    </div>
                    {documentToDelete.isHashed && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Blockchain Hash: {documentToDelete.blockchainHash?.substr(0, 16)}...
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800 dark:text-red-200">
                    <p className="font-medium">Warning: This will also delete:</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      <li>• All associated access links</li>
                      <li>• Document blockchain hash records</li>
                      <li>• View and download statistics</li>
                      <li>• Sharing permissions and settings</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteDocument}
              className="bg-red-600 hover:bg-red-700"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Delete Permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}