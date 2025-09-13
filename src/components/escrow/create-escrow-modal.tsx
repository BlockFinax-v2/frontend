import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { escrowManager, type CreateEscrowParams } from '@/lib/escrow';
import { NETWORKS } from '@/lib/networks';
import { Plus, Trash2, Calendar, DollarSign, Users, FileText } from 'lucide-react';

const createEscrowSchema = z.object({
  exporterAddress: z.string().min(42, 'Invalid Ethereum address').max(42, 'Invalid Ethereum address'),
  arbitratorAddress: z.string().min(42, 'Invalid Ethereum address').max(42, 'Invalid Ethereum address'),
  arbitratorFee: z.string().min(1, 'Arbitrator fee is required'),
  deadline: z.string().min(1, 'Deadline is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  termsAndConditions: z.string().min(50, 'Terms and conditions must be at least 50 characters'),
  networkId: z.number().min(1, 'Please select a network'),
  currency: z.enum(['ETH', 'USDC'], { required_error: 'Please select a currency' }),
  milestones: z.array(z.object({
    title: z.string().min(1, 'Milestone title is required'),
    description: z.string().min(10, 'Milestone description must be at least 10 characters'),
    amount: z.string().min(1, 'Milestone amount is required'),
    dueDate: z.string().min(1, 'Due date is required')
  })).min(1, 'At least one milestone is required')
});

type CreateEscrowFormData = z.infer<typeof createEscrowSchema>;

interface CreateEscrowModalProps {
  trigger: React.ReactNode;
  onEscrowCreated?: (escrowId: number, txHash: string) => void;
}

export function CreateEscrowModal({ trigger, onEscrowCreated }: CreateEscrowModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue
  } = useForm<CreateEscrowFormData>({
    resolver: zodResolver(createEscrowSchema),
    defaultValues: {
      networkId: 11155111, // Ethereum Sepolia
      currency: 'ETH' as const,
      milestones: [
        {
          title: 'Initial Payment',
          description: 'Payment for order confirmation',
          amount: '',
          dueDate: ''
        }
      ]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'milestones'
  });

  const watchedMilestones = watch('milestones');
  const totalAmount = watchedMilestones.reduce((sum, milestone) => {
    return sum + (parseFloat(milestone.amount) || 0);
  }, 0);

  const onSubmit = async (data: CreateEscrowFormData) => {
    setIsCreating(true);
    try {
      const params: CreateEscrowParams = {
        exporterAddress: data.exporterAddress,
        arbitratorAddress: data.arbitratorAddress,
        arbitratorFee: data.arbitratorFee,
        deadline: new Date(data.deadline),
        description: data.description,
        termsAndConditions: data.termsAndConditions,
        networkId: data.networkId,
        milestones: data.milestones.map(milestone => ({
          ...milestone,
          dueDate: new Date(milestone.dueDate)
        }))
      };

      const result = await escrowManager.createEscrow(params);
      
      toast({
        title: "Escrow Contract Created",
        description: `Escrow ID: ${result.escrowId}. Transaction: ${result.txHash.slice(0, 10)}...`,
      });

      onEscrowCreated?.(result.escrowId, result.txHash);
      setIsOpen(false);
      reset();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Creating Escrow",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const addMilestone = () => {
    append({
      title: '',
      description: '',
      amount: '',
      dueDate: ''
    });
  };

  const removeMilestone = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span>Create Trade Escrow Contract</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Contract Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Contract Participants</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exporterAddress">Exporter Address</Label>
                <Input
                  id="exporterAddress"
                  placeholder="0x..."
                  {...register('exporterAddress')}
                  className={errors.exporterAddress ? 'border-destructive' : ''}
                />
                {errors.exporterAddress && (
                  <p className="text-sm text-destructive">{errors.exporterAddress.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="arbitratorAddress">Arbitrator Address</Label>
                <Input
                  id="arbitratorAddress"
                  placeholder="0x..."
                  {...register('arbitratorAddress')}
                  className={errors.arbitratorAddress ? 'border-destructive' : ''}
                />
                {errors.arbitratorAddress && (
                  <p className="text-sm text-destructive">{errors.arbitratorAddress.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="arbitratorFee">Arbitrator Fee ({watch('currency')})</Label>
                <Input
                  id="arbitratorFee"
                  type="number"
                  step="0.0001"
                  placeholder="0.01"
                  {...register('arbitratorFee')}
                  className={errors.arbitratorFee ? 'border-destructive' : ''}
                />
                {errors.arbitratorFee && (
                  <p className="text-sm text-destructive">{errors.arbitratorFee.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="networkId">Network</Label>
                <select
                  {...register('networkId', { valueAsNumber: true })}
                  className="w-full p-2 border border-border rounded-md"
                >
                  {NETWORKS.filter(n => n.isTestnet).map(network => (
                    <option key={network.id} value={network.id}>
                      {network.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Payment Currency</Label>
                <select
                  {...register('currency')}
                  className="w-full p-2 border border-border rounded-md"
                >
                  <option value="ETH">ETH (Ethereum)</option>
                  <option value="USDC">USDC (USD Coin)</option>
                </select>
                {errors.currency && (
                  <p className="text-sm text-destructive">{errors.currency.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contract Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Contract Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Trade Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the goods/services being traded..."
                  {...register('description')}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Contract Deadline</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  {...register('deadline')}
                  className={errors.deadline ? 'border-destructive' : ''}
                />
                {errors.deadline && (
                  <p className="text-sm text-destructive">{errors.deadline.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
                <Textarea
                  id="termsAndConditions"
                  placeholder="Enter detailed terms and conditions for this trade..."
                  rows={4}
                  {...register('termsAndConditions')}
                  className={errors.termsAndConditions ? 'border-destructive' : ''}
                />
                {errors.termsAndConditions && (
                  <p className="text-sm text-destructive">{errors.termsAndConditions.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Payment Milestones</span>
                </div>
                <Button type="button" onClick={addMilestone} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Milestone {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`milestones.${index}.title`}>Title</Label>
                      <Input
                        placeholder="Milestone title"
                        {...register(`milestones.${index}.title`)}
                        className={errors.milestones?.[index]?.title ? 'border-destructive' : ''}
                      />
                      {errors.milestones?.[index]?.title && (
                        <p className="text-sm text-destructive">
                          {errors.milestones[index]?.title?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`milestones.${index}.amount`}>Amount ({watch('currency')})</Label>
                      <Input
                        type="number"
                        step="0.0001"
                        placeholder="0.00"
                        {...register(`milestones.${index}.amount`)}
                        className={errors.milestones?.[index]?.amount ? 'border-destructive' : ''}
                      />
                      {errors.milestones?.[index]?.amount && (
                        <p className="text-sm text-destructive">
                          {errors.milestones[index]?.amount?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`milestones.${index}.dueDate`}>Due Date</Label>
                      <Input
                        type="datetime-local"
                        {...register(`milestones.${index}.dueDate`)}
                        className={errors.milestones?.[index]?.dueDate ? 'border-destructive' : ''}
                      />
                      {errors.milestones?.[index]?.dueDate && (
                        <p className="text-sm text-destructive">
                          {errors.milestones[index]?.dueDate?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`milestones.${index}.description`}>Description</Label>
                      <Textarea
                        placeholder="Milestone description"
                        {...register(`milestones.${index}.description`)}
                        className={errors.milestones?.[index]?.description ? 'border-destructive' : ''}
                      />
                      {errors.milestones?.[index]?.description && (
                        <p className="text-sm text-destructive">
                          {errors.milestones[index]?.description?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Contract Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Contract Value:</span>
                  <span className="text-xl font-bold">{totalAmount.toFixed(4)} {watch('currency')}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">+ Arbitrator Fee:</span>
                  <span className="text-sm">{watch('arbitratorFee') || '0'} {watch('currency')}</span>
                </div>
                <div className="border-t border-border mt-2 pt-2">
                  <div className="flex items-center justify-between font-bold">
                    <span>Total Required:</span>
                    <span>{(totalAmount + parseFloat(watch('arbitratorFee') || '0')).toFixed(4)} {watch('currency')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating Contract...' : 'Create Escrow Contract'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}