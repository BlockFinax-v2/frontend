import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Milestone {
  id?: number;
  title: string;
  description: string;
  value: string;
  dueDate: string;
  status: 'pending' | 'claimed' | 'verified' | 'completed' | 'disputed';
  claimedBy?: string;
  claimedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  evidence?: string;
}

interface MilestoneManagerProps {
  contractId?: number;
  milestones: Milestone[];
  onMilestonesChange: (milestones: Milestone[]) => void;
  totalValue: string;
  currency: string;
  readOnly?: boolean;
  currentUserAddress?: string;
}

export function MilestoneManager({
  contractId,
  milestones,
  onMilestonesChange,
  totalValue,
  currency,
  readOnly = false,
  currentUserAddress
}: MilestoneManagerProps) {
  const [newMilestone, setNewMilestone] = useState<Partial<Milestone>>({
    title: '',
    description: '',
    value: '',
    dueDate: '',
    status: 'pending'
  });

  const addMilestone = () => {
    if (!newMilestone.title || !newMilestone.value || !newMilestone.dueDate) {
      return;
    }

    const milestone: Milestone = {
      title: newMilestone.title!,
      description: newMilestone.description || '',
      value: newMilestone.value!,
      dueDate: newMilestone.dueDate!,
      status: 'pending'
    };

    onMilestonesChange([...milestones, milestone]);
    setNewMilestone({
      title: '',
      description: '',
      value: '',
      dueDate: '',
      status: 'pending'
    });
  };

  const removeMilestone = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index);
    onMilestonesChange(updated);
  };

  const updateMilestone = (index: number, updates: Partial<Milestone>) => {
    const updated = milestones.map((milestone, i) => 
      i === index ? { ...milestone, ...updates } : milestone
    );
    onMilestonesChange(updated);
  };

  const getTotalMilestoneValue = () => {
    return milestones.reduce((sum, milestone) => sum + parseFloat(milestone.value || '0'), 0);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'default',
      claimed: 'secondary',
      verified: 'outline',
      completed: 'outline',
      disputed: 'destructive'
    } as const;

    const icons = {
      pending: Clock,
      claimed: AlertCircle,
      verified: CheckCircle,
      completed: CheckCircle,
      disputed: AlertCircle
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <Badge variant={variants[status as keyof typeof variants]} className={status === 'verified' || status === 'completed' ? 'text-green-700 border-green-300' : ''}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const claimMilestone = async (milestone: Milestone, index: number) => {
    if (!contractId || !currentUserAddress) return;

    try {
      const response = await fetch(`/api/contracts/deliverables/${milestone.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimedBy: currentUserAddress,
          evidence: 'Milestone completed as per contract requirements'
        })
      });

      if (response.ok) {
        updateMilestone(index, {
          status: 'claimed',
          claimedBy: currentUserAddress,
          claimedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to claim milestone:', error);
    }
  };

  const verifyMilestone = async (milestone: Milestone, index: number, approved: boolean) => {
    if (!contractId || !currentUserAddress) return;

    try {
      const response = await fetch(`/api/contracts/deliverables/${milestone.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifierAddress: currentUserAddress,
          status: approved ? 'approved' : 'rejected',
          signature: 'verification_signature',
          comments: approved ? 'Milestone approved' : 'Milestone needs revision'
        })
      });

      if (response.ok) {
        updateMilestone(index, {
          status: approved ? 'verified' : 'disputed',
          verifiedBy: currentUserAddress,
          verifiedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to verify milestone:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contract Milestones</h3>
        <div className="text-sm text-muted-foreground">
          Allocated: {getTotalMilestoneValue().toFixed(2)} / {totalValue} {currency}
        </div>
      </div>

      {/* Existing Milestones */}
      <div className="space-y-4">
        {milestones.map((milestone, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{milestone.title}</CardTitle>
                  {milestone.description && (
                    <p className="text-sm text-muted-foreground">{milestone.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(milestone.status)}
                  {!readOnly && milestone.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMilestone(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-medium">{milestone.value} {currency}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(milestone.dueDate), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                
                {/* Milestone Actions */}
                {contractId && currentUserAddress && (
                  <div className="flex gap-2">
                    {milestone.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => claimMilestone(milestone, index)}
                      >
                        Mark Complete
                      </Button>
                    )}
                    {milestone.status === 'claimed' && milestone.claimedBy !== currentUserAddress && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => verifyMilestone(milestone, index, true)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => verifyMilestone(milestone, index, false)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Milestone Timeline */}
              {(milestone.claimedAt || milestone.verifiedAt) && (
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  {milestone.claimedAt && (
                    <div>Completed: {format(new Date(milestone.claimedAt), 'MMM dd, yyyy HH:mm')}</div>
                  )}
                  {milestone.verifiedAt && (
                    <div>Verified: {format(new Date(milestone.verifiedAt), 'MMM dd, yyyy HH:mm')}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Milestone */}
      {!readOnly && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Milestone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Milestone title"
                value={newMilestone.title || ''}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
              />
              <Input
                type="number"
                placeholder={`Value (${currency})`}
                value={newMilestone.value || ''}
                onChange={(e) => setNewMilestone({ ...newMilestone, value: e.target.value })}
              />
            </div>
            <Textarea
              placeholder="Milestone description"
              value={newMilestone.description || ''}
              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
            />
            <div className="flex items-center gap-4">
              <Input
                type="date"
                value={newMilestone.dueDate || ''}
                onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
              />
              <Button onClick={addMilestone}>
                Add Milestone
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <div className="font-medium">
            {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
          </div>
          <div className="text-sm text-muted-foreground">
            {milestones.filter(m => m.status === 'verified').length} completed
          </div>
        </div>
        <div className="text-right">
          <div className="font-medium">
            {getTotalMilestoneValue().toFixed(2)} {currency}
          </div>
          <div className="text-sm text-muted-foreground">
            {((getTotalMilestoneValue() / parseFloat(totalValue || '1')) * 100).toFixed(1)}% allocated
          </div>
        </div>
      </div>
    </div>
  );
}