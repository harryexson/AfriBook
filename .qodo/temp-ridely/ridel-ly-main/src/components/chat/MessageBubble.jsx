import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Copy, Zap, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock, Bot, User } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FunctionDisplay = ({ toolCall }) => {
    // ... (This component is already defensive)
    const [expanded, setExpanded] = useState(false);
    const name = toolCall?.name || 'Function';
    const status = toolCall?.status || 'pending';
    const results = toolCall?.results;
    const parsedResults = (() => {
        if (!results) return null;
        try { return typeof results === 'string' ? JSON.parse(results) : results; } catch { return results; }
    })();
    const isError = results && ((typeof results === 'string' && /error|failed/i.test(results)) || (parsedResults?.success === false));
    const statusConfig = {
        pending: { icon: Clock, color: 'text-slate-400', text: 'Pending' },
        running: { icon: Loader2, color: 'text-slate-500', text: 'Running...', spin: true },
        in_progress: { icon: Loader2, color: 'text-slate-500', text: 'Running...', spin: true },
        completed: isError ? { icon: AlertCircle, color: 'text-red-500', text: 'Failed' } : { icon: CheckCircle2, color: 'text-green-600', text: 'Success' },
        success: { icon: CheckCircle2, color: 'text-green-600', text: 'Success' },
        failed: { icon: AlertCircle, color: 'text-red-500', text: 'Failed' },
        error: { icon: AlertCircle, color: 'text-red-500', text: 'Failed' }
    }[status] || { icon: Zap, color: 'text-slate-500', text: '' };
    const Icon = statusConfig.icon;
    const formattedName = name.split('.').reverse().join(' ').toLowerCase();
    
    return (
        <div className="mt-2 text-xs">
            <button onClick={() => setExpanded(!expanded)} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all", "hover:bg-slate-50", expanded ? "bg-slate-50 border-slate-300" : "bg-white border-slate-200")}>
                <Icon className={cn("h-3 w-3", statusConfig.color, statusConfig.spin && "animate-spin")} />
                <span className="text-slate-700">{formattedName}</span>
                {statusConfig.text && (<span className={cn("text-slate-500", isError && "text-red-600")}>• {statusConfig.text}</span>)}
                {!statusConfig.spin && (toolCall?.arguments_string || results) && (<ChevronRight className={cn("h-3 w-3 text-slate-400 transition-transform ml-auto", expanded && "rotate-90")} />)}
            </button>
            {expanded && !statusConfig.spin && (
                <div className="mt-1.5 ml-3 pl-3 border-l-2 border-slate-200 space-y-2">
                    {toolCall?.arguments_string && (
                        <div>
                            <div className="text-xs text-slate-500 mb-1">Parameters:</div>
                            <pre className="bg-slate-50 rounded-md p-2 text-xs text-slate-600 whitespace-pre-wrap">{(() => { try { return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2); } catch { return toolCall.arguments_string; } })()}</pre>
                        </div>
                    )}
                    {parsedResults && (
                        <div>
                            <div className="text-xs text-slate-500 mb-1">Result:</div>
                            <pre className="bg-slate-50 rounded-md p-2 text-xs text-slate-600 whitespace-pre-wrap max-h-48 overflow-auto">{typeof parsedResults === 'object' ? JSON.stringify(parsedResults, null, 2) : parsedResults}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function MessageBubble({ message }) {
    // ARCHITECTURAL FIX: Definitive check to ensure message is a valid object to prevent crashes.
    if (!message || typeof message !== 'object') {
        return null;
    }

    const isUser = message.role === 'user';
    // ARCHITECTURAL FIX: Ensure `tool_calls` is ALWAYS an array AND filter out any null/undefined items.
    const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls.filter(Boolean) : [];
    
    return (
        <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
            {!isUser ? (
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5 shrink-0">
                    <Bot className="h-5 w-5 text-primary" />
                </div>
            ) : (
                 <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center mt-0.5 shrink-0 order-2">
                    <User className="h-5 w-5 text-slate-600" />
                </div>
            )}
            <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end order-1")}>
                {message.content && (
                    <div className={cn("rounded-2xl px-4 py-2.5", isUser ? "bg-primary text-primary-foreground" : "bg-white border border-slate-200")}>
                        {isUser ? (
                            <p className="text-sm leading-relaxed">{message.content}</p>
                        ) : (
                            <ReactMarkdown 
                                className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                                components={{
                                    code: ({ inline, className, children, ...props }) => (<code className="px-1 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">{children}</code>),
                                    a: ({ children, ...props }) => (<a {...props} target="_blank" rel="noopener noreferrer">{children}</a>),
                                    p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                                }}
                            >{message.content}</ReactMarkdown>
                        )}
                    </div>
                )}
                
                {toolCalls.length > 0 && (
                    <div className="space-y-1 w-full mt-2">
                        {toolCalls.map((toolCall, idx) => (
                            <FunctionDisplay key={toolCall?.id || idx} toolCall={toolCall} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}