import React from 'react';
import { Lead } from '../../interfaces';

interface LeadSentimentAnalysisProps {
  lead: Lead;
}

const LeadSentimentAnalysis: React.FC<LeadSentimentAnalysisProps> = ({ lead }) => {
  // Se não houver análise de sentimento, não renderizar o componente
  if (!lead.sentiment_status && !lead.lead_score) {
    return null;
  }

  // Função para obter cor baseada no status de sentimento
  const getSentimentColor = (status?: string) => {
    switch (status) {
      case 'interessado': return { bg: '#4caf506b', text: '#1b5e20' };
      case 'compra futura': return { bg: '#2196f36b', text: '#0d47a1' };
      case 'achou caro': return { bg: '#ff980026', text: '#e65100' };
      case 'quer desconto': return { bg: '#ffeb3b6b', text: '#f57f17' };
      case 'parcelamento': return { bg: '#9c27b06b', text: '#4a148c' };
      case 'sem interesse': return { bg: '#f4433636', text: '#b71c1c' };
      default: return { bg: '#90909036', text: '#424242' };
    }
  };

  // Função para obter a tradução do status
  const getSentimentLabel = (status?: string) => {
    switch (status) {
      case 'interessado': return 'Interessado';
      case 'compra futura': return 'Compra Futura';
      case 'achou caro': return 'Achou Caro';
      case 'quer desconto': return 'Quer Desconto';
      case 'parcelamento': return 'Necessita Parcelamento';
      case 'sem interesse': return 'Sem Interesse';
      case 'indeterminado': return 'Indeterminado';
      default: return 'Não Analisado';
    }
  };

  // Função para calcular a cor do indicador de score
  const getScoreColor = (score?: number) => {
    if (!score) return '#909090';
    if (score >= 80) return '#4caf50'; // Verde
    if (score >= 60) return '#2196f3'; // Azul
    if (score >= 40) return '#ff9800'; // Laranja
    return '#f44336'; // Vermelho
  };

  // Função para calcular a largura da barra de progresso
  const getScoreWidth = (score?: number) => {
    return score ? `${score}%` : '0%';
  };

  // Função para formatar a data da última atualização
  const formatLastUpdate = (dateString?: string) => {
    if (!dateString) return 'Nunca';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const sentimentColor = getSentimentColor(lead.sentiment_status);
  const scoreColor = getScoreColor(lead.lead_score);

  return (
    <div className="card h-100">
      <div className="card-header d-flex align-items-center">
        <i className="bi bi-graph-up-arrow me-2" style={{ color: '#7e57c2' }}></i>
        <h5 className="mb-0">Análise de Sentimento</h5>
      </div>
      
      <div className="card-body">
        {/* Status de Sentimento */}
        <div className="mb-4">
          <h6 className="fw-semibold mb-3" style={{ color: '#7e57c2' }}>Status do Lead</h6>
          
          {lead.sentiment_status ? (
            <div 
              className="px-3 py-2 rounded-3 mb-3" 
              style={{ 
                backgroundColor: sentimentColor.bg,
                color: sentimentColor.text,
                fontWeight: 600
              }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <i className="bi bi-person-fill me-2"></i>
                  {getSentimentLabel(lead.sentiment_status)}
                </div>
                <div>
                  <span className="badge bg-white text-dark">
                    {lead.lead_score || 0}/100
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-light mb-3">
              <i className="bi bi-info-circle me-2"></i>
              Ainda não há análise de sentimento disponível
            </div>
          )}

          {/* Barra de Pontuação */}
          {lead.lead_score !== undefined && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-muted small">Pontuação de Interesse</span>
                <span className="fw-medium" style={{ color: scoreColor }}>{lead.lead_score}/100</span>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <div 
                  className="progress-bar" 
                  role="progressbar" 
                  style={{ 
                    width: getScoreWidth(lead.lead_score), 
                    backgroundColor: scoreColor 
                  }} 
                  aria-valuenow={lead.lead_score} 
                  aria-valuemin={0} 
                  aria-valuemax={100}
                ></div>
              </div>
              <div className="d-flex justify-content-between mt-1">
                <span className="text-muted small">Frio</span>
                <span className="text-muted small">Quente</span>
              </div>
            </>
          )}

          {/* Última Atualização */}
          <div className="mt-3 d-flex align-items-center text-muted small">
            <i className="bi bi-clock-history me-1"></i>
            Atualizado em: {formatLastUpdate(lead.last_sentiment_update)}
          </div>
        </div>

        {/* Análise Detalhada */}
        {lead.ai_analysis && (
          <div>
            <h6 className="fw-semibold mb-3" style={{ color: '#7e57c2' }}>Análise Detalhada</h6>
            <div className="p-3 bg-light rounded-3">
              <p className="card-text mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                {lead.ai_analysis}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="card-footer bg-transparent">
        <small className="text-muted d-flex align-items-center">
          <i className="bi bi-info-circle me-1"></i>
          Baseado na análise de todas as interações do lead
        </small>
      </div>
    </div>
  );
};

export default LeadSentimentAnalysis;