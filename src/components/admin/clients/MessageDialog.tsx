import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { messageTemplate, toIntlPhone, type Customer } from "@/lib/customers";

const MessageDialog = ({ c }: { c: Customer }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const { toast } = useToast();
  useEffect(() => { if (open) setText(messageTemplate(c)); }, [open, c]);
  const phone = c.phones[0];

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); toast({ title: "Message copié" }); }
    catch { toast({ title: "Copie impossible", variant: "destructive" }); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-h-11"><MessageSquare className="mr-2 h-4 w-4" />Préparer un message</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Message pour {c.name}</DialogTitle></DialogHeader>
        <Label htmlFor="crm-msg">Texte (modifiable)</Label>
        <Textarea id="crm-msg" rows={6} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="min-h-11" onClick={copy}>Copier</Button>
          {phone && (
            <>
              <Button asChild variant="outline" className="min-h-11">
                <a href={`https://wa.me/${toIntlPhone(phone)}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
              </Button>
              <Button asChild variant="outline" className="min-h-11">
                <a href={`sms:${phone}?body=${encodeURIComponent(text)}`}>SMS</a>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog;
