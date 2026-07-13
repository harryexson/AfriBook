import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Car, User, ArrowRightLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ModeSwitch({ currentMode, onModeChange }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
        >
            <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ArrowRightLeft className="w-5 h-5" />
                            <div>
                                <p className="text-sm font-medium opacity-90">Current Mode</p>
                                <p className="text-lg font-bold capitalize">{currentMode}</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => onModeChange(currentMode === 'driver' ? 'rider' : 'driver')}
                            className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                        >
                            {currentMode === 'driver' ? (
                                <>
                                    <User className="w-4 h-4 mr-2" />
                                    Switch to Rider
                                </>
                            ) : (
                                <>
                                    <Car className="w-4 h-4 mr-2" />
                                    Switch to Driver
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}