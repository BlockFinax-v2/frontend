import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/hooks/use-wallet';
import UserProfileModal from '@/components/profile/user-profile-modal';
import { 
  Send, 
  MessageCircle, 
  User, 
  Clock,
  Check,
  CheckCheck,
  Users,
  Wifi,
  WifiOff,
  Paperclip,
  File,
  Image,
  Download,
  X,
  MoreVertical,
  Trash2,
  Forward,
  Save,
  FileDown
} from 'lucide-react';

interface MessageAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded file data
}

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: Date;
  read: boolean;
  delivered?: boolean;
  attachment?: MessageAttachment;
}

interface Conversation {
  walletAddress: string;
  lastMessage?: Message;
  unreadCount: number;
}

export default function WalletChat() {
  const { wallet } = useWallet();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newChatAddress, setNewChatAddress] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    messageId: string;
    attachment: MessageAttachment;
  } | null>(null);
  const [profileModal, setProfileModal] = useState<{
    show: boolean;
    walletAddress: string;
  }>({ show: false, walletAddress: '' });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };
    
    if (contextMenu?.show) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  // Handle context menu actions
  const handleDeleteMessage = async (messageId: string) => {
    try {
      // Remove message from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast({
        title: "Message deleted",
        description: "The message has been removed from your view."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive"
      });
    }
    setContextMenu(null);
  };

  const handleForwardMessage = (messageId: string, attachment: MessageAttachment) => {
    // Set the attachment as selected file for forwarding
    const blob = new Blob([Uint8Array.from(atob(attachment.data), c => c.charCodeAt(0))], {
      type: attachment.type
    });
    // Create a temporary file representation for forwarding
    setSelectedFile(blob as any); // Use blob directly for compatibility
    setFilePreview(attachment.data);
    
    toast({
      title: "File ready to forward",
      description: "The file is now attached and ready to send to another conversation."
    });
    setContextMenu(null);
  };

  const handleSaveToDocuments = async (messageId: string, attachment: MessageAttachment) => {
    try {
      // Convert base64 to blob
      const blob = new Blob([Uint8Array.from(atob(attachment.data), c => c.charCodeAt(0))], {
        type: attachment.type
      });
      
      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', blob, attachment.name);
      
      // Upload to document management
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        toast({
          title: "Saved to Documents",
          description: `${attachment.name} has been saved to Document Management.`
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save file to documents",
        variant: "destructive"
      });
    }
    setContextMenu(null);
  };

  const handleDownloadFile = (attachment: MessageAttachment) => {
    try {
      const blob = new Blob([Uint8Array.from(atob(attachment.data), c => c.charCodeAt(0))], {
        type: attachment.type
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: `${attachment.name} is being downloaded.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
    setContextMenu(null);
  };

  const handleAttachmentContextMenu = (e: React.MouseEvent, messageId: string, attachment: MessageAttachment) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      messageId,
      attachment
    });
  };

  const handleWalletAddressClick = (walletAddress: string) => {
    setProfileModal({
      show: true,
      walletAddress
    });
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history from database
  useEffect(() => {
    if (!wallet?.address) return;

    const loadConversationHistory = async () => {
      try {
        const response = await fetch(`/api/messages?to=${wallet.address}&limit=100`);
        if (response.ok) {
          const dbMessages = await response.json();
          
          // Convert database messages to client format
          const convertedMessages: Message[] = dbMessages.map((msg: any) => ({
            id: msg.id.toString(),
            from: msg.from,
            to: msg.to,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            read: msg.read,
            delivered: msg.delivered,
            attachment: msg.attachmentName ? {
              name: msg.attachmentName,
              type: msg.attachmentType,
              size: msg.attachmentSize,
              data: msg.attachmentData
            } : undefined
          }));

          setMessages(convertedMessages);

          // Build conversations from messages
          const conversationMap = new Map<string, Conversation>();
          
          convertedMessages.forEach(msg => {
            const otherUser = msg.from === wallet.address ? msg.to : msg.from;
            const existing = conversationMap.get(otherUser);
            
            if (!existing || new Date(msg.timestamp) > new Date(existing.lastMessage!.timestamp)) {
              conversationMap.set(otherUser, {
                walletAddress: otherUser,
                lastMessage: msg,
                unreadCount: existing?.unreadCount || 0
              });
            }
          });

          setConversations(Array.from(conversationMap.values()));
        }
      } catch (error) {
        console.error('Failed to load conversation history:', error);
      }
    };

    loadConversationHistory();
  }, [wallet?.address]);

  // WebSocket connection effect
  useEffect(() => {
    if (!wallet?.address) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      // Authenticate with wallet address
      ws.send(JSON.stringify({
        type: 'authenticate',
        walletAddress: wallet.address
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'authenticated') {
          console.log('WebSocket authenticated for:', data.walletAddress);
        } else if (data.type === 'new_message') {
          // Received a new message
          const newMsg: Message = {
            id: data.id,
            from: data.from,
            to: data.to,
            content: data.content,
            timestamp: new Date(data.timestamp),
            read: false,
            attachment: data.attachment || undefined
          };
          
          setMessages(prev => [...prev, newMsg]);
          
          // Update or create conversation
          setConversations(prev => {
            const existingConv = prev.find(c => c.walletAddress === data.from);
            if (existingConv) {
              return prev.map(c => 
                c.walletAddress === data.from 
                  ? { ...c, lastMessage: newMsg, unreadCount: c.unreadCount + 1 }
                  : c
              );
            } else {
              return [...prev, {
                walletAddress: data.from,
                lastMessage: newMsg,
                unreadCount: 1
              }];
            }
          });
          
          toast({
            title: "New message",
            description: `Message from ${formatAddress(data.from)}`
          });
        } else if (data.action === 'message_sent') {
          // Message sent confirmation
          const sentMsg: Message = {
            id: data.id,
            from: data.from,
            to: data.to,
            content: data.content,
            timestamp: new Date(data.timestamp),
            read: false,
            delivered: data.delivered || false,
            attachment: data.attachment || undefined
          };
          
          setMessages(prev => [...prev, sentMsg]);
          
          // Update conversation
          setConversations(prev => prev.map(conv => 
            conv.walletAddress === data.to 
              ? { ...conv, lastMessage: sentMsg }
              : conv
          ));

          // Show delivery status
          if (data.delivered) {
            toast({
              title: "Message delivered",
              description: `Delivered to ${formatAddress(data.to)}`
            });
          } else {
            toast({
              title: "Message queued",
              description: `Will be delivered when ${formatAddress(data.to)} comes online`,
              variant: "default"
            });
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [wallet?.address, toast]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadFile = (attachment: { name: string; type: string; data: string }) => {
    try {
      const byteCharacters = atob(attachment.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: attachment.type });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to download file",
        variant: "destructive"
      });
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || !wallet?.address || !wsRef.current) return;

    // Send message via WebSocket
    if (wsRef.current.readyState === WebSocket.OPEN) {
      let attachment = null;
      
      // Handle file attachment
      if (selectedFile) {
        try {
          const reader = new FileReader();
          const fileData = await new Promise<string>((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string;
              const base64Data = result.split(',')[1]; // Remove data:type;base64, prefix
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });

          attachment = {
            name: selectedFile.name,
            type: selectedFile.type,
            size: selectedFile.size,
            data: fileData
          };
        } catch (error) {
          toast({
            title: "File upload failed",
            description: "Unable to process file",
            variant: "destructive"
          });
          return;
        }
      }

      wsRef.current.send(JSON.stringify({
        type: 'send_message',
        to: selectedConversation,
        content: newMessage.trim() || (attachment ? `📎 ${attachment.name}` : ''),
        attachment: attachment
      }));
      
      setNewMessage('');
      removeFile();
    } else {
      toast({
        title: "Connection error",
        description: "Unable to send message. Please check your connection.",
        variant: "destructive"
      });
    }
  };

  const startNewChat = () => {
    if (!newChatAddress.trim()) return;
    
    // Validate address format
    if (!newChatAddress.startsWith('0x') || newChatAddress.length !== 42) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid wallet address",
        variant: "destructive"
      });
      return;
    }

    // Check if conversation already exists
    if (conversations.find(conv => conv.walletAddress === newChatAddress)) {
      setSelectedConversation(newChatAddress);
      setShowNewChat(false);
      setNewChatAddress('');
      return;
    }

    // Create new conversation
    const newConversation: Conversation = {
      walletAddress: newChatAddress,
      unreadCount: 0
    };

    setConversations(prev => [...prev, newConversation]);
    setSelectedConversation(newChatAddress);
    setShowNewChat(false);
    setNewChatAddress('');
    
    toast({
      title: "New conversation started",
      description: `Started chat with ${formatAddress(newChatAddress)}`
    });
  };

  const getConversationMessages = (address: string) => {
    return messages.filter(msg => 
      (msg.from === address && msg.to === wallet?.address) ||
      (msg.from === wallet?.address && msg.to === address)
    );
  };

  const markAsRead = (address: string) => {
    setMessages(prev => prev.map(msg => 
      msg.from === address ? { ...msg, read: true } : msg
    ));
    setConversations(prev => prev.map(conv => 
      conv.walletAddress === address ? { ...conv, unreadCount: 0 } : conv
    ));
  };

  if (!wallet?.address) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Wallet Required</h3>
          <p className="text-muted-foreground">Connect your wallet to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[80vh] sm:h-[600px] flex flex-col sm:flex-row bg-background border rounded-lg overflow-hidden">
      {/* Left Sidebar - Conversations List */}
      <div className="w-full sm:w-80 border-b sm:border-b-0 sm:border-r bg-background flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold">Signal</h1>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {wsConnected ? (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                ) : (
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowAddUserModal(true)}
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 bg-muted/50 border-0 focus-visible:ring-1"
            />
            <MessageCircle className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="p-4 border-b bg-blue-50 dark:bg-blue-950/20">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Start New Conversation</h3>
                <Button size="sm" variant="ghost" onClick={() => setShowAddUserModal(false)} className="h-6 w-6 p-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                placeholder="Enter wallet address (0x...)"
                value={newChatAddress}
                onChange={(e) => setNewChatAddress(e.target.value)}
                className="h-9"
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={startNewChat} className="h-8 px-3">
                  Start Chat
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowAddUserModal(false); setNewChatAddress(''); }} className="h-8 px-3">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No conversations yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Start a new conversation to begin messaging</p>
              <Button onClick={() => setShowAddUserModal(true)} size="sm">
                <Users className="h-4 w-4 mr-2" />
                Start Conversation
              </Button>
            </div>
          ) : (
            <>
              {conversations
                .filter(conv => 
                  !searchTerm || 
                  conv.walletAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  formatWalletAddress(conv.walletAddress).toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((conversation) => (
                <div
                  key={conversation.walletAddress}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50 ${
                    selectedConversation === conversation.walletAddress ? 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => {
                    setSelectedConversation(conversation.walletAddress);
                    markAsRead(conversation.walletAddress);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div 
                        className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:scale-105 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWalletAddressClick(conversation.walletAddress);
                        }}
                        title="View profile"
                      >
                        {conversation.walletAddress.slice(2, 4).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                    </div>
                    
                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 
                          className="font-medium text-sm hover:text-blue-600 cursor-pointer transition-colors truncate"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWalletAddressClick(conversation.walletAddress);
                          }}
                          title="View profile"
                        >
                          {formatWalletAddress(conversation.walletAddress)}
                        </h3>
                        <div className="flex items-center space-x-2 shrink-0">
                          {conversation.lastMessage && (
                            <span className="text-xs text-muted-foreground">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </span>
                          )}
                          {conversation.unreadCount > 0 && (
                            <div className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage.from === wallet?.address ? 'You: ' : ''}
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-background/95 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div 
                      className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => handleWalletAddressClick(selectedConversation)}
                      title="View profile"
                    >
                      {selectedConversation.slice(2, 4).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                  </div>
                  <div>
                    <h2 
                      className="font-medium cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => handleWalletAddressClick(selectedConversation)}
                      title="View profile"
                    >
                      {formatWalletAddress(selectedConversation)}
                    </h2>
                    <p className="text-sm text-green-600 font-medium">Online</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-gray-900/30">
              {getConversationMessages(selectedConversation).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Start the conversation</h3>
                  <p className="text-sm text-muted-foreground">Send a message to begin chatting with {formatWalletAddress(selectedConversation)}</p>
                </div>
              ) : (
                getConversationMessages(selectedConversation).map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.from === wallet.address ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end space-x-2 ${message.from === wallet.address ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {/* Avatar for received messages */}
                      {message.from !== wallet.address && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {message.from.slice(2, 4).toUpperCase()}
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                          message.from === wallet.address
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-white dark:bg-gray-800 border rounded-bl-md'
                        }`}
                      >
                        <div className="text-sm leading-relaxed">{message.content}</div>
                        
                        {/* Message timestamp and status */}
                        <div className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
                          message.from === wallet.address ? 'text-blue-100' : 'text-muted-foreground'
                        }`}>
                          <span>{formatTime(message.timestamp)}</span>
                          {message.from === wallet.address && (
                            <>
                              {message.delivered === false ? (
                                <Clock className="h-3 w-3 opacity-60" />
                              ) : message.read ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-background">
              {/* File Preview */}
              {selectedFile && (
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {filePreview ? (
                        <img src={filePreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg shrink-0" />
                      ) : selectedFile.type.startsWith('image/') ? (
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <Image className="h-5 w-5 text-blue-600" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <File className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{selectedFile.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={removeFile} className="h-8 w-8 p-0 shrink-0 hover:bg-red-100 hover:text-red-600">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <Input
                    placeholder={wsConnected ? "Message..." : "Connecting..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    disabled={!wsConnected}
                    className="pr-12 h-10 rounded-3xl border-muted-foreground/20 focus-visible:ring-blue-500 bg-muted/50"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!wsConnected}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted-foreground/10"
                  >
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <Button 
                  onClick={sendMessage} 
                  disabled={(!newMessage.trim() && !selectedFile) || !wsConnected}
                  size="sm"
                  className={`h-10 w-10 rounded-full p-0 ${
                    (!newMessage.trim() && !selectedFile) || !wsConnected 
                      ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.rar"
              />
              
              {!wsConnected && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Connecting to messaging server...
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50/30 dark:bg-gray-900/30">
            <div className="text-center max-w-md mx-auto p-8">
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Welcome to Signal</h3>
              <p className="text-muted-foreground mb-6">Select a conversation from the sidebar to start messaging, or create a new conversation to begin chatting.</p>
              <Button onClick={() => setShowAddUserModal(true)} className="bg-blue-500 hover:bg-blue-600">
                <Users className="h-4 w-4 mr-2" />
                Start New Conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu for File Attachments */}
      {contextMenu?.show && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            onClick={() => handleDownloadFile(contextMenu.attachment)}
          >
            <FileDown className="h-4 w-4" />
            <span>Download</span>
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            onClick={() => handleForwardMessage(contextMenu.messageId, contextMenu.attachment)}
          >
            <Forward className="h-4 w-4" />
            <span>Forward</span>
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            onClick={() => handleSaveToDocuments(contextMenu.messageId, contextMenu.attachment)}
          >
            <Save className="h-4 w-4" />
            <span>Save to Documents</span>
          </button>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 text-red-600 dark:text-red-400"
            onClick={() => handleDeleteMessage(contextMenu.messageId)}
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Message</span>
          </button>
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        walletAddress={profileModal.walletAddress}
        isOpen={profileModal.show}
        onClose={() => setProfileModal({ show: false, walletAddress: '' })}
      />
    </div>
  );
}
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            onClick={() => handleDownloadFile(contextMenu.attachment)}
          >
            <FileDown className="h-4 w-4" />
            <span>Download</span>
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            onClick={() => handleForwardMessage(contextMenu.messageId, contextMenu.attachment)}
          >
            <Forward className="h-4 w-4" />
            <span>Forward</span>
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
            onClick={() => handleSaveToDocuments(contextMenu.messageId, contextMenu.attachment)}
          >
            <Save className="h-4 w-4" />
            <span>Save to Documents</span>
          </button>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 text-red-600 dark:text-red-400"
            onClick={() => handleDeleteMessage(contextMenu.messageId)}
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Message</span>
          </button>
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        walletAddress={profileModal.walletAddress}
        isOpen={profileModal.show}
        onClose={() => setProfileModal({ show: false, walletAddress: '' })}
      />
    </div>
  );
}