'use client';

import { useState, useMemo } from 'react';
import { LessonGroup } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Search, GraduationCap, Check } from 'lucide-react';

interface LessonGroupSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonGroups: LessonGroup[];
  selectedGroupName?: string;
  onSelect: (groupName: string) => void;
  title?: string;
}

export function LessonGroupSelectionDialog({
  open,
  onOpenChange,
  lessonGroups,
  selectedGroupName,
  onSelect,
  title = 'Ders Grubu Seçin',
}: LessonGroupSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return lessonGroups;
    const query = searchQuery.toLowerCase();
    return lessonGroups.filter(g => g.groupName?.toLowerCase().includes(query));
  }, [lessonGroups, searchQuery]);

  const handleSelect = (groupName: string) => {
    onSelect(groupName);
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
            <GraduationCap className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Grup ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredGroups.map((group) => {
                const isSelected = selectedGroupName === group.groupName;
                return (
                  <button
                    key={group.id}
                    onClick={() => handleSelect(group.groupName)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 rounded-lg border transition-all",
                      isSelected
                        ? "border-purple-500 bg-purple-50"
                        : "border-transparent bg-gray-50 hover:bg-gray-100"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      isSelected ? "bg-purple-500" : "bg-gray-200"
                    )}>
                      <GraduationCap className={cn(
                        "h-6 w-6",
                        isSelected ? "text-white" : "text-gray-500"
                      )} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={cn(
                        "font-semibold",
                        isSelected && "text-purple-700"
                      )}>
                        {group.groupName}
                      </p>
                      {group.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {group.description}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}

              {filteredGroups.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{searchQuery ? 'Sonuç bulunamadı' : 'Ders grubu bulunamadı'}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
