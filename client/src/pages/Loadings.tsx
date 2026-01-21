import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useLoadings, useCreateLoading } from "@/hooks/use-loadings";
import { useVehicles } from "@/hooks/use-vehicles";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLoadingSchema } from "@shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function CreateLoadingForm({ onSuccess }: { onSuccess: () => void }) {
  const { mutate, isPending } = useCreateLoading();
  const { data: vehicles } = useVehicles();
  
  const form = useForm<z.infer<typeof insertLoadingSchema>>({
    resolver: zodResolver(insertLoadingSchema),
    defaultValues: {
      type: "URBAN",
      grossFreight: "0",
      appliedPercent: "0",
      estimatedRevenue: "0",
      date: new Date(),
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutate(data, { onSuccess }))} className="space-y-4">
        <FormField
            control={form.control}
            name="vehicleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle</FormLabel>
                <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={field.value ? String(field.value) : undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicles?.map(v => (
                       <SelectItem key={v.id} value={String(v.id)}>{v.nickname} ({v.plate})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

        <div className="grid grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="URBAN">Urban</SelectItem>
                    <SelectItem value="TRIP">Trip</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                   <Input 
                      type="date" 
                      value={field.value ? format(new Date(field.value), "yyyy-MM-dd") : ""}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
            control={form.control}
            name="grossFreight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gross Freight ($)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
        />
        
        <div className="grid grid-cols-2 gap-4">
             <FormField
                control={form.control}
                name="appliedPercent"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Percent (%)</FormLabel>
                    <FormControl>
                    <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="estimatedRevenue"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Est. Revenue ($)</FormLabel>
                    <FormControl>
                    <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating..." : "Record Loading"}
        </Button>
      </form>
    </Form>
  );
}

export default function Loadings() {
  const [open, setOpen] = useState(false);
  const { data: loadings, isLoading } = useLoadings();

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Loadings</h1>
          <p className="text-muted-foreground">Track freight and trips</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20">
              <Plus className="w-4 h-4 mr-2" />
              Add Loading
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Loading</DialogTitle>
            </DialogHeader>
            <CreateLoadingForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
             <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Freight</TableHead>
                <TableHead className="text-right">Est. Revenue</TableHead>
             </TableRow>
          </TableHeader>
          <TableBody>
             {isLoading ? (
                 <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
             ) : loadings?.map(l => (
                 <TableRow key={l.id} className="hover:bg-muted/30">
                     <TableCell>{format(new Date(l.date), "MMM dd")}</TableCell>
                     <TableCell>{l.vehicle?.nickname}</TableCell>
                     <TableCell><span className="text-xs font-bold uppercase tracking-wide bg-secondary px-2 py-1 rounded">{l.type}</span></TableCell>
                     <TableCell className="text-right">${Number(l.grossFreight).toFixed(2)}</TableCell>
                     <TableCell className="text-right font-bold text-green-600">${Number(l.estimatedRevenue).toFixed(2)}</TableCell>
                 </TableRow>
             ))}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}
