// ====================================
// IR
// ====================================

function calcularIRIsolado(dados, valortotatt, valorBase, principalBase, valorPrevidencia, rrapagamentoRecalculado) {
    const resultadoVazio = {
        valorIR: 0,
        aliquotaIR: 0,
        baseIRHonora: 0,
        baseIRSindi: 0,
        baseIRPrev: 0,
        principalComDesagio: 0,
        percentualDesagioIR: 0,
        rraComDesagio: 0,
        baseIRRRA: 0,
        valorIRUnitario: 0,
        descontoAdicional2026: 0,
        valorIRSemDesconto: 0
    };
    
    const temIR = dados.valoresPrincipais?.some(item => item.tributacao?.ir === true);
    
    // Early return - sem IR ou sem RRA (PF)
    if (!temIR || (dados.tipoBeneficiario !== 'pj' && rrapagamentoRecalculado === 0)) {
        return resultadoVazio;
    }
    
    const percentualTotalAdv = dados.advogados.reduce((sum, adv) => sum + adv.percentual, 0);
    const percentualTotalSind = dados.tipoCalculo === 'preferencia' ? 0 : 
        dados.sindicatos.reduce((sum, sind) => sum + sind.percentual, 0);
    
    // PESSOA JURÍDICA
    if (dados.natureza === 'comum' && dados.tipoBeneficiario === 'pj') {
        const baseIRPJ = valortotatt * (1 - percentualTotalAdv - percentualTotalSind);
        let valorIR = baseIRPJ * 0.03;
        const percentualDesagio = dados.percentualAcordo || 0;
        
        if (dados.tipoCalculo === 'acordo') {
            valorIR = valorIR * (1 - percentualDesagio);
        }
        
        return {
            ...resultadoVazio,
            valorIR,
            aliquotaIR: 0.03,
            valorIRUnitario: valorIR,
            percentualDesagioIR: percentualDesagio,
            baseIRHonora: 1,
            baseIRSindi: 1,
            baseIRPrev: 1,
            baseIRRRA: 1
        };
    }
    
    // PESSOA FÍSICA
    const baseIRHonora = principalBase - (principalBase * percentualTotalAdv);
    const baseIRSindi = baseIRHonora - (principalBase * percentualTotalSind);
    
    const percentualDesagioIR = dados.percentualAcordo || 0;
    const principalComDesagio = dados.tipoCalculo === 'acordo' 
        ? baseIRSindi * (1 - percentualDesagioIR)
        : baseIRSindi;
    
    const rraComDesagio = rrapagamentoRecalculado > 0 ? Math.max(1, rrapagamentoRecalculado) : 0;
    const baseIRPrev = principalComDesagio - valorPrevidencia;
    const baseIRRRA = baseIRPrev / rraComDesagio;
    
    // ✅ 1. Calcular IR pela tabela (base unitária)
    const valorIRSemDesconto = calcularIR(baseIRRRA);
    
    // ✅ 2. Aplicar desconto 2026 (sobre o IR unitário)
    const descontoAdicional2026 = calcularDescontoAdicional2026(baseIRRRA, valorIRSemDesconto);
    
    // ✅ 3. IR unitário com desconto
    const valorIRUnitario = Math.max(0, valorIRSemDesconto - descontoAdicional2026);
    
    // ✅ 4. Multiplicar pelo RRA (APENAS NO FINAL)
    const valorIR = valorIRUnitario * rraComDesagio;
    
    const aliquotaIR = obterAliquotaIR(baseIRRRA);
    
    return {
        valorIR,                        
        aliquotaIR,
        baseIRHonora,
        baseIRSindi,
        baseIRPrev,
        principalComDesagio,
        percentualDesagioIR,
        rraComDesagio,
        baseIRRRA,
        valorIRUnitario,                
        descontoAdicional2026,          
        valorIRSemDesconto             
    };
}

function calcularIR(valorBruto) {
    if (valorBruto <= 2428.80) return 0;
    else if (valorBruto <= 2826.65) return (valorBruto * 0.075) - 182.16;
    else if (valorBruto <= 3751.05) return (valorBruto * 0.15) - 394.16;
    else if (valorBruto <= 4664.68) return (valorBruto * 0.225) - 675.49;
    else return (valorBruto * 0.275) - 908.73;
}

function calcularDescontoAdicional2026(baseIRRRA, valorIRCalculado) {
    // Faixa 1: Até R$ 5.000,00 → Desconto até R$ 312,89 (limitado ao IR)
    if (baseIRRRA <= 5000.00) {
        const descontoMaximo = 312.89;
        return Math.min(valorIRCalculado, descontoMaximo);
    }
    
    // Faixa 2: De R$ 5.000,01 até R$ 7.350,00
    if (baseIRRRA <= 7350.00) {
        const desconto = 978.62 - (0.133145 * baseIRRRA);
        return Math.max(0, desconto); // Não pode ser negativo
    }
    
    // Faixa 3: Acima de R$ 7.350,01 → Sem desconto adicional
    return 0;
}

function obterAliquotaIR(valorBruto) {
    if (valorBruto <= 2428.80) return 0;
    else if (valorBruto <= 2826.65) return 0.075;
    else if (valorBruto <= 3751.05) return 0.15;
    else if (valorBruto <= 4664.68) return 0.225;
    else return 0.275;
}

