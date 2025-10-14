import { Button } from "@/components/ui/button";
import { CircleArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BackHeaderProps {
  title: string;
  onBack?: () => void;
  className?: string;
}

export function BackHeader({ title, onBack, className }: BackHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className={`flex flex-col gap-3 ${className || ""}`}>
      <Button
        variant="ghost"
        onClick={onBack || (() => navigate(-1))}
        aria-label="Go back"
        className="w-fit px-0 text-base font-normal"
      >
        <CircleArrowLeft className="h-6 w-6" /> Back
      </Button>
      <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
        {title}
      </h1>
    </div>
  );
}
