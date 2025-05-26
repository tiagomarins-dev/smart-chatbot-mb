import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { apiClient as api } from '../../api/client';

interface AIAnalysisLog {
  id: string;
  lead_id: string;
  analyzed_at: string;
  success: boolean;
  sentiment_status: string | null;
  lead_score: number | null;
  ai_model: string | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  response_time_ms: number | null;
  error_message: string | null;
  trigger_source: string;
  trigger_details: any;
  created_at: string;
}

interface LeadAIAnalysisLogsProps {
  leadId: string;
}

export function LeadAIAnalysisLogs({ leadId }: LeadAIAnalysisLogsProps) {
  const [logs, setLogs] = useState<AIAnalysisLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchLogs();
  }, [leadId, offset]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ logs: AIAnalysisLog[], total: number }>(`/leads/${leadId}/ai-analysis-logs`, {
        params: { limit, offset }
      });
      
      if (response.success && response.data) {
        setLogs(response.data.logs);
        setTotal(response.data.total);
      }
    } catch (err) {
      console.error('Error fetching AI analysis logs:', err);
      setError('Erro ao carregar logs de análise');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentBadge = (status: string | null) => {
    if (!status) return null;
    
    const variants: Record<string, string> = {
      'interessado': 'success',
      'sem interesse': 'danger',
      'compra futura': 'info',
      'achou caro': 'warning',
      'quer desconto': 'warning',
      'parcelamento': 'info',
      'indeterminado': 'secondary'
    };
    
    return (
      <Badge bg={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getTriggerBadge = (source: string) => {
    const labels: Record<string, string> = {
      'event_creation': 'Criação de Evento',
      'event_capture': 'Captura de Evento',
      'manual': 'Análise Manual',
      'cron': 'Análise Agendada',
      'whatsapp': 'Mensagem WhatsApp'
    };
    
    return (
      <Badge bg="secondary" className="text-capitalize">
        {labels[source] || source}
      </Badge>
    );
  };

  const formatResponseTime = (ms: number | null) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading && logs.length === 0) {
    return (
      <Card>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </Spinner>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Body>
          <Alert variant="danger">{error}</Alert>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Histórico de Análises de IA</h5>
      </Card.Header>
      <Card.Body>
        {logs.length === 0 ? (
          <Alert variant="info">
            Nenhuma análise de IA foi executada para este lead ainda.
          </Alert>
        ) : (
          <>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Status</th>
                    <th>Sentimento</th>
                    <th>Score</th>
                    <th>Origem</th>
                    <th>Modelo IA</th>
                    <th>Tempo</th>
                    <th>Tokens</th>
                    <th>Erro</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        {new Date(log.analyzed_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td>
                        <Badge bg={log.success ? 'success' : 'danger'}>
                          {log.success ? 'Sucesso' : 'Erro'}
                        </Badge>
                      </td>
                      <td>{getSentimentBadge(log.sentiment_status)}</td>
                      <td>
                        {log.lead_score !== null ? (
                          <Badge bg="primary">{log.lead_score}</Badge>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>{getTriggerBadge(log.trigger_source)}</td>
                      <td>
                        <small className="text-muted">
                          {log.ai_model || '-'}
                        </small>
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatResponseTime(log.response_time_ms)}
                        </small>
                      </td>
                      <td>
                        {log.total_tokens ? (
                          <small className="text-muted">
                            {log.total_tokens}
                          </small>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {log.error_message ? (
                          <small className="text-danger" title={log.error_message}>
                            {log.error_message.length > 30
                              ? log.error_message.substring(0, 30) + '...'
                              : log.error_message}
                          </small>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            {total > limit && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  Mostrando {offset + 1} a {Math.min(offset + limit, total)} de {total} registros
                </div>
                <div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    className="me-2"
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    disabled={offset + limit >= total}
                    onClick={() => setOffset(offset + limit)}
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-3">
              <small className="text-muted">
                <strong>Resumo:</strong> {total} análises executadas, 
                {' '}{logs.filter(l => l.success).length} com sucesso, 
                {' '}{logs.filter(l => !l.success).length} com erro
              </small>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
}