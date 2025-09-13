/**
 * WalletChat Component
 * 
 * Main chat interface for blockchain wallet-to-wallet communication.
 * Features real-time messaging via WebSocket, file attachments, contact management,
 * and message delivery status tracking.
 */

import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Send, 
  Paperclip, 
  X, 
  Users, 
  User,
  File,
  Image,
  Download,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  ArrowLeft,
  RefreshCw,
  FileDown,
  Forward,
  Save,
  Trash2
} from 'lucide-react';
import { UserProfileModal } from './user-profile-modal';
import { ContactManager } from './contact-manager';
import { useQuery } from '@tanstack/react-query';
import type { Contact } from '@shared/schema';

/**
 * Interface for message file attachments
 * Supports various file types with base64 encoding for transmission
 */
interface MessageAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded file data
}

/**
 * Core message interface for chat communications
 * Includes delivery tracking and optional file attachments
 */
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

/**
 * Interface for conversation tracking
 * Each conversation is identified by a wallet address with message metadata
 */
interface Conversation {
  walletAddress: string;
  lastMessage?: Message;
  unreadCount: number;
}

/**
 * Main WalletChat Component
 * Provides a complete chat interface with WebSocket real-time messaging,
 * contact management, file attachments, and mobile-responsive design
 */
export default function WalletChat() {
  const { wallet } = useWallet();
  
  // Core chat state management
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  
  // File attachment handling
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  // WebSocket connection status
  const [wsConnected, setWsConnected] = useState(false);
  
  // UI state management
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newChatAddress, setNewChatAddress] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConversationList, setShowConversationList] = useState(true);
  const [showContactManager, setShowContactManager] = useState(false);
  
  // Context menu for file attachments
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    messageId: string;
    attachment: MessageAttachment;
  } | null>(null);
  
  // User profile modal state
  const [profileModal, setProfileModal] = useState<{
    show: boolean;
    walletAddress: string;
  }>({ show: false, walletAddress: '' });
  
  // Force refresh for message queries
  const [messagesRefreshKey, setMessagesRefreshKey] = useState(0);

  // DOM references
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  /**
   * Fetch contacts for wallet address name resolution
   * Enables displaying friendly names instead of raw wallet addresses
   */
  const { data: contacts = [], refetch: refetchContacts } = useQuery({
    queryKey: ["/api/contacts", { ownerWalletAddress: wallet?.address }],
    queryFn: async () => {
      if (!wallet?.address) return [];
      const response = await fetch(`/api/contacts?ownerWalletAddress=${wallet.address}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');
      return response.json();
    },
    enabled: !!wallet?.address,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });

  /**
   * Resolve wallet address to display name
   * Returns contact name if available, otherwise returns truncated address
   */
  const getDisplayName = (walletAddress: string) => {
    if (!contacts || !Array.isArray(contacts)) {
      return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
    }
    
    const contact = contacts.find((c: any) => 
      c.contactWalletAddress && c.contactWalletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
    
    if (contact && contact.contactName && contact.contactName.trim()) {
      return contact.contactName;
    }
    return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
  };

  /**
   * Handle profile modal closure and refresh data
   * Ensures contacts and messages are updated after profile changes
   */
  const handleProfileModalClose = () => {
    setProfileModal({ show: false, walletAddress: '' });
    refetchContacts();
    setMessagesRefreshKey(prev => prev + 1);
  };





  // Load conversations only once when wallet is available
  useEffect(() => {
    let mounted = true;
    
    const loadConversations = async () => {
      if (!wallet?.address) return;
      
      try {
        const response = await fetch(`/api/messages?walletAddress=${wallet.address}&limit=100`);
        if (!mounted || !response.ok) return;
        
        const allMessages = await response.json();
        if (!mounted) return;
        
        console.log('Loading fresh messages from API:', allMessages.length);
        console.log('API messages sample:', allMessages.slice(0, 3));
        
        const conversationMap = new Map<string, Conversation>();
        
        allMessages.forEach((msg: any) => {
          const otherParty = msg.from.toLowerCase() === wallet.address.toLowerCase() ? msg.to : msg.from;
          
          if (otherParty.toLowerCase() !== wallet.address.toLowerCase()) {
            const existing = conversationMap.get(otherParty.toLowerCase());
            const message: Message = {
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
            };
            
            if (!existing || new Date(msg.timestamp) > (existing.lastMessage?.timestamp || new Date(0))) {
              conversationMap.set(otherParty.toLowerCase(), {
                walletAddress: otherParty,
                lastMessage: message,
                unreadCount: existing?.unreadCount || 0
              });
            }
          }
        });
        
        const conversations = Array.from(conversationMap.values());
        const formattedMessages: Message[] = allMessages
          .filter((msg: any) => 
            msg.from.toLowerCase() === wallet.address.toLowerCase() || 
            msg.to.toLowerCase() === wallet.address.toLowerCase()
          )
          .map((msg: any) => ({
            id: msg.id.toString(),
            from: msg.from,
            to: msg.to,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            read: msg.read || false,
            delivered: msg.delivered !== false, // Default to true unless explicitly false
            attachment: msg.attachmentName ? {
              name: msg.attachmentName,
              type: msg.attachmentType,
              size: msg.attachmentSize,
              data: msg.attachmentData
            } : undefined
          }));
        
        console.log('Formatted messages count:', formattedMessages.length);
        console.log('Sample formatted message:', formattedMessages[0]);
        
        if (mounted) {
          setConversations(conversations);
          setMessages(formattedMessages);
          console.log(`Loaded ${conversations.length} conversations and ${formattedMessages.length} messages`);
          console.log('Fresh messages loaded:', formattedMessages);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error loading conversations:', error);
        }
      }
    };

    if (wallet?.address) {
      loadConversations();
    }

    return () => {
      mounted = false;
    };
  }, [wallet?.address, messagesRefreshKey]);

  // WebSocket connection
  useEffect(() => {
    if (!wallet?.address) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws`);
    
    ws.onopen = () => {
      console.log('WebSocket connected successfully');
      setWsConnected(true);
      wsRef.current = ws;
      // Send authentication message
      ws.send(JSON.stringify({
        type: 'authenticate',
        walletAddress: wallet.address
      }));
    };

    ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setWsConnected(false);
      wsRef.current = null;
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
      wsRef.current = null;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        if (data.type === 'new_message') {
          const newMessage: Message = {
            id: data.id || Date.now().toString(),
            from: data.from,
            to: data.to,
            content: data.content,
            timestamp: new Date(data.timestamp),
            read: false,
            delivered: true,
            attachment: data.attachment
          };
          
          setMessages(prev => [...prev, newMessage]);
          updateConversations(newMessage);
          console.log('New message added to conversation:', newMessage);
        } else if (data.type === 'message_sent') {
          // Update delivery status for sender
          console.log('📨 Received delivery confirmation:', data);
          
          setMessages(prev => {
            const updated = prev.map(msg => {
              const isMatchingMessage = 
                msg.from.toLowerCase() === data.from?.toLowerCase() && 
                msg.to.toLowerCase() === data.to?.toLowerCase() && 
                msg.content === data.content &&
                msg.delivered === false; // Only update undelivered messages
              
              if (isMatchingMessage) {
                console.log('✅ Updating message delivery status:', msg.id, '-> delivered');
                return { ...msg, delivered: true, id: data.id };
              }
              return msg;
            });
            
            // Log the update result
            const updatedCount = updated.filter((msg, idx) => 
              prev[idx] && msg.delivered !== prev[idx].delivered
            ).length;
            console.log('📊 Updated', updatedCount, 'message(s) delivery status');
            
            return updated;
          });
        } else if (data.type === 'authenticated') {
          console.log('WebSocket authenticated for:', data.walletAddress);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    return () => {
      ws.close();
    };
  }, [wallet?.address]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mobile keyboard handling
  useEffect(() => {
    const handleInputFocus = () => {
      if (window.innerWidth <= 768) {
        document.body.classList.add('keyboard-open');
        // Scroll input into view on mobile
        setTimeout(() => {
          const inputElement = document.querySelector('.mobile-input-container input');
          if (inputElement) {
            inputElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }, 300);
      }
    };

    const handleInputBlur = () => {
      document.body.classList.remove('keyboard-open');
    };

    const inputElement = document.querySelector('.mobile-input-container input');
    if (inputElement) {
      inputElement.addEventListener('focus', handleInputFocus);
      inputElement.addEventListener('blur', handleInputBlur);
      
      return () => {
        inputElement.removeEventListener('focus', handleInputFocus);
        inputElement.removeEventListener('blur', handleInputBlur);
      };
    }
  }, [selectedConversation]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
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
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation || !wallet?.address) return;

    let attachment: MessageAttachment | undefined;

    if (selectedFile) {
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        const base64Content = base64Data.split(',')[1]; // Remove data:image/jpeg;base64, prefix

        attachment = {
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size,
          data: base64Content
        };

        console.log('File attachment prepared:', { name: selectedFile.name, type: selectedFile.type, size: selectedFile.size });
      } catch (error) {
        console.error('Error reading file:', error);
        return;
      }
    }

    await sendMessageWithAttachment(attachment);
  };

  const sendMessageWithAttachment = async (attachment?: MessageAttachment) => {
    if (!selectedConversation || !wallet?.address) {
      console.error('Cannot send message: Missing required data');
      return;
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket not connected, state:', wsRef.current?.readyState);
      alert('Connection lost. Please refresh the page to reconnect.');
      return;
    }

    const messageContent = newMessage.trim();
    if (!messageContent && !attachment) {
      console.error('Cannot send empty message');
      return;
    }

    const messageData = {
      type: 'send_message',
      from: wallet.address,
      to: selectedConversation,
      content: messageContent,
      timestamp: new Date().toISOString(),
      attachment
    };

    console.log('Sending message via WebSocket:', messageData);

    try {
      // Send via WebSocket
      wsRef.current.send(JSON.stringify(messageData));
      
      // Add message to local state immediately for sender (mark as pending delivery)
      const tempId = `temp_${Date.now()}_${Math.random()}`;
      const sentMsg: Message = {
        id: tempId,
        from: wallet.address,
        to: selectedConversation,
        content: messageContent,
        timestamp: new Date(),
        read: false,
        delivered: false, // Will be updated when server confirms
        attachment
      };

      setMessages(prev => [...prev, sentMsg]);
      updateConversations(sentMsg);
      setNewMessage('');
      removeFile();
      
      console.log('📤 Message sent via WebSocket to:', selectedConversation, 'with temp ID:', tempId);
      console.log('📤 Message content:', messageContent.substring(0, 50));
      console.log('📤 Current delivery status: pending');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const updateConversations = (message: Message) => {
    const otherParty = message.from === wallet?.address ? message.to : message.from;
    
    setConversations(prev => {
      const existing = prev.find(c => c.walletAddress === otherParty);
      if (existing) {
        return prev.map(c => 
          c.walletAddress === otherParty 
            ? { 
                ...c, 
                lastMessage: message,
                unreadCount: message.from === wallet?.address ? c.unreadCount : c.unreadCount + 1
              }
            : c
        );
      } else {
        return [...prev, {
          walletAddress: otherParty,
          lastMessage: message,
          unreadCount: message.from === wallet?.address ? 0 : 1
        }];
      }
    });
  };

  const startNewChat = async () => {
    if (!newChatAddress.trim()) return;
    
    const normalizedAddress = newChatAddress.trim().toLowerCase();
    
    if (!normalizedAddress.startsWith('0x') || normalizedAddress.length !== 42) {
      alert('Please enter a valid wallet address (0x...)');
      return;
    }

    const existingConversation = conversations.find(c => 
      c.walletAddress.toLowerCase() === normalizedAddress
    );

    if (existingConversation) {
      setSelectedConversation(existingConversation.walletAddress);
    } else {
      const newConversation: Conversation = {
        walletAddress: normalizedAddress,
        unreadCount: 0
      };
      setConversations(prev => [...prev, newConversation]);
      setSelectedConversation(normalizedAddress);
      
      // Load existing messages for this conversation
      await loadMessagesForConversation(normalizedAddress);
    }

    setShowAddUserModal(false);
    setNewChatAddress('');
  };

  const loadMessagesForConversation = async (walletAddress: string) => {
    // Messages are already loaded in loadExistingConversations, no need to reload
    console.log(`Using cached messages for conversation with ${walletAddress}`);
  };

  const getConversationMessages = (conversationAddress: string) => {
    const filtered = messages.filter(msg => 
      (msg.from.toLowerCase() === wallet?.address.toLowerCase() && msg.to.toLowerCase() === conversationAddress.toLowerCase()) ||
      (msg.from.toLowerCase() === conversationAddress.toLowerCase() && msg.to.toLowerCase() === wallet?.address.toLowerCase())
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return filtered;
  };

  const markAsRead = (conversationAddress: string) => {
    setConversations(prev => 
      prev.map(c => 
        c.walletAddress === conversationAddress 
          ? { ...c, unreadCount: 0 }
          : c
      )
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleWalletAddressClick = (address: string) => {
    setProfileModal({ show: true, walletAddress: address });
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

  const handleDownloadFile = (attachment: MessageAttachment) => {
    const blob = new Blob([
      Uint8Array.from(atob(attachment.data), c => c.charCodeAt(0))
    ], { type: attachment.type });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setContextMenu(null);
  };

  const handleForwardMessage = (messageId: string, attachment: MessageAttachment) => {
    // TODO: Implement forward functionality
    console.log('Forward message:', messageId, attachment);
    setContextMenu(null);
  };

  const handleSaveToDocuments = async (messageId: string, attachment: MessageAttachment) => {
    // TODO: Implement save to documents functionality
    console.log('Save to documents:', messageId, attachment);
    setContextMenu(null);
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    setContextMenu(null);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu?.show) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu?.show]);

  if (!wallet?.address) {
    return (
      <div className="h-[80vh] sm:h-[600px] flex items-center justify-center border rounded-lg">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Wallet Required</h3>
          <p className="text-muted-foreground">Please create or import a wallet to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] sm:h-[600px] flex flex-col sm:flex-row bg-background border rounded-lg overflow-hidden mobile-chat-container">
      {/* Left Sidebar - Conversations List */}
      <div className={`w-full sm:w-80 border-b sm:border-b-0 sm:border-r bg-background flex flex-col ${
        showConversationList ? 'flex' : 'hidden sm:flex'
      }`}>
        {/* Header */}
        <div className="p-4 border-b bg-background/95 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold">BlockFinaX Chat</h1>
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
                onClick={() => setMessagesRefreshKey(prev => prev + 1)}
                className="h-8 w-8 p-0 hover:bg-muted"
                title="Refresh Messages"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowContactManager(true)}
                className="h-8 w-8 p-0 hover:bg-muted"
                title="Manage Contacts"
              >
                <User className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowAddUserModal(true)}
                className="h-8 w-8 p-0 hover:bg-muted"
                title="Start New Chat"
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
                  getDisplayName(conv.walletAddress).toLowerCase().includes(searchTerm.toLowerCase()) ||
                  formatWalletAddress(conv.walletAddress).toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((conversation) => (
                <div
                  key={conversation.walletAddress}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50 ${
                    selectedConversation === conversation.walletAddress ? 'bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={async () => {
                    setSelectedConversation(conversation.walletAddress);
                    markAsRead(conversation.walletAddress);
                    await loadMessagesForConversation(conversation.walletAddress);
                    // On mobile, hide conversation list when a chat is selected
                    if (window.innerWidth < 768) {
                      setShowConversationList(false);
                    }
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
                          {getDisplayName(conversation.walletAddress)}
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
      <div className={`flex-1 flex flex-col min-h-0 ${
        !showConversationList || selectedConversation ? 'flex' : 'hidden sm:flex'
      }`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-background/95 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Back button for mobile */}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setShowConversationList(true)}
                    className="h-8 w-8 p-0 md:hidden"
                    title="Back to conversations"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
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
                      {getDisplayName(selectedConversation)}
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
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-50/30 dark:bg-gray-900/30 mobile-messages-area">
              {getConversationMessages(selectedConversation).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Start the conversation</h3>
                  <p className="text-sm text-muted-foreground">Send a message to begin chatting with {getDisplayName(selectedConversation)}</p>
                </div>
              ) : (
                getConversationMessages(selectedConversation).map((message) => {
                  const isFromCurrentUser = message.from.toLowerCase() === wallet.address.toLowerCase();
                  return (
                  <div
                    key={message.id}
                    className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mobile-message-spacing`}
                  >
                    <div className={`flex items-end space-x-2 ${isFromCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {/* Avatar for received messages */}
                      {!isFromCurrentUser && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {message.from.slice(2, 4).toUpperCase()}
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-md transition-all duration-200 hover:shadow-lg message-bubble ${
                          isFromCurrentUser
                            ? 'bg-blue-500 text-white rounded-br-sm ml-2'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-sm mr-2'
                        }`}
                      >
                        <div className={`text-sm message-content ${
                          isFromCurrentUser ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                        }`}>
                          {message.content}
                        </div>
                        
                        {/* File Attachment Display */}
                        {message.attachment && (
                          <div 
                            className={`mt-3 p-3 rounded-lg border cursor-pointer hover:opacity-90 transition-all duration-200 ${
                              isFromCurrentUser
                                ? 'border-blue-300/50 bg-blue-400/20 backdrop-blur-sm'
                                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                            }`}
                            onContextMenu={(e) => handleAttachmentContextMenu(e, message.id, message.attachment!)}
                            onDoubleClick={() => handleDownloadFile(message.attachment!)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                {message.attachment.type.startsWith('image/') ? (
                                  <Image className="h-4 w-4 flex-shrink-0" />
                                ) : (
                                  <File className="h-4 w-4 flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className={`text-xs font-medium truncate ${
                                    isFromCurrentUser ? 'text-blue-50' : 'text-gray-700'
                                  }`}>
                                    {message.attachment.name}
                                  </div>
                                  <div className={`text-xs ${
                                    isFromCurrentUser ? 'text-blue-100' : 'text-gray-500'
                                  }`}>
                                    {formatFileSize(message.attachment.size)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDownloadFile(message.attachment!)}
                                  className={`p-1 h-6 w-6 ${
                                    isFromCurrentUser
                                      ? 'hover:bg-blue-400 text-blue-50'
                                      : 'hover:bg-gray-200 text-gray-600'
                                  }`}
                                  title="Download file"
                                >
                                  <Download className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => handleAttachmentContextMenu(e, message.id, message.attachment!)}
                                  className={`p-1 h-6 w-6 ${
                                    isFromCurrentUser
                                      ? 'hover:bg-blue-400 text-blue-50'
                                      : 'hover:bg-gray-200 text-gray-600'
                                  }`}
                                  title="More options"
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Image Preview */}
                            {message.attachment.type.startsWith('image/') && (
                              <div className="mt-2">
                                <img
                                  src={`data:${message.attachment.type};base64,${message.attachment.data}`}
                                  alt={message.attachment.name}
                                  className="max-w-full h-auto rounded border max-h-32 object-cover"
                                />
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Message timestamp and status */}
                        <div className={`flex items-center justify-end space-x-2 mt-2 text-xs ${
                          isFromCurrentUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          <span className="font-medium">{formatTime(message.timestamp)}</span>
                          {isFromCurrentUser && (
                            <div className="flex items-center space-x-1 px-1 py-0.5 rounded-md bg-black/10 sm:bg-transparent">
                              {message.delivered === false ? (
                                <div className="flex items-center space-x-1" title="Sending">
                                  <Clock className="h-3.5 w-3.5 opacity-70 message-status-icon" />
                                  <span className="text-xs opacity-70 hidden sm:inline">Sending</span>
                                </div>
                              ) : message.read ? (
                                <div className="flex items-center space-x-1" title="Read">
                                  <CheckCheck className="h-3.5 w-3.5 text-blue-200 message-status-icon" />
                                  <span className="text-xs opacity-80 hidden sm:inline">Read</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1" title="Delivered">
                                  <Check className="h-3.5 w-3.5 text-blue-200 message-status-icon" />
                                  <span className="text-xs opacity-80 hidden sm:inline">Delivered</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="mobile-input-container shrink-0">
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
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-muted-foreground mb-4">No conversation selected</p>
              <Button onClick={() => setShowAddUserModal(true)} variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                New Chat
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
        onClose={handleProfileModalClose}
      />

      {/* Contact Manager Modal */}
      {showContactManager && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-background border rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden m-4">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Contact Management</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContactManager(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {wallet?.address && (
                <ContactManager
                  walletAddress={wallet.address}
                  onContactSelected={(contact) => {
                    setSelectedConversation(contact.contactWalletAddress);
                    setShowContactManager(false);
                    // On mobile, hide conversation list when a chat is selected
                    if (window.innerWidth < 768) {
                      setShowConversationList(false);
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}