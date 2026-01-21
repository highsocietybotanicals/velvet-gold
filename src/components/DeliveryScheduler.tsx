import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, Phone } from "lucide-react";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DeliverySchedulerProps {
  scheduledDate: Date | undefined;
  setScheduledDate: (date: Date | undefined) => void;
  scheduledTime: string;
  setScheduledTime: (time: string) => void;
  contactPhone: string;
  setContactPhone: (phone: string) => void;
}

const TIME_SLOTS = [
  { value: "09:00-12:00", label: "9h - 12h (Matin)" },
  { value: "14:00-18:00", label: "14h - 18h (Après-midi)" },
  { value: "18:00-20:00", label: "18h - 20h (Soir)" },
];

const DeliveryScheduler = ({
  scheduledDate,
  setScheduledDate,
  scheduledTime,
  setScheduledTime,
  contactPhone,
  setContactPhone,
}: DeliverySchedulerProps) => {
  // Minimum date is tomorrow
  const minDate = addDays(new Date(), 1);

  const disabledDays = (date: Date) => {
    // Disable dates before tomorrow
    return isBefore(startOfDay(date), startOfDay(minDate));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 p-4 bg-muted/20 rounded-lg border border-primary/20"
    >
      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-primary" />
        Choisir un créneau
      </h4>

      {/* Date Picker */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground">Date souhaitée</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !scheduledDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {scheduledDate ? (
                format(scheduledDate, "EEEE d MMMM yyyy", { locale: fr })
              ) : (
                <span>Sélectionner une date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={scheduledDate}
              onSelect={setScheduledDate}
              disabled={disabledDays}
              initialFocus
              locale={fr}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Slot */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Créneau horaire
        </label>
        <div className="grid grid-cols-1 gap-2">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot.value}
              onClick={() => setScheduledTime(slot.value)}
              className={`p-3 rounded-lg border text-sm transition-all ${
                scheduledTime === slot.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contact Phone */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <Phone className="w-3 h-3" />
          Téléphone de contact *
        </label>
        <Input
          type="tel"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="06 12 34 56 78"
          className="bg-background"
        />
        <p className="text-[10px] text-muted-foreground">
          Pour vous contacter avant la livraison
        </p>
      </div>
    </motion.div>
  );
};

export default DeliveryScheduler;
