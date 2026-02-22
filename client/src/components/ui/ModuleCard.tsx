import { cn } from "@/lib/utils";
import { PlayCircle } from "lucide-react";
import { Link } from "wouter";

interface ModuleCardProps {
  id: number;
  title: string;
  category: string;
  duration?: string;
  imageUrl?: string | null;
  className?: string;
}

export function ModuleCard({ id, title, category, duration = "5 min", imageUrl, className }: ModuleCardProps) {
  return (
    <Link href={`/modules/${id}`}>
      <div className={cn("group cursor-pointer min-w-[280px]", className)}>
        <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-muted shadow-sm">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <PlayCircle className="w-12 h-12 text-slate-400 group-hover:text-primary transition-colors" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-medium">
            {duration}
          </div>
        </div>
        
        <div>
          <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">{category}</div>
          <h4 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
            {title}
          </h4>
        </div>
      </div>
    </Link>
  );
}
