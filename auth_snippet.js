// ============================================================
// AUTENTICAÇÃO — Adicionar no início do <script> do index.html
// ============================================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://wzmuswrjobxbfmddqkda.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bXVzd3Jqb2J4YmZtZGRxa2RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyODk0OTIsImV4cCI6MjA5Mjg2NTQ5Mn0.3DptbVZS76WTOPOJTZeFbBz7XHVYGsBCsLIffd9xItc';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 1. Verificar sessão — redirecionar se não logado
const sessao = sessionStorage.getItem('precalc_user');
if (!sessao) { window.location.href = 'login.html'; }
const userAtual = JSON.parse(sessao || '{}');

// 2. Mostrar nome do usuário no header (opcional)
document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header p');
    if (header) header.textContent = `Olá, ${userAtual.nome} · Sistema de Cálculo de Precatórios`;
});

// 3. Verificar se deve recarregar um cálculo anterior
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('recarregar') === '1') {
    const dadosSalvos = sessionStorage.getItem('precalc_recarregar');
    if (dadosSalvos) {
        sessionStorage.removeItem('precalc_recarregar');
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                try {
                    restaurarFormularioCompleto(JSON.parse(dadosSalvos));
                } catch(e) {
                    console.error('Erro ao recarregar:', e);
                }
            }, 500);
        });
    }
}

// ============================================================
// SALVAR CÁLCULO — Substituir a função exibirResultados
// ============================================================

const _exibirResultadosOriginal = exibirResultados;

window.exibirResultados = async function(resultados, dados) {
    // Exibir normalmente
    _exibirResultadosOriginal(resultados, dados);

    // Salvar no banco em background
    try {
        const htmlResultado = document.getElementById('resultadosContent')?.innerHTML || '';

        await supabase.from('calculos').insert({
            contador_id: userAtual.id,
            contador_nome: userAtual.nome,
            num_processo: dados.numProcesso || null,
            beneficiario: dados.beneficiario || null,
            credor: dados.credor || null,
            tipo_calculo: dados.tipoCalculo || null,
            ano_orcamento: dados.anoOrcamento || null,
            dados_entrada: dados,
            html_resultado: htmlResultado
        });

        console.log('✅ Cálculo salvo no histórico');
    } catch(e) {
        console.warn('⚠️ Não foi possível salvar no histórico:', e);
    }
};

// ============================================================
// BOTÃO SAIR — Adicionar no HTML do header
// ============================================================
// <button onclick="sairDoSistema()" style="...">Sair</button>

window.sairDoSistema = function() {
    sessionStorage.removeItem('precalc_user');
    window.location.href = 'login.html';
};

// ============================================================
// RESTAURAR FORMULÁRIO — Para recarregar cálculo do histórico
// ============================================================

function restaurarFormularioCompleto(dados) {
    if (!dados) return;

    // Campos básicos
    const campos = {
        numprocesso: dados.numProcesso,
        beneficiario: dados.beneficiario,
        credor: dados.credor,
        natureza: dados.natureza,
        tipoCalculo: dados.tipoCalculo,
        anoOrcamento: dados.anoOrcamento,
        tipoBeneficiario: dados.tipoBeneficiario
    };

    Object.entries(campos).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el && val !== undefined) el.value = val;
    });

    // Restaurar valores principais
    if (dados.valoresPrincipais?.length) {
        window.valoresPrincipais = dados.valoresPrincipais;
        renderizarValoresPrincipais();
    }

    // Restaurar quantidades e disparar events
    const quantidades = {
        quantAdvogados: dados.quantAdvogados,
        quantAdvogadosSucumbenciais: dados.quantAdvogadosSucumbenciais,
        quantHerdeiros: dados.quantHerdeiros,
        quantSindicatos: dados.quantSindicatos,
        quantCessoes: dados.quantCessoes,
        quantidadePagamentos: dados.quantidadePagamentos
    };

    Object.entries(quantidades).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el && val) {
            el.value = val;
            el.dispatchEvent(new Event('change'));
        }
    });

    // Restaurar dados dos sub-formulários após render
    setTimeout(() => {
        if (dados.advogados?.length) {
            DadosFormulario.advogados = dados.advogados.map(a => ({
                nome: a.nome, tipo: a.tipo,
                incidenciaIR: a.incidenciaIR ? 'sim' : 'nao',
                percentual: a.percentual
            }));
            DadosFormulario.restaurarAdvogados();
        }

        if (dados.herdeiros?.length) {
            DadosFormulario.herdeiros = dados.herdeiros.map(h => ({
                nome: h.nome, percentual: h.percentual,
                preferencia: h.temPreferencia ? 'sim' : 'nao'
            }));
            DadosFormulario.restaurarHerdeiros();
        }

        if (dados.sindicatos?.length) {
            DadosFormulario.sindicatos = dados.sindicatos.map(s => ({
                nome: s.nome, percentual: s.percentual,
                tributacao: s.tributacao
            }));
            DadosFormulario.restaurarSindicatos();
        }

        if (dados.cessoes?.length) {
            DadosFormulario.cessoes = dados.cessoes.map(c => ({
                tipo: c.tipo, cedente: c.cedente,
                cessionario: c.cessionario, percentual: c.percentual
            }));
            DadosFormulario.restaurarCessoes();
        }

        // Disparar events de visibilidade
        ['tipoCalculo','natureza','incidenciaPrevidencia'].forEach(id =>
            document.getElementById(id)?.dispatchEvent(new Event('change'))
        );

        alert('✅ Dados carregados! Revise e clique em Calcular para recalcular.');
        showTab('tab1');
    }, 300);
}