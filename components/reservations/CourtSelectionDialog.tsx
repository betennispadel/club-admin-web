'use client';

import { useState, useMemo } from 'react';
import { Court } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Search, MapPin, Check, Clock, Grid3X3 } from 'lucide-react';

interface CourtSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courts: Court[];
  selectedCourtId?: string;
  onSelect: (court: Court | null) => void;
  title?: string;
  allowAll?: boolean;
}

export function CourtSelectionDialog({
  open,
  onOpenChange,
  courts,
  selectedCourtId,
  onSelect,
  title = 'Kort Seçin',
  allowAll = false,
}: CourtSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourts = useMemo(() => {
    if (!searchQuery.trim()) return courts;
    const query = searchQuery.toLowerCase();
    return courts.filter(c => c.name?.toLowerCase().includes(query));
  }, [courts, searchQuery]);

  const handleSelect = (court: Court | null) => {
    onSelect(court);
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) setSearchQuery('');
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kort ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {allowAll && (
                <button
                  onClick={() => handleSelect(null)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-lg border transition-all",
                    !selectedCourtId
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-gray-50 hover:bg-gray-100"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    !selectedCourtId ? "bg-primary" : "bg-gray-200"
                  )}>
                    <Grid3X3 className={cn(
                      "h-6 w-6",
                      !selectedCourtId ? "text-white" : "text-gray-500"
                    )} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={cn(
                      "font-semibold",
                      !selectedCourtId && "text-primary"
                    )}>
                      Tüm Kortlar
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {courts.length} kort
                    </p>
                  </div>
                  {!selectedCourtId && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </button>
              )}

              {filteredCourts.map((court) => {
                const isSelected = selectedCourtId === court.id;
                return (
                  <button
                    key={court.id}
                    onClick={() => handleSelect(court)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-lg border transition-all",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-transparent bg-gray-50 hover:bg-gray-100"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      isSelected ? "bg-primary" : "bg-gray-200"
                    )}>
                      <MapPin className={cn(
                        "h-6 w-6",
                        isSelected ? "text-white" : "text-gray-500"
                      )} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={cn(
                        "font-semibold",
                        isSelected && "text-primary"
                      )}>
                        {court.name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {court.availableFrom || '08:00'} - {court.availableUntil || '22:00'}
                        </span>
                        {court.timeSlotInterval && (
                          <Badge variant="outline" className="text-xs">
                            {court.timeSlotInterval} dk
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}

              {filteredCourts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Kort bulunamadı</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
