import { useState } from 'react';
import { Send, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useChatContext } from '../context/chat-context';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { getSourceTypeLabel } from '../../lib/sourceType';

export function Chat() {
  const [input, setInput] = useState('');
  const { messages, isLoading, error, sendMessage } = useChatContext();

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;
    setInput('');
    await sendMessage(query);
  };

  const rawSources = messages.length > 0
    ? (messages[messages.length - 1].sources ?? [])
    : [];

  const currentSources = Array.from(
    [...rawSources]
      .sort((a, b) => (b.display_priority ?? 0) - (a.display_priority ?? 0))
      .reduce((map, s) => {
        if (!map.has(s.url)) map.set(s.url, s);
        return map;
      }, new Map<string, typeof rawSources[0]>())
      .values(),
  );

  const renderSourceTypeBadge = (sourceType?: string) => {
    const label = getSourceTypeLabel(sourceType);
    if (!label) return null;

    return (
      <Badge className="mb-2 bg-emerald-500/15 text-emerald-300 border-emerald-500/30">
        Fuente: {label}
      </Badge>
    );
  };

  return (
    <div className="h-full flex">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-[#1a2332] bg-[#0f1419] px-6 flex items-center">
          <div>
            <h1 className="font-semibold text-white">Chat CSDI</h1>
            <p className="text-sm text-slate-400">Consulta tu base de conocimiento indexada</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-[#0a0e1a]">
          {error && (
            <div className="max-w-3xl mx-auto mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Inicia una conversación</h3>
                <p className="text-sm text-slate-400">
                  Pregunta cualquier cosa sobre tu documentación indexada. La IA recuperará fuentes relevantes y proporcionará respuestas precisas.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={message.type === 'user' ? 'flex justify-end' : ''}>
                  {message.type === 'user' ? (
                    <div className="bg-gradient-to-br from-[#2563eb] to-[#1e40af] text-white px-4 py-3 rounded-lg max-w-2xl shadow-lg shadow-blue-900/20">
                      {message.content}
                    </div>
                  ) : (
                    <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6 shadow-xl">
                      <div className="prose-dark">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                      {message.model && (
                        <p className="text-xs text-slate-600 mt-4">Modelo: {message.model}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="bg-[#0f1419] border border-[#1a2332] rounded-lg p-6 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  <span className="text-slate-300">Generando respuesta...</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[#1a2332] bg-[#0f1419] p-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="flex items-stretch gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                placeholder="Escribe tu pregunta sobre la base de conocimiento..."
                className="flex-1 min-h-[60px] resize-none bg-[#1a2332] border-[#2d3748] text-white placeholder:text-slate-500 disabled:opacity-60 disabled:cursor-not-allowed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="self-stretch aspect-square flex-shrink-0 p-0 bg-gradient-to-br from-[#2563eb] to-[#1e40af] hover:from-[#1d4ed8] hover:to-[#1e3a8a] text-white shadow-lg shadow-blue-900/30"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Sources Sidebar */}
      <div className="w-96 border-l border-[#1a2332] bg-[#0f1419] overflow-y-auto">
        <div className="sticky top-0 bg-[#0f1419] border-b border-[#1a2332] px-4 py-4">
          <h2 className="font-semibold text-white">Fuentes Recuperadas</h2>
          <p className="text-xs text-slate-400 mt-1">
            {currentSources.length} fuentes utilizadas en la respuesta
          </p>
        </div>

        <div className="p-4 space-y-3">
          {currentSources.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Las fuentes aparecerán aquí después de hacer una pregunta
            </div>
          ) : (
            currentSources.map((source) => (
              <div
                key={source.chunk_id}
                className="bg-[#1a2332] border border-[#2d3748] rounded-lg p-4 hover:border-blue-500/30 transition-colors"
              >
                {renderSourceTypeBadge(source.source_type)}
                <h3 className="font-medium text-sm text-white line-clamp-2 mb-2">
                  {source.title}
                </h3>

                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate">{source.url}</span>
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