/**
 * Arredondamento específico para RRA conforme legislação
 * Regras:
 * - < 5: mantém a 1ª casa decimal
 * - > 5: adiciona 1 à 1ª casa decimal  
 * - = 5: analisa a 3ª casa decimal:
 *   - 3ª casa entre 0-4: mantém a 1ª casa decimal
 *   - 3ª casa entre 5-9: adiciona 1 à 1ª casa decimal
 */
function arredondarRRA(valor) {
    if (typeof valor !== 'number' || isNaN(valor)) {
        return 0;
    }
    // Converter para string para analisar dígito por dígito
    const valorStr = valor.toFixed(3); // Garantir 3 casas decimais
    const partes = valorStr.split('.');
    
    if (partes.length !== 2) {
        return Math.round(valor * 10) / 10; // Fallback para arredondamento normal
    }
    
    const parteInteira = partes[0];
    const parteDecimal = partes[1].padEnd(3, '0'); // Garantir 3 dígitos decimais
    
    const primeiraDecimal = parseInt(parteDecimal[0]);
    const segundaDecimal = parseInt(parteDecimal[1]);
    const terceiraDecimal = parseInt(parteDecimal[2]);
    
    let novaParteDecimal = primeiraDecimal;
    
    if (segundaDecimal < 5) {
        // Regra I: menor que 5, mantém a 1ª casa decimal
        novaParteDecimal = primeiraDecimal;
    } else if (segundaDecimal > 5) {
        // Regra II: maior que 5, adiciona 1 à 1ª casa decimal
        novaParteDecimal = primeiraDecimal + 1;
    } else if (segundaDecimal === 5) {
        // Regra III: igual a 5, analisar a 3ª casa decimal
        if (terceiraDecimal >= 0 && terceiraDecimal <= 4) {
            // III.a: 3ª casa entre 0-4, mantém a 1ª casa decimal
            novaParteDecimal = primeiraDecimal;
        } else if (terceiraDecimal >= 5 && terceiraDecimal <= 9) {
            // III.b: 3ª casa entre 5-9, adiciona 1 à 1ª casa decimal
            novaParteDecimal = primeiraDecimal + 1;
        }
    }
    // Tratar caso onde a soma ultrapassa 9
    if (novaParteDecimal >= 10) {
        const novaParteInteira = parseInt(parteInteira) + 1;
        novaParteDecimal = novaParteDecimal - 10;
        return parseFloat(`${novaParteInteira}.${novaParteDecimal}`);
    }
    
    return parseFloat(`${parteInteira}.${novaParteDecimal}`);
}

// ====================================
// PREVIDENCIA
// ====================================

function calcularPrevidenciaIsolada(dados, principalBase, rrapagamento) {
    const resultadoVazio = {
        valorPrevidencia: 0,
        aliquotaEfetiva: 0,
        valorDesagioPrevidencia: 0,
        percentualDesagioPrevidencia: 0
    };
    
    // PJ não tem previdência
    if (dados.tipoBeneficiario === 'pj') return resultadoVazio;
    
    const deveCalcularPrevidencia = dados.incidenciaPrevidencia || 
        dados.valoresPrincipais?.some(item => item.tributacao?.previdencia);
    
    if (!deveCalcularPrevidencia) return resultadoVazio;

    const itemComPrevidencia = dados.valoresPrincipais?.find(item => item.tributacao?.previdencia);
    const tipoPrevidencia = itemComPrevidencia?.tributacao.tipoPrevidencia || dados.tipoPrevidencia || 'inss';
    const aliquotaFixa = itemComPrevidencia?.tributacao.aliquotaFixa || dados.aliquotaFixa || 0;

    let valorPrevidencia, aliquotaEfetiva;

    if (tipoPrevidencia === 'fixa') {
        valorPrevidencia = principalBase * aliquotaFixa;
        aliquotaEfetiva = aliquotaFixa;
    } else {
        const base = rrapagamento === 0 ? principalBase : principalBase / rrapagamento;
        const resultadoINSS = calcularINSS(base);
        valorPrevidencia = resultadoINSS * (rrapagamento || 1);
        aliquotaEfetiva = base > 0 ? resultadoINSS / base : 0;
    }

    let valorDesagioPrevidencia = 0;
    let percentualDesagioPrevidencia = 0;

    if (dados.tipoCalculo === 'acordo') {
        percentualDesagioPrevidencia = dados.percentualAcordo || 0;
        valorDesagioPrevidencia = valorPrevidencia * percentualDesagioPrevidencia;
        valorPrevidencia = valorPrevidencia - valorDesagioPrevidencia;
    }
    
    return {
        valorPrevidencia,
        aliquotaEfetiva,
        valorDesagioPrevidencia,
        percentualDesagioPrevidencia
    };
}

function calcularINSS(base) {
    if (base <= 1518.00) return base * 0.075;
    else if (base <= 2793.88) return 1518 * 0.075 + (base - 1518) * 0.09;
    else if (base <= 4190.83) return 1518 * 0.075 + 1275.88 * 0.09 + (base - 2793.88) * 0.12;
    else if (base <= 8157.41) return 1518 * 0.075 + 1275.88 * 0.09 + 1396.95 * 0.12 + (base - 4190.83) * 0.14;
    else return 951.63; // Teto
}