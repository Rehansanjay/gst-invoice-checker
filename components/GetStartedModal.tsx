'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Zap, UserPlus, LogIn } from 'lucide-react';

interface GetStartedModalProps {
    open: boolean;
    onClose: () => void;
}

export default function GetStartedModal({ open, onClose }: GetStartedModalProps) {
    const router = useRouter();

    const handleChoice = (path: string) => {
        onClose();
        router.push(path);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">Choose Your Path</DialogTitle>
                    <DialogDescription className="text-center">
                        How would you like to check your invoices?
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {/* Quick Check */}
                    <Card
                        className="p-6 cursor-pointer hover:shadow-lg hover:border-primary transition-all group"
                        onClick={() => handleChoice('/check')}
                    >
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                <Zap className="w-8 h-8 text-primary group-hover:text-white" />
                            </div>
                            <h3 className="font-bold text-lg">Quick Check</h3>
                            <p className="text-sm text-muted-foreground">
                                Pay <span className="font-bold text-primary">₹99</span> per invoice
                            </p>
                            <p className="text-xs text-muted-foreground">
                                No login required • Instant results
                            </p>
                            <Button className="w-full mt-4 group-hover:bg-primary group-hover:text-white" variant="outline">
                                Get Started
                            </Button>
                        </div>
                    </Card>

                    {/* Sign Up */}
                    <Card
                        className="p-6 cursor-pointer hover:shadow-lg hover:border-green-500 transition-all group"
                        onClick={() => handleChoice('/signup')}
                    >
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-500 transition-colors">
                                <UserPlus className="w-8 h-8 text-green-600 group-hover:text-white" />
                            </div>
                            <h3 className="font-bold text-lg">Sign Up</h3>
                            <p className="text-sm text-muted-foreground">
                                Get bulk packages from <span className="font-bold text-green-600">₹50/check</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Save up to 50% • Dashboard access
                            </p>
                            <Button className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white">
                                Create Account
                            </Button>
                        </div>
                    </Card>

                    {/* Login */}
                    <Card
                        className="p-6 cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all group"
                        onClick={() => handleChoice('/login')}
                    >
                        <div className="text-center space-y-3">
                            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                                <LogIn className="w-8 h-8 text-blue-600 group-hover:text-white" />
                            </div>
                            <h3 className="font-bold text-lg">Login</h3>
                            <p className="text-sm text-muted-foreground">
                                Already have an account?
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Access your dashboard
                            </p>
                            <Button className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white">
                                Sign In
                            </Button>
                        </div>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
