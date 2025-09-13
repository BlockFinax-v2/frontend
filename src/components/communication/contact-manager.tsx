import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Contact, InsertContact } from "@shared/schema";

interface ContactManagerProps {
  walletAddress: string;
  onContactSelected?: (contact: Contact) => void;
}

export function ContactManager({ walletAddress, onContactSelected }: ContactManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [newContactForm, setNewContactForm] = useState({
    contactName: "",
    contactWalletAddress: "",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts", walletAddress],
    enabled: !!walletAddress
  });

  const addContactMutation = useMutation({
    mutationFn: async (contactData: InsertContact) => {
      return await apiRequest("/api/contacts", "POST", contactData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", walletAddress] });
      setIsAddDialogOpen(false);
      setNewContactForm({ contactName: "", contactWalletAddress: "", notes: "" });
      toast({
        title: "Contact Added",
        description: "Contact has been successfully added to your address book."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add contact",
        variant: "destructive"
      });
    }
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<InsertContact> }) => {
      return await apiRequest(`/api/contacts/${id}`, "PUT", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", walletAddress] });
      setEditingContact(null);
      toast({
        title: "Contact Updated",
        description: "Contact has been successfully updated."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update contact",
        variant: "destructive"
      });
    }
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      return await apiRequest(`/api/contacts/${contactId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", walletAddress] });
      toast({
        title: "Contact Deleted",
        description: "Contact has been removed from your address book."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete contact",
        variant: "destructive"
      });
    }
  });

  const handleAddContact = () => {
    if (!newContactForm.contactName.trim() || !newContactForm.contactWalletAddress.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please provide both contact name and wallet address.",
        variant: "destructive"
      });
      return;
    }

    // Validate wallet address format
    if (!newContactForm.contactWalletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid Ethereum wallet address.",
        variant: "destructive"
      });
      return;
    }

    addContactMutation.mutate({
      ownerWalletAddress: walletAddress,
      contactWalletAddress: newContactForm.contactWalletAddress.toLowerCase(),
      contactName: newContactForm.contactName.trim(),
      notes: newContactForm.notes.trim() || null
    });
  };

  const handleUpdateContact = (contact: Contact) => {
    if (!editingContact) return;

    updateContactMutation.mutate({
      id: contact.id,
      updates: {
        contactName: contact.contactName,
        notes: contact.notes
      }
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Address Book</h3>
          <Badge variant="secondary">{(contacts as Contact[]).length}</Badge>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  value={newContactForm.contactName}
                  onChange={(e) => setNewContactForm(prev => ({ ...prev, contactName: e.target.value }))}
                  placeholder="Enter contact name"
                />
              </div>
              <div>
                <Label htmlFor="contactAddress">Wallet Address</Label>
                <Input
                  id="contactAddress"
                  value={newContactForm.contactWalletAddress}
                  onChange={(e) => setNewContactForm(prev => ({ ...prev, contactWalletAddress: e.target.value }))}
                  placeholder="0x..."
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={newContactForm.notes}
                  onChange={(e) => setNewContactForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add notes about this contact"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddContact}
                  disabled={addContactMutation.isPending}
                  className="flex-1"
                >
                  {addContactMutation.isPending ? "Adding..." : "Add Contact"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {(contacts as Contact[]).length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No contacts added yet</p>
              <p className="text-sm text-gray-400">
                Add contacts to easily identify wallet addresses in your conversations
              </p>
            </CardContent>
          </Card>
        ) : (
          (contacts as Contact[]).map((contact: Contact) => (
            <Card key={contact.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => onContactSelected?.(contact)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">
                          {contact.contactName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{contact.contactName}</h4>
                        <p className="text-sm text-gray-500">
                          {formatAddress(contact.contactWalletAddress)}
                        </p>
                        {contact.notes && (
                          <p className="text-xs text-gray-400 mt-1">{contact.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingContact(contact)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteContactMutation.mutate(contact.id)}
                      disabled={deleteContactMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Contact Dialog */}
      <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          {editingContact && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editContactName">Contact Name</Label>
                <Input
                  id="editContactName"
                  value={editingContact.contactName}
                  onChange={(e) => setEditingContact(prev => prev ? { ...prev, contactName: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editContactAddress">Wallet Address</Label>
                <Input
                  id="editContactAddress"
                  value={editingContact.contactWalletAddress}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800"
                />
                <p className="text-xs text-gray-500 mt-1">Wallet address cannot be changed</p>
              </div>
              <div>
                <Label htmlFor="editNotes">Notes</Label>
                <Input
                  id="editNotes"
                  value={editingContact.notes || ""}
                  onChange={(e) => setEditingContact(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="Add notes about this contact"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleUpdateContact(editingContact)}
                  disabled={updateContactMutation.isPending}
                  className="flex-1"
                >
                  {updateContactMutation.isPending ? "Updating..." : "Update Contact"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingContact(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}