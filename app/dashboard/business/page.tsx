"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Package,
  Clock,
  CheckCircle,
  PlusCircle,
  MapPin,
  Calendar,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSocket } from "@/hooks/use-socket";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/map"), { ssr: false });

const donationSchema = z.object({
  type: z.string().min(1, "Food type is required"),
  quantity: z.string().min(1, "Quantity is required"),
  expiry: z.string().min(1, "Expiry date is required"),
  notes: z.string().optional(),
});

export default function BusinessDashboard() {
  const { data: session } = useSession();
  const socket = useSocket();
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    completed: 0,
  });

  const form = useForm({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      type: "",
      quantity: "",
      expiry: "",
      notes: "",
    },
  });

  useEffect(() => {
    fetchDonations();
    
    if (socket) {
      socket.on('new-donation', handleNewDonation);
      socket.on('donation-updated', handleDonationUpdate);

      return () => {
        socket.off('new-donation', handleNewDonation);
        socket.off('donation-updated', handleDonationUpdate);
      };
    }
  }, [socket]);

  const fetchDonations = async () => {
    try {
      const response = await fetch(`/api/donations?businessId=${session?.user?.businessId}`);
      const data = await response.json();
      setDonations(data);
      updateStats(data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast.error('Failed to load donations');
      setIsLoading(false);
    }
  };

  const handleNewDonation = (donation) => {
    setDonations((prev) => [donation, ...prev]);
    updateStats([donation, ...donations]);
    toast.success('New donation added');
  };

  const handleDonationUpdate = (updatedDonation) => {
    setDonations((prev) =>
      prev.map((d) => (d.id === updatedDonation.id ? updatedDonation : d))
    );
    updateStats(donations.map((d) => (d.id === updatedDonation.id ? updatedDonation : d)));
    toast.success('Donation updated');
  };

  const updateStats = (donationsList) => {
    const newStats = donationsList.reduce(
      (acc, donation) => {
        if (donation.status === 'AVAILABLE') acc.active++;
        else if (donation.status === 'CLAIMED') acc.pending++;
        else if (donation.status === 'COMPLETED') acc.completed++;
        return acc;
      },
      { active: 0, pending: 0, completed: 0 }
    );
    setStats(newStats);
  };

  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create donation');

      const newDonation = await response.json();
      socket?.emit('donation-created', newDonation);
      form.reset();
      toast.success('Donation created successfully');
    } catch (error) {
      console.error('Error creating donation:', error);
      toast.error('Failed to create donation');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Rest of the component remains the same, but update the stats display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Donations</p>
              <h3 className="text-2xl font-bold">{stats.active}</h3>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Pickups</p>
              <h3 className="text-2xl font-bold">{stats.pending}</h3>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/10 rounded-full">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <h3 className="text-2xl font-bold">{stats.completed}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Update the donations list to use real data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold mb-4">Recent Donations</h2>
          <div className="space-y-4">
            {donations.map((donation) => (
              <Card key={donation.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{donation.type}</h3>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {donation.quantity}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(donation.expiry).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{donation.business.address}</span>
                    </div>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      donation.status === "AVAILABLE"
                        ? "bg-green-100 text-green-800"
                        : donation.status === "CLAIMED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {donation.status.toLowerCase()}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold mb-4">Donation Locations</h2>
          <Card className="h-[400px] overflow-hidden">
            <Map donations={donations} />
          </Card>
        </motion.div>
      </div>
    </div>
  );
}