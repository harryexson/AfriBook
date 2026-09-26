'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, isSameDay, isBefore, isAfter, isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  value: { from: Date; to: Date } | undefined;
  onChange: (value: { from: Date; to: Date } | undefined) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  className?: string;
}

export function DateRangePicker({ 
  value, 
  onChange, 
  placeholder = 'Select dates',
  minDate = new Date(),
  maxDate,
  disabledDates = [],
  className 
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const inputRef = useRef<HTMLInputElement>(null);

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, minDate)) return true;
    if (maxDate && isAfter(date, maxDate)) return true;
    return disabledDates.some(d => isSameDay(d, date));
  };

  const isDateSelected = (date: Date) => {
    if (!value) return false;
    return isSameDay(date, value.from) || isSameDay(date, value.to);
  };

  const isDateInRange = (date: Date) => {
    if (!value || !value.to) return false;
    return isAfter(date, value.from) && isBefore(date, value.to);
  };

  const isDateRangeStart = (date: Date) => {
    if (!value) return false;
    return isSameDay(date, value.from);
  };

  const isDateRangeEnd = (date: Date) => {
    if (!value || !value.to) return false;
    return isSameDay(date, value.to);
  };

  const handleDayClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (!value || (value.from && value.to)) {
      // Start new selection
      onChange({ from: date, to: date });
    } else if (value.from && !value.to) {
      // Complete selection
      if (isBefore(date, value.from)) {
        onChange({ from: date, to: value.from });
      } else {
        onChange({ from: value.from, to: date });
      }
      setOpen(false);
    }
  };

  const handleDayHover = (date: Date) => {
    if (!value || !value.from || value.to) return;
    setHoverDate(date);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setOpen(false);
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth)),
  });

  const monthName = format(currentMonth, 'MMMM yyyy');

  return (
    <div className={cn('relative', className)}>
      <div 
        className="relative"
        onClick={() => setOpen(true)}
      >
        <input
          ref={inputRef}
          placeholder={placeholder}
          readOnly
          value={
            value
              ? `${format(value.from, 'MMM d')} - ${format(value.to, 'MMM d')}`
              : ''
          }
          className="w-full pl-10 pr-10 py-2 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-auto p-3 bg-white border rounded-lg shadow-lg" style={{ minWidth: 680 }}>
          {/* Month 1 */}
          <div className="flex items-center justify-between px-2 py-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 rounded hover:bg-muted"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="font-medium text-center flex-1">{monthName}</span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 rounded hover:bg-muted"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {daysInMonth.map(day => {
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const selected = isDateSelected(day);
              const inRange = isDateInRange(day);
              const rangeStart = isDateRangeStart(day);
              const rangeEnd = isDateRangeEnd(day);
              const disabled = isDateDisabled(day);
              const today = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => handleDayHover(day)}
                  onMouseLeave={() => setHoverDate(null)}
                  disabled={disabled}
                  className={cn(
                    'relative h-9 w-9 mx-auto rounded-full text-sm font-medium transition-all',
                    !isCurrentMonth && 'text-muted-foreground/50',
                    disabled && 'opacity-30 cursor-not-allowed',
                    today && !selected && 'font-bold text-primary',
                    selected && 'bg-primary text-white',
                    inRange && 'bg-primary/10',
                    rangeStart && 'rounded-l-full',
                    rangeEnd && 'rounded-r-full',
                    rangeStart && rangeEnd && 'rounded-full'
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Month 2 */}
          <div className="flex items-center justify-between px-2 py-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 rounded hover:bg-muted"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="font-medium text-center flex-1">
              {format(addMonths(currentMonth, 1), 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 rounded hover:bg-muted"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day + '2'} className="text-center text-xs font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {eachDayOfInterval({
              start: startOfWeek(startOfMonth(addMonths(currentMonth, 1))),
              end: endOfWeek(endOfMonth(addMonths(currentMonth, 1))),
            }).map(day => {
              const isCurrentMonth = isSameMonth(day, addMonths(currentMonth, 1));
              const selected = isDateSelected(day);
              const inRange = isDateInRange(day);
              const rangeStart = isDateRangeStart(day);
              const rangeEnd = isDateRangeEnd(day);
              const disabled = isDateDisabled(day);
              const today = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString() + '2'}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  onMouseEnter={() => handleDayHover(day)}
                  onMouseLeave={() => setHoverDate(null)}
                  disabled={disabled}
                  className={cn(
                    'relative h-9 w-9 mx-auto rounded-full text-sm font-medium transition-all',
                    !isCurrentMonth && 'text-muted-foreground/50',
                    disabled && 'opacity-30 cursor-not-allowed',
                    today && !selected && 'font-bold text-primary',
                    selected && 'bg-primary text-white',
                    inRange && 'bg-primary/10',
                    rangeStart && 'rounded-l-full',
                    rangeEnd && 'rounded-r-full',
                    rangeStart && rangeEnd && 'rounded-full'
                  )}
                >
                  {format(day, 'd')}
                </button>
              );
            })}
          </div>

          {/* Selected Range Display */}
          {value && (
            <div className="border-t pt-3 px-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Check-in</span>
                <span className="font-medium">{format(value.from, 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Check-out</span>
                <span className="font-medium">
                  {value.to ? format(value.to, 'MMM d, yyyy') : 'Select date'}
                </span>
              </div>
              {value.to && (
                <div className="text-sm text-muted-foreground mt-2">
                  {Math.ceil((value.to.getTime() - value.from.getTime()) / (1000 * 60 * 60 * 24))} day(s)
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 p-3 border-t">
            <button 
              className="flex-1 px-4 py-2 border rounded-md text-sm hover:bg-muted"
              onClick={() => onChange(undefined)}
            >
              Clear
            </button>
            {value && value.to && (
              <button className="flex-1 px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90" onClick={() => setOpen(false)}>
                Apply
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}