import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KarmaSeal as KarmaSealType } from '@/types/forensic';
import { SealIcon, VerifiedIcon } from './icons/DivinityIcons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface KarmaSealProps {
  seal?: KarmaSealType;
  isAnimating?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
};

export const KarmaSeal: React.FC<KarmaSealProps> = ({ 
  seal, 
  isAnimating = false,
  size = 'md' 
}) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!seal && !isAnimating) return null;

  return (
    <>
      <motion.div
        className={`relative cursor-pointer ${sizeMap[size]}`}
        onClick={() => seal && setShowDetails(true)}
        initial={isAnimating ? { scale: 3, rotate: -180, opacity: 0 } : { scale: 1, opacity: 1 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ 
          duration: 0.8, 
          type: "spring",
          stiffness: 200,
          damping: 15
        }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-accent to-primary"
          animate={{
            boxShadow: [
              '0 0 20px hsl(43 80% 55% / 0.4), 0 0 40px hsl(43 80% 55% / 0.2)',
              '0 0 40px hsl(43 80% 55% / 0.6), 0 0 80px hsl(43 80% 55% / 0.4)',
              '0 0 20px hsl(43 80% 55% / 0.4), 0 0 40px hsl(43 80% 55% / 0.2)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Inner seal */}
        <div className="absolute inset-1 rounded-full bg-seal-red flex items-center justify-center border-2 border-seal-gold/70">
          <div className="text-center">
            <span className="text-seal-gold font-display text-xs tracking-widest">
              {seal?.verified ? 'VERIFIED' : 'SEALED'}
            </span>
            <SealIcon className="w-6 h-6 mx-auto text-seal-gold mt-0.5" />
          </div>
        </div>

        {/* Verification badge */}
        {seal?.verified && (
          <motion.div 
            className="absolute -top-1 -right-1 bg-primary rounded-full p-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <VerifiedIcon className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        )}
      </motion.div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-card border-primary/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-primary flex items-center gap-2">
              <SealIcon className="w-5 h-5" />
              Karma Seal Verification
            </DialogTitle>
          </DialogHeader>
          
          {seal && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-muted rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <VerifiedIcon className={`w-5 h-5 ${seal.verified ? 'text-primary' : 'text-destructive'}`} />
                  <span className={`font-display text-sm ${seal.verified ? 'text-primary' : 'text-destructive'}`}>
                    {seal.verified ? 'Signature Valid' : 'Signature Invalid'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm font-mono">
                  <div>
                    <span className="text-muted-foreground">Algorithm:</span>
                    <span className="ml-2 text-foreground">{seal.algorithm}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Timestamp:</span>
                    <span className="ml-2 text-foreground">
                      {format(seal.timestamp, 'PPpp')}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">NTP Server:</span>
                    <span className="ml-2 text-foreground">{seal.ntpServer}</span>
                  </div>
                </div>
              </div>

              {seal.qrCodeDataUrl && (
                <div className="flex justify-center p-4 bg-white rounded-lg border border-border">
                  <img src={seal.qrCodeDataUrl} alt="Verification QR Code" className="w-32 h-32" />
                </div>
              )}

              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <span className="text-xs text-muted-foreground block mb-2">Digital Signature</span>
                <code className="text-xs text-primary break-all font-mono">
                  {seal.signature}
                </code>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <span className="text-xs text-muted-foreground block mb-2">Public Key Fingerprint</span>
                <code className="text-xs text-foreground font-mono">
                  {seal.publicKeyFingerprint}
                </code>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
